# -----------------------------------------------------------------------
# app.py
# Entry point for the application.
# Contains Flask App Routing
# -----------------------------------------------------------------------

# external libraries
import flask
from flask import Flask
import os
import dotenv
from sys import path


# Tiger Spot files
path.append("src")
from CAS import auth
from Databases import challenges_database
from Databases import matches_database
from Databases import versus_database
from Databases import pictures_database
from Databases import user_database
from Databases import daily_user_database
from Databases import user_database
import distance_func
import points

# -----------------------------------------------------------------------

dotenv.load_dotenv()
app = Flask(__name__, template_folder="./templates", static_folder="./static")
app.secret_key = os.environ["APP_SECRET_KEY"]

# -----------------------------------------------------------------------

# default value for id needed for daily reset
# id = 1

# -----------------------------------------------------------------------


# For error handling
# checks if a function call had a database error based on function's return value
def database_check(list):
    if "database error" in list:
        return False
    return True


# -----------------------------------------------------------------------


# Routes for authentication.
@app.route("/logoutapp", methods=["GET"])
def logoutapp():
    return auth.logoutapp()


@app.route("/logoutcas", methods=["GET"])
def logoutcas():
    return auth.logoutcas()


# -----------------------------------------------------------------------
# Displays page with log in button
@app.route("/", methods=["GET"])
@app.route("/index", methods=["GET"])
def index():

    html_code = flask.render_template("index.html")
    response = flask.make_response(html_code)
    return response


# -----------------------------------------------------------------------


# Home page after user logs in through Princeton's CAS
@app.route("/menu", methods=["GET"])
def menu():
    username = auth.authenticate()
    user_insert = user_database.insert_player(username)
    daily_insert = daily_user_database.insert_player_daily(username)
    played_date = daily_user_database.get_last_played_date(username)
    current_date = pictures_database.get_current_date()

    check = database_check([user_insert, daily_insert, played_date, current_date])
    if check is False:
        html_code = flask.render_template("contact_admin.html")
        return flask.make_response(html_code)

    if played_date != current_date:
        reset = daily_user_database.reset_player(username)
        user_played = daily_user_database.player_played(username)
        id = pictures_database.pic_of_day()
        check = database_check([reset, user_played, id])
        if check is False:
            html_code = flask.render_template("contact_admin.html")
            return flask.make_response(html_code)

    html_code = flask.render_template("menu.html", username=username)
    response = flask.make_response(html_code)
    return response


# -----------------------------------------------------------------------


# if there are no database errors, renders versus page listing a user's challenges. Otherwise, renders error page
@app.route("/requests", methods=["GET"])
def requests():
    username = flask.request.args.get("username")
    username_auth = auth.authenticate()
    last_date = daily_user_database.get_last_versus_date(username_auth)
    current_date = pictures_database.get_current_date()

    check = database_check([last_date, current_date])
    if check is False:
        html_code = flask.render_template("contact_admin.html")
        return flask.make_response(html_code)

    if last_date != current_date:
        clear = challenges_database.clear_user_challenges(username_auth)
        update = daily_user_database.update_player_versus(username_auth)
        check = database_check([clear, update])
        if check is False:
            html_code = flask.render_template("contact_admin.html")
            return flask.make_response(html_code)

    pending_challenges = challenges_database.get_user_challenges(username_auth)
    users = user_database.get_players()

    check = database_check([pending_challenges, users])
    if check is False:
        html_code = flask.render_template("contact_admin.html")
    else:
        html_code = flask.render_template(
            "Versus/challenges.html",
            challenges=pending_challenges,
            user=username_auth,
            users=flask.json.dumps(users),
            username=username,
        )

    response = flask.make_response(html_code)
    return response


# -----------------------------------------------------------------------


# if there are no errors, loads the daily game
# or if user has already played today's game, loads a page stating their points and distance between their guess and correct location
@app.route("/game", methods=["GET"])
def game():

    id = pictures_database.pic_of_day()

    username = auth.authenticate()

    user_played = daily_user_database.player_played(username)
    today_points = daily_user_database.get_daily_points(username)
    today_distance = daily_user_database.get_daily_distance(username)

    check = database_check([user_played, today_points, today_distance])
    if check is False:
        html_code = flask.render_template("contact_admin.html")
        return flask.make_response(html_code)

    if user_played:
        html_code = flask.render_template(
            "alrplayed.html",
            username=username,
            today_points=today_points,
            today_distance=today_distance,
        )
        response = flask.make_response(html_code)
        return response

    link = pictures_database.get_pic_info("link", id)

    check = database_check([link])
    if check is False:
        html_code = flask.render_template("contact_admin.html")
    else:
        html_code = flask.render_template("gamepage.html", link=link, id=id)

    response = flask.make_response(html_code)
    return response


