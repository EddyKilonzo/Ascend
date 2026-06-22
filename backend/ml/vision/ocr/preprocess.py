import io
import math
import numpy as np
from PIL import Image

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False


def load_image(image_bytes: bytes) -> "np.ndarray | Image.Image":
    if CV2_AVAILABLE:
        arr = np.frombuffer(image_bytes, dtype=np.uint8)
        return cv2.imdecode(arr, cv2.IMREAD_COLOR)
    return Image.open(io.BytesIO(image_bytes))


def to_grayscale(image) -> "np.ndarray | Image.Image":
    if CV2_AVAILABLE and isinstance(image, np.ndarray):
        return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    if isinstance(image, Image.Image):
        return image.convert("L")
    return image


def denoise(image) -> "np.ndarray | Image.Image":
    if CV2_AVAILABLE and isinstance(image, np.ndarray):
        return cv2.fastNlMeansDenoising(image, h=10, templateWindowSize=7, searchWindowSize=21)
    return image


def threshold(image) -> "np.ndarray | Image.Image":
    if CV2_AVAILABLE and isinstance(image, np.ndarray):
        _, binary = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return binary
    if isinstance(image, Image.Image):
        import PIL.ImageOps
        return image.point(lambda p: 255 if p > 128 else 0, "L")
    return image


def resize_for_ocr(image, min_width: int = 800) -> "np.ndarray | Image.Image":
    if CV2_AVAILABLE and isinstance(image, np.ndarray):
        h, w = image.shape[:2]
        if w < min_width:
            scale = min_width / w
            new_w = int(w * scale)
            new_h = int(h * scale)
            return cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
        return image
    if isinstance(image, Image.Image):
        w, h = image.size
        if w < min_width:
            scale = min_width / w
            return image.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
        return image
    return image


def correct_skew(image) -> "np.ndarray | Image.Image":
    if not CV2_AVAILABLE or not isinstance(image, np.ndarray):
        return image

    try:
        coords = np.column_stack(np.where(image > 0))
        if len(coords) < 10:
            return image
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = 90 + angle
        if abs(angle) < 0.5:
            return image
        h, w = image.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        return cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    except Exception:
        return image


def sharpen(image) -> "np.ndarray | Image.Image":
    if CV2_AVAILABLE and isinstance(image, np.ndarray):
        kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
        return cv2.filter2D(image, -1, kernel)
    return image


def preprocess(image_bytes: bytes, for_handwriting: bool = False) -> "np.ndarray | Image.Image":
    img = load_image(image_bytes)
    img = to_grayscale(img)
    img = resize_for_ocr(img)
    img = correct_skew(img)
    img = denoise(img)

    if not for_handwriting:
        img = threshold(img)
    else:
        img = sharpen(img)

    return img


def image_to_bytes(image) -> bytes:
    if CV2_AVAILABLE and isinstance(image, np.ndarray):
        _, encoded = cv2.imencode(".png", image)
        return encoded.tobytes()
    if isinstance(image, Image.Image):
        buf = io.BytesIO()
        image.save(buf, format="PNG")
        return buf.getvalue()
    return b""
