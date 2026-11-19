from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.security import verify_api_key
from app.services.predictor import predict


router = APIRouter()


class PredictRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)


class PredictResponse(BaseModel):
    success: bool
    data: dict


@router.post(
    "/predict",
    response_model=PredictResponse,
    dependencies=[Depends(verify_api_key)],
)
async def predict_sentiment(body: PredictRequest) -> PredictResponse:
    result = predict(body.text)
    return PredictResponse(success=True, data=result)
