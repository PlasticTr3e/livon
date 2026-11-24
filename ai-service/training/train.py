"""
Training pipeline for Livon sentiment analysis (v3).

Benchmarks Indonesian preprocessing (with/without stemming), word + character
n-gram TF-IDF features, and calibrated linear/logistic classifiers across
Indonesian SMSA + housing-domain feedback datasets without validation leakage.

Usage:
    python training/train.py
"""

import json
import os
import sys
import time
import urllib.request

import joblib
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    roc_auc_score,
)
from sklearn.model_selection import ParameterGrid, train_test_split
from sklearn.pipeline import FeatureUnion
from sklearn.preprocessing import LabelEncoder
from sklearn.svm import LinearSVC

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from training.preprocess import IndonesianPreprocessor

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SMSA_DATA_DIR = os.path.join(ROOT_DIR, "smsa-ind-classification", "data")
CACHE_DATA_DIR = os.path.join(ROOT_DIR, "data")
MODEL_DIR = os.path.join(ROOT_DIR, "app", "models")

HF_PARQUET_INDEX_URL = (
    "https://huggingface.co/api/datasets/kornwtp/smsa-ind-classification/parquet"
)

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(CACHE_DATA_DIR, exist_ok=True)

LABEL_MAP: dict[int, str] = {
    0: "positive",
    1: "neutral",
    2: "negative",
}

DOMAIN_TRAIN_REPEAT = 5


def load_domain_data() -> pd.DataFrame:
    path = os.path.join(SMSA_DATA_DIR, "domain_specific.csv")
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"domain_specific.csv not found in {SMSA_DATA_DIR}. "
            "Run training/generate_domain_data.py first."
        )
    df = pd.read_csv(path)
    print(f"  domain data: {len(df):>6} rows")
    return apply_label_map(df)


