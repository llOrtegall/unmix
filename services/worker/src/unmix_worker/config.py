from pydantic import NonNegativeInt, PositiveFloat
from pydantic_settings import BaseSettings

from unmix_worker.modules.separation.domain.model_name import ModelName


class Settings(BaseSettings):
    redis_url: str
    s3_endpoint: str
    s3_region: str = "us-east-1"
    s3_access_key: str
    s3_secret_key: str
    s3_bucket: str
    demucs_model: ModelName = ModelName.HTDEMUCS_6S
    max_duration_seconds: PositiveFloat = 600
    # 0 keeps torch's default thread count.
    torch_threads: NonNegativeInt = 0
    log_level: str = "INFO"
