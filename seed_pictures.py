#!/usr/bin/env python3
# -----------------------------------------------------------------------
# seed_pictures.py
# Seed the pictures table with images from Cloudinary
# -----------------------------------------------------------------------

from dotenv import load_dotenv
import cloudinary
import cloudinary.api
from src import cloud
from src.models import Picture
from src.db import get_session
import os

load_dotenv()
cloud_name = os.environ["CLOUDINARY_CLOUD_NAME"]
api_key = os.environ["CLOUDINARY_API_KEY"]
api_secret = os.environ["CLOUDINARY_API_SECRET"]


def seed_pictures():
    """
    Load pictures from Cloudinary and populate the pictures table.
    """
    try:
        # Configure and connect to cloudinary account
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
        )

        # Name of folder to extract resources from
        folder_name = "TigerSpot/Checked"

        print(f"Fetching images from Cloudinary folder: {folder_name}")

        # Extract all resources from folder
        resources = cloudinary.api.resources(
            type="upload", prefix=folder_name, max_results=500, context=True
        )

        pictureID = 0
        added_count = 0
        skipped_count = 0

        with get_session() as session:
            # Loop through folder and retrieve image url, coordinates, place, and set pictureid per resource
            for resource in resources.get("resources", []):
                link, latitude, longitude, place = cloud.image_data(resource)
                coordinates = [latitude, longitude]

                # Check if picture already exists
                existing = (
                    session.query(Picture).filter_by(link=link).first()
                )

                if not existing:
                    pictureID += 1
                    new_picture = Picture(
                        pictureid=pictureID,
                        coordinates=coordinates,
                        link=link,
                        place=place,
                    )
                    session.add(new_picture)
                    added_count += 1
                    print(f"  Added: {place} (ID: {pictureID})")
                else:
                    skipped_count += 1
                    print(f"  Skipped (already exists): {place}")

        print(f"\nSeed complete!")
        print(f"  Pictures added: {added_count}")
        print(f"  Pictures skipped: {skipped_count}")
        print(f"  Total pictures: {added_count + skipped_count}")

        return "success"

    except Exception as error:
        print(f"Error seeding pictures: {error}")
        return "database error"


if __name__ == "__main__":
    print("=" * 60)
    print("TigerSpot Picture Seeder")
    print("=" * 60)
    print()
    result = seed_pictures()
    print()
    if result == "success":
        print("✓ Seeding completed successfully!")
    else:
        print("✗ Seeding failed. See error above.")
