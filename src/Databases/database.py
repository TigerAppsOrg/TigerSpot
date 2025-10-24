# -----------------------------------------------------------------------
# database.py
# This file is for general actions with tables
# Tables in Tiger Spot: pictures, users, usersDaily, challenges, matches
# -----------------------------------------------------------------------

from sqlalchemy import func

from src.db import get_session
from src.models import Challenge, Match, Picture, User, UserDaily

# -----------------------------------------------------------------------


# returns all the values from a specified column in a table in the form of an array of tuples
def query(column, table):
    try:
        # Map table names to models
        model_map = {
            "users": User,
            "usersdaily": UserDaily,
            "pictures": Picture,
            "challenges": Challenge,
            "matches": Match,
        }

        model = model_map.get(table.lower())

        if model is None:
            print(f"Unknown table: {table}")
            return "database error"

        with get_session() as session:
            if column == "*":
                # Return all columns
                rows = session.query(model).all()
                return [(row,) for row in rows]
            else:
                # Return specific column
                rows = session.query(getattr(model, column)).all()
                return rows

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------


# Returns the number of rows in a table
def get_table_size(table):
    try:
        # Map table names to models
        model_map = {
            "users": User,
            "usersdaily": UserDaily,
            "pictures": Picture,
            "challenges": Challenge,
            "matches": Match,
        }

        model = model_map.get(table.lower())

        if model is None:
            print(f"Unknown table: {table}")
            return "database error"

        with get_session() as session:
            count = session.query(func.count()).select_from(model).scalar()
            print(f"Returning number of rows in table '{table}'")
            return count

    except Exception as error:
        print(error)
        return "database error"


# -----------------------------------------------------------------------


# prints out all rows in the users, usersDaily, pictures, challenges, and matches tables
def show_rows():
    print(
        "Showing all rows in users, usersDaily, pictures, challenges, and matches tables"
    )
    print()
    print("USERS TABLE")
    print(query("*", "users"))
    print()
    print("DAILY USERS TABLE")
    print(query("*", "usersDaily"))
    print()
    print("PICTURES TABLE")
    print(query("*", "pictures"))
    print()
    print("CHALLENGES TABLE")
    print(query("*", "challenges"))
    print()
    print("MATCHES TABLE")
    print(query("*", "matches"))
    print()


# -----------------------------------------------------------------------
# tests the above functions that do not commit changes to the tables
def testing():
    print("-----Testing query()-----")
    print(query("pictureid", "pictures"))
    print(query("place", "pictures"))
    print()
    print("-----Testing get_table_size()-----")
    print(get_table_size("pictures"))
    print(get_table_size("users"))
    print(get_table_size("usersDaily"))
    print(get_table_size("challenges"))
    print(get_table_size("matches"))
    print()
    print("-----Testing show_rows()-----")
    show_rows()


# -----------------------------------------------------------------------


def main():
    print()
    testing()


# -----------------------------------------------------------------------

if __name__ == "__main__":
    main()
