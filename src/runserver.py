# -----------------------------------------------------------------------
# runserver.py
# Runs Tiger Spot application
# -----------------------------------------------------------------------
import sys
import admin


# Runs the server on port 4000
def main():
    try:
        admin.app.run(host="0.0.0.0", port=4000, debug=True)
    except Exception as ex:
        print(ex, file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
