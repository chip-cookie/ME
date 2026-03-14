
import pypdf
import sys
import os

# Handle encoding for Windows console
sys.stdout.reconfigure(encoding='utf-8')

file_path = os.path.join("data", "personal", "석상훈 신입 이력서.pdf")

if not os.path.exists(file_path):
    print(f"Error: File not found at {file_path}")
    sys.exit(1)

try:
    reader = pypdf.PdfReader(file_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    print(text)
except Exception as e:
    print(f"Error reading PDF: {e}")
