import os
import sys
import unittest

os.environ.setdefault("INTERNAL_API_KEY", "test-secret")

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT_DIR)

from training.preprocess import IndonesianPreprocessor
from app.services.predictor import predict


class TestIndonesianPreprocessor(unittest.TestCase):
    def setUp(self) -> None:
        self.prep = IndonesianPreprocessor(use_stemming=False)

    def test_negation_is_scoped_until_clause_boundary(self) -> None:
        cleaned = self.prep.transform("tidak mengganggu warga, sangat bagus!")
        tokens = cleaned.split()
        self.assertIn("NOT_mengganggu", tokens)
        self.assertIn("NOT_warga", tokens)
        self.assertIn("bagus", tokens)
        self.assertNotIn("NOT_bagus", tokens)

    def test_elongated_slang_and_emoji_normalized(self) -> None:
        cleaned = self.prep.transform("Bagusss bgt mks pengurus 👍")
        self.assertEqual(cleaned, "bagus banget terima kasih pengurus emoji_positif")


class TestPredictor(unittest.TestCase):
    def test_negated_praise_is_not_classified_positive(self) -> None:
        res = predict("proyek ini tidak bagus dan tidak penting")
        self.assertEqual(res["sentiment"], "NEGATIF")

    def test_negated_disruption_with_positive_context(self) -> None:
        res = predict("pembangunan ini tidak mengganggu warga, sangat membantu")
        self.assertEqual(res["sentiment"], "POSITIF")

    def test_substring_does_not_trigger_neutral_override(self) -> None:
        res = predict("sebab aja bagus banget pelaksanaannya alhamdulillah")
        self.assertEqual(res["sentiment"], "POSITIF")

    def test_domain_praise_and_complaint(self) -> None:
        pos = predict("alhamdulillah jalan sudah bagus dan sangat membantu warga")
        neg = predict("buang anggaran saja proyek ini kualitasnya jelek dan bikin banjir")
        neu = predict("kapan proyek ini mulai dikerjakan dan berapa biayanya?")
        mild = predict("b aja")
        self.assertEqual(pos["sentiment"], "POSITIF")
        self.assertEqual(neg["sentiment"], "NEGATIF")
        self.assertEqual(neu["sentiment"], "NETRAL")
        self.assertEqual(mild["sentiment"], "NETRAL")

    def test_empty_punctuation_input_falls_back_cleanly(self) -> None:
        res = predict("... !!! ???")
        self.assertEqual(res["sentiment"], "NETRAL")
        self.assertEqual(res["confidence_score"], 0.5)


if __name__ == "__main__":
    unittest.main()