def split_domain_data(
    domain_df: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Splits curated domain examples 70/15/15 stratified with zero leakage."""
    train_df, temp_df = train_test_split(
        domain_df,
        test_size=0.30,
        random_state=42,
        stratify=domain_df["labels"],
    )
    val_df, test_df = train_test_split(
        temp_df,
        test_size=0.50,
        random_state=42,
        stratify=temp_df["labels"],
    )
    return (
        train_df.reset_index(drop=True),
        val_df.reset_index(drop=True),
        test_df.reset_index(drop=True),
    )


def find_local_parquet(split: str) -> str | None:
    for directory in (CACHE_DATA_DIR, SMSA_DATA_DIR):
        if not os.path.isdir(directory):
            continue
        matches = sorted(
            f for f in os.listdir(directory)
            if f.startswith(split) and f.endswith(".parquet")
        )
        if matches:
            return os.path.join(directory, matches[0])
    return None


def download_smsa_parquets() -> bool:
    """Downloads kornwtp/smsa-ind-classification parquet splits into ai-service/data/."""
    if os.environ.get("SKIP_HF_DOWNLOAD") == "1":
        return False

    print("fetching SMSA parquet index from Hugging Face...")
    try:
        with urllib.request.urlopen(HF_PARQUET_INDEX_URL, timeout=15) as resp:
            index = json.loads(resp.read().decode("utf-8"))
        default_splits = index.get("default", {})
        for split in ("train", "validation", "test"):
            urls = default_splits.get(split) or []
            if not urls:
                return False
            target = os.path.join(CACHE_DATA_DIR, f"{split}-00000.parquet")
            if not os.path.exists(target):
                print(f"  downloading {split} split...")
                urllib.request.urlretrieve(urls[0], target)
        return True
    except Exception as exc:
        print(f"  warning: could not download SMSA splits ({exc})")
        return False


def apply_label_map(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    def normalize_label(value):
        if pd.isna(value):
            return value
        if value in LABEL_MAP:
            return LABEL_MAP[value]
        if isinstance(value, str) and value.isdigit():
            numeric_value = int(value)
            if numeric_value in LABEL_MAP:
                return LABEL_MAP[numeric_value]
        if isinstance(value, str):
            return value.strip().lower()
        return value

    df["labels"] = df["labels"].map(normalize_label)
    return df.dropna(subset=["labels", "texts"])


def load_splits() -> dict[str, pd.DataFrame]:
    print("loading dataset...")
    domain_df = load_domain_data()
    domain_train, domain_val, domain_test = split_domain_data(domain_df)

    smsa_paths = {split: find_local_parquet(split) for split in ("train", "validation", "test")}
    if any(path is None for path in smsa_paths.values()):
        if download_smsa_parquets():
            smsa_paths = {
                split: find_local_parquet(split) for split in ("train", "validation", "test")
            }

    if all(path is not None for path in smsa_paths.values()):
        smsa_splits = {}
        for split, path in smsa_paths.items():
            df = apply_label_map(pd.read_parquet(path)[["texts", "labels"]])
            smsa_splits[split] = df
            print(f"  smsa {split:>10}: {len(df):>6} rows")

        domain_train_weighted = pd.concat(
            [domain_train] * DOMAIN_TRAIN_REPEAT, ignore_index=True
        )
        train_df = pd.concat(
            [smsa_splits["train"], domain_train_weighted], ignore_index=True
        ).sample(frac=1, random_state=42).reset_index(drop=True)

        return {
            "dataset_name": "smsa-ind-classification + livon domain",
            "train": train_df,
            "smsa_val": smsa_splits["validation"],
            "smsa_test": smsa_splits["test"],
            "domain_val": domain_val,
            "domain_test": domain_test,
        }

    print("  parquet splits unavailable; falling back to domain_specific.csv splits")
    return {
        "dataset_name": "domain_specific_only",
        "train": domain_train,
        "smsa_val": domain_val,
        "smsa_test": domain_test,
        "domain_val": domain_val,
        "domain_test": domain_test,
    }


def calibration_cv(labels) -> int:
    min_class_count = int(pd.Series(labels).value_counts().min())
    return max(2, min(5, min_class_count))


def build_vectorizer(word_ngram: tuple[int, int], use_char: bool) -> FeatureUnion:
    transformers = [
        (
            "word",
            TfidfVectorizer(
                ngram_range=word_ngram,
                sublinear_tf=True,
                min_df=2,
                max_features=35_000,
                token_pattern=r"(?u)\b\w+\b",
            ),
        ),
    ]
    if use_char:
        transformers.append(
            (
                "char",
                TfidfVectorizer(
                    analyzer="char_wb",
                    ngram_range=(3, 5),
                    sublinear_tf=True,
                    min_df=3,
                    max_features=35_000,
                ),
            )
        )
    return FeatureUnion(transformers)


def build_classifier(config: dict, y_train):
    if config["family"] == "svm":
        base = LinearSVC(
            C=config["C"],
            class_weight=config["class_weight"],
            max_iter=3000,
            random_state=42,
        )
        return CalibratedClassifierCV(
            base,
            cv=calibration_cv(y_train),
            method="sigmoid",
        )
    return LogisticRegression(
        C=config["C"],
        class_weight=config["class_weight"],
        max_iter=1000,
        random_state=42,
    )


def benchmark_stemming(
    splits: dict[str, pd.DataFrame],
    encoder: LabelEncoder,
) -> tuple[bool, dict[bool, dict[str, list[str]]]]:
    tokenized: dict[bool, dict[str, list[str]]] = {}
    scores: dict[bool, float] = {}

    y_train = encoder.transform(splits["train"]["labels"])
    y_smsa_val = encoder.transform(splits["smsa_val"]["labels"])
    y_domain_val = encoder.transform(splits["domain_val"]["labels"])

    for use_stemming in (False, True):
        label = "with stemming" if use_stemming else "without stemming"
        start = time.time()
        print(f"\n  [{label}] preprocessing...")
        preprocessor = IndonesianPreprocessor(use_stemming=use_stemming)
        prepped = {
            name: preprocessor.transform_batch(splits[name]["texts"].tolist())
            for name in ("train", "smsa_val", "smsa_test", "domain_val", "domain_test")
        }
        tokenized[use_stemming] = prepped

        vectorizer = build_vectorizer(word_ngram=(1, 2), use_char=True)
        X_train = vectorizer.fit_transform(prepped["train"])
        X_smsa_val = vectorizer.transform(prepped["smsa_val"])
        X_domain_val = vectorizer.transform(prepped["domain_val"])

        model = LogisticRegression(C=2.0, class_weight="balanced", max_iter=1000, random_state=42)
        model.fit(X_train, y_train)

        smsa_f1 = f1_score(y_smsa_val, model.predict(X_smsa_val), average="macro")
        domain_f1 = f1_score(y_domain_val, model.predict(X_domain_val), average="macro")
        combined = 0.65 * smsa_f1 + 0.35 * domain_f1
        scores[use_stemming] = combined
        print(
            f"  [{label}] smsa_val_f1={smsa_f1:.4f}, "
            f"domain_val_f1={domain_f1:.4f}, combined={combined:.4f} ({time.time() - start:.1f}s)"
        )

    best_stemming = max(scores, key=scores.get)
    print(f"  -> selected stemming={best_stemming}")
    return best_stemming, tokenized


def search_best_model(
    prepped: dict[str, list[str]],
    splits: dict[str, pd.DataFrame],
    encoder: LabelEncoder,
):
    param_grid = list(
        ParameterGrid(
            [
                {
                    "family": ["svm"],
                    "C": [0.25, 0.5, 1.0],
                    "class_weight": [None, "balanced"],
                    "word_ngram": [(1, 2)],
                    "use_char": [True],
                },
                {
                    "family": ["logreg"],
                    "C": [1.0, 2.0, 5.0],
                    "class_weight": [None, "balanced"],
                    "word_ngram": [(1, 2)],
                    "use_char": [True],
                },
            ]
        )
    )

    y_train = encoder.transform(splits["train"]["labels"])
    y_smsa_val = encoder.transform(splits["smsa_val"]["labels"])
    y_domain_val = encoder.transform(splits["domain_val"]["labels"])

    vectorizer = build_vectorizer(word_ngram=(1, 2), use_char=True)
    X_train = vectorizer.fit_transform(prepped["train"])
    X_smsa_val = vectorizer.transform(prepped["smsa_val"])
    X_domain_val = vectorizer.transform(prepped["domain_val"])

    print("\n" + "=" * 60)
    print(f"model selection - {len(param_grid)} configs")
    print("=" * 60)

    best_score = -1.0
    best_config = None
    best_model = None

    for idx, config in enumerate(param_grid, 1):
        model = build_classifier(config, y_train)
        model.fit(X_train, y_train)

        smsa_pred = model.predict(X_smsa_val)
        domain_pred = model.predict(X_domain_val)
        smsa_f1 = f1_score(y_smsa_val, smsa_pred, average="macro")
        smsa_acc = accuracy_score(y_smsa_val, smsa_pred)
        domain_f1 = f1_score(y_domain_val, domain_pred, average="macro")
        score = 0.65 * smsa_f1 + 0.35 * domain_f1

        marker = " <-" if score > best_score else ""
        print(
            f"  [{idx:>2}/{len(param_grid)}] {config['family']:<6} C={config['C']:<4} "
            f"cw={str(config['class_weight']):<8} smsa_f1={smsa_f1:.4f} (acc={smsa_acc:.4f}) "
            f"dom_f1={domain_f1:.4f}{marker}"
        )

        if score > best_score:
            best_score = score
            best_config = config
            best_model = model

    return best_model, vectorizer, best_config


def evaluate_split(
    name: str,
    model,
    vectorizer,
    texts: list[str],
    labels: pd.Series,
    encoder: LabelEncoder,
) -> dict:
    X = vectorizer.transform(texts)
    y_true = encoder.transform(labels)
    y_pred = model.predict(X)
    y_proba = model.predict_proba(X)

    acc = accuracy_score(y_true, y_pred)
    macro_f1 = f1_score(y_true, y_pred, average="macro")
    try:
        auc = roc_auc_score(y_true, y_proba, multi_class="ovr", average="macro")
    except ValueError:
        auc = float("nan")
    report = classification_report(
        y_true,
        y_pred,
        target_names=encoder.classes_,
        digits=4,
        zero_division=0,
    )
    cm = confusion_matrix(y_true, y_pred)

    print(f"\n[{name}] accuracy={acc:.4f} macro_f1={macro_f1:.4f} roc_auc={auc:.4f}")
    print(report)
    return {
        "accuracy": acc,
        "macro_f1": macro_f1,
        "roc_auc": auc,
        "report": report,
        "cm": cm,
    }


def save_artifacts(
    model,
    vectorizer,
    encoder: LabelEncoder,
    use_stemming: bool,
    best_config: dict,
    dataset_name: str,
    metrics: dict[str, dict],
) -> None:
    joblib.dump(model, os.path.join(MODEL_DIR, "svm_model.pkl"))
    joblib.dump(vectorizer, os.path.join(MODEL_DIR, "tfidf_vect.pkl"))
    joblib.dump(encoder, os.path.join(MODEL_DIR, "label_encoder.pkl"))
    joblib.dump(
        {
            "use_stemming": use_stemming,
            "model_family": best_config["family"],
            "config": best_config,
            "version": "3.0",
        },
        os.path.join(MODEL_DIR, "preprocessing_config.pkl"),
    )

    lines = [
        "=" * 60,
        "livon ai - training report (v3)",
        "=" * 60,
        f"model        : {best_config['family']} (C={best_config['C']}, class_weight={best_config['class_weight']})",
        f"features     : FeatureUnion(word ngram={best_config['word_ngram']} + char_wb 3-5)",
        f"dataset      : {dataset_name}",
        f"stemming     : {use_stemming}",
        "",
    ]
    for split_name, res in metrics.items():
        lines.extend(
            [
                "-" * 40,
                split_name.upper(),
                "-" * 40,
                f"accuracy : {res['accuracy']:.4f}",
                f"macro_f1 : {res['macro_f1']:.4f}",
                f"roc-auc  : {res['roc_auc']:.4f}",
                "",
                res["report"].rstrip(),
                "",
                "confusion matrix:",
                str(res["cm"]),
                "",
            ]
        )

    report_path = os.path.join(MODEL_DIR, "training_report.txt")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines).rstrip() + "\n")
    print(f"\nsaved artifacts + report -> {MODEL_DIR}")


def sanity_check(
    model,
    vectorizer,
    encoder: LabelEncoder,
    use_stemming: bool,
) -> None:
    preprocessor = IndonesianPreprocessor(use_stemming=use_stemming)
    samples = [
        "jalanan di blok A sudah rusak parah, tolong segera perbaiki!",
        "terima kasih sudah memperbaiki trotoar, warga sangat senang",
        "kapan proyek ini mulai dikerjakan?",
        "proyek ini tidak bagus dan membuang anggaran",
        "pembangunan ini tidak mengganggu warga justru membantu",
        "konsepnya bagus tapi jalan masih banjir",
        "sebab aja masih menunggu rapat warga",
        "b aja",
    ]
    print("\nsanity check:")
    for text in samples:
        cleaned = preprocessor.transform(text)
        X = vectorizer.transform([cleaned])
        probs = model.predict_proba(X)[0]
        idx = int(probs.argmax())
        label = str(encoder.inverse_transform([idx])[0])
        print(f"  [{label.upper():8} {probs[idx]:.2f}] {text}")


def main() -> None:
    print("=" * 60)
    print("livon ai - training pipeline v3")
    print("=" * 60)

    splits = load_splits()
    encoder = LabelEncoder()
    encoder.fit(["negative", "neutral", "positive"])

    use_stemming, tokenized = benchmark_stemming(splits, encoder)
    prepped = tokenized[use_stemming]

    model, vectorizer, best_config = search_best_model(prepped, splits, encoder)

    metrics = {
        "smsa_validation": evaluate_split(
            "smsa_validation", model, vectorizer, prepped["smsa_val"], splits["smsa_val"]["labels"], encoder
        ),
        "smsa_test": evaluate_split(
            "smsa_test", model, vectorizer, prepped["smsa_test"], splits["smsa_test"]["labels"], encoder
        ),
        "domain_test": evaluate_split(
            "domain_test", model, vectorizer, prepped["domain_test"], splits["domain_test"]["labels"], encoder
        ),
    }

    save_artifacts(
        model,
        vectorizer,
        encoder,
        use_stemming,
        best_config,
        splits["dataset_name"],
        metrics,
    )
    sanity_check(model, vectorizer, encoder, use_stemming)


if __name__ == "__main__":
    main()
