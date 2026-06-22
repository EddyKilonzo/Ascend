from ocr.preprocess import preprocess, image_to_bytes
from ocr.selector import select_and_extract
from ocr.confidence import score_result
from extraction.structurer import structure


def run(image_bytes: bytes, hint: str = "general") -> dict:
    try:
        processed = preprocess(image_bytes, for_handwriting=(hint in ("notes", "handwriting")))
        processed_bytes = image_to_bytes(processed)

        if not processed_bytes:
            processed_bytes = image_bytes

        ocr_result = select_and_extract(processed_bytes, hint=hint)
        scored = score_result(ocr_result)

        if not scored.get("text"):
            return {
                "success": False,
                "error": "No text extracted from image",
                "ocr_result": scored,
                "structured": None,
            }

        structured = structure(scored["text"], context_hint=hint)

        return {
            "success": True,
            "ocr_result": scored,
            "structured": structured,
            "pipeline": "image",
            "hint": hint,
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "ocr_result": None,
            "structured": None,
        }
