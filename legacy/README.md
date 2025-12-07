<div align = "center">
<h1>
  <a href= "https://tigerspot.tigerapps.org">Tiger Spot</a>
</h1>
<p align="center">
  <img src="static/styles/logo.png" alt="Tiger Spot Logo"/>
</p>

TigerSpot is an interactive geographical guessing web app. Users will be able to log in to their account, receive a daily photo of a place on campus, and place their guess of where they think it is on the map. After submitting a guess, the location will be revealed and their score will be determined based on how far their guess was to the correct location. Users can only play this mode once a day.
However, users can also play the Versus mode where users can compete one on one with their friends with five rounds per game. This is a great way for students to learn about new places on campus and interact more with the Princeton community!

</div>

## Getting Started

Ensure that you have the following installed on your machine:

- Python 3.10 or higher
- [Docker](https://www.docker.com/products/docker-desktop/)

Set up a virtual environment and install the required packages using `uv`:

```bash
# Install uv if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Sync dependencies and create virtual environment
uv sync

# Activate the virtual environment (optional - uv run works without activation)
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

Alternatively, run commands directly without activating:

```bash
uv run python your_script.py
```

Ensure that environment variables are set in accordance with the `.env.example` file. You can create a `.env` file in the root directory and set the environment variables there. **IMPORTANT**: Do not commit the `.env` file to the repository and do not place actual secrets in the `.env.example` file.

### Database Setup

To set up the local PostgreSQL database using Docker, run `docker-compose up -d` in the root directory. The connection string in `.env.example` for DATABASE_URL is already configured to connect to the Docker container.

Set up the database schema using Alembic migrations:

```bash
# Run database migrations
alembic upgrade head

# Seed the database with pictures from Cloudinary
python seed_pictures.py
```

To stop the database container, run `docker-compose down`. If you want to completely clear and reset the database, you can run `docker-compose down -v`. To view logs, use `docker-compose logs -f`.

**Note**: The project now uses SQLAlchemy with Alembic for database migrations. To create a new migration after modifying models, run:

```bash
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

### Development Server

Run the development server with `python3 dev.py`. You can access the web app at `http://localhost:5173`.

## License

This project is licensed under the BSD 3-Clause License - see the [LICENSE](LICENSE) file for details.
