# -----------------------------------------------------------------------
# pictures_database.py
# -----------------------------------------------------------------------

import psycopg2
import datetime
import cloudinary
import cloudinary.api
import cloud
from Databases import database
import pytz
from dotenv import load_dotenv
import os

load_dotenv()
cloud_name = os.environ["CLOUDINARY_CLOUD_NAME"]
api_key = os.environ["CLOUDINARY_API_KEY"]
api_secret = os.environ["CLOUDINARY_API_SECRET"]
DATABASE_URL = os.environ["DATABASE_URL"]

# -----------------------------------------------------------------------


# Creates pictures database table
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


# -----------------------------------------------------------------------


# Inserts a new row into pictures database table
def insert_picture(pictureID, coordinates, link, place):

    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:

                cur.execute(
                    """INSERT INTO pictures (pictureID, coordinates, link) 
                                VALUES (%s, %s, %s);""",
                    (pictureID, coordinates, link, place),
                )
                conn.commit()

    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------


# Returns the date based on eastern time zone
def get_current_date():

    eastern = pytz.timezone("America/New_York")
    eastern_timezone = datetime.datetime.now(eastern)
    eastern_date = eastern_timezone.date()
    return eastern_date


# -----------------------------------------------------------------------


# Checks the current date and returns associated picture id
def pic_of_day():

    eastern_date = get_current_date()
    day_of_year = eastern_date.timetuple().tm_yday
    picture_id = (day_of_year - 1) % database.get_table_size("pictures") + 1

    return picture_id


# -----------------------------------------------------------------------


# Returns specified information of picture using its id
def get_pic_info(col, id):

    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor() as cur:

                cur.execute(f"SELECT {col} FROM pictures WHERE pictureID = {id}")
                rows = cur.fetchall()
                row = rows[0][0]

                return row

    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------


def main():

    create_pic_table()

    current_date = get_current_date()
    today_id = pic_of_day()
    pic_place = get_pic_info("place", 1)
    pic_coords = get_pic_info("coordinates", 1)
    pic_url = get_pic_info("link", 1)

    print(f"Current date: {current_date}")

    print(f"Picture ID Today: {today_id}")

    # Effron Music Building
    print(f"Place: {pic_place}")

    # 40.342396, -74.659527
    print(f"Coordinates: {pic_coords}")

    # http://res.cloudinary.com/dmiaxw4rr/image/upload/v1712640742/TigerSpot/Checked/91271FD2-F874-4AAE-B589-F6FD7BB0920B_1_201_a_r2hcfr.jpg
    print(f"URL: {pic_url}")


# -----------------------------------------------------------------------

if __name__ == "__main__":
    main()
