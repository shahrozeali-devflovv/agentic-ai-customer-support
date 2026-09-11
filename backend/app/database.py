import os

import psycopg


def check_database_connection() -> bool:
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        return False

    try:
        with psycopg.connect(database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()

                return result == (1,)
    except psycopg.Error:
        return False