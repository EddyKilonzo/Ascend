from typing import Optional
from config import vision_settings

try:
    import pytesseract
    from PIL import Image
    import io
    import numpy as np
    TESSERACT_AVAILABLE = True

    if vision_settings.TESSERACT_CMD:
        pytesseract.pytesseract.tesseract_cmd = vision_settings.TESSERACT_CMD

except ImportError:
    TESSERACT_AVAILABLE = False


def extract(image_data, lang: str = "eng") -> dict:
    if not TESSERACT_AVAILABLE:
        return {"text": "", "confidence": 0.0, "engine": "tesseract", "available": False}

    try:
        if isinstance(image_data, bytes):
            from PIL import Image
            import io
            pil_img = Image.open(io.BytesIO(image_data))
        elif hasattr(image_data, "shape"):
            import numpy as np
            from PIL import Image
            pil_img = Image.fromarray(image_data)
        else:
            pil_img = image_data

        data = pytesseract.image_to_data(pil_img, lang=lang, output_type=pytesseract.Output.DICT)

        words = []
        confidences = []
        for i, word in enumerate(data["text"]):
            if word.strip():
                conf = float(data["conf"][i])
                if conf > 0:
                    words.append(word)
                    confidences.append(conf)

        raw_text = pytesseract.image_to_string(pil_img, lang=lang).strip()
        avg_confidence = (sum(confidences) / len(confidences) / 100.0) if confidences else 0.0

        return {
            "text": raw_text,
            "confidence": round(avg_confidence, 3),
            "engine": "tesseract",
            "word_count": len(words),
            "available": True,
        }
    except Exception as e:
        return {
            "text": "",
            "confidence": 0.0,
            "engine": "tesseract",
            "error": str(e),
            "available": True,
        }
