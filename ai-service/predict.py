import joblib
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from training.preprocess import IndonesianPreprocessor

ROOT_DIR  = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(ROOT_DIR, "models")

model     = joblib.load(os.path.join(MODEL_DIR, "svm_model.pkl"))
vectorizer = joblib.load(os.path.join(MODEL_DIR, "tfidf_vect.pkl"))
encoder   = joblib.load(os.path.join(MODEL_DIR, "label_encoder.pkl"))
preprocessor = IndonesianPreprocessor(use_stemming=False)

def predict(text: str) -> dict:
    cleaned = preprocessor.transform(text)
    X       = vectorizer.transform([cleaned])
    idx     = model.predict(X)[0]
    probs   = model.predict_proba(X)[0]
    label   = str(encoder.inverse_transform([idx])[0])
    return {
        "text_cleaned":    cleaned,
        "sentiment":       label.upper(),
        "confidence":      round(float(max(probs)), 10),
    }

if __name__ == "__main__":
    while True:
        text = input("\nmasukkan teks (ctrl+c untuk keluar): ")
        result = predict(text)
        print(f"  sentiment  : {result['sentiment']}")
        print(f"  confidence : {result['confidence']}")
        print(f"  cleaned    : {result['text_cleaned']}")