# -----------------------------------------------------------------------


# if there are no errors with database, calculates distance and points and updates usersDaily table with points and adds today's points to total points column in users table
# Then loads the results page which displays the correct location, the distance from guess to acutal location, points earned, place where picture was taken
@app.route("/submit", methods=["POST"])
def submit():
    id = pictures_database.pic_of_day()
    username = auth.authenticate()

    user_played = daily_user_database.player_played(username)
    today_points = daily_user_database.get_daily_points(username)
    today_distance = daily_user_database.get_daily_distance(username)

    check = database_check([user_played, today_points, today_distance])
    if check is False:
        html_code = flask.render_template("contact_admin.html")
        return flask.make_response(html_code)

    if user_played:
        html_code = flask.render_template(
            "alrplayed.html",
            username=username,
            today_points=today_points,
            today_distance=today_distance,
        )
        response = flask.make_response(html_code)
        return response

    # get user input using flask.request.args.get('')
    # once user clicks submit then get coordinates
    currLat = flask.request.form.get("currLat")  # Use .get for safe retrieval
    currLon = flask.request.form.get("currLon")
    if not currLat or not currLon:
        return

    coor = pictures_database.get_pic_info("coordinates", id)
    place = pictures_database.get_pic_info("place", id)
    distance = distance_func.calc_distance(currLat, currLon, coor)
    today_points = points.calculate_today_points(distance)
    total_points = points.calculate_total_points(username, today_points)
    update = user_database.update_player(username, total_points)
    daily_update = daily_user_database.update_player_daily(
        username, today_points, distance
    )

    check = database_check([coor, place, update, daily_update])
    if check is False:
        html_code = flask.render_template("contact_admin.html")
    else:
        html_code = flask.render_template(
            "results.html",
            dis=distance,
            lat=currLat,
            lon=currLon,
            coor=coor,
            today_points=today_points,
            place=place,
            today_distance=distance,
        )

    response = flask.make_response(html_code)
    return response


# -----------------------------------------------------------------------


# Displays rules page for both daily game and versus mode
@app.route("/rules", methods=["GET"])
def rules():
    # user must be logged in to access page
    auth.authenticate()
    html_code = flask.render_template("rules.html")
    response = flask.make_response(html_code)
    return response


# -----------------------------------------------------------------------


# Congratulations page easter egg
@app.route("/congrats", methods=["GET"])
def congrats():
    username = auth.authenticate()
    top_player = user_database.get_top_player()

    check = database_check([top_player])
    if check is False:
        html_code = flask.render_template("contact_admin.html")
        return flask.make_response(html_code)

    top_player_username = top_player["username"]

    if (
        username == top_player_username
        or username == "sr4508"
        or username == "rdondero"
        or username == "mtouil"
        or username == "cl7359"
        or username == "fl9971"
        or username == "wn4759"
        or username == "jy3107"
        or username == "ed8205"
    ):
        html_code = flask.render_template("congrats.html")
    else:
        html_code = flask.render_template("secret.html")
    response = flask.make_response(html_code)
    return response


# -----------------------------------------------------------------------


# Displays about the team page
@app.route("/team", methods=["GET"])
def team():
    # user must be logged in to access page
    username = auth.authenticate()
    top_player = user_database.get_top_player()

    check = database_check([top_player])
    if check is False:
        html_code = flask.render_template("contact_admin.html")
        return flask.make_response(html_code)

    top_player_username = top_player["username"]

    html_code = flask.render_template(
        "team.html", username=username, top_player_username=top_player_username
    )
    response = flask.make_response(html_code)
    return response


# -----------------------------------------------------------------------


# Displays the leaderboard for overall points
@app.route("/totalboard", methods=["GET"])
def leaderboard():
    top_players = user_database.get_top_players()
    username = auth.authenticate()
    points = user_database.get_points(username)
    daily_points = daily_user_database.get_daily_points(username)
    rank = user_database.get_rank(username)
    daily_rank = daily_user_database.get_daily_rank(username)
    streak = daily_user_database.get_streak(username)

    check = database_check(
        [top_players, points, daily_points, rank, daily_rank, streak]
    )

    if check is False:
        html_code = flask.render_template("contact_admin.html")
    else:
        html_code = flask.render_template(
            "totalboard.html",
            top_players=top_players,
            points=points,
            daily_points=daily_points,
            rank=rank,
            daily_rank=daily_rank,
            streak=streak,
        )

    response = flask.make_response(html_code)
    return response


