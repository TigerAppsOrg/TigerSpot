# -----------------------------------------------------------------------
# challenges_database.py
# -----------------------------------------------------------------------

import random

from sqlalchemy import text

from src.db import get_session
import sys, traceback
from src.models import Challenge, Match


# -----------------------------------------------------------------------
# Reset challenges tables
def clear_challenges_table():
    try:
        with get_session() as session:
            # Delete all records from the challenges table
            session.query(Challenge).delete()
            print("Challenges table cleared.")

            # Delete all records from matches table
            session.query(Match).delete()
            print("Matches table cleared.")

            # Reset sequences
            session.execute(text("ALTER SEQUENCE challenges_id_seq RESTART WITH 1"))
            print("Challenges id sequence reset.")

            session.execute(text("ALTER SEQUENCE matches_id_seq RESTART WITH 1"))
            print("Matches id sequence reset.")

        return "success"

    except Exception as error:
        print(f"Error clearing challenges table: {error}")
        return "database error"


# -----------------------------------------------------------------------
# Reset challenges pertaining to a certain user
def clear_user_challenges(user_id):
    try:
        with get_session() as session:
            # Find challenges related to the user_id
            challenges = (
                session.query(Challenge)
                .filter(
                    (Challenge.challenger_id == user_id)
                    | (Challenge.challengee_id == user_id)
                )
                .all()
            )

            challenge_ids = [c.id for c in challenges]

            if challenge_ids:
                # Delete matching entries from the matches table
                session.query(Match).filter(
                    Match.challenge_id.in_(challenge_ids)
                ).delete(synchronize_session=False)

                # Delete entries from the challenges table
                session.query(Challenge).filter(Challenge.id.in_(challenge_ids)).delete(
                    synchronize_session=False
                )

        return "success"

    except Exception as error:
        print(f"Error clearing entries for user_id {user_id}: {error}")
        return "database error"


# -----------------------------------------------------------------------


# Create a new challenge row between new users
def create_challenge(challenger_id, challengee_id):
    try:
        with get_session() as session:
            # Check for existing challenge between the two users
            existing_challenge = (
                session.query(Challenge)
                .filter(
                    (
                        (Challenge.challenger_id == challenger_id)
                        & (Challenge.challengee_id == challengee_id)
                    )
                    | (
                        (Challenge.challenger_id == challengee_id)
                        & (Challenge.challengee_id == challenger_id)
                    )
                )
                .filter(Challenge.status.in_(["pending", "accepted"]))
                .first()
            )

            if existing_challenge:
                return {
                    "error": "Challenge already exists",
                    "challenge_id": existing_challenge.id,
                }

            # No existing challenge found, proceed to create a new one
            new_challenge = Challenge(
                challenger_id=challenger_id,
                challengee_id=challengee_id,
                status="pending",
            )
            session.add(new_challenge)
            session.flush()  # Flush to get the ID

            challenge_id = new_challenge.id

        return {
            "success": "Challenge created successfully",
            "challenge_id": challenge_id,
        }

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------


# Accept a challenge
def accept_challenge(challenge_id):
    status = "database error"  # Default status in case of error
    try:
        with get_session() as session:
            challenge = session.query(Challenge).filter_by(id=challenge_id).first()

            if challenge:
                challenge.status = "accepted"
                challenge.versuslist = create_random_versus()
                status = "accepted"

        return status

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------


# Decline a challenge
def decline_challenge(challenge_id):
    status = "database error"  # Default status in case of error
    try:
        with get_session() as session:
            challenge = session.query(Challenge).filter_by(id=challenge_id).first()

            if challenge:
                challenge.status = "declined"
                status = "declined"

        return status

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------


# Retrieve all challenges that a user is involved in
def get_user_challenges(user_id):
    try:
        with get_session() as session:
            # Query for both challenges initiated by the user and challenges where the user is the challengee
            challenges = (
                session.query(Challenge)
                .filter(
                    (Challenge.challenger_id == user_id)
                    | (Challenge.challengee_id == user_id)
                )
                .all()
            )

            # Initialize dictionaries to hold the two types of challenges
            user_challenges = {"initiated": [], "received": []}

            # Iterate through the results and categorize each challenge
            for challenge in challenges:
                try:
                    cid = challenge.id
                    challenger_id = challenge.challenger_id
                    challengee_id = challenge.challengee_id
                    status = challenge.status
                    challenger_finished = challenge.challenger_finished
                    challengee_finished = challenge.challengee_finished
                except Exception as ex:
                    print(f"get_user_challenges attr error: {type(ex).__name__}: {ex}", file=sys.stderr)
                    traceback.print_exc()
                    raise

                # compute winner using the same session to avoid detaching current objects
                winner_row = session.query(Match).filter_by(challenge_id=cid).first()
                winner_id = winner_row.winner_id if winner_row is not None else None

                challenge_dict = {
                    "id": cid,
                    "challenger_id": challenger_id,
                    "challengee_id": challengee_id,
                    "status": status,
                    "challenger_finished": challenger_finished,
                    "challengee_finished": challengee_finished,
                    "winner_id": winner_id,
                }

                if challenger_id == user_id:  # User is the challenger
                    user_challenges["initiated"].append(challenge_dict)
                else:  # User is the challengee
                    user_challenges["received"].append(challenge_dict)

        return user_challenges

    except Exception as error:
        print(f"Error getting user challenges: {type(error).__name__}: {error}", file=sys.stderr)
        traceback.print_exc()
        return "database error"


