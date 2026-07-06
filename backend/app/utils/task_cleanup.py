"""Deterministic task cleanup utility.

Pure function — no LLM calls, no database access, no FastAPI dependencies.
Applies normalization, blocklisting, deduplication, and field corrections.
"""
import logging
import re
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

# Exact-match blocklist of normalised titles that represent meta/agenda items.
_BLOCKLIST: set[str] = {
    "review sprint priorities",
    "finalize scope",
    "meeting discussion",
    "general discussion",
    "agenda review",
    "project discussion",
    "add tasks to sprint",
    "sprint planning",
}


def _normalize_title(title: str) -> str:
    """Lowercase, strip, collapse whitespace, remove surrounding punctuation."""
    t = title.strip().lower()
    t = re.sub(r"\s+", " ", t)
    t = t.strip(".,;:!?\"'()[]{}–—-")
    return t


def _has_named_owner(task: Dict[str, Any]) -> bool:
    """Return True if the task has a real (non-Unassigned) owner."""
    owner = (task.get("owner") or "").strip()
    return bool(owner) and owner.lower() != "unassigned"


def _is_better_duplicate(candidate: Dict[str, Any], existing: Dict[str, Any]) -> bool:
    """Return True if *candidate* should replace *existing*.

    Deterministic ordered comparison:
      1. Named owner beats "Unassigned".
      2. Non-null due_date beats null.
      3. Longer non-empty description wins.
      4. If still tied, keep existing (first occurrence).
    """
    cand_owner = _has_named_owner(candidate)
    exist_owner = _has_named_owner(existing)
    if cand_owner and not exist_owner:
        return True
    if exist_owner and not cand_owner:
        return False

    cand_due = candidate.get("due_date") is not None
    exist_due = existing.get("due_date") is not None
    if cand_due and not exist_due:
        return True
    if exist_due and not cand_due:
        return False

    cand_desc_len = len((candidate.get("description") or "").strip())
    exist_desc_len = len((existing.get("description") or "").strip())
    if cand_desc_len > exist_desc_len:
        return True

    # Tied on all criteria — keep existing (first occurrence)
    return False


def clean_tasks(tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Apply deterministic cleanup pipeline to a list of task dicts.

    Processing order:
      1. Remove blank/empty titles
      2. Normalize titles (internal use only)
      3. Safety-net blocklist
      4. Deduplicate by normalised title (keep most complete)
      5. Normalize owner
      6. Normalize priority
      7. Return cleaned list
    """
    result: List[Dict[str, Any]] = []

    # ── Step 1: Remove tasks with blank/empty/None titles ────────────────
    valid: List[Dict[str, Any]] = []
    for task in tasks:
        title = task.get("title")
        if title is None or str(title).strip() == "":
            logger.warning("Cleanup: removed task with blank/empty title")
            continue
        valid.append(task)

    # ── Step 2 & 3: Normalise titles, apply blocklist ────────────────────
    after_blocklist: List[Dict[str, Any]] = []
    for task in valid:
        norm = _normalize_title(str(task["title"]))
        if norm in _BLOCKLIST:
            logger.warning(f"Cleanup: removed blocklisted title: {norm!r}")
            continue
        # Attach normalised title for dedup (temporary key)
        task["_norm_title"] = norm
        after_blocklist.append(task)

    # ── Step 4: Deduplicate by normalised title ──────────────────────────
    best: Dict[str, Dict[str, Any]] = {}
    for task in after_blocklist:
        norm = task["_norm_title"]
        if norm in best:
            if _is_better_duplicate(task, best[norm]):
                dropped = best[norm]
                best[norm] = task
            else:
                dropped = task
            logger.warning(
                f"Cleanup: removed duplicate title {norm!r} "
                f"(dropped owner={dropped.get('owner')!r})"
            )
        else:
            best[norm] = task

    deduped = list(best.values())

    # ── Step 5 & 6: Normalize owner and priority, collect to result ──────
    allowed_priorities = {"High", "Medium", "Low"}

    for task in deduped:
        # Remove temporary key
        task.pop("_norm_title", None)

        # Step 5: Owner normalisation
        owner = task.get("owner")
        if owner is None or str(owner).strip() == "":
            task["owner"] = "Unassigned"

        # Step 6: Priority normalisation
        priority = task.get("priority")
        if priority not in allowed_priorities:
            logger.warning(
                f"Cleanup: corrected invalid priority {priority!r} → 'Medium' "
                f"for task {task.get('title')!r}"
            )
            task["priority"] = "Medium"

        result.append(task)

    return result
