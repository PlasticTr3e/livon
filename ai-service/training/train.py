"""
training pipeline for livon sentiment analysis.

improvements over v1:
    - preprocessing benchmark: compare with/without stemming
    - gridsearchcv on validation set for C and ngram_range tuning
    - best config is selected before final test evaluation

usage:
    python training/train.py

outputs:
    models/svm_model.pkl        - best calibrated linearsvc
    models/tfidf_vect.pkl       - best fitted tf-idf vectorizer
    models/label_encoder.pkl    - label encoder (int <-> string)
    models/training_report.txt  - full evaluation report
"""

import os
import sys
import time

import joblib
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score,
)
from sklearn.model_selection import ParameterGrid, train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.svm import LinearSVC

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from training.preprocess import IndonesianPreprocessor

ROOT_DIR  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR  = os.path.join(ROOT_DIR, "smsa-ind-classification", "data")
MODEL_DIR = os.path.join(ROOT_DIR, "app", "models")

os.makedirs(MODEL_DIR, exist_ok=True)

LABEL_MAP: dict[int, str] = {
    0: "positive",
    1: "neutral",
    2: "negative",
}

PARAM_GRID: list[dict] = list(ParameterGrid({
    "C":           [0.1, 0.5, 1.0, 5.0, 10.0],
    "ngram_range": [(1, 1), (1, 2), (1, 3)],
}))

TFIDF_BASE: dict = {
    "max_features": 30_000,
    "sublinear_tf": True,
    "min_df": 1,
}

SVM_BASE: dict = {
    "class_weight": "balanced",
    "max_iter":     2000,
    "random_state": 42,
}

def load_domain_data() -> pd.DataFrame:
    path = os.path.join(DATA_DIR, "domain_specific.csv")
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"domain_specific.csv not found in {DATA_DIR}. "
            "run training/generate_domain_data.py first."
        )
    df = pd.read_csv(path)
    print(f"  domain data: {len(df):>6} rows")
    return df


