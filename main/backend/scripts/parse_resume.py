import os
import sys

# Check for docling installation
try:
    from docling.document_converter import DocumentConverter
except ImportError:
    print("Error: 'docling' library is not installed.")
    print("Please install it using: pip install docling")
    sys.exit(1)

def main():
    # Assume script is run from project root, look for data/personal
    base_dir = os.getcwd()
    data_dir = os.path.join(base_dir, "data", "personal")
    
    print(f"Checking for files in: {data_dir}")

    if not os.path.exists(data_dir):
        print(f"Error: Directory '{data_dir}' not found.")
        print("Please ensure you are running this script from the project root.")
        return

    # Find supported files
    supported_exts = ('.pdf', '.docx', '.doc')
    files = [f for f in os.listdir(data_dir) if f.lower().endswith(supported_exts)]
    
    if not files:
        print(f"No supported files {supported_exts} found in '{data_dir}'.")
        print("Please add your resume file (PDF or Word) to this directory.")
        return

    # Pick the first file
    target_filename = files[0]
    target_path = os.path.join(data_dir, target_filename)
    print(f"\nFound file: {target_filename}")
    print("Initializing Docling converter... (This might take a while for the first run)")

    try:
        converter = DocumentConverter()
        print(f"Converting '{target_filename}' to Markdown...")
        
        result = converter.convert(target_path)
        markdown_content = result.document.export_to_markdown()

        # Save output
        output_filename = "parsed_resume.md"
        output_path = os.path.join(data_dir, output_filename)
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(markdown_content)
        
        print(f"\n[SUCCESS] Conversion completed successfully!")
        print(f"Output saved to: {output_path}")
        print("\n--- Parsed Content Preview ---")
        print(markdown_content[:500] + ("..." if len(markdown_content) > 500 else ""))
        print("------------------------------")
        print("\nYou can now check 'resume_data/parsed_resume.md' or ask the agent to apply this content to your portfolio.")

    except Exception as e:
        print(f"\n[ERROR] An error occurred during conversion:")
        print(str(e))

if __name__ == "__main__":
    main()
