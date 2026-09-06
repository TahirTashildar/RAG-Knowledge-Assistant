"""
Evaluation methodology (documented here and in the README, per Section 26):

1. A fixed set of questions is defined below, each with a keyword or phrase
   that SHOULD appear in a relevant retrieved chunk if retrieval worked
   (a crude but honest proxy for "relevant-context retrieval rate" — this is
   NOT a judgment of answer correctness, which would need human review or a
   separate LLM-graded eval that this script does not implement).
2. For each question, both STANDARD and MULTI_QUERY pipelines are run
   against the same user's documents.
3. We measure:
   - Latency (wall-clock time for the full pipeline call)
   - Relevant-context retrieval rate (did any retrieved chunk contain the
     expected keyword?)
4. Results are printed as a table. No score is invented for anything that
   wasn't actually measured (e.g. we do not claim an "accuracy %" — that
   would require ground-truth answers and a grading step this script
   doesn't have).

Requires a live rag-service with real Hugging Face credentials and documents
already ingested for the given user_id — this is an integration eval, not a
unit test, and genuinely cannot run without those.

Usage:
    python eval/evaluate.py --user-id <id> --questions eval/questions.json
"""
import argparse
import json
import time
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.rag.pipeline import run_pipeline  # noqa: E402


def run_eval(user_id: str, questions: list[dict]) -> list[dict]:
    rows = []
    for q in questions:
        question = q["question"]
        expected_keyword = q.get("expected_keyword", "").lower()

        for mode in ("STANDARD", "MULTI_QUERY"):
            start = time.perf_counter()
            try:
                result = run_pipeline(mode=mode, user_id=user_id, question=question)
                elapsed = time.perf_counter() - start
                hit = any(expected_keyword in s["chunkText"].lower() for s in result["sources"]) if expected_keyword else None
                rows.append(
                    {
                        "question": question,
                        "mode": mode,
                        "latency_seconds": round(elapsed, 3),
                        "chunks_retrieved": len(result["sources"]),
                        "expected_keyword_found": hit,
                        "error": None,
                    }
                )
            except Exception as e:
                rows.append(
                    {
                        "question": question,
                        "mode": mode,
                        "latency_seconds": None,
                        "chunks_retrieved": None,
                        "expected_keyword_found": None,
                        "error": str(e),
                    }
                )
    return rows


def summarize(rows: list[dict]) -> None:
    print(f"{'Mode':<12} {'Avg latency (s)':<18} {'Relevant-context rate':<22} {'Errors'}")
    for mode in ("STANDARD", "MULTI_QUERY"):
        mode_rows = [r for r in rows if r["mode"] == mode]
        successful = [r for r in mode_rows if r["error"] is None]
        errors = len(mode_rows) - len(successful)

        latencies = [r["latency_seconds"] for r in successful if r["latency_seconds"] is not None]
        avg_latency = round(sum(latencies) / len(latencies), 3) if latencies else None

        hits = [r["expected_keyword_found"] for r in successful if r["expected_keyword_found"] is not None]
        rate = f"{round(100 * sum(hits) / len(hits), 1)}%" if hits else "n/a"

        print(f"{mode:<12} {str(avg_latency):<18} {rate:<22} {errors}")

    print(
        "\nNote: 'Relevant-context rate' only checks whether the expected keyword "
        "appeared in a retrieved chunk — it is a retrieval proxy, not a judgment "
        "of answer correctness. Any latency difference here is from this run "
        "only and has not been established as statistically significant across "
        "repeated runs."
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--user-id", required=True)
    parser.add_argument("--questions", default=str(Path(__file__).parent / "questions.json"))
    args = parser.parse_args()

    questions = json.loads(Path(args.questions).read_text())
    rows = run_eval(args.user_id, questions)
    print(json.dumps(rows, indent=2))
    print()
    summarize(rows)
