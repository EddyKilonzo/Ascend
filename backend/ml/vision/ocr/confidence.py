from config import vision_settings


def score_result(ocr_result: dict) -> dict:
    confidence = ocr_result.get("confidence", 0.0)
    text = ocr_result.get("text", "")

    quality_flags: list[str] = []
    penalties = 0.0

    if not text.strip():
        return {**ocr_result, "quality": "empty", "quality_flags": ["no_text_extracted"]}

    word_count = len(text.split())
    if word_count < 3:
        quality_flags.append("very_short_result")
        penalties += 0.10

    noise_chars = sum(1 for c in text if c in "~`^\\|<>{}[]")
    noise_ratio = noise_chars / max(len(text), 1)
    if noise_ratio > 0.10:
        quality_flags.append("high_noise_characters")
        penalties += 0.15

    alpha_ratio = sum(1 for c in text if c.isalpha()) / max(len(text), 1)
    if alpha_ratio < 0.40:
        quality_flags.append("low_alphabetic_ratio")
        penalties += 0.10

    adjusted_confidence = max(0.0, confidence - penalties)

    if adjusted_confidence >= 0.80:
        quality = "high"
    elif adjusted_confidence >= 0.60:
        quality = "medium"
    elif adjusted_confidence >= 0.40:
        quality = "low"
    else:
        quality = "poor"

    return {
        **ocr_result,
        "adjusted_confidence": round(adjusted_confidence, 3),
        "quality": quality,
        "quality_flags": quality_flags,
        "meets_threshold": adjusted_confidence >= vision_settings.OCR_CONFIDENCE_THRESHOLD,
    }
