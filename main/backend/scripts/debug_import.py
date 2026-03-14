import sys
print("Python executable:", sys.executable)
print("Python version:", sys.version)

print("-" * 20)
try:
    import cv2
    print(f"cv2 version: {cv2.__version__}")
except ImportError as e:
    print(f"cv2 import failed: {e}")
except Exception as e:
    print(f"cv2 verification failed: {e}")

print("-" * 20)
try:
    import paddle
    print(f"paddle version: {paddle.__version__}")
except ImportError as e:
    print(f"paddle import failed: {e}")

print("-" * 20)
print("Attempting paddleocr import...")
try:
    import paddleocr
    print(f"paddleocr version: {paddleocr.__version__}")
except ImportError as e:
    print(f"paddleocr import failed: {e}")
    import traceback
    traceback.print_exc()
except Exception as e:
    print(f"paddleocr crash: {e}")
    import traceback
    traceback.print_exc()
