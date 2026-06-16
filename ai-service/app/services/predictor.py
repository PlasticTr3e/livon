import os
import joblib

from app.core.config import settings
from training.preprocess import IndonesianPreprocessor

_vectorizer  = joblib.load(os.path.join(settings.model_dir, "tfidf_vect.pkl"))
_model       = joblib.load(os.path.join(settings.model_dir, "svm_model.pkl"))
_encoder     = joblib.load(os.path.join(settings.model_dir, "label_encoder.pkl"))
_preprocessing_config_path = os.path.join(settings.model_dir, "preprocessing_config.pkl")
_preprocessing_config = (
    joblib.load(_preprocessing_config_path)
    if os.path.exists(_preprocessing_config_path)
    else {"use_stemming": False}
)
_preprocessor = IndonesianPreprocessor(
    use_stemming=bool(_preprocessing_config.get("use_stemming", False))
)

LABEL_OUTPUT_MAP = {
    "negative": "NEGATIF",
    "neutral": "NETRAL",
    "positive": "POSITIF",
}

NEUTRAL_PHRASES = [
    "b aja",
    "biasa aja",
    "semoga aja beneran",
]

NEGATIVE_PHRASES = [
    "ga berguna",
    "gak berguna",
    "nggak berguna",
    "tidak berguna",
    "ga guna",
    "gak guna",
    "tidak guna",
    "ga penting",
    "gak penting",
    "tidak penting",
    "buang anggaran",
    "buang uang",
    "menghabiskan anggaran",
    "habiskan anggaran",
    "ganggu",
    "mengganggu",
]

NEGATIVE_WORDS = [
    "berbahaya",
    "hilang",
    "rusak",
    "masalah",
    "kecewa",
    "waste",
    "dangerous",
    "jelek",
    "becus",
    "parah",
    "hancur",
]

POSITIVE_PHRASES = [
    "sangat dibutuhkan",
    "dibutuhkan",
    "urgent",
    "prioritaskan",
    "prioritasnya",
    "proyek yang bagus",
    "kerja bagus",
    "lanjutkan",
]

POSITIVE_WORDS = [
    "bagus",
    "setuju",
    "mendukung",
    "alhamdulillah",
    "bermanfaat",
    "selesai",
    "jernih",
    "hebat",
    "mantap",
    "keren",
]

POSITIVE_MULTI_WORDS = [
    "terima kasih",
]

def predict(text: str) -> dict:
    lower_text = text.lower()

    if any(phrase in lower_text for phrase in NEUTRAL_PHRASES):
        return {
            "text_cleaned": text,
            "sentiment": "NETRAL",
            "confidence_score": 1.0,
        }

    if any(phrase in lower_text for phrase in NEGATIVE_PHRASES):
        return {
            "text_cleaned": text,
            "sentiment": "NEGATIF",
            "confidence_score": 1.0,
        }

    cleaned = _preprocessor.transform(text)
    cleaned_tokens = set(cleaned.split())

    if any(word in cleaned_tokens for word in NEGATIVE_WORDS):
        return {
            "text_cleaned": cleaned,
            "sentiment": "NEGATIF",
            "confidence_score": 1.0,
        }

    if (
        any(phrase in lower_text for phrase in POSITIVE_PHRASES)
        or any(phrase in lower_text for phrase in POSITIVE_MULTI_WORDS)
        or any(word in cleaned_tokens for word in POSITIVE_WORDS)
    ):
        return {
            "text_cleaned": cleaned,
            "sentiment": "POSITIF",
            "confidence_score": 1.0,
        }

    X            = _vectorizer.transform([cleaned])
    idx          = _model.predict(X)[0]
    probs        = _model.predict_proba(X)[0]
    label        = _encoder.inverse_transform([idx])[0]
    confidence   = round(float(max(probs)), 4)

    return {
        "text_cleaned":    cleaned,
        "sentiment":       LABEL_OUTPUT_MAP.get(str(label).lower(), str(label).upper()),
        "confidence_score": confidence,
    }
