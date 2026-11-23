
import mysql.connector
import os

def get_db_connection():
    return mysql.connector.connect(
        host=os.environ.get("AQUASENSE_DB_HOST"),
        user=os.environ.get("AQUASENSE_DB_USER"),
        password=os.environ.get("AQUASENSE_DB_PASSWORD"),
        database=os.environ.get("AQUASENSE_DB_NAME"),
        port=int(os.environ.get("AQUASENSE_DB_PORT", 3306))
    )
