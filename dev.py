# -----------------------------------------------------------------------
# runserver.py
# Runs Tiger Spot application
# -----------------------------------------------------------------------

import sys

import app


# Runs the server on port 5173
def main():
    try:
        app.app.run(host="0.0.0.0", port=5173, debug=True)
    except Exception as ex:
        print(ex, file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
