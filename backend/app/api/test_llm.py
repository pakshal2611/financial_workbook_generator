from fastapi import APIRouter

from app.services.llm_service import test_llm

router = APIRouter(
    prefix="/llm",
    tags=["LLM"]
)


@router.get("/test")
def test():

    return {
        "response": test_llm()
    }