# -----------------------------------------------------------------------


# Displays the leaderboard for today's daily game points
@app.route("/leaderboard", methods=["GET"])
def totalleaderboard():
    top_players = daily_user_database.get_daily_top_players()
    username = auth.authenticate()
    points = user_database.get_points(username)
    daily_points = daily_user_database.get_daily_points(username)
    rank = user_database.get_rank(username)
    daily_rank = daily_user_database.get_daily_rank(username)
    streak = daily_user_database.get_streak(username)

    check = database_check(
        [top_players, points, daily_points, rank, daily_rank, streak]
    )
    if check is False:
        html_code = flask.render_template("contact_admin.html")
    else:
        html_code = flask.render_template(
            "leaderboard.html",
            top_players=top_players,
            points=points,
            daily_points=daily_points,
            rank=rank,
            daily_rank=daily_rank,
            streak=streak,
        )

    response = flask.make_response(html_code)
    return response


# -----------------------------------------------------------------------


# checks that users table is not corrupted and then displays the versus page where users can initiate and see challenges
@app.route("/versus", methods=["GET"])
def versus_func():
    users = user_database.get_players()
    username = flask.request.args.get("username")

    check = database_check([users])
    if check is False:
        html_code = flask.render_template("contact_admin.html")
    else:
        html_code = flask.render_template(
            "Versus/challenges.html", users=flask.json.dumps(users), username=username
        )

    response = flask.make_response(html_code)
    return response


# -----------------------------------------------------------------------


# checks that user table is not corrupted and that opponent enters is a valid user (exisiting netiID and has logged in before)
@app.route("/create-challenge", methods=["POST"])
def create_challenge_route():
    challengee_id = flask.request.form["challengee_id"].strip()  # Trim whitespace
    users = user_database.get_players()

    check = database_check([users])
    if check is False:
        html_code = flask.render_template("contact_admin.html")
        return flask.make_response(html_code)

    # Ensure challengee_id is not empty and exists in the users list
    if (
        challengee_id == None
        or challengee_id not in users
        or challengee_id == auth.authenticate()
    ):
        response = {
            "status": "error",
            "message": "Invalid Opponent NetID -- Must enter a valid NetID and Opponent must have logged into Tiger Spot before",
        }
        return flask.jsonify(response), 400  # Including a 400 Bad Request status code
    else:
        result = challenges_database.create_challenge(
            auth.authenticate(), challengee_id
        )

    check = database_check([result])
    if check is False:
        html_code = flask.render_template("contact_admin.html")
        return flask.make_response(html_code)

    # Handle the response from the database function
    if "error" in result:
        return flask.jsonify({"status": "error", "message": result["error"]}), 400
    else:
        return (
            flask.jsonify(
                {
                    "status": "success",
                    "message": result["success"],
                    "challenge_id": result["challenge_id"],
                }
            ),
            200,
        )


# -----------------------------------------------------------------------


# Accepts challenge unless there is a database error
@app.route("/accept_challenge", methods=["POST"])
def accept_challenge_route():
    challenge_id = flask.request.form.get("challenge_id")
    result = challenges_database.accept_challenge(
        challenge_id
    )  # Returns whether or not challenge acceptance was successful

    check = database_check([result])
    if check is False:
        html_code = flask.render_template("contact_admin.html")
        return flask.make_response(html_code)

    if result == "accepted":
        flask.flash("Challenge accepted successfully.")
    else:
        flask.flash("Error accepting challenge.")
    return flask.redirect(
        flask.url_for("requests")
    )  # Redirects back to the versus page with the tables of user's challenges


# -----------------------------------------------------------------------


# Declines challenge unless there is a database error
@app.route("/decline_challenge", methods=["POST"])
def decline_challenge_route():
    challenge_id = flask.request.form.get("challenge_id")
    result = challenges_database.decline_challenge(challenge_id)

    check = database_check([result])
    if check is False:
        html_code = flask.render_template("contact_admin.html")
        return flask.make_response(html_code)

    if result == "declined":
        flask.flash("Challenge declined successfully.")
    else:
        flask.flash("Error declining challenge.")
    return flask.redirect(flask.url_for("requests"))


# -----------------------------------------------------------------------


