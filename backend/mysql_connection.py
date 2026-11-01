
import mysql.connector
import os

def get_db_connection():
    password = os.environ.get("AQUASENSE_DB_PASSWORD")

    print("DEBUG - MySQL password available:", bool(password))

    return mysql.connector.connect(
        host="localhost",
        user="aquasense_user",
        password=password,
        database="aquasense"
    )
