import re

from Sastrawi.Stemmer.StemmerFactory import StemmerFactory

_SLANG: dict[str, str] = {
    "gw": "saya", "gue": "saya", "sy": "saya",
    "lo": "kamu", "lu": "kamu", "km": "kamu",
    "ga": "tidak", "gak": "tidak", "gk": "tidak", "nggak": "tidak",
    "ngga": "tidak", "enggak": "tidak", "engga": "tidak", "tdk": "tidak",
    "kagak": "tidak", "kaga": "tidak", "ndak": "tidak", "nda": "tidak",
    "tak": "tidak", "bkn": "bukan", "jgn": "jangan", "krg": "kurang",
    "blm": "belum", "blom": "belum",
    "yg": "yang", "dg": "dengan", "dgn": "dengan",
    "utk": "untuk", "krn": "karena", "karna": "karena",
    "sdh": "sudah", "udah": "sudah", "ud": "sudah",
    "jg": "juga", "lg": "lagi",
    "trs": "terus", "trus": "terus", "tp": "tapi", "tpi": "tapi",
    "klo": "kalau", "klu": "kalau", "kalo": "kalau", "klw": "kalau",
    "bs": "bisa", "jd": "jadi", "aja": "saja", "aj": "saja",
    "bgt": "banget", "bngt": "banget", "sgt": "sangat",
    "skrg": "sekarang", "stlh": "setelah", "sblm": "sebelum",
    "dr": "dari", "pd": "pada", "spy": "supaya",
    "lbh": "lebih", "brp": "berapa", "smg": "semoga",
    "bnyk": "banyak", "byk": "banyak", "dikit": "sedikit",
    "org": "orang", "wrg": "warga", "msh": "masih", "dpt": "dapat",
    "emg": "memang", "bener": "benar", "beneran": "benaran",
    "blg": "bilang", "pke": "pakai",
    "jln": "jalan", "jl": "jalan",
    "dpn": "depan", "blkg": "belakang",
    "kec": "kecamatan", "kel": "kelurahan",
    "rmh": "rumah", "hrs": "harus",
    "pem": "pemerintah",
    "mks": "terima kasih", "makasih": "terima kasih",
    "mksh": "terima kasih", "thx": "terima kasih", "tq": "terima kasih",
    "bgus": "bagus", "bgs": "bagus",
    "mntp": "mantap", "mantul": "mantap",
    "jlk": "jelek", "rsk": "rusak", "prh": "parah",
}

_NEGATION_WORDS: set[str] = {
    "tidak", "bukan", "belum", "jangan", "kurang", "tanpa", "anti",
}

_CONTRAST_WORDS: set[str] = {
    "tapi", "tetapi", "namun", "melainkan", "padahal", "sedangkan", "justru",
}

_CLAUSE_SEP = "__SEP__"

_POSITIVE_EMOJIS = frozenset("👍👌❤️💖👏🎉😊😁😄🥳🙌🙏💪✅😍🥰")
_NEGATIVE_EMOJIS = frozenset("👎😡🤬😠💔😢😭😞😔😫💩❌⚠️")

_RE_URL = re.compile(r"https?://\S+|www\.\S+")
_RE_MENTION = re.compile(r"@\w+")
_RE_HASHTAG = re.compile(r"#(\w+)")
_RE_NUMBER = re.compile(r"\d+")
_RE_CLAUSE_BOUNDARY = re.compile(r"[.,!?;:\n]+")
_RE_PUNCT = re.compile(r"[^\w\s]")
_RE_ELONGATION = re.compile(r"(.)\1{2,}")
_RE_WHITESPACE = re.compile(r"\s+")
_RE_MILD_IDIOM = re.compile(r"\bb\s+aja\b")


class IndonesianPreprocessor:
    """Normalizes informal Indonesian text and scopes negation within clauses."""

    def __init__(self, use_stemming: bool = False) -> None:
        self.use_stemming = use_stemming
        self._stem_cache: dict[str, str] = {}

        if use_stemming:
            stemmer_factory = StemmerFactory()
            self._stemmer = stemmer_factory.create_stemmer()
        else:
            self._stemmer = None

        self._stopwords: set[str] = {
            "yang", "di", "ke", "dari", "dan", "atau", "ini", "itu",
            "dengan", "pada", "untuk", "adalah", "dalam", "oleh", "juga",
            "sebagai", "telah", "akan", "ada", "bisa",
            "saya", "kamu", "kami", "mereka", "kita", "dia", "ia",
            "nya", "pun", "lah", "kah", "tah",
        }

    def transform(self, text: str) -> str:
        cleaned = self._clean(text)
        if not cleaned:
            return ""

        tokens = self._normalize_tokens(cleaned.split())
        if self.use_stemming:
            tokens = [self._stem_token(t) for t in tokens]
        tokens = [
            t for t in tokens
            if t == _CLAUSE_SEP or t not in self._stopwords
        ]
        tokens = self._apply_negation_scope(tokens)
        return " ".join(t for t in tokens if t != _CLAUSE_SEP)

    def transform_batch(self, texts: list[str]) -> list[str]:
        return [self.transform(t) for t in texts]

    @staticmethod
    def _replace_emojis(text: str) -> str:
        chars: list[str] = []
        for ch in text:
            if ch in _POSITIVE_EMOJIS:
                chars.append(" emoji_positif ")
            elif ch in _NEGATIVE_EMOJIS:
                chars.append(" emoji_negatif ")
            else:
                chars.append(ch)
        return "".join(chars)

    @classmethod
    def _clean(cls, text: str) -> str:
        text = cls._replace_emojis(text)
        text = _RE_URL.sub(" ", text)
        text = _RE_MENTION.sub(" ", text)
        text = _RE_HASHTAG.sub(r" \1 ", text)
        text = _RE_CLAUSE_BOUNDARY.sub(f" {_CLAUSE_SEP} ", text)
        text = _RE_NUMBER.sub(" ", text)
        text = _RE_PUNCT.sub(" ", text)
        text = text.lower().replace("__sep__", _CLAUSE_SEP)
        text = _RE_MILD_IDIOM.sub("biasa saja", text)
        return _RE_WHITESPACE.sub(" ", text).strip()

    @staticmethod
    def _normalize_tokens(tokens: list[str]) -> list[str]:
        normalized: list[str] = []
        for token in tokens:
            if token == _CLAUSE_SEP:
                normalized.append(token)
                continue
            collapsed = _RE_ELONGATION.sub(r"\1", token)
            replacement = _SLANG.get(collapsed, collapsed)
            normalized.extend(replacement.split())
        return normalized

    def _stem_token(self, token: str) -> str:
        if token == _CLAUSE_SEP or token.startswith("emoji_"):
            return token
        cached = self._stem_cache.get(token)
        if cached is not None:
            return cached
        stemmed = self._stemmer.stem(token) if self._stemmer else token
        self._stem_cache[token] = stemmed
        return stemmed

    @staticmethod
    def _apply_negation_scope(tokens: list[str]) -> list[str]:
        scoped: list[str] = []
        neg_remaining = 0
        for token in tokens:
            if token == _CLAUSE_SEP or token in _CONTRAST_WORDS:
                neg_remaining = 0
                scoped.append(token)
            elif token in _NEGATION_WORDS:
                neg_remaining = 2
                scoped.append(token)
            elif neg_remaining > 0:
                scoped.append(f"NOT_{token}")
                neg_remaining -= 1
            else:
                scoped.append(token)
        return scoped