# updates if a given user has started a given challenge or not
# and redirects accordingly if forfeitting is necessary
@app.route("/play_button", methods=["POST"])
def play_button():
    challenge_id = flask.request.form.get("challenge_id")
    user = auth.authenticate()
    status = challenges_database.get_playbutton_status(challenge_id, user)
    check = database_check([status])
    if check is False:
        html_code = flask.render_template("contact_admin.html")
        return flask.make_response(html_code)
    if status is None:
        return flask.redirect(flask.url_for("requests"))
    elif status is False:
        button = challenges_database.update_playbutton_status(challenge_id, user)
        check = database_check([button])
        if check is False:
            html_code = flask.render_template("contact_admin.html")
            return flask.make_response(html_code)
        flask.session["challenge_id"] = challenge_id
        return flask.redirect(flask.url_for("play_button2"))
    elif status is True:
        for i in range(5):
            pic = versus_database.update_versus_pic_status(challenge_id, user, i + 1)
            check = database_check([pic])
            if check is False:
                html_code = flask.render_template("contact_admin.html")
                return flask.make_response(html_code)
        update = challenges_database.update_finish_status(challenge_id, user)
        status = challenges_database.check_finish_status(challenge_id)
        check = database_check([update, status])
        if check is False:
            html_code = flask.render_template("contact_admin.html")
            return flask.make_response(html_code)
        if status["status"] == "finished":
            result = challenges_database.get_challenge_results(challenge_id)
            complete = matches_database.complete_match(
                challenge_id,
                result["winner"],
                result["challenger_points"],
                result["challengee_points"],
            )
            check = database_check([status, complete])
            if check is False:
                html_code = flask.render_template("contact_admin.html")
                return flask.make_response(html_code)
            return flask.redirect(flask.url_for("requests"))
        else:
            return flask.redirect(flask.url_for("requests"))


# -----------------------------------------------------------------------


# Handles first game page of versus mode
@app.route("/play_button2", methods=["GET"])
def play_button2():
    return next_challenge()


# -----------------------------------------------------------------------


# Handles all the game pages of versus mode
@app.route("/next_challenge", methods=["POST"])
def next_challenge():
    challenge_id = flask.session.get("challenge_id")
    index = flask.request.form.get("index")
    if index is None:
        index = 0
    return start_challenge(challenge_id, index)


# -----------------------------------------------------------------------


# Handles game page functionality of versus mode
@app.route("/start_challenge", methods=["GET", "POST"])
def start_challenge(challenge_id=None, index=None):
    versusList = challenges_database.get_random_versus(challenge_id)
    check = database_check([versusList])
    if check is False:
        html_code = flask.render_template("contact_admin.html")
        return flask.make_response(html_code)
    if versusList is None:
        return flask.redirect(flask.url_for("requests"))
    index = int(index)
    if index < len(versusList):
        link = pictures_database.get_pic_info("link", versusList[index])
        check = database_check([link])
        if check is False:
            html_code = flask.render_template("contact_admin.html")
            return flask.make_response(html_code)
        html_code = flask.render_template(
            "Versus/versusgame.html", challenge_id=challenge_id, index=index, link=link
        )

        return flask.make_response(html_code)
    else:
        return flask.redirect(flask.url_for("requests"))


# -----------------------------------------------------------------------


# Handles ending the game of versus mode and updating tables
@app.route("/end_challenge", methods=["POST"])
def end_challenge():
    challenge_id = flask.request.form.get("challenge_id")
    user = auth.authenticate()
    finish = challenges_database.update_finish_status(challenge_id, user)
    check = database_check([finish])
    if check is False:
        html_code = flask.render_template("contact_admin.html")
        return flask.make_response(html_code)
    if finish is None:
        return flask.redirect(flask.url_for("requests"))
    status = challenges_database.check_finish_status(challenge_id)
    check = database_check([status])
    if check is False:
        html_code = flask.render_template("contact_admin.html")
        return flask.make_response(html_code)
    if status["status"] == "finished":
        result = challenges_database.get_challenge_results(challenge_id)
        complete = matches_database.complete_match(
            challenge_id,
            result["winner"],
            result["challenger_points"],
            result["challengee_points"],
        )
        check = database_check([result, complete])
        if check is False:
            html_code = flask.render_template("contact_admin.html")
            return flask.make_response(html_code)
        return flask.redirect(flask.url_for("requests"))
    else:
        return flask.redirect(flask.url_for("requests"))


# -----------------------------------------------------------------------


