import os
import json
import fitz  # PyMuPDF
from pathlib import Path
from advanced_pipeline import run_pipeline

def extract_profile_image(pdf_path: Path, output_dir: Path) -> str:
    """
    PDF에서 가장 큰 이미지를 찾아 프로필 사진으로 저장합니다.
    """
    try:
        doc = fitz.open(pdf_path)
        # 첫 페이지에서만 검색
        page = doc[0]
        image_list = page.get_images(full=True)

        if not image_list:
            print("⚠️ PDF에서 이미지를 찾을 수 없습니다.")
            return "/assets/default_avatar.png"

        # 가장 큰 이미지 찾기 (너비*높이 기준)
        best_image = None
        max_area = 0
        best_xref = 0

        for img in image_list:
            xref = img[0]
            base_image = doc.extract_image(xref)
            width = base_image["width"]
            height = base_image["height"]
            area = width * height
            
            # 너무 작은 아이콘(예: 전화기 아이콘)은 제외 (100x100 이상)
            if area > 10000 and area > max_area:
                max_area = area
                best_image = base_image
                best_xref = xref

        if best_image:
            image_bytes = best_image["image"]
            # public 폴더에 저장
            output_dir.mkdir(parents=True, exist_ok=True)
            image_filename = "profile_extracted.png"
            output_path = output_dir / image_filename
            
            with open(output_path, "wb") as f:
                f.write(image_bytes)
            
            print(f"📸 프로필 이미지 추출 성공: {output_path}")
            return f"/{image_filename}"
        
        return "/assets/default_avatar.png"

    except Exception as e:
        print(f"❌ 이미지 추출 실패: {e}")
        return "/assets/default_avatar.png"

def main():
    # 경로 설정
    base_dir = Path(__file__).parent.parent
    pdf_path = base_dir / "data" / "personal" / "석상훈 신입 이력서.pdf"
    json_path = base_dir / "data" / "portfolio.json"
    public_dir = base_dir / "public"

    if not pdf_path.exists():
        print(f"❌ 파일을 찾을 수 없습니다: {pdf_path}")
        return

    print("=== 포트폴리오 업데이트 파이프라인 시작 ===")

    # 1. 프로필 이미지 추출
    image_url = extract_profile_image(pdf_path, public_dir)

    # 2. 하이브리드 파이프라인 실행 (Router -> Docling/Vision -> JSON)
    try:
        final_data = run_pipeline(str(pdf_path))
        
        # 3. 이미지 경로 병합
        if "profile" in final_data:
            final_data["profile"]["image"] = image_url
            
        # 4. JSON 저장
        json_path.parent.mkdir(parents=True, exist_ok=True)
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(final_data, f, ensure_ascii=False, indent=4)
            
        print(f"✨ 완료! {json_path} 파일이 업데이트되었습니다.")
        print(f"   - 이름: {final_data.get('profile', {}).get('name')}")
        print(f"   - 프로젝트 수: {len(final_data.get('projects', []))}")

    except Exception as e:
        print(f"❌ 파이프라인 실행 중 오류 발생: {e}")

if __name__ == "__main__":
    main()
