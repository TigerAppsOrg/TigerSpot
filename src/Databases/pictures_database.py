# -----------------------------------------------------------------------
# pictures_database.py
# -----------------------------------------------------------------------

import datetime

import pytz
from sqlalchemy import func

from src.db import get_session
from src.models import Picture

# -----------------------------------------------------------------------


# Inserts a new row into pictures database table
def insert_picture(pictureid, coordinates, link, place):
    try:
        with get_session() as session:
            new_picture = Picture(
                pictureid=pictureid, coordinates=coordinates, link=link, place=place
            )
            session.add(new_picture)

        return "success"

    except Exception as error:
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

    # Get total number of pictures
    try:
        with get_session() as session:
            picture_count = session.query(func.count(Picture.pictureid)).scalar()
    except Exception as error:
        print(error)
        return 1

    picture_id = (day_of_year - 1) % picture_count + 1
    return picture_id


# -----------------------------------------------------------------------


# Returns specified information of picture using its id
def get_pic_info(col, id):
    try:
        with get_session() as session:
            picture = session.query(Picture).filter_by(pictureid=id).first()

            if picture is None:
                return None

            # Return the requested column
            return getattr(picture, col)

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

if __name__ == "__main__":
    current_date = get_current_date()
    today_id = pic_of_day()
    pic_place = get_pic_info("place", 1)
    pic_coords = get_pic_info("coordinates", 1)
    pic_url = get_pic_info("link", 1)

    print(f"Current date: {current_date}")
    print(f"Picture ID Today: {today_id}")
    print(f"Place: {pic_place}")
    print(f"Coordinates: {pic_coords}")
    print(f"URL: {pic_url}")
