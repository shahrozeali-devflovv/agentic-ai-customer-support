import os


class Settings:
    def __init__(self) -> None:
        self.secret_key = self._get_required_env("SECRET_KEY")

        self.jwt_algorithm = os.getenv(
            "JWT_ALGORITHM",
            "HS256",
        )

        self.access_token_expire_minutes = int(
            os.getenv(
                "ACCESS_TOKEN_EXPIRE_MINUTES",
                "30",
            )
        )

        self.smtp_host = os.getenv(
            "SMTP_HOST",
            "",
        )

        self.smtp_port = int(
            os.getenv(
                "SMTP_PORT",
                "587",
            )
        )

        self.smtp_username = os.getenv(
            "SMTP_USERNAME",
            "",
        )

        self.smtp_password = os.getenv(
            "SMTP_PASSWORD",
            "",
        )

        self.smtp_from_email = os.getenv(
            "SMTP_FROM_EMAIL",
            "",
        )

        self.frontend_url = os.getenv(
            "FRONTEND_URL",
            "http://localhost:3000",
        )

    @staticmethod
    def _get_required_env(name: str) -> str:
        value = os.getenv(name)

        if not value:
            raise RuntimeError(
                f"{name} environment variable is not set"
            )

        return value


settings = Settings()