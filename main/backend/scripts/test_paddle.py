import cv2
from paddleocr import PaddleOCR
import fitz
import numpy as np
import os

print("start test script")

try:
    path = "/app/data/personal/석상훈 신입 이력서.pdf"
    if not os.path.exists(path):
        print(f"Path not found: {path}")
        exit(1)
        
    print("Loading valid PDF...")
    doc = fitz.open(path)
    page = doc[0]
    pix = page.get_pixmap(dpi=150)
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
    
    if pix.n == 3:
        img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    elif pix.n == 4:
        img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
        
    print(f"Image shape: {img.shape}")

    print("Initializing PaddleOCR (Fallback Mode: lang='korean', enable_mkldnn=False)...")
    model = PaddleOCR(lang='korean', enable_mkldnn=False)
    
    print("Running predict(img)...")
    # Check what methods exist
    print(f"Model attributes: {dir(model)}")
    
    if hasattr(model, 'predict'):
        print("Calling model.predict(img)...")
        result = model.predict(img)
        print("predict() success")
        # print(result)
    elif hasattr(model, 'ocr'):
        print("predict() NOT found. Calling model.ocr(img)...")
        # Legacy ocr() takes img, det=True, rec=True, cls=True
        result = model.ocr(img, cls=True)
        print("ocr() success")
        print(result)
    else:
        print("No predict() or ocr() method found!")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

print("Test finished")
