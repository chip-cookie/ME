"""
Style Module Router
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.style.service import StyleService
from app.modules.style.schemas import (
    StyleProfileCreate, StyleProfileUpdate, StyleProfileResponse,
    ExplicitRuleCreate, ExplicitRuleResponse
)

router = APIRouter(prefix="/api/styles", tags=["styles"])


@router.get("", response_model=List[StyleProfileResponse])
def get_all_styles(db: Session = Depends(get_db)):
    service = StyleService(db)
    return service.get_all_styles()


@router.get("/{style_id}", response_model=StyleProfileResponse)
def get_style(style_id: int, db: Session = Depends(get_db)):
    service = StyleService(db)
    style = service.get_style_by_id(style_id)
    if not style:
        raise HTTPException(status_code=404, detail="스타일을 찾을 수 없습니다")
    return style


@router.post("", response_model=StyleProfileResponse)
def create_style(data: StyleProfileCreate, db: Session = Depends(get_db)):
    service = StyleService(db)
    if service.get_style_by_name(data.name):
        raise HTTPException(status_code=400, detail="이미 존재하는 스타일 이름입니다")
    return service.create_style(data)


@router.put("/{style_id}", response_model=StyleProfileResponse)
def update_style(style_id: int, data: StyleProfileUpdate, db: Session = Depends(get_db)):
    service = StyleService(db)
    style = service.update_style(style_id, data)
    if not style:
        raise HTTPException(status_code=404, detail="스타일을 찾을 수 없습니다")
    return style


@router.delete("/{style_id}")
def delete_style(style_id: int, db: Session = Depends(get_db)):
    service = StyleService(db)
    if not service.delete_style(style_id):
        raise HTTPException(status_code=404, detail="스타일을 찾을 수 없습니다")
    return {"message": "스타일이 삭제되었습니다"}


@router.get("/{style_id}/rules", response_model=List[ExplicitRuleResponse])
def get_style_rules(style_id: int, active_only: bool = True, db: Session = Depends(get_db)):
    service = StyleService(db)
    return service.get_rules_by_style(style_id, active_only)


@router.post("/{style_id}/rules", response_model=ExplicitRuleResponse)
def add_rule(style_id: int, data: ExplicitRuleCreate, db: Session = Depends(get_db)):
    service = StyleService(db)
    if not service.get_style_by_id(style_id):
        raise HTTPException(status_code=404, detail="스타일을 찾을 수 없습니다")
    return service.add_rule(style_id, data)


@router.delete("/rules/{rule_id}")
def deactivate_rule(rule_id: int, db: Session = Depends(get_db)):
    service = StyleService(db)
    if not service.deactivate_rule(rule_id):
        raise HTTPException(status_code=404, detail="규칙을 찾을 수 없습니다")
    return {"message": "규칙이 비활성화되었습니다"}
