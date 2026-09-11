import os


class Settings:
    def __init__(self) -> None:
        self.secret_key = self._get_required_env("SECRET_KEY")
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        self.access_token_expire_minutes = int(
            os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
        )

    @staticmethod
    def _get_required_env(name: str) -> str:
        value = os.getenv(name)

        if not value:
            raise RuntimeError(f"{name} environment variable is not set")

        return value


settings = Settings()