def split_domain_data(domain_df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    domain_df = apply_label_map(domain_df)
    train_df, temp_df = train_test_split(
        domain_df,
        test_size=0.4,
        random_state=42,
        stratify=domain_df["labels"],
    )
    val_df, test_df = train_test_split(
        temp_df,
        test_size=0.5,
        random_state=42,
        stratify=temp_df["labels"],
    )

    print("  parquet splits not found; using domain_specific.csv fallback")
    print(f"  {'train':>10}: {len(train_df):>6} rows")
    print(f"  {'validation':>10}: {len(val_df):>6} rows")
    print(f"  {'test':>10}: {len(test_df):>6} rows")
    return (
        train_df.reset_index(drop=True),
        val_df.reset_index(drop=True),
        test_df.reset_index(drop=True),
    )


def load_splits() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    print("loading dataset...")
    splits = {}
    for split in ["train", "validation", "test"]:
        matches = [
            f for f in os.listdir(DATA_DIR)
            if f.startswith(split) and f.endswith(".parquet")
        ]
        if not matches:
            return split_domain_data(load_domain_data())

        path = os.path.join(DATA_DIR, matches[0])
        splits[split] = pd.read_parquet(path)
        print(f"  {split:>10}: {len(splits[split]):>6} rows")

    domain_df = load_domain_data()
    train_df = pd.concat([splits["train"], domain_df], ignore_index=True)
    train_df = train_df.sample(frac=1, random_state=42).reset_index(drop=True)
    return train_df, splits["validation"], splits["test"]


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

    df = df.dropna(subset=["labels"])
    return df


def calibration_cv(labels) -> int:
    min_class_count = int(pd.Series(labels).value_counts().min())
    return max(2, min(5, min_class_count))

def benchmark_preprocessing(
    train_df: pd.DataFrame,
    val_df: pd.DataFrame,
    encoder: LabelEncoder,
) -> bool:
    results = {}

    for use_stemming in [True, False]:
        label = "with stemming" if use_stemming else "without stemming"
        print(f"\n  [{label}] preprocessing...")

        preprocessor = IndonesianPreprocessor(use_stemming=use_stemming)
        train_texts  = preprocessor.transform_batch(train_df["texts"].tolist())
        val_texts    = preprocessor.transform_batch(val_df["texts"].tolist())

        vectorizer = TfidfVectorizer(**TFIDF_BASE, ngram_range=(1, 2))
        X_train = vectorizer.fit_transform(train_texts)
        X_val   = vectorizer.transform(val_texts)

        y_train = encoder.transform(train_df["labels"])
        y_val   = encoder.transform(val_df["labels"])

        model = CalibratedClassifierCV(
            LinearSVC(C=1.0, **SVM_BASE),
            cv=calibration_cv(y_train),
            method="sigmoid",
        )
        model.fit(X_train, y_train)

        acc = accuracy_score(y_val, model.predict(X_val))
        results[use_stemming] = acc
        print(f"  [{label}] val accuracy: {acc:.4f}")

    best = max(results, key=results.get)
    print(f"\n  -> best config: {'with' if best else 'without'} stemming "
          f"({results[best]:.4f})")
    return best

def grid_search(
    train_df: pd.DataFrame,
    val_df: pd.DataFrame,
    encoder: LabelEncoder,
    use_stemming: bool,
) -> tuple[float, dict, list[str], list[str]]:

    print("\n" + "=" * 60)
    print(f"grid search - {len(PARAM_GRID)} configs")
    print("=" * 60)

    preprocessor = IndonesianPreprocessor(use_stemming=use_stemming)
    train_texts  = preprocessor.transform_batch(train_df["texts"].tolist())
    val_texts    = preprocessor.transform_batch(val_df["texts"].tolist())

    y_train = encoder.transform(train_df["labels"])
    y_val   = encoder.transform(val_df["labels"])

    best_acc    = -1.0
    best_params = {}
    start_total = time.time()

    for i, params in enumerate(PARAM_GRID, 1):
        vectorizer = TfidfVectorizer(
            **TFIDF_BASE,
            ngram_range=params["ngram_range"],
        )
        X_train = vectorizer.fit_transform(train_texts)
        X_val   = vectorizer.transform(val_texts)

        model = CalibratedClassifierCV(
            LinearSVC(C=params["C"], **SVM_BASE),
            cv=calibration_cv(y_train),
            method="sigmoid",
        )
        model.fit(X_train, y_train)
        acc = accuracy_score(y_val, model.predict(X_val))

        marker = " <-" if acc > best_acc else ""
        print(f"  [{i:>2}/{len(PARAM_GRID)}] C={params['C']:<5} "
              f"ngram={str(params['ngram_range']):<8} val_acc={acc:.4f}{marker}")

        if acc > best_acc:
            best_acc    = acc
            best_params = params

    elapsed = time.time() - start_total
    print(f"\n  best params : {best_params}")
    print(f"  best val acc: {best_acc:.4f}")
    print(f"  total time  : {elapsed:.1f}s")

    return best_acc, best_params, train_texts, val_texts

def train_best(
    train_texts: list[str],
    val_texts: list[str],
    test_df: pd.DataFrame,
    encoder: LabelEncoder,
    best_params: dict,
    use_stemming: bool,
) -> tuple[CalibratedClassifierCV, TfidfVectorizer, object, object, object]:
    """retrain on full train set using best params, then vectorize test."""
    print("\n" + "=" * 60)
    print("final training with best config")
    print("=" * 60)

    preprocessor = IndonesianPreprocessor(use_stemming=use_stemming)
    test_texts   = preprocessor.transform_batch(test_df["texts"].tolist())

    vectorizer = TfidfVectorizer(
        **TFIDF_BASE,
        ngram_range=best_params["ngram_range"],
    )
    X_train = vectorizer.fit_transform(train_texts)
    X_val   = vectorizer.transform(val_texts)
    X_test  = vectorizer.transform(test_texts)

    y_train = encoder.transform(
        pd.Series(train_texts).index.map(lambda _: None)  
    ) if False else None

    return vectorizer, X_train, X_val, X_test, test_texts


def train_model(X_train, y_train, best_params: dict) -> CalibratedClassifierCV:
    print(f"\ntraining with C={best_params['C']}, "
          f"ngram={best_params['ngram_range']}...")
    start = time.time()

    model = CalibratedClassifierCV(
        LinearSVC(C=best_params["C"], **SVM_BASE),
        cv=calibration_cv(y_train),
        method="sigmoid",
    )
    model.fit(X_train, y_train)
    print(f"  done in {time.time() - start:.1f}s")
    return model


def evaluate(
    model: CalibratedClassifierCV,
    X_val, y_val,
    X_test, y_test,
    encoder: LabelEncoder,
    best_params: dict,
    use_stemming: bool,
) -> dict[str, float]:
    class_names = [str(name) for name in encoder.classes_]
    class_labels = list(range(len(class_names)))
    results     = {}

    lines: list[str] = [
        "=" * 60,
        "livon ai - training report (v2)",
        "=" * 60,
        f"model        : linearsvc (calibrated, cv=5)",
        f"dataset      : smsa-ind-classification",
        f"best C       : {best_params['C']}",
        f"best ngram   : {best_params['ngram_range']}",
        f"stemming     : {use_stemming}",
        "",
    ]

    for split_name, X, y in [("validation", X_val, y_val), ("test", X_test, y_test)]:
        y_pred  = model.predict(X)
        y_prob  = model.predict_proba(X)
        acc     = accuracy_score(y, y_pred)
        if y_prob.ndim == 2 and y_prob.shape[1] == len(class_names) and len(set(y)) == len(class_names):
            roc_auc = roc_auc_score(y, y_prob, multi_class="ovr", average="macro")
        else:
            roc_auc = float("nan")
            print(
                f"  warning: skipping roc-auc for {split_name} set because "
                f"y_true has {len(set(y))} classes and y_score has {y_prob.shape[1]} columns"
            )
        report  = classification_report(
            y,
            y_pred,
            labels=class_labels,
            target_names=class_names,
            zero_division=0,
        )
        cm      = confusion_matrix(y, y_pred)

        results[f"{split_name}_accuracy"] = acc
        results[f"{split_name}_roc_auc"]  = roc_auc

        print(f"\n{split_name} set:")
        print(f"  accuracy : {acc:.4f}")
        print(f"  roc-auc  : {roc_auc:.4f}")
        print(f"\n{report}")

        lines += [
            "-" * 40,
            split_name.upper(),
            "-" * 40,
            f"accuracy : {acc:.4f}",
            f"roc-auc  : {roc_auc:.4f}",
            "",
            report,
            f"confusion matrix:\n{cm}",
            "",
        ]

    report_path = os.path.join(MODEL_DIR, "training_report.txt")
    with open(report_path, "w") as f:
        f.write("\n".join(lines))
    print(f"\nreport saved -> {report_path}")

    return results



def save_artifacts(
    model: CalibratedClassifierCV,
    vectorizer: TfidfVectorizer,
    encoder: LabelEncoder,
    use_stemming: bool,
) -> None:
    artifacts = {
        "svm_model.pkl":              model,
        "tfidf_vect.pkl":             vectorizer,
        "label_encoder.pkl":          encoder,
        "preprocessing_config.pkl":   {"use_stemming": use_stemming},
    }
    print("\nsaving artifacts...")
    for filename, obj in artifacts.items():
        path = os.path.join(MODEL_DIR, filename)
        joblib.dump(obj, path)
        print(f"  saved {filename}")


def sanity_check(
    model: CalibratedClassifierCV,
    vectorizer: TfidfVectorizer,
    encoder: LabelEncoder,
    use_stemming: bool,
) -> None:
    preprocessor = IndonesianPreprocessor(use_stemming=use_stemming)
    samples = [
        "jalanan di blok A sudah rusak parah, tolong segera perbaiki!",
        "terima kasih sudah memperbaiki trotoar, warga sangat senang",
        "pengerjaan sedang berlangsung minggu ini",
        "ga guna jelek",
        "ganggu banget ga berguna",
        "ini terlalu menghabiskan anggaran",
        "sangat dibutuhkan",
        "bagus tolong kembangkan",
        "b aja",
    ]
    print("\nsanity check:")
    for text in samples:
        cleaned  = preprocessor.transform(text)
        X        = vectorizer.transform([cleaned])
        idx      = model.predict(X)[0]
        prob     = max(model.predict_proba(X)[0])
        label    = str(encoder.inverse_transform([idx])[0])
        print(f"  [{label.upper():8} {prob:.2f}] {text[:65]}")

def main() -> None:
    print("=" * 60)
    print("livon ai - training pipeline v2")
    print("=" * 60)

    # load
    train_df, val_df, test_df = load_splits()
    train_df = apply_label_map(train_df)
    val_df   = apply_label_map(val_df)
    test_df  = apply_label_map(test_df)

    encoder = LabelEncoder()
    encoder.fit(train_df["labels"])
    print(f"\nlabel classes: {encoder.classes_}")

    y_train = encoder.transform(train_df["labels"])
    y_val   = encoder.transform(val_df["labels"])
    y_test  = encoder.transform(test_df["labels"])

    use_stemming = benchmark_preprocessing(train_df, val_df, encoder)

    _, best_params, train_texts, val_texts = grid_search(
        train_df, val_df, encoder, use_stemming
    )

    preprocessor = IndonesianPreprocessor(use_stemming=use_stemming)
    test_texts   = preprocessor.transform_batch(test_df["texts"].tolist())

    final_train_texts = train_texts + val_texts
    y_final_train = encoder.transform(
        pd.concat([train_df["labels"], val_df["labels"]], ignore_index=True)
    )

    vectorizer = TfidfVectorizer(**TFIDF_BASE, ngram_range=best_params["ngram_range"])
    X_train = vectorizer.fit_transform(final_train_texts)
    X_val   = vectorizer.transform(val_texts)
    X_test  = vectorizer.transform(test_texts)

    model   = train_model(X_train, y_final_train, best_params)
    results = evaluate(model, X_val, y_val, X_test, y_test, encoder, best_params, use_stemming)

    save_artifacts(model, vectorizer, encoder, use_stemming)
    sanity_check(model, vectorizer, encoder, use_stemming)

    print("\n" + "=" * 60)
    print("training complete")
    print(f"  best params   : {best_params}")
    print(f"  use stemming  : {use_stemming}")
    print(f"  val accuracy  : {results['validation_accuracy']:.4f}")
    print(f"  val roc-auc   : {results['validation_roc_auc']:.4f}")
    print(f"  test accuracy : {results['test_accuracy']:.4f}")
    print(f"  test roc-auc  : {results['test_roc_auc']:.4f}")
    print("=" * 60)


if __name__ == "__main__":
    main()
