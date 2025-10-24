# -----------------------------------------------------------------------
# versus_database.py
# -----------------------------------------------------------------------

from src.db import get_session
from src.models import Challenge, Match

# -----------------------------------------------------------------------


# Update cumulative points for a user in a given challenge
def update_versus_points(challenge_id, user_id, additional_points):
    try:
        with get_session() as session:
            challenge = session.query(Challenge).filter_by(id=challenge_id).first()

            if challenge is None:
                return

            # Determine if user is challenger or challengee
            if user_id == challenge.challenger_id:
                challenge.challenger_points = (
                    challenge.challenger_points or 0
                ) + additional_points
            elif user_id == challenge.challengee_id:
                challenge.challengee_points = (
                    challenge.challengee_points or 0
                ) + additional_points
            else:
                return

        return "success"

    except Exception as error:
        print(f"Error: {error}")
        return "database error"


# -----------------------------------------------------------------------
# Calculate the points for a versus challenge
def calculate_versus(distance, time):
    if time < 10 and distance < 10:
        return 1000
    else:
        if distance < 0:
            raise ValueError("Distance cannot be negative")
        dis_points = max(0, 1 - distance / 110) * 900
        if time < 0 or time > 120:
            raise ValueError(
                "Time taken must be between 0 and the maximum allowed time"
            )
        time_points = max(0, 1 - time / 120) * 100

        return dis_points + time_points


# -----------------------------------------------------------------------
# Return winner of a given challenge
def get_winner(challenge_id):
    try:
        with get_session() as session:
            match = session.query(Match).filter_by(challenge_id=challenge_id).first()

            if match is None:
                return None
            else:
                return match.winner_id

    except Exception as error:
        print(f"Error: {error}")
        return "database error"


# -----------------------------------------------------------------------


# Update the status of a versus challenge picture
def update_versus_pic_status(challenge_id, user_id, index):
    try:
        with get_session() as session:
            challenge = session.query(Challenge).filter_by(id=challenge_id).first()

            if challenge is None:
                return

            # Determine if user is challenger or challengee
            if user_id == challenge.challenger_id:
                if challenge.challenger_bool is None:
                    challenge.challenger_bool = [False] * 5
                # PostgreSQL arrays are 1-indexed, Python lists are 0-indexed
                challenge.challenger_bool[index - 1] = True
            elif user_id == challenge.challengee_id:
                if challenge.challengee_bool is None:
                    challenge.challengee_bool = [False] * 5
                challenge.challengee_bool[index - 1] = True
            else:
                return

            # Mark the object as modified (needed for mutable types like arrays)
            from sqlalchemy.orm.attributes import flag_modified

            flag_modified(challenge, "challenger_bool")
            flag_modified(challenge, "challengee_bool")

        return "success"

    except Exception as error:
        print(f"Error: {error}")
        return "database error"


# -----------------------------------------------------------------------


# Get the status of a versus challenge picture
def get_versus_pic_status(challenge_id, user_id, index):
    try:
        with get_session() as session:
            challenge = session.query(Challenge).filter_by(id=challenge_id).first()

            if challenge is None:
                return None

            # Determine if user is challenger or challengee
            if user_id == challenge.challenger_id:
                if challenge.challenger_bool is None:
                    return False
                return challenge.challenger_bool[index - 1]
            elif user_id == challenge.challengee_id:
                if challenge.challengee_bool is None:
                    return False
                return challenge.challengee_bool[index - 1]
            else:
                return None

    except Exception as error:
        print(f"Error: {error}")
        return "database error"


# -----------------------------------------------------------------------


# Store the points for a versus challenge picture
def store_versus_pic_points(challenge_id, user_id, index, points):
    from sqlalchemy.orm.attributes import flag_modified

    try:
        with get_session() as session:
            challenge = session.query(Challenge).filter_by(id=challenge_id).first()

            if challenge is None:
                return

            # Determine if user is challenger or challengee
            if user_id == challenge.challenger_id:
                if challenge.challenger_pic_points is None:
                    challenge.challenger_pic_points = [0] * 5
                challenge.challenger_pic_points[index - 1] = points

                flag_modified(challenge, "challenger_pic_points")
            elif user_id == challenge.challengee_id:
                if challenge.challengee_pic_points is None:
                    challenge.challengee_pic_points = [0] * 5
                challenge.challengee_pic_points[index - 1] = points

                flag_modified(challenge, "challengee_pic_points")
            else:
                return

        return "success"

    except Exception as error:
        print(f"Error: {error}")
        return "database error"


# -----------------------------------------------------------------------

# Testing
if __name__ == "__main__":
    print("Testing")
    print(update_versus_points("1", "123", 100))
    print(calculate_versus(2, 1))
    print(get_winner("1"))
    print(update_versus_pic_status("1", "123", 2))
    print(get_versus_pic_status("1", "123", 2))
    print(store_versus_pic_points("1", "123", 2, 100))
