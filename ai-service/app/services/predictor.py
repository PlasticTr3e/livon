import os

import joblib

from app.core.config import settings
from training.preprocess import IndonesianPreprocessor

_vectorizer  = joblib.load(os.path.join(settings.model_dir, "tfidf_vect.pkl"))
_model       = joblib.load(os.path.join(settings.model_dir, "svm_model.pkl"))
_encoder     = joblib.load(os.path.join(settings.model_dir, "label_encoder.pkl"))
_preprocessor = IndonesianPreprocessor(use_stemming=False)

def predict(text: str) -> dict:
    cleaned      = _preprocessor.transform(text)
    X            = _vectorizer.transform([cleaned])
    idx          = _model.predict(X)[0]
    probs        = _model.predict_proba(X)[0]
    label        = _encoder.inverse_transform([idx])[0]
    confidence   = round(float(max(probs)), 4)

    return {
        "text_cleaned":    cleaned,
        "sentiment":       label.upper(),
        "confidence_score": confidence,
    }