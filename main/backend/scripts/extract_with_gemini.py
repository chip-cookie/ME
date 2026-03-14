import os
import json
import time
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("Error: GEMINI_API_KEY not found")
    exit(1)

genai.configure(api_key=api_key)

def extract_resume_data_standalone():
    pdf_path = Path("data/personal/석상훈 신입 이력서.pdf")
    output_path = Path("data/portfolio_standalone.json")

    if not pdf_path.exists():
        print(f"File not found: {pdf_path}")
        return

    print("📤 Uploading PDF to Gemini...")
    sample_file = genai.upload_file(path=pdf_path, display_name="Resume_Standalone")

    # Processing Wait Loop
    while sample_file.state.name == "PROCESSING":
        print("   Processing file...")
        time.sleep(2)
        sample_file = genai.get_file(sample_file.name)

    if sample_file.state.name == "FAILED":
        print("❌ File processing failed.")
        return

    print("✅ File processed. Generating JSON...")

    prompt = """
    이력서를 분석하여 JSON 데이터를 추출해줘.
    
    Format:
    {
        "profile": { "name": "", "title": "", "bio": "", "email": "" },
        "projects": [ { "id": "p-1", "title": "", "description": "", "tags": [{"name": ""}], "date": "" } ],
        "skills": [ { "title": "Main", "items": [{ "name": "Python", "level": "Advanced" }] } ]
    }
    """

    model = genai.GenerativeModel('gemini-2.0-flash')
    response = model.generate_content([sample_file, prompt])
    
    # Cleanup text
    json_str = response.text.replace("```json", "").replace("```", "").strip()
    
    try:
        data = json.loads(json_str)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"✨ Saved to {output_path}")
    except Exception as e:
        print(f"❌ JSON Parsing Error: {e}")
        print("Raw output:", json_str)
    
    # Delete file from Gemini Storage
    genai.delete_file(sample_file.name)

if __name__ == "__main__":
    extract_resume_data_standalone()
