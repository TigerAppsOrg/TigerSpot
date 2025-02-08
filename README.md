<div align = "center">
<h1>
  <a href= "https://tigerspot.tigerapps.org">Tiger Spot</a>
</h1>
<p align="center">
  <img src="https://github.com/TigerAppsOrg/TigerSpot/assets/68723604/dbbc795f-0607-400b-9ffb-ba446cdcbeb5" alt="Tiger Spot Logo"/>
</p>

TigerSpot is an interactive geographical guessing web app. Users will be able to log in to their account, receive a daily photo of a place on campus, and place their guess of where they think it is on the map. After submitting a guess, the location will be revealed and their score will be determined based on how far their guess was to the correct location. Users can only play this mode once a day.
However, users can also play the Versus mode where users can compete one on one with their friends with five rounds per game. This is a great way for students to learn about new places on campus and interact more with the Princeton community!

</div>

## Getting Started

Set up a virtual environment and install the required packages by running the following commands:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Ensure that environment variables are set in accordance with the `.env.example` file. You can create a `.env` file in the root directory and set the environment variables there. **IMPORTANT**: Do not commit the `.env` file to the repository and do not place actual secrets in the `.env.example` file.

Set up the database schema by running `python3 init_database.py`.

Run the development server with `python3 dev.py`. You can access the web app at `http://localhost:5173`.

## License

This project is licensed under the BSD 3-Clause License - see the [LICENSE](LICENSE) file for details.
