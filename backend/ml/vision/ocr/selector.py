from ocr import tesseract, easyocr_engine, paddleocr_engine
from config import vision_settings


def select_and_extract(image_data, hint: str = "general") -> dict:
    """
    Priority order per hint:
      - general/document: Tesseract → EasyOCR → PaddleOCR
      - handwriting/messy: EasyOCR → PaddleOCR → Tesseract
      - complex_layout/table: PaddleOCR → EasyOCR → Tesseract
    """
    if hint in ("handwriting", "messy", "notes"):
        pipeline = [easyocr_engine, paddleocr_engine, tesseract]
    elif hint in ("complex_layout", "table", "calendar"):
        pipeline = [paddleocr_engine, easyocr_engine, tesseract]
    else:
        pipeline = [tesseract, easyocr_engine, paddleocr_engine]

    best_result: dict = {"text": "", "confidence": 0.0, "engine": "none"}

    for engine in pipeline:
        result = engine.extract(image_data)

        if not result.get("available", True):
            continue

        if result.get("error"):
            continue

        if result["confidence"] >= vision_settings.OCR_CONFIDENCE_THRESHOLD:
            return result

        if result["confidence"] > best_result["confidence"]:
            best_result = result

    return best_result if best_result["text"] else {
        "text": "",
        "confidence": 0.0,
        "engine": "none",
        "error": "All OCR engines failed or returned empty results.",
    }
