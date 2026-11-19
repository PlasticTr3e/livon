import hmac
from fastapi import Header, HTTPException, status


async def verify_api_key(authorization: str = Header(...)) -> None:
    from app.core.config import settings

    scheme, _, token = authorization.partition(" ")

    if scheme.lower() != "bearer" or not hmac.compare_digest(
        token, settings.internal_api_key
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid or missing api key",
        )
