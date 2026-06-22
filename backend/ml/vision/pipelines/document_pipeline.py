from ocr.preprocess import preprocess, image_to_bytes
from ocr.selector import select_and_extract
from ocr.confidence import score_result
from extraction.structurer import structure
from extraction.text_cleaner import clean


def run(image_bytes: bytes) -> dict:
    try:
        processed = preprocess(image_bytes, for_handwriting=False)
        processed_bytes = image_to_bytes(processed)
        if not processed_bytes:
            processed_bytes = image_bytes

        ocr_result = select_and_extract(processed_bytes, hint="document")
        scored = score_result(ocr_result)

        if not scored.get("text"):
            return {"success": False, "error": "No text extracted", "pages": []}

        full_text = scored["text"]
        cleaned_text = clean(full_text)

        paragraphs = [p.strip() for p in cleaned_text.split("\n\n") if p.strip()]

        tasks_structured = structure(cleaned_text, context_hint="document")

        return {
            "success": True,
            "full_text": cleaned_text,
            "paragraphs": paragraphs,
            "word_count": len(cleaned_text.split()),
            "structured": tasks_structured,
            "ocr_metadata": {
                "engine": scored.get("engine"),
                "confidence": scored.get("adjusted_confidence", scored.get("confidence")),
                "quality": scored.get("quality"),
            },
            "pipeline": "document",
        }
    except Exception as e:
        return {"success": False, "error": str(e), "pages": []}
