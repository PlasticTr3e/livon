from fastapi import FastAPI
from app.api.routes import router

app = FastAPI(
    title="livon ai service",
    description="internal sentiment analysis microservice",
    version="1.0.0",
    docs_url="/docs", 
    redoc_url=None,
)

app.include_router(router, prefix="/api")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}