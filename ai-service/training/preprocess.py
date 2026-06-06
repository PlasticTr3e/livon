import re

from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory

_SLANG: dict[str, str] = {
    "gw": "saya", "gue": "saya", "sy": "saya",
    "lo": "kamu", "lu": "kamu", "km": "kamu",
    "ga": "tidak", "gak": "tidak", "nggak": "tidak",
    "ngga": "tidak", "enggak": "tidak", "tdk": "tidak",
    "yg": "yang", "dg": "dengan", "dgn": "dengan",
    "utk": "untuk", "krn": "karena", "karna": "karena",
    "sdh": "sudah", "udah": "sudah", "ud": "sudah",
    "blm": "belum", "jg": "juga", "lg": "lagi",
    "trs": "terus", "trus": "terus", "tp": "tapi",
    "klo": "kalau", "klu": "kalau", "kalo": "kalau",
    "bs": "bisa", "jd": "jadi", "aja": "saja",
    "bgt": "banget", "sgt": "sangat",
    "skrg": "sekarang", "stlh": "setelah", "sblm": "sebelum",
    "dr": "dari", "pd": "pada", "spy": "supaya",
    "lbh": "lebih", "brp": "berapa",
    "jln": "jalan", "jl": "jalan",
    "dpn": "depan", "blkg": "belakang",
    "kec": "kecamatan", "kel": "kelurahan",
    "rmh": "rumah", "hrs": "harus",
    "pem": "pemerintah",
}

_RE_URL        = re.compile(r"https?://\S+|www\.\S+")
_RE_MENTION    = re.compile(r"@\w+")
_RE_HASHTAG    = re.compile(r"#\w+")
_RE_NUMBER     = re.compile(r"\d+")
_RE_PUNCT      = re.compile(r"[^\w\s]")
_RE_WHITESPACE = re.compile(r"\s+")


class IndonesianPreprocessor:
    def __init__(self, use_stemming: bool = True) -> None:
        self.use_stemming = use_stemming

        if use_stemming:
            stemmer_factory  = StemmerFactory()
            self._stemmer    = stemmer_factory.create_stemmer()
        else:
            self._stemmer = None

        self._stopwords: set[str] = {
            "yang", "di", "ke", "dari", "dan", "atau", "ini", "itu",
            "dengan", "pada", "untuk", "adalah", "dalam", "oleh", "juga",
            "sebagai", "telah", "akan", "sudah", "ada", "tidak", "bisa",
            "saya", "kamu", "kami", "mereka", "kita", "dia", "ia",
            "nya", "pun", "lah", "kah", "tah",
        }

    def transform(self, text: str) -> str:
        text = self._clean(text)
        text = self._normalize_slang(text)
        if self.use_stemming:
            text = self._stem(text)
        text = self._remove_stopwords(text)
        return text

    def transform_batch(self, texts: list[str]) -> list[str]:
        return [self.transform(t) for t in texts]

    @staticmethod
    def _clean(text: str) -> str:
        """steps 1 & 2: noise removal + lowercase."""
        text = _RE_URL.sub(" ", text)
        text = _RE_MENTION.sub(" ", text)
        text = _RE_HASHTAG.sub(" ", text)
        text = _RE_NUMBER.sub(" ", text)
        text = _RE_PUNCT.sub(" ", text)
        text = text.lower()
        return _RE_WHITESPACE.sub(" ", text).strip()

    @staticmethod
    def _normalize_slang(text: str) -> str:
        return " ".join(_SLANG.get(token, token) for token in text.split())

    def _stem(self, text: str) -> str:
        return self._stemmer.stem(text)

    def _remove_stopwords(self, text: str) -> str:
        return " ".join(t for t in text.split() if t not in self._stopwords)