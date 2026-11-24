import os
import joblib

from app.core.config import settings
from training.preprocess import IndonesianPreprocessor

_vectorizer = joblib.load(os.path.join(settings.model_dir, "tfidf_vect.pkl"))
_model = joblib.load(os.path.join(settings.model_dir, "svm_model.pkl"))
_encoder = joblib.load(os.path.join(settings.model_dir, "label_encoder.pkl"))
_preprocessing_config_path = os.path.join(
    settings.model_dir, "preprocessing_config.pkl"
)
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


def predict(text: str) -> dict:
    """Predicts sentiment label, confidence, and per-class probabilities."""
    cleaned = _preprocessor.transform(text)
    if not cleaned:
        return {
            "text_cleaned": "",
            "sentiment": "NETRAL",
            "confidence_score": 0.5,
            "probabilities": {
                "POSITIF": 0.0,
                "NEGATIF": 0.0,
                "NETRAL": 1.0,
            },
        }

    features = _vectorizer.transform([cleaned])
    probs = _model.predict_proba(features)[0]
    best_idx = int(probs.argmax())
    raw_label = str(_encoder.inverse_transform([best_idx])[0]).lower()
    mapped_label = LABEL_OUTPUT_MAP.get(raw_label, raw_label.upper())

    prob_map = {
        LABEL_OUTPUT_MAP.get(str(cls_name).lower(), str(cls_name).upper()): round(
            float(prob), 4
        )
        for cls_name, prob in zip(_encoder.classes_, probs)
    }

    return {
        "text_cleaned": cleaned,
        "sentiment": mapped_label,
        "confidence_score": round(float(probs[best_idx]), 4),
        "probabilities": prob_map,
    }
