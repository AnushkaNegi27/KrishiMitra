import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

DB_HOST = os.getenv("DB_HOST")       # e.g., "localhost"
DB_USER = os.getenv("DB_USER")       # e.g., "krishi_user"
DB_PASSWORD = os.getenv("DB_PASSWORD") # e.g., "Anushka@27"
DB_NAME = os.getenv("DB_NAME")       # e.g., "krishimitra"

def get_connection():
    """
    Creates and returns a PostgreSQL database connection
    """
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            cursor_factory=RealDictCursor
        )
        print("Connected to PostgreSQL database")
        return conn
    except Exception as e:
        print(f"Error connecting to PostgreSQL: {e}")
        return None
