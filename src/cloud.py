# -----------------------------------------------------------------------
# cloud.py
# -----------------------------------------------------------------------

import cloudinary.api
from dotenv import load_dotenv
import os

load_dotenv()
cloud_name = os.environ["CLOUDINARY_CLOUD_NAME"]
api_key = os.environ["CLOUDINARY_API_KEY"]
api_secret = os.environ["CLOUDINARY_API_SECRET"]


# -----------------------------------------------------------------------


# extracts the url, latitude, longitude, and place metadata from
# each image in the cloudinary folder
def image_data(resource):
    url = resource["url"]
    custom_metadata = resource.get("context", {}).get("custom", {})
    latitude = float(custom_metadata.get("Latitude"))
    longitude = float(custom_metadata.get("Longitude"))
    place = custom_metadata.get("Place")
    return url, latitude, longitude, place


# -----------------------------------------------------------------------


def main():
    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
    )

    # name of folder to extract resources from
    folder_name = "TigerSpot/Checked"

    # extracts all resources from folder
    resources = cloudinary.api.resources(
        type="upload", prefix=folder_name, max_results=500, context=True
    )

    # extracts and writes all image data to picturedata.txt
    with open("picturedata.txt", "w") as f:
        for resource in resources.get("resources", []):
            url, latitude, longitude, place = image_data(resource)
            f.write(f"{place}\n")
            f.write(f"{latitude}, {longitude}\n")
            f.write(url + "\n\n")

    print("TigerSpot's image data saved to picturedata.txt")


# -----------------------------------------------------------------------

if __name__ == "__main__":
    main()
