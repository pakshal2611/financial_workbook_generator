"""
statement_page_detector.py

Intelligent detection of financial-statement pages within the raw text
extracted from annual reports.

Strategy:
    1. Split the full extracted text into individual pages.
    2. Attempt to locate a Table of Contents (TOC) and parse page
       references for Balance Sheet, Income Statement, and Cash Flow
       Statement.  Supports both individual page numbers and page ranges
       (e.g. "92-119").
    3. If TOC-based detection fails, fall back to keyword-density
       scoring across all pages and select the best cluster.
    4. Within the selected pages, apply a second pass to deprioritise
       "Notes to Accounts" and similar note-heavy pages so that the
       primary statements (Balance Sheet, P&L, Cash Flow) are always
       included.
    5. Return the concatenated text of the identified pages, or None
       if detection is not confident enough (the caller should then
       fall back to the original behaviour).

This module is pure logic — no database access, no API changes,
no model modifications.
"""

import logging
import re
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Minimum / maximum size of the focused text that we consider valid.
MIN_FOCUSED_CHARS = 500
MAX_FOCUSED_CHARS = 50_000

# How many extra pages to include on either side of a detected page.
PAGE_BUFFER = 1

# ---------------------------------------------------------------------------
# Keyword / Pattern Definitions
# ---------------------------------------------------------------------------

# Keywords that signal a Table of Contents section.
_TOC_HEADING_PATTERNS = [
    r"table\s+of\s+contents",
    r"\bcontents\b",
    r"\bindex\b",
    r"standalone\s+financial\s+statements",
    r"consolidated\s+financial\s+statements",
]

# Financial-statement keywords used both for TOC line matching and
# for the keyword-density fallback.
_STATEMENT_KEYWORDS = [
    # Balance Sheet / Statement of Financial Position
    r"balance\s+sheet",
    r"statement\s+of\s+financial\s+position",
    # Income Statement / Profit & Loss
    r"income\s+statement",
    r"statement\s+of\s+income",
    r"profit\s+and\s+loss",
    r"statement\s+of\s+profit",
    # Cash Flow
    r"cash\s+flow",
    r"statement\s+of\s+cash\s+flows",
]

# Section-level keywords that appear in TOC to mark broad financial
# statement sections (e.g. "Standalone Financial Statements ... 92-119").
_SECTION_KEYWORDS = [
    r"standalone\s+financial\s+statements",
    r"consolidated\s+financial\s+statements",
    r"financial\s+statements",
]

# Keywords that indicate a page is primarily notes / policies (Phase 2
# filtering).  These pages are deprioritised when the focused text is
# too large.
_NOTE_KEYWORDS = [
    r"notes\s+to\s+(?:the\s+)?(?:financial\s+)?(?:statements|accounts)",
    r"notes\s+on\s+(?:financial\s+)?(?:statements|accounts)",
    r"notes\s+forming\s+part",
    r"significant\s+accounting\s+policies",
    r"accounting\s+policies",
    r"schedules?\s+to\s+(?:the\s+)?(?:financial\s+)?(?:statements|accounts)",
]

# Additional keywords that signal tabular financial data (used to boost
# keyword-density scores).
_TABULAR_INDICATORS = [
    r"\bas\s+at\b",
    r"\bfor\s+the\s+year\s+ended\b",
    r"\bparticulars\b",
    r"\bin\s+(?:crores?|lakhs?|thousands?|millions?|billions?)\b",
    r"₹\s*in\b",
    r"\btotal\b",
]

# Compiled regex objects (case-insensitive).
_TOC_HEADING_RE = [re.compile(p, re.IGNORECASE) for p in _TOC_HEADING_PATTERNS]
_STATEMENT_KW_RE = [re.compile(p, re.IGNORECASE) for p in _STATEMENT_KEYWORDS]
_SECTION_KW_RE = [re.compile(p, re.IGNORECASE) for p in _SECTION_KEYWORDS]
_NOTE_KW_RE = [re.compile(p, re.IGNORECASE) for p in _NOTE_KEYWORDS]
_TABULAR_RE = [re.compile(p, re.IGNORECASE) for p in _TABULAR_INDICATORS]

