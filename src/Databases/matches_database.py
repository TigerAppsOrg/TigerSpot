# -----------------------------------------------------------------------
# matches_database.py
# -----------------------------------------------------------------------

from src.db import get_session
from src.models import Challenge, Match


# -----------------------------------------------------------------------
# Clear the matches table
def clear_matches_table():
    try:
        with get_session() as session:
            session.query(Match).delete()

        return "success"

    except Exception as error:
        print(f"Error clearing matches table: {error}")
        return "database error"


# -----------------------------------------------------------------------


# Complete a match
def complete_match(challenge_id, winner_id, challenger_score, challengee_score):
    try:
        with get_session() as session:
            # Update challenge status
            session.query(Challenge).filter_by(id=challenge_id).update(
                {Challenge.status: "completed"}
            )

            # Create match record
            new_match = Match(
                challenge_id=challenge_id,
                winner_id=winner_id,
                challenger_score=challenger_score,
                challengee_score=challengee_score,
            )
            session.add(new_match)

        return "success"

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

# Testing
if __name__ == "__main__":
    print("Testing")
    complete_match("1", "123", 1000, 500)
    clear_matches_table()
