# -----------------------------------------------------------------------
# auth.py
# -----------------------------------------------------------------------

import urllib.request
import urllib.parse
import re
import flask

# -----------------------------------------------------------------------

_CAS_URL = "https://fed.princeton.edu/cas/"

# -----------------------------------------------------------------------

# Return url after stripping out the "ticket" parameter that was
# added by the CAS server.


def strip_ticket(url):
    if url is None:
        return "something is badly wrong"
    url = re.sub(r"ticket=[^&]*&?", "", url)
    url = re.sub(r"\?&?$|&$", "", url)
    return url


# -----------------------------------------------------------------------

# Validate a login ticket by contacting the CAS server. If
# valid, return the user's username; otherwise, return None.


def validate(ticket):
    
    # YUBI: updated using v3
    val_url = (
        _CAS_URL
        + "p3/serviceValidate"
        + "?service="
        + urllib.parse.quote(strip_ticket(flask.request.url))
        + "&ticket="
        + urllib.parse.quote(ticket)
        + "&format=json"
    )

    with urllib.request.urlopen(val_url) as response:
        data = json.load(response)

    # Check if authentication was successful
    service_response = data.get("serviceResponse", {})
    auth_success = service_response.get("authenticationSuccess")
    if not auth_success:
        return None

    username = auth_success.get("user", "").strip()
    attributes = auth_success.get("attributes", {})
    
    # Extract displayName
    display_name = ""
    if "displayName" in attributes:
        # Could be a list
        if isinstance(attributes["displayName"], list):
            display_name = attributes["displayName"][0]
        else:
            display_name = attributes["displayName"]
            
    # Extract class year from grouperGroups
    year = "Graduate"
    grouper_groups = attributes.get("grouperGroups", [])
    if isinstance(grouper_groups, list):
        for g in grouper_groups:
            if "PU:basis:classyear:" in g:
                year = g.split(":")[-1]
                break
            
    return {
        "username": username,
        "displayName": display_name or username,
        "year": year
    }


# -----------------------------------------------------------------------

# Authenticate the remote user, and return the user's username.
# Do not return unless the user is successfully authenticated.


def authenticate():
    # If already authenticated, return cached info
    if "user_info" in flask.session:
        return flask.session.get("user_info")

    # If no ticket, redirect to CAS login
    ticket = flask.request.args.get("ticket")
    if ticket is None:
        login_url = _CAS_URL + "login?service=" + urllib.parse.quote(flask.request.url)
        flask.abort(flask.redirect(login_url))

    # Validate ticket
    user_info = validate(ticket)
    if user_info is None:
        login_url = (
            _CAS_URL + "login?service=" + urllib.parse.quote(strip_ticket(flask.request.url))
        )
        flask.abort(flask.redirect(login_url))

    # Store in session
    flask.session["user_info"] = user_info
    return user_info


# -----------------------------------------------------------------------


def logoutapp():

    # Log out of the application.
    flask.session.clear()
    html_code = flask.render_template("index.html")
    response = flask.make_response(html_code)
    return response


# -----------------------------------------------------------------------


def logoutcas():

    # YUBI: ASK, does this correctly logout of cas?
    # Log out of the CAS session, and then the application.
    logout_url = (
        _CAS_URL
        + "logout?service="
        + urllib.parse.quote(re.sub("logoutcas", "logoutapp", flask.request.url))
    )
    flask.abort(flask.redirect(logout_url))
