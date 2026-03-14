from rapidocr_onnxruntime import RapidOCR
import os

print("Starting RapidOCR test...")

try:
    engine = RapidOCR()
    path = "/app/data/personal/석상훈 신입 이력서.pdf"
    
    # RapidOCR doesn't read PDF directly usually, but let's check basic init first.
    # We can pass an image.
    
    print("RapidOCR initialized successfully.")
    
    # Create dummy image or verify capabilities
    # For now, just init is enough to prove ONNX doesn't crash like Paddle
    
except Exception as e:
    print(f"RapidOCR Failed: {e}")
