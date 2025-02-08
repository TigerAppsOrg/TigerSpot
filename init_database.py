from dotenv import load_dotenv
import psycopg2
import cloudinary
from src import cloud

import os

load_dotenv()
DATABASE_URL = os.environ["DATABASE_URL"]
cloud_name = os.environ["CLOUDINARY_CLOUD_NAME"]
api_key = os.environ["CLOUDINARY_API_KEY"]
api_secret = os.environ["CLOUDINARY_API_SECRET"]


def create_user_table():

    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """CREATE TABLE IF NOT EXISTS users (
                username varchar(255),
                points int);"""
                )
                conn.commit()

    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return "database error"


def create_daily_user_table():

    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """CREATE TABLE IF NOT EXISTS usersDaily (
                                username varchar(255),
                                points int,
                                distance int,
                                played boolean,
                                last_played date,
                                last_versus date,
                                current_streak int);"""
                )
                conn.commit()

    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return "database error"


def create_pic_table():

    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:

                cur.execute(
                    """CREATE TABLE IF NOT EXISTS pictures (
                    pictureID int,
                    coordinates float[2],
                    link varchar(255),
                    place varchar(255));"""
                )

                # configures and connects to cloudinary account
                cloudinary.config(
                    cloud_name=cloud_name,
                    api_key=api_key,
                    api_secret=api_secret,
                )

                # name of folder to extract resources from
                folder_name = "TigerSpot/Checked"

                # extracts all resources from folder
                resources = cloudinary.api.resources(
                    type="upload", prefix=folder_name, max_results=500, context=True
                )

                pictureID = 0

                # loops through folder and retrieves image url, coordinates, place, and sets pictureid per resource
                for resource in resources.get("resources", []):
                    link, latitude, longitude, place = cloud.image_data(resource)
                    coordinates = [latitude, longitude]
                    cur.execute("SELECT * FROM pictures WHERE link = %s", (link,))
                    exists = cur.fetchone()
                    if not exists:
                        pictureID += 1
                        cur.execute(
                            """INSERT INTO pictures (pictureID, coordinates, link, place) 
                        VALUES (%s, %s, %s, %s);""",
                            (pictureID, coordinates, link, place),
                        )

                conn.commit()

    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return "database error"


def create_challenges_table():
    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """CREATE TABLE IF NOT EXISTS challenges(
                id SERIAL PRIMARY KEY,
                challenger_id VARCHAR(255),
                challengee_id VARCHAR(255),
                status VARCHAR(255),
                challenger_finished BOOL DEFAULT FALSE,
                challengee_finished BOOL DEFAULT FALSE,
                challenger_points INT,
                challengee_points INT,
                versuslist INT[5] DEFAULT '{0, 0, 0, 0, 0}',
                challenger_bool BOOL[5] DEFAULT '{FALSE, FALSE, FALSE, FALSE, FALSE}',
                challengee_bool BOOL[5] DEFAULT '{FALSE, FALSE, FALSE, FALSE, FALSE}',
                challenger_pic_points INT[5] DEFAULT '{0, 0, 0, 0, 0}',
                challengee_pic_points INT[5] DEFAULT '{0, 0, 0, 0, 0}',
                playger_button_status BOOL DEFAULT FALSE,
                playgee_button_status BOOL DEFAULT FALSE);"""
                )
                conn.commit()

    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Error clearing challenges table: {error}")
        return "database error"


def create_matches_table():
    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """CREATE TABLE IF NOT EXISTS matches (
                id SERIAL PRIMARY KEY,
                challenge_id INTEGER,
                winner_id VARCHAR(255),
                challenger_score INTEGER,
                challengee_score INTEGER);"""
                )
                conn.commit()
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Error clearing matches table: {error}")
        return "database error"


def init_database():
    create_user_table()
    create_daily_user_table()
    create_pic_table()
    create_challenges_table()
    create_matches_table()


if __name__ == "__main__":
    init_database()