# Handles the submission of a versus mode game, updating tables accordingly
@app.route("/submit2", methods=["POST"])
def submit2():
    currLat = flask.request.form.get("currLat")
    currLon = flask.request.form.get("currLon")
    points = 0
    index = int(flask.request.form.get("index"))
    challenge_id = flask.request.form.get("challenge_id")
    versusList = challenges_database.get_random_versus(challenge_id)
    coor = pictures_database.get_pic_info("coordinates", versusList[index])
    place = pictures_database.get_pic_info("place", versusList[index])
    check = database_check([versusList, coor, place])
    if check is False:
        html_code = flask.render_template("contact_admin.html")
        return flask.make_response(html_code)
    if not currLat or not currLon:
        pic_status = versus_database.get_versus_pic_status(
            challenge_id, auth.authenticate(), index + 1
        )
        check = database_check([pic_status])
        if check is False:
            html_code = flask.render_template("contact_admin.html")
            return flask.make_response(html_code)
        if pic_status is None:
            return flask.redirect(flask.url_for("requests"))
        if pic_status is False:
            fin1 = versus_database.update_versus_pic_status(
                challenge_id, auth.authenticate(), index + 1
            )
            if fin1 is None:
                return flask.redirect(flask.url_for("requests"))
            fin2 = versus_database.store_versus_pic_points(
                challenge_id, auth.authenticate(), index + 1, points
            )
            if fin2 is None:
                return flask.redirect(flask.url_for("requests"))
            fin3 = versus_database.update_versus_points(
                challenge_id, auth.authenticate(), points
            )
            if fin3 is None:
                return flask.redirect(flask.url_for("requests"))
            check = database_check([fin1, fin2, fin3])
            if check is False:
                html_code = flask.render_template("contact_admin.html")
                return flask.make_response(html_code)
        else:
            points = "Already submitted."
        index = int(index) + 1
        html_code = flask.render_template(
            "Versus/versusresults.html",
            dis="No Submission",
            lat=None,
            lon=None,
            coor=coor,
            index=index,
            challenge_id=challenge_id,
            points=str(points),
            place=place,
        )
        response = flask.make_response(html_code)
        return response

    time = int(flask.request.form.get("time"))
    if versusList is None:
        return flask.redirect(flask.url_for("requests"))
    distance = round(distance_func.calc_distance(currLat, currLon, coor))
    pic_status = versus_database.get_versus_pic_status(
        challenge_id, auth.authenticate(), index + 1
    )
    check = database_check([pic_status])
    if check is False:
        html_code = flask.render_template("contact_admin.html")
        return flask.make_response(html_code)
    if pic_status is None:
        return flask.redirect(flask.url_for("requests"))
    if pic_status is False:
        points = round(versus_database.calculate_versus(distance, time))
        fin1 = versus_database.store_versus_pic_points(
            challenge_id, auth.authenticate(), index + 1, points
        )
        if fin1 is None:
            return flask.redirect(flask.url_for("requests"))
        fin2 = versus_database.update_versus_points(
            challenge_id, auth.authenticate(), points
        )
        if fin2 is None:
            return flask.redirect(flask.url_for("requests"))
        fin3 = versus_database.update_versus_pic_status(
            challenge_id, auth.authenticate(), index + 1
        )
        if fin3 is None:
            return flask.redirect(flask.url_for("requests"))
        check = database_check([fin1, fin2, fin3])
        if check is False:
            html_code = flask.render_template("contact_admin.html")
            return flask.make_response(html_code)
    else:
        points = "Already submitted."
    index = int(index) + 1
    html_code = flask.render_template(
        "Versus/versusresults.html",
        dis=distance,
        lat=currLat,
        lon=currLon,
        coor=coor,
        index=index,
        challenge_id=challenge_id,
        points=str(points),
        place=place,
    )
    response = flask.make_response(html_code)
    return response


# -----------------------------------------------------------------------


# Displays the results of a versus mode game
@app.route("/versus_stats", methods=["POST"])
def versus_stats():
    challenge_id = flask.request.form.get("challenge_id")
    results = challenges_database.get_challenge_results(challenge_id)
    versusList = challenges_database.get_random_versus(challenge_id)
    pictures = [pictures_database.get_pic_info("link", pic) for pic in versusList]

    check = database_check([results, versusList, pictures])
    if check is False:
        html_code = flask.render_template("contact_admin.html")
    else:
        html_code = flask.render_template(
            "Versus/versus_stats.html", results=results, images=pictures
        )

    response = flask.make_response(html_code)
    return response


if __name__ == "__main__":
    app.run(host="localhost", port=3000)
