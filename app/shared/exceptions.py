"""
JasoS 공통 예외 클래스
"""
from fastapi import HTTPException


class NotFoundError(HTTPException):
    def __init__(self, detail: str = "리소스를 찾을 수 없습니다"):
        super().__init__(status_code=404, detail=detail)


class BadRequestError(HTTPException):
    def __init__(self, detail: str = "잘못된 요청입니다"):
        super().__init__(status_code=400, detail=detail)


class ServiceUnavailableError(HTTPException):
    def __init__(self, detail: str = "서비스를 사용할 수 없습니다"):
        super().__init__(status_code=503, detail=detail)
