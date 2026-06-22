from typing import Optional
import io

try:
    import easyocr
    import numpy as np
    EASYOCR_AVAILABLE = True
    _readers: dict[str, "easyocr.Reader"] = {}

    def _get_reader(lang: str = "en") -> "easyocr.Reader":
        if lang not in _readers:
            _readers[lang] = easyocr.Reader([lang], gpu=False, verbose=False)
        return _readers[lang]

except ImportError:
    EASYOCR_AVAILABLE = False


def extract(image_data, lang: str = "en") -> dict:
    if not EASYOCR_AVAILABLE:
        return {"text": "", "confidence": 0.0, "engine": "easyocr", "available": False}

    try:
        if isinstance(image_data, bytes):
            import numpy as np
            arr = np.frombuffer(image_data, dtype=np.uint8)
            try:
                import cv2
                img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            except ImportError:
                from PIL import Image
                img = Image.open(io.BytesIO(image_data))
        else:
            img = image_data

        reader = _get_reader(lang)
        results = reader.readtext(img, detail=1, paragraph=False)

        if not results:
            return {"text": "", "confidence": 0.0, "engine": "easyocr", "available": True}

        text_parts = []
        confidences = []
        for bbox, text, conf in results:
            if text.strip():
                text_parts.append(text.strip())
                confidences.append(conf)

        full_text = " ".join(text_parts)
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

        return {
            "text": full_text,
            "confidence": round(avg_confidence, 3),
            "engine": "easyocr",
            "word_count": len(text_parts),
            "available": True,
        }
    except Exception as e:
        return {
            "text": "",
            "confidence": 0.0,
            "engine": "easyocr",
            "error": str(e),
            "available": True,
        }
