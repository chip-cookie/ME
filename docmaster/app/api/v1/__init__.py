from fastapi import APIRouter
from app.api.v1 import documents, evaluate, gleaning, generate

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(documents.router)
api_router.include_router(evaluate.router)
api_router.include_router(gleaning.router)
api_router.include_router(generate.router)
