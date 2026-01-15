"""
Style Module Service
"""
from typing import List, Optional
from sqlalchemy.orm import Session

from app.modules.style.models import StyleProfile, ExplicitRule
from app.modules.style.schemas import StyleProfileCreate, StyleProfileUpdate, ExplicitRuleCreate


class StyleService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_all_styles(self) -> List[StyleProfile]:
        return self.db.query(StyleProfile).all()
    
    def get_style_by_id(self, style_id: int) -> Optional[StyleProfile]:
        return self.db.query(StyleProfile).filter(StyleProfile.id == style_id).first()
    
    def get_style_by_name(self, name: str) -> Optional[StyleProfile]:
        return self.db.query(StyleProfile).filter(StyleProfile.name == name).first()
    
    def create_style(self, data: StyleProfileCreate) -> StyleProfile:
        style = StyleProfile(**data.model_dump())
        self.db.add(style)
        self.db.commit()
        self.db.refresh(style)
        return style
    
    def update_style(self, style_id: int, data: StyleProfileUpdate) -> Optional[StyleProfile]:
        style = self.get_style_by_id(style_id)
        if not style:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(style, key, value)
        
        self.db.commit()
        self.db.refresh(style)
        return style
    
    def delete_style(self, style_id: int) -> bool:
        style = self.get_style_by_id(style_id)
        if not style:
            return False
        self.db.delete(style)
        self.db.commit()
        return True
    
    def get_rules_by_style(self, style_id: int, active_only: bool = True) -> List[ExplicitRule]:
        query = self.db.query(ExplicitRule).filter(ExplicitRule.style_id == style_id)
        if active_only:
            query = query.filter(ExplicitRule.is_active == True)
        return query.order_by(ExplicitRule.priority.desc()).all()
    
    def add_rule(self, style_id: int, data: ExplicitRuleCreate) -> ExplicitRule:
        rule = ExplicitRule(style_id=style_id, **data.model_dump())
        self.db.add(rule)
        self.db.commit()
        self.db.refresh(rule)
        return rule
    
    def deactivate_rule(self, rule_id: int) -> bool:
        rule = self.db.query(ExplicitRule).filter(ExplicitRule.id == rule_id).first()
        if not rule:
            return False
        rule.is_active = False
        self.db.commit()
        return True
    
    def build_style_prompt(self, style_id: int) -> str:
        style = self.get_style_by_id(style_id)
        if not style:
            return ""
        
        rules = self.get_rules_by_style(style_id)
        prompt_parts = []
        
        if style.tone_patterns:
            tone = style.tone_patterns
            prompt_parts.append(f"- 문체: {tone.get('formality', 'formal')}")
            prompt_parts.append(f"- 어조: {tone.get('politeness', 'polite')}")
        
        if style.structure_rules:
            struct = style.structure_rules
            if struct.get("uses_bullet_points"):
                prompt_parts.append("- 불릿 포인트를 사용하세요")
            if struct.get("uses_numbering"):
                prompt_parts.append("- 번호 매기기를 사용하세요")
        
        if style.expression_dict:
            expr = style.expression_dict
            endings = expr.get("common_endings", [])
            if endings:
                prompt_parts.append(f"- 종결어미: {', '.join(endings[:3])}")
        
        if style.good_examples:
            prompt_parts.append("\n[👍 좋은 예시 (이 스타일을 따르세요)]")
            for i, example in enumerate(style.good_examples[:2]): # Top 2
                prompt_parts.append(f"예시 {i+1}:\n{example[:300]}...")

        if style.bad_examples:
            prompt_parts.append("\n[👎 나쁜 예시 (이 스타일을 피하세요)]")
            for i, example in enumerate(style.bad_examples[:2]): # Top 2
                prompt_parts.append(f"예시 {i+1}:\n{example[:300]}...")

        for rule in rules:
            prompt_parts.append(f"- [규칙] {rule.description}")
        
        return "\n".join(prompt_parts)
