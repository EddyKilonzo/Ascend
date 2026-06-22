import io

try:
    from paddleocr import PaddleOCR
    import numpy as np
    PADDLE_AVAILABLE = True
    _ocr_instance: "PaddleOCR | None" = None

    def _get_ocr() -> "PaddleOCR":
        global _ocr_instance
        if _ocr_instance is None:
            _ocr_instance = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
        return _ocr_instance

except ImportError:
    PADDLE_AVAILABLE = False


def extract(image_data, lang: str = "en") -> dict:
    if not PADDLE_AVAILABLE:
        return {"text": "", "confidence": 0.0, "engine": "paddleocr", "available": False}

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

        ocr = _get_ocr()
        result = ocr.ocr(img, cls=True)

        if not result or not result[0]:
            return {"text": "", "confidence": 0.0, "engine": "paddleocr", "available": True}

        lines = []
        confidences = []
        for line in result[0]:
            if line and len(line) == 2:
                text_conf = line[1]
                if isinstance(text_conf, (list, tuple)) and len(text_conf) == 2:
                    text, conf = text_conf
                    if text.strip():
                        lines.append(text.strip())
                        confidences.append(float(conf))

        full_text = "\n".join(lines)
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

        return {
            "text": full_text,
            "confidence": round(avg_confidence, 3),
            "engine": "paddleocr",
            "line_count": len(lines),
            "available": True,
        }
    except Exception as e:
        return {
            "text": "",
            "confidence": 0.0,
            "engine": "paddleocr",
            "error": str(e),
            "available": True,
        }