# Pattern to grab a page number (or page range) at the end of a TOC line.
# Matches things like:
#   Balance Sheet ........... 45
#   Cash Flow Statement          102
#   Profit and Loss ... 78 - 95
#   Financial Statements     92-119
#   Financial Statements     92 to 119
_TOC_PAGE_REF_RE = re.compile(
    r"[.\s…·\-_\t]{2,}\s*(\d{1,4})\s*(?:[-–—]\s*(\d{1,4}))?\s*$",
    re.MULTILINE,
)

# Broader pattern: keyword followed by a page number/range on the same line.
_KEYWORD_THEN_NUMBER_RE = re.compile(
    r"(" + "|".join(_STATEMENT_KEYWORDS + _SECTION_KEYWORDS) + r")"
    r".*?(\d{1,4})\s*(?:[-–—]\s*(\d{1,4}))?\s*$",
    re.IGNORECASE | re.MULTILINE,
)

# Pattern to detect lines that are mostly numeric (financial table rows).
_NUMERIC_LINE_RE = re.compile(
    r"^.*(?:\d[\d,. ]*){3,}.*$", re.MULTILINE
)


# ---------------------------------------------------------------------------
# Page Splitting
# ---------------------------------------------------------------------------

def _split_into_pages(raw_text: str) -> list[str]:
    """
    Split the raw extracted text into individual pages.

    Strategies tried in order:
        1. Form-feed characters (``\\f``) — produced by PyMuPDF.
        2. Heuristic page-break markers (``Page N``, ``--- N ---``).
        3. Double/triple newline splitting with minimum chunk size —
           works for OCR output and many PyMuPDF extractions that lack
           form-feeds.
        4. Fixed character-budget slicing as ultimate fallback.
    """

    # Strategy 1: form-feed delimited.
    if "\f" in raw_text:
        pages = raw_text.split("\f")
        pages = [p for p in pages if p.strip()]
        if len(pages) > 1:
            logger.debug(f"Split text into {len(pages)} pages via form-feed.")
            return pages

    # Strategy 2: explicit page-break markers.
    page_break_re = re.compile(
        r"\n\s*(?:---\s*)?(?:Page\s+)?(\d{1,4})(?:\s+of\s+\d{1,4})?\s*(?:---\s*)?\n",
        re.IGNORECASE,
    )
    splits = list(page_break_re.finditer(raw_text))
    if len(splits) >= 5:
        pages = []
        prev = 0
        for m in splits:
            chunk = raw_text[prev:m.start()].strip()
            if chunk:
                pages.append(chunk)
            prev = m.end()
        tail = raw_text[prev:].strip()
        if tail:
            pages.append(tail)
        if len(pages) > 1:
            logger.debug(
                f"Split text into {len(pages)} pages via page-break heuristic."
            )
            return pages

    # Strategy 3: double/triple newline splitting.
    # A typical page of text is 1500-4000 chars.  We split on \n\n\n
    # first, then \n\n, keeping only splits that produce chunks in a
    # reasonable size range.
    for separator in ["\n\n\n", "\n\n"]:
        chunks = raw_text.split(separator)
        # Merge very small chunks (< 200 chars) into the previous one.
        merged: list[str] = []
        for chunk in chunks:
            stripped = chunk.strip()
            if not stripped:
                continue
            if merged and len(stripped) < 200:
                merged[-1] = merged[-1] + separator + stripped
            else:
                merged.append(stripped)

        if len(merged) >= 5:
            # Check that the median chunk size is reasonable (> 500 chars).
            sizes = sorted(len(c) for c in merged)
            median_size = sizes[len(sizes) // 2]
            if median_size >= 500:
                logger.debug(
                    f"Split text into {len(merged)} pages via "
                    f"'{repr(separator)}' separator (median chunk: "
                    f"{median_size} chars)."
                )
                return merged

    # Strategy 4: fixed character-budget slicing.
    # Slice the text into ~3000-char pages.
    page_size = 3000
    if len(raw_text) > page_size * 2:
        pages = []
        for i in range(0, len(raw_text), page_size):
            chunk = raw_text[i:i + page_size].strip()
            if chunk:
                pages.append(chunk)
        if len(pages) > 1:
            logger.debug(
                f"Split text into {len(pages)} pages via fixed "
                f"{page_size}-char slicing."
            )
            return pages

    # If we cannot split, return the whole text as a single "page".
    logger.debug("Could not split text into pages; treating as single page.")
    return [raw_text]


# ---------------------------------------------------------------------------
# TOC Detection
# ---------------------------------------------------------------------------

def _find_toc_pages(pages: list[str]) -> list[int]:
    """
    Return the indices of pages that look like they contain a Table of
    Contents.  Only scans the first ~30 % of the document (TOCs are near
    the front).
    """

    search_limit = max(1, int(len(pages) * 0.30))
    toc_indices: list[int] = []

    for idx in range(min(search_limit, len(pages))):
        page_text = pages[idx]
        for pattern in _TOC_HEADING_RE:
            if pattern.search(page_text):
                toc_indices.append(idx)
                break

    logger.debug(f"TOC page indices: {toc_indices}")
    return toc_indices


def _extract_page_refs_from_toc(
    toc_text: str,
    total_pages: int,
) -> list[int]:
    """
    Parse a TOC text block and return a sorted, deduplicated list of
    page numbers (0-indexed) that reference financial statements.

    Supports:
        - Individual page numbers: ``Balance Sheet ... 45``
        - Page ranges: ``Financial Statements ... 92-119``
    """

    page_numbers: set[int] = set()

    for match in _KEYWORD_THEN_NUMBER_RE.finditer(toc_text):
        start_str = match.group(2)
        end_str = match.group(3)  # May be None if not a range.

        try:
            # TOC page numbers are 1-indexed; convert to 0-indexed.
            start_page = int(start_str) - 1

            if end_str:
                end_page = int(end_str) - 1
                # Sanity: range should not span more than 40 pages.
                if (
                    0 <= start_page < total_pages
                    and 0 <= end_page < total_pages
                    and start_page <= end_page
                    and (end_page - start_page) <= 40
                ):
                    for p in range(start_page, end_page + 1):
                        page_numbers.add(p)
            else:
                if 0 <= start_page < total_pages:
                    page_numbers.add(start_page)

        except ValueError:
            continue

    logger.debug(f"TOC-extracted page refs (0-indexed): {sorted(page_numbers)}")
    return sorted(page_numbers)


# ---------------------------------------------------------------------------
# Note-Page Filtering (Phase 2)
# ---------------------------------------------------------------------------

def _is_note_page(page_text: str) -> bool:
    """
    Return True if a page appears to be primarily a notes / accounting
    policies page rather than a primary financial statement.
    """
    text_lower = page_text.lower()

    # Check for note-page headings.
    for kw_re in _NOTE_KW_RE:
        if kw_re.search(text_lower):
            # But if the page ALSO contains a primary statement heading,
            # it's likely a statement page that happens to mention notes.
            has_statement_heading = False
            for stmt_re in _STATEMENT_KW_RE:
                if stmt_re.search(text_lower):
                    has_statement_heading = True
                    break
            if not has_statement_heading:
                return True

    return False


def _filter_note_pages(
    pages: list[str],
    indices: list[int],
) -> list[int]:
    """
    From a list of page indices, separate them into primary-statement
    pages and note pages.  Return primary pages first; append note pages
    only if needed to meet MIN_FOCUSED_CHARS.
    """
    primary: list[int] = []
    notes: list[int] = []

    for idx in indices:
        if _is_note_page(pages[idx]):
            notes.append(idx)
        else:
            primary.append(idx)

    if not primary:
        # All pages look like notes — keep them all.
        logger.debug("All detected pages appear to be notes; keeping all.")
        return indices

    # Check if primary pages alone are sufficient.
    primary_text_len = sum(len(pages[i]) for i in primary)
    if primary_text_len >= MIN_FOCUSED_CHARS:
        logger.debug(
            f"Filtered {len(notes)} note pages, keeping "
            f"{len(primary)} primary statement pages "
            f"({primary_text_len} chars)."
        )
        return primary

    # Primary pages are too short — add note pages back until we have
    # enough content.
    result = list(primary)
    for idx in notes:
        result.append(idx)
        if sum(len(pages[i]) for i in result) >= MIN_FOCUSED_CHARS:
            break

    result.sort()
    logger.debug(
        f"Primary pages insufficient; added {len(result) - len(primary)} "
        f"note pages back. Total: {len(result)} pages."
    )
    return result


# ---------------------------------------------------------------------------
# Keyword-Density Fallback
# ---------------------------------------------------------------------------

def _score_page(page_text: str) -> int:
    """
    Score a single page by the number of financial-statement keywords
    and tabular-data indicators it contains.
    """
    score = 0
    text_lower = page_text.lower()

    # Primary statement keywords (weight: 3 each).
    for kw_re in _STATEMENT_KW_RE:
        hits = len(kw_re.findall(text_lower))
        score += hits * 3

    # Tabular indicators (weight: 1 each).
    for tab_re in _TABULAR_RE:
        hits = len(tab_re.findall(text_lower))
        score += hits

    # Bonus for pages with many numeric lines (financial tables).
    numeric_lines = len(_NUMERIC_LINE_RE.findall(page_text))
    if numeric_lines >= 5:
        score += 2

    return score


def _keyword_scan_pages(pages: list[str]) -> list[int]:
    """
    Score every page by how many financial-statement keywords it contains
    and return the indices of the best consecutive cluster.

    A "cluster" is a group of pages that are at most 3 apart (allowing for
    a blank page or a notes page in between statements).
    """

    scores = [_score_page(p) for p in pages]

    # Find page indices with score >= 3 (at least one primary keyword hit).
    candidates = [i for i, s in enumerate(scores) if s >= 3]

    if not candidates:
        # Lower threshold: try score >= 1.
        candidates = [i for i, s in enumerate(scores) if s >= 1]

    if not candidates:
        logger.debug("Keyword scan found no candidate pages.")
        return []

    # Cluster candidates: consecutive if gap <= 3.
    clusters: list[list[int]] = []
    current_cluster: list[int] = [candidates[0]]

    for i in range(1, len(candidates)):
        if candidates[i] - candidates[i - 1] <= 4:
            current_cluster.append(candidates[i])
        else:
            clusters.append(current_cluster)
            current_cluster = [candidates[i]]
    clusters.append(current_cluster)

    # Pick the cluster with the highest total score.
    best_cluster = max(
        clusters,
        key=lambda c: sum(scores[i] for i in c),
    )

    logger.debug(
        f"Keyword scan best cluster (0-indexed): {best_cluster}, "
        f"scores: {[scores[i] for i in best_cluster]}"
    )
    return best_cluster


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def detect_financial_pages(raw_text: str) -> Optional[str]:
    """
    Attempt to identify the pages of *raw_text* that contain financial
    statements (Balance Sheet, Income Statement, Cash Flow Statement).

    Returns
    -------
    str or None
        The concatenated text of the identified pages, or ``None`` if
        detection failed and the caller should fall back to the default
        strategy (e.g. ``raw_text[:15000]``).
    """

    try:
        if not raw_text or len(raw_text.strip()) < MIN_FOCUSED_CHARS:
            logger.debug("Raw text too short for page detection.")
            return None

        pages = _split_into_pages(raw_text)

        if len(pages) <= 1:
            # Cannot split — nothing to detect.
            logger.debug("Single page detected; skipping page detection.")
            return None

        logger.info(
            f"Page detection: {len(pages)} pages, "
            f"{len(raw_text)} total chars."
        )

        # --- Strategy 1: TOC-based detection ---
        target_page_indices: list[int] = []

        toc_indices = _find_toc_pages(pages)
        if toc_indices:
            toc_text = "\n".join(pages[i] for i in toc_indices)
            target_page_indices = _extract_page_refs_from_toc(
                toc_text, len(pages)
            )
            if target_page_indices:
                logger.info(
                    f"TOC detection found {len(target_page_indices)} page "
                    f"references: {target_page_indices}"
                )

        # --- Strategy 2: Keyword-density fallback ---
        if not target_page_indices:
            logger.info(
                "TOC detection did not yield results; trying keyword scan."
            )
            target_page_indices = _keyword_scan_pages(pages)

        if not target_page_indices:
            logger.info(
                "No financial statement pages detected by any strategy."
            )
            return None

        # Expand with a ±PAGE_BUFFER to capture multi-page statements.
        expanded: set[int] = set()
        for idx in target_page_indices:
            for offset in range(-PAGE_BUFFER, PAGE_BUFFER + 1):
                candidate = idx + offset
                if 0 <= candidate < len(pages):
                    expanded.add(candidate)

        selected_indices = sorted(expanded)

        # --- Phase 2: Filter note pages ---
        selected_indices = _filter_note_pages(pages, selected_indices)

        logger.info(
            f"Selected {len(selected_indices)} pages "
            f"(indices {selected_indices[0]}–{selected_indices[-1]}) "
            f"out of {len(pages)} total pages."
        )

        focused_text = "\n\n".join(pages[i] for i in selected_indices)

        # Validate size.
        if len(focused_text.strip()) < MIN_FOCUSED_CHARS:
            logger.warning(
                f"Focused text too short ({len(focused_text)} chars); "
                f"falling back."
            )
            return None

        if len(focused_text) > MAX_FOCUSED_CHARS:
            logger.warning(
                f"Focused text too long ({len(focused_text)} chars); "
                f"truncating to {MAX_FOCUSED_CHARS} chars."
            )
            focused_text = focused_text[:MAX_FOCUSED_CHARS]

        return focused_text

    except Exception:
        logger.exception("Statement page detection failed unexpectedly.")
        return None


# ---------------------------------------------------------------------------
# Section-Aware Detection (Standalone vs Consolidated)
# ---------------------------------------------------------------------------

# Regex to identify standalone vs consolidated labels in TOC lines or page text.
_STANDALONE_RE = re.compile(r"standalone", re.IGNORECASE)
_CONSOLIDATED_RE = re.compile(r"consolidat", re.IGNORECASE)

# TOC pattern specifically for section-level lines with page refs.
_SECTION_LINE_RE = re.compile(
    r"(standalone|consolidat\w*)\s+financial\s+statements"
    r".*?(\d{1,4})\s*(?:[-–—]\s*(\d{1,4}))?\s*$",
    re.IGNORECASE | re.MULTILINE,
)


def _extract_section_page_refs_from_toc(
    toc_text: str,
    total_pages: int,
) -> dict[str, list[int]]:
    """
    Parse a TOC and return separate page-index lists for standalone
    and consolidated sections.

    Returns e.g. {"standalone": [91, 92, ...], "consolidated": [135, 136, ...]}
    """
    sections: dict[str, list[int]] = {}

    for match in _SECTION_LINE_RE.finditer(toc_text):
        label = match.group(1).lower()
        start_str = match.group(2)
        end_str = match.group(3)

        section_key = (
            "standalone" if "standalone" in label else "consolidated"
        )

        try:
            start_page = int(start_str) - 1  # 0-indexed

            if end_str:
                end_page = int(end_str) - 1
                if (
                    0 <= start_page < total_pages
                    and 0 <= end_page < total_pages
                    and start_page <= end_page
                    and (end_page - start_page) <= 40
                ):
                    sections[section_key] = list(
                        range(start_page, end_page + 1)
                    )
            else:
                if 0 <= start_page < total_pages:
                    sections.setdefault(section_key, []).append(start_page)

        except ValueError:
            continue

    logger.debug(
        f"TOC section refs: "
        + ", ".join(f"{k}: {len(v)} pages" for k, v in sections.items())
    )
    return sections


def _classify_pages_by_section(
    pages: list[str],
    indices: list[int],
) -> dict[str, list[int]]:
    """
    Given a flat list of page indices, classify them into standalone
    and consolidated buckets based on section headers found in the pages.

    Scans for 'Standalone' or 'Consolidated' headings and assigns
    subsequent pages to that section until the other heading is found.
    """
    sections: dict[str, list[int]] = {}
    current_section: str | None = None

    for idx in indices:
        text = pages[idx]
        has_standalone = bool(_STANDALONE_RE.search(text))
        has_consolidated = bool(_CONSOLIDATED_RE.search(text))

        if has_standalone and not has_consolidated:
            current_section = "standalone"
        elif has_consolidated and not has_standalone:
            current_section = "consolidated"

        if current_section:
            sections.setdefault(current_section, []).append(idx)

    # If no sections were identified, put everything under "standalone".
    if not sections:
        sections["standalone"] = list(indices)

    return sections


def _build_focused_text(
    pages: list[str],
    target_indices: list[int],
) -> str | None:
    """
    Apply page-buffer expansion, note-page filtering, size validation,
    and return the focused text for a section.  Returns None if the
    result is too short.
    """
    # Expand with ±PAGE_BUFFER.
    expanded: set[int] = set()
    for idx in target_indices:
        for offset in range(-PAGE_BUFFER, PAGE_BUFFER + 1):
            candidate = idx + offset
            if 0 <= candidate < len(pages):
                expanded.add(candidate)

    selected = sorted(expanded)
    selected = _filter_note_pages(pages, selected)

    focused = "\n\n".join(pages[i] for i in selected)

    if len(focused.strip()) < MIN_FOCUSED_CHARS:
        return None

    if len(focused) > MAX_FOCUSED_CHARS:
        focused = focused[:MAX_FOCUSED_CHARS]

    return focused


def detect_financial_pages_by_section(
    raw_text: str,
) -> dict[str, str]:
    """
    Detect financial-statement pages and separate them by section
    (standalone vs consolidated).

    Returns
    -------
    dict[str, str]
        Keys are ``"standalone"`` and/or ``"consolidated"``.
        Values are the concatenated text of the relevant pages.
        Returns an empty dict if detection fails entirely.
    """
    try:
        if not raw_text or len(raw_text.strip()) < MIN_FOCUSED_CHARS:
            logger.debug("Raw text too short for section detection.")
            return {}

        pages = _split_into_pages(raw_text)

        if len(pages) <= 1:
            logger.debug("Single page; cannot detect sections.")
            return {}

        logger.info(
            f"Section detection: {len(pages)} pages, "
            f"{len(raw_text)} total chars."
        )

        result: dict[str, str] = {}

        # --- Strategy 1: TOC-based section detection ---
        toc_indices = _find_toc_pages(pages)
        if toc_indices:
            toc_text = "\n".join(pages[i] for i in toc_indices)
            section_refs = _extract_section_page_refs_from_toc(
                toc_text, len(pages)
            )

            if section_refs:
                for section_key, page_indices in section_refs.items():
                    focused = _build_focused_text(pages, page_indices)
                    if focused:
                        result[section_key] = focused
                        logger.info(
                            f"TOC section '{section_key}': "
                            f"{len(focused)} chars from "
                            f"{len(page_indices)} pages."
                        )

                if result:
                    return result

            # TOC exists but no section-level lines found — try the
            # generic TOC extraction and then classify by keywords.
            all_refs = _extract_page_refs_from_toc(toc_text, len(pages))
            if all_refs:
                sections = _classify_pages_by_section(pages, all_refs)
                for section_key, page_indices in sections.items():
                    focused = _build_focused_text(pages, page_indices)
                    if focused:
                        result[section_key] = focused

                if result:
                    return result

        # --- Strategy 2: Keyword scan + section classification ---
        logger.info(
            "TOC section detection failed; trying keyword scan "
            "with section classification."
        )
        kw_indices = _keyword_scan_pages(pages)
        if kw_indices:
            sections = _classify_pages_by_section(pages, kw_indices)
            for section_key, page_indices in sections.items():
                focused = _build_focused_text(pages, page_indices)
                if focused:
                    result[section_key] = focused

        if not result:
            # Ultimate fallback: try detect_financial_pages() and label
            # it as "standalone".
            fallback = detect_financial_pages(raw_text)
            if fallback:
                result["standalone"] = fallback

        return result

    except Exception:
        logger.exception("Section-aware detection failed unexpectedly.")
        return {}

