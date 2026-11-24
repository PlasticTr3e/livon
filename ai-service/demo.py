"""Interactive terminal demo for Livon Indonesian sentiment analysis.

Supports two backends:
- Local model inference (requires ai-service runtime dependencies installed)
- Remote HTTP inference against a running ai-service container (--url / --token)
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from collections.abc import Callable

AI_DIR = os.path.dirname(os.path.abspath(__file__))

SAMPLE_TEXTS: tuple[str, ...] = (
    "terima kasih sudah memperbaiki trotoar, warga sangat senang 👍",
    "jalanan di blok A sudah rusak parahhh, tolong segera perbaiki!!",
    "kapan proyek perbaikan drainase ini mulai dikerjakan?",
    "proyek ini tdk bagus dan buang anggaran",
    "pembangunan ini gak mengganggu warga justru sangat membantu",
    "konsepnya bagus tapi jalan masih banjir terus",
    "b aja sih pengerjaannya",
    "bagusss bgt pengurus, mantul mks 🙏",
)

LABEL_ORDER: tuple[str, ...] = ("POSITIF", "NETRAL", "NEGATIF")
LABEL_COLORS: dict[str, str] = {
    "POSITIF": "\033[92m",
    "NETRAL": "\033[93m",
    "NEGATIF": "\033[91m",
}
ANSI_BOLD = "\033[1m"
ANSI_DIM = "\033[2m"
ANSI_RESET = "\033[0m"


def _supports_color(disable_flag: bool) -> bool:
    if disable_flag or os.environ.get("NO_COLOR"):
        return False
    return sys.stdout.isatty()


def _colorize(text: str, code: str, enabled: bool) -> str:
    if not enabled or not code:
        return text
    return f"{code}{text}{ANSI_RESET}"


def _build_local_predictor() -> Callable[[str], dict]:
    os.environ.setdefault("INTERNAL_API_KEY", "demo-local")
    os.environ.setdefault("MODEL_DIR", os.path.join(AI_DIR, "app", "models"))
    if AI_DIR not in sys.path:
        sys.path.insert(0, AI_DIR)

    try:
        from app.services.predictor import predict
    except ModuleNotFoundError as exc:
        raise RuntimeError(
            f"Missing local AI dependency ({exc.name}). Run inside the ai-service "
            "environment/Docker container, or pass --url http://localhost:8000 "
            "--token <INTERNAL_API_KEY> to query a running container."
        ) from exc

    return predict


def _build_http_predictor(base_url: str, token: str) -> Callable[[str], dict]:
    endpoint = f"{base_url.rstrip('/')}/api/predict"
    if not token:
        raise RuntimeError(
            "HTTP mode requires an API token via --token or INTERNAL_API_KEY."
        )

    def predict_via_http(text: str) -> dict:
        payload = json.dumps({"text": text}).encode("utf-8")
        req = urllib.request.Request(
            endpoint,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                parsed = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"AI service returned HTTP {exc.code}: {detail}") from exc
        except urllib.error.URLError as exc:
            raise RuntimeError(f"Could not reach {endpoint}: {exc.reason}") from exc

        if not parsed.get("success") or not isinstance(parsed.get("data"), dict):
            raise RuntimeError(f"Unexpected response payload: {parsed}")
        return parsed["data"]

    return predict_via_http


def _format_bar(prob: float, width: int = 20) -> str:
    clamped = max(0.0, min(1.0, prob))
    filled = round(clamped * width)
    return "#" * filled + "-" * (width - filled)


def _render_result(
    text: str,
    result: dict,
    elapsed_ms: float,
    use_color: bool,
) -> None:
    sentiment = str(result.get("sentiment", "NETRAL"))
    confidence = float(result.get("confidence_score", 0.5))
    cleaned = str(result.get("text_cleaned", ""))
    probs = result.get("probabilities") or {}

    badge = _colorize(f"[{sentiment:<7}]", LABEL_COLORS.get(sentiment, ""), use_color)
    header = (
        f"{badge} "
        f"{_colorize(f'{confidence * 100:5.1f}%', ANSI_BOLD, use_color)} "
        f"{_colorize(f'({elapsed_ms:.1f} ms)', ANSI_DIM, use_color)}  "
        f"{text}"
    )
    print(header)

    if cleaned:
        print(_colorize(f"  tokens : {cleaned}", ANSI_DIM, use_color))
    else:
        print(_colorize("  tokens : <empty after cleaning>", ANSI_DIM, use_color))

    if isinstance(probs, dict) and probs:
        parts: list[str] = []
        for label in LABEL_ORDER:
            p = float(probs.get(label, 0.0))
            parts.append(f"{label:<7} [{_format_bar(p, 12)}] {p * 100:5.1f}%")
        print("  scores : " + "  |  ".join(parts))

    print()


def _evaluate_and_print(
    predict_fn: Callable[[str], dict],
    text: str,
    use_color: bool,
) -> None:
    start = time.perf_counter()
    result = predict_fn(text)
    elapsed_ms = (time.perf_counter() - start) * 1000.0
    _render_result(text, result, elapsed_ms, use_color)


def _run_samples(predict_fn: Callable[[str], dict], use_color: bool) -> None:
    print(_colorize("=== Sample Civic Feedback Showcase ===", ANSI_BOLD, use_color))
    print()
    for sample in SAMPLE_TEXTS:
        _evaluate_and_print(predict_fn, sample, use_color)


def _run_interactive(
    predict_fn: Callable[[str], dict],
    mode_label: str,
    use_color: bool,
) -> None:
    is_tty = sys.stdin.isatty()
    if is_tty:
        print(_colorize("Livon AI - Indonesian Sentiment Demo", ANSI_BOLD, use_color))
        print(_colorize(f"Backend: {mode_label}", ANSI_DIM, use_color))
        print("Enter a comment to analyze, ':samples' to run examples, or 'exit' to quit.\n")

    while True:
        try:
            line = input("> " if is_tty else "")
        except (EOFError, KeyboardInterrupt):
            if is_tty:
                print("\nBye.")
            break

        text = line.strip()
        if not text:
            continue
        if text.lower() in {"exit", "quit", ":q"}:
            if is_tty:
                print("Bye.")
            break
        if text.lower() == ":samples":
            _run_samples(predict_fn, use_color)
            continue

        try:
            _evaluate_and_print(predict_fn, text, use_color)
        except RuntimeError as exc:
            print(f"Error: {exc}", file=sys.stderr)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Terminal demo for Livon Indonesian sentiment analysis."
    )
    parser.add_argument(
        "--text",
        type=str,
        help="Analyze a single input string and exit.",
    )
    parser.add_argument(
        "--samples",
        action="store_true",
        help="Run built-in Indonesian civic sentiment examples and exit.",
    )
    parser.add_argument(
        "--url",
        type=str,
        help="Query a running ai-service base URL (e.g. http://localhost:8000).",
    )
    parser.add_argument(
        "--token",
        type=str,
        default=os.environ.get("INTERNAL_API_KEY", ""),
        help="Bearer token for --url mode (defaults to INTERNAL_API_KEY env var).",
    )
    parser.add_argument(
        "--no-color",
        action="store_true",
        help="Disable ANSI terminal colors.",
    )
    return parser.parse_args()


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    args = parse_args()
    use_color = _supports_color(args.no_color)

    try:
        if args.url:
            predict_fn = _build_http_predictor(args.url, args.token)
            mode_label = f"HTTP API ({args.url.rstrip('/')})"
        else:
            predict_fn = _build_local_predictor()
            mode_label = "Local scikit-learn model (app/models)"
    except RuntimeError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    try:
        if args.samples:
            _run_samples(predict_fn, use_color)
        elif args.text is not None:
            cleaned = args.text.strip()
            if not cleaned:
                print("Error: --text must not be empty.", file=sys.stderr)
                return 1
            _evaluate_and_print(predict_fn, cleaned, use_color)
        else:
            _run_interactive(predict_fn, mode_label, use_color)
    except RuntimeError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
