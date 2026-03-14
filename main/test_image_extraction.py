import fitz
import os
from PIL import Image
import sys

# Add backend to path to import ImageProcessor
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from app.modules.common.utils.image_processor import ImageProcessor
from app.core.config import settings

def create_dummy_pdf(filename="test_resume.pdf"):
    """Creates a PDF with a red square image."""
    doc = fitz.open()
    page = doc.new_page()
    
    # Create a simple red image
    img = Image.new('RGB', (100, 100), color = 'red')
    img.save("temp_img.jpg")
    
    # Insert image
    rect = fitz.Rect(100, 100, 200, 200)
    page.insert_image(rect, filename="temp_img.jpg")
    
    doc.save(filename)
    doc.close()
    
    os.remove("temp_img.jpg")
    return filename

def test_extraction():
    pdf_path = create_dummy_pdf()
    print(f"Created dummy PDF at {pdf_path}")
    
    try:
        print("Extracting image...")
        result_url = ImageProcessor.extract_from_pdf(pdf_path)
        
        if result_url:
            print(f"SUCCESS: Image extracted. URL: {result_url}")
            # Verify file exists
            filename = os.path.basename(result_url)
            file_path = os.path.join(settings.PROFILE_DIR, filename)
            if os.path.exists(file_path):
                 print(f"SUCCESS: File found at {file_path}")
            else:
                 print(f"FAILURE: File not found at {file_path}")
        else:
            print("FAILURE: No image returned.")
            
    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)

if __name__ == "__main__":
    test_extraction()
