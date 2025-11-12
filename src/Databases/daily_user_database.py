# -----------------------------------------------------------------------
# daily_user_database.py
# -----------------------------------------------------------------------

from sqlalchemy import func, text

from src.db import get_session
from src.models import UserDaily

# -----------------------------------------------------------------------

# Inserts username into usersDaily table.


def insert_player_daily(username):
    try:
        with get_session() as session:
            session.execute(text("SET TIME ZONE 'America/New_York'"))
            existing = session.query(UserDaily).filter_by(username=username).first()

            if existing is None:
                new_user = UserDaily(
                    username=username,
                    points=0,
                    distance=0,
                    played=False,
                    first_played=func.current_date(),
                    last_played=None,
                    last_versus=None,
                    current_streak=0,
                )
                session.add(new_user)

        return "success"

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

# Updates username's daily stats with new points and distance.
# Updates that username has played at current date and updates streaks.


def update_player_daily(username, points, distance):
    try:
        with get_session() as session:
            # Set timezone
            session.execute(text("SET TIME ZONE 'America/New_York'"))

            user = session.query(UserDaily).filter_by(username=username).first()

            if user is None:
                return "database error"

            # Calculate new streak and record first play date when needed
            if user.last_played is None:
                new_streak = 1
            elif user.last_played == func.date(
                func.current_date() - text("INTERVAL '1 day'")
            ):
                new_streak = user.current_streak + 1
            else:
                new_streak = 1

            user.points = points
            user.distance = distance
            user.played = True
            user.current_streak = new_streak
            user.last_played = func.current_date()

        return "success"

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

# Updates username's last_versus to current date.


def update_player_versus(username):
    try:
        with get_session() as session:
            session.execute(text("SET TIME ZONE 'America/New_York'"))

            user = session.query(UserDaily).filter_by(username=username).first()

            if user:
                user.last_versus = func.current_date()

        return "success"

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

# Returns whether username has played for the day or not.


def player_played(username):
    try:
        with get_session() as session:
            user = session.query(UserDaily).filter_by(username=username).first()

            if user is None:
                return False

            return user.played

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

# Resets the user's daily points, distance, and if they have played.


def reset_player(username):
    try:
        with get_session() as session:
            session.query(UserDaily).filter_by(username=username).update(
                {
                    UserDaily.played: False,
                    UserDaily.points: 0,
                    UserDaily.distance: 0,
                }
            )

        return "success"

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

# Resets all players' daily points, distance, and if they have played.


def reset_players():
    try:
        with get_session() as session:
            session.query(UserDaily).update(
                {
                    UserDaily.played: False,
                    UserDaily.points: 0,
                    UserDaily.distance: 0,
                    UserDaily.last_played: None,
                    UserDaily.current_streak: 0,
                }
            )

        return "success"

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

# Returns the date when the username last played.


def get_last_played_date(username):
    try:
        with get_session() as session:
            user = session.query(UserDaily).filter_by(username=username).first()

            if user is None or user.last_played is None:
                return 0

            return user.last_played

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

# Returns the date when the username last used the versus mode.


def get_last_versus_date(username):
    try:
        with get_session() as session:
            user = session.query(UserDaily).filter_by(username=username).first()

            if user is None or user.last_versus is None:
                return 0

            return user.last_versus

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

# Returns username's streak.


def get_streak(username):
    try:
        with get_session() as session:
            user = session.query(UserDaily).filter_by(username=username).first()

            if user is None:
                return 0

            return user.current_streak

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

# Returns username's daily points.


def get_daily_points(username):
    try:
        with get_session() as session:
            user = session.query(UserDaily).filter_by(username=username).first()

            if user is None:
                return 0

            return user.points

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

# Returns username's guess distance.


def get_daily_distance(username):
    try:
        with get_session() as session:
            user = session.query(UserDaily).filter_by(username=username).first()

            if user is None:
                return 0

            return user.distance

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

# Returns a dictionary of the usernames and points of the the top 10
# scoring players for the day.


def get_daily_top_players():
    try:
        with get_session() as session:
            daily_top_players = []
            session.execute(text("SET TIME ZONE 'America/New_York'"))

            users = (
                session.query(UserDaily)
                .filter(UserDaily.last_played == func.current_date())
                .order_by(UserDaily.points.desc(), UserDaily.username.asc())
                .limit(10)
                .all()
            )

            for user in users:
                player_stats = {"username": user.username, "points": user.points}
                daily_top_players.append(player_stats)

        return daily_top_players

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

# Returns username's daily rank among all players who played for the day.


def get_daily_rank(username):
    try:
        with get_session() as session:
            session.execute(text("SET TIME ZONE 'America/New_York'"))

            ranked_query = (
                session.query(
                    UserDaily.username,
                    UserDaily.points,
                    func.dense_rank()
                    .over(order_by=(UserDaily.points.desc(), UserDaily.username.asc()))
                    .label("rank"),
                )
                .filter(UserDaily.last_played == func.current_date())
                .all()
            )

            for player in ranked_query:
                if player.username == username:
                    return player.rank

            return "Play Today's Game!"

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

# Removes username from the usersDaily table.


def remove_daily_user(username):
    try:
        with get_session() as session:
            session.query(UserDaily).filter_by(username=username).delete()

        return "success"

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------

if __name__ == "__main__":
    print("test")
    print(get_daily_top_players())
    print(insert_player_daily("test"))
    print(update_player_daily("test", 1000, 3))
    print(update_player_versus("test"))
    print(get_daily_distance("test"))
    print(get_daily_points("test"))
    print(get_daily_rank("test"))
    print(get_last_played_date("test"))
    print(get_last_versus_date("test"))
    print(get_streak("test"))
    print(get_daily_top_players())
    print(reset_player("test"))
    print(get_daily_points("test"))
    print(get_daily_rank("test"))
    print(get_last_played_date("test"))
    print(get_daily_top_players())
    print(remove_daily_user("test"))
    print(get_daily_top_players())
    reset_player("cl7359")
