# -----------------------------------------------------------------------
# user_database.py
# -----------------------------------------------------------------------

from sqlalchemy import func

from src.db import get_session
from src.models import User

# -----------------------------------------------------------------------

# Inserts username into users table.

# YUBI: update function to enable addition of displayName and year as well
def insert_player(username, display_name, year):
    try:
        with get_session() as session:
            # Check if username exists
            existing = session.query(User).filter_by(username=username).first()

            if existing is None:
                new_user = User(username=username, points=0, display_name=display_name, year=year)
                session.add(new_user)

        return "success"

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

# Resets username's total points to 0.


def reset_player_total_points(username):
    try:
        with get_session() as session:
            user = session.query(User).filter_by(username=username).first()

            if user is None:
                return

            user.points = 0

        return "success"

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

# Resets all players to 0 points.


def reset_all_players_total_points():
    try:
        with get_session() as session:
            session.query(User).update({User.points: 0})

        return "success"

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

# Updates username's total points with points.

def update_player(username, points):
    try:
        with get_session() as session:
            session.query(User).filter_by(username=username).update(
                {User.points: points}
            )

        return "success"

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

# Returns username's points.


def get_points(username):
    try:
        with get_session() as session:
            user = session.query(User).filter_by(username=username).first()

            if user is None:
                return 0

            return user.points

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

# Returns username's total rank among all players.


def get_rank(username):
    try:
        with get_session() as session:
            # Use window function to calculate rank
            ranked_query = session.query(
                User.username,
                User.points,
                func.dense_rank()
                .over(order_by=(User.points.desc(), User.username.asc()))
                .label("rank"),
            ).all()

            for player in ranked_query:
                if player.username == username:
                    return player.rank

            return "Player not found"

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

# Returns a dictionary of the usernames and points of the the top 10
# scoring players.


def get_top_players():
    try:
        with get_session() as session:
            top_players = []
            users = (
                session.query(User)
                .order_by(User.points.desc(), User.username.asc())
                .limit(10)
                .all()
            )
            # YUBI, ASK: does users return the whole row of information including display name and year?

            for user in users:
                # YUBI: add display name and year to player stats
                player_stats = {"Name": user.display_name + " (" + user.year + ")", "points": user.points}
                top_players.append(player_stats)

        return top_players

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

# Removes username from the users table.


def remove_from_user_table(username):
    try:
        with get_session() as session:
            session.query(User).filter_by(username=username).delete()

        return "success"

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

# Returns all players in users table.


def get_players():
    try:
        with get_session() as session:
            users = session.query(User.username).all()
            user_ids = [user.username for user in users]

        return user_ids

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

# Returns number one player's username and points


def get_top_player():
    try:
        with get_session() as session:
            user = (
                session.query(User)
                .order_by(User.points.desc(), User.username.asc())
                .limit(1)
                .first()
            )

            if user is None:
                return {"username": None, "points": 0}

            player_stats = {"username": user.username, "points": user.points}

        return player_stats

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

if __name__ == "__main__":
    print(get_top_players())
    print(get_top_player())
    print(get_players())
    print(insert_player("test"))
    print(update_player("test", 30000))
    print(get_points("test"))
    print(get_rank("test"))
    print(get_top_players())
    print(reset_player_total_points("test"))
    print(get_points("test"))
    print(get_rank("test"))
    print(remove_from_user_table("test"))
    print(get_players())
