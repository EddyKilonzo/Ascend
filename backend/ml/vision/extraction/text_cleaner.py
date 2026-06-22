import re
import unicodedata


def clean(text: str) -> str:
    if not text:
        return ""

    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r"[^\x20-\x7E\n\t]", " ", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[~`^\\|<>{}[\]]{2,}", " ", text)
    text = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", text)
    text = re.sub(r"\b([A-Za-z])(\1{3,})\b", r"\1\1", text)
    text = _fix_broken_words(text)
    text = _normalize_punctuation(text)
    text = text.strip()

    return text


def _fix_broken_words(text: str) -> str:
    text = re.sub(r"(\w)-\s+(\w)", r"\1\2", text)
    text = re.sub(r"\b(\w)\s(\w)\s(\w)\b", r"\1\2\3", text)
    return text


def _normalize_punctuation(text: str) -> str:
    text = re.sub(r"\s+([.,;:!?])", r"\1", text)
    text = re.sub(r"([.,;:!?])\s*([.,;:!?])+", r"\1", text)
    return text


def normalize_dates(text: str) -> str:
    text = re.sub(r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b", _normalize_date_match, text)
    return text


def _normalize_date_match(match: re.Match) -> str:
    day, month, year = match.group(1), match.group(2), match.group(3)
    if len(year) == 2:
        year = "20" + year
    return f"{day.zfill(2)}/{month.zfill(2)}/{year}"


def normalize_times(text: str) -> str:
    text = re.sub(r"\b(\d{1,2})[:.h](\d{2})\s*(am|pm|AM|PM)?\b", _normalize_time_match, text)
    return text


def _normalize_time_match(match: re.Match) -> str:
    hour, minute = match.group(1), match.group(2)
    period = match.group(3) or ""
    return f"{hour.zfill(2)}:{minute}{(' ' + period.lower()) if period else ''}".strip()
