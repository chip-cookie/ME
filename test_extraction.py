
import os
import sys
from pathlib import Path

# Add app to path
sys.path.append(os.getcwd())

# Mock settings
os.environ["OLLAMA_BASE_URL"] = "http://localhost:11434"
os.environ["OLLAMA_MODEL"] = "qwen3-next:80b"

try:
    from app.modules.analysis.extraction_service import extract_document
    print("✅ Extraction service imported successfully")
except ImportError as e:
    print(f"❌ Failed to import extraction service: {e}")
    sys.exit(1)

# Create dummy file
with open("test.txt", "w") as f:
    f.write("This is a test document for extraction.")

try:
    print("Attempting to extract test.txt...")
    result = extract_document("test.txt")
    print(f"✅ Extraction successful. Text: {result.text}")
    print(f"Source: {result.source}")
except Exception as e:
    print(f"❌ Extraction failed: {e}")
    import traceback
    traceback.print_exc()
finally:
    if os.path.exists("test.txt"):
        os.remove("test.txt")