# -----------------------------------------------------------------------


# Update if a given user has finished a given challenge
def update_finish_status(challenge_id, user_id):
    try:
        with get_session() as session:
            challenge = session.query(Challenge).filter_by(id=challenge_id).first()

            if challenge is None:
                return

            # Depending on whether the user is the challenger or the challengee
            if user_id == challenge.challenger_id:
                challenge.challenger_finished = True
            elif user_id == challenge.challengee_id:
                challenge.challengee_finished = True
            else:
                return

        return "success"

    except Exception as error:
        print(f"Error: {error}")
        return "database error"


# -----------------------------------------------------------------------


# Check if both users have finished a given challenge
def check_finish_status(challenge_id):
    status = {"status": "unfinished"}  # Default status
    try:
        with get_session() as session:
            challenge = session.query(Challenge).filter_by(id=challenge_id).first()

            if challenge:
                if challenge.challenger_finished and challenge.challengee_finished:
                    status = {"status": "finished"}
            else:
                print("No match found with the given challenge_id.")

        return status

    except Exception as error:
        print(f"Error checking finish status: {error}")
        return "database error"


# -----------------------------------------------------------------------


# Get the participants of a given challenge
def get_challenge_participants(challenge_id):
    try:
        with get_session() as session:
            challenge = session.query(Challenge).filter_by(id=challenge_id).first()

            if challenge:
                participants = {
                    "challenger_id": challenge.challenger_id,
                    "challengee_id": challenge.challengee_id,
                }
                return participants
            else:
                return None

    except Exception as error:
        print(f"Database error: {error}")
        return "database error"


# -----------------------------------------------------------------------


# Get the results of a given challenge and return a dictionary of related result information
def get_challenge_results(challenge_id):
    try:
        with get_session() as session:
            challenge = session.query(Challenge).filter_by(id=challenge_id).first()

            if challenge is None:
                print("Challenge not found.")
                return

            # Determine the winner or if it's a tie
            if challenge.challenger_points > challenge.challengee_points:
                winner = challenge.challenger_id
            elif challenge.challengee_points > challenge.challenger_points:
                winner = challenge.challengee_id
            else:
                winner = "Tie"

            # Return a dictionary with the results
            return {
                "winner": winner,
                "challenger_id": challenge.challenger_id,
                "challengee_id": challenge.challengee_id,
                "challenger_points": challenge.challenger_points,
                "challengee_points": challenge.challengee_points,
                "challenge_id": challenge.id,
                "challenger_pic_points": challenge.challenger_pic_points,
                "challengee_pic_points": challenge.challengee_pic_points,
            }

    except Exception as error:
        print(f"Error: {error}")
        return "database error"


# -----------------------------------------------------------------------


# pseudo randomly create a list of 5 picture IDs for a challenge
def create_random_versus():
    random.seed()

    # Get table size using SQLAlchemy
    try:
        from sqlalchemy import func

        from src.models import Picture

        with get_session() as session:
            row_count = session.query(func.count(Picture.pictureid)).scalar()
    except Exception:
        row_count = 100  # Fallback value

    # Generate 5 unique pseudo-random integers from 1 to row_count
    random_indices = random.sample(range(1, row_count + 1), 5)

    return random_indices


# -----------------------------------------------------------------------


# Return the versusList for a given challenge ID
def get_random_versus(challenge_id):
    try:
        with get_session() as session:
            challenge = session.query(Challenge).filter_by(id=challenge_id).first()

            if challenge is None:
                return None

            return challenge.versuslist

    except Exception as error:
        print(f"Error: {error}")
        return "database error"


# -----------------------------------------------------------------------


# Update if a player has started a given challenge or not
def update_playbutton_status(challenge_id, user_id):
    try:
        with get_session() as session:
            challenge = session.query(Challenge).filter_by(id=challenge_id).first()

            if challenge is None:
                return

            # Depending on whether the user is the challenger or the challengee
            if user_id == challenge.challenger_id:
                challenge.playger_button_status = True
            elif user_id == challenge.challengee_id:
                challenge.playgee_button_status = True
            else:
                return

        return "success"

    except Exception as error:
        print(f"Error: {error}")
        return "database error"


# -----------------------------------------------------------------------


# Get the play button status for a given user in a given challenge
def get_playbutton_status(challenge_id, user_id):
    try:
        with get_session() as session:
            challenge = session.query(Challenge).filter_by(id=challenge_id).first()

            if challenge is None:
                print("Challenge not found.")
                return None

            # Depending on whether the user is the challenger or the challengee
            if user_id == challenge.challenger_id:
                return challenge.playger_button_status
            elif user_id == challenge.challengee_id:
                return challenge.playgee_button_status
            else:
                return None

    except Exception as error:
        print(f"Error: {error}")
        return "database error"


# -----------------------------------------------------------------------

# Testing
if __name__ == "__main__":
    print("Testing")
    print(create_challenge("123", "456"))
    print(create_challenge("abc", "def"))
    print(accept_challenge("1"))
    print(decline_challenge("2"))
    print(get_user_challenges("abc"))
    print(update_finish_status("1", "123"))
    print(check_finish_status("1"))
    print(get_challenge_participants("1"))
    print(get_challenge_results("1"))
    print(create_random_versus())
    print(get_random_versus("1"))
    print(update_playbutton_status("1", "123"))
    print(get_playbutton_status("1", "123"))
    print(clear_user_challenges("123"))
    print(clear_user_challenges("abc"))
    print(clear_challenges_table())
