# fix_challenges.py
import sys
import os
from sqlalchemy import text

# Ensure we can import from src
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

from src.db import get_session
from src.models import Challenge
from src.Databases.challenges_database import create_random_versus

def fix_broken_challenges():
    print("Starting database repair...")
    
    fixed_count = 0
    
    try:
        with get_session() as session:
            # 1. Find challenges with the default '0' array or empty arrays
            # checking if the array sums to 0 is a quick way to catch [0,0,0,0,0]
            challenges = session.query(Challenge).all()
            
            for challenge in challenges:
                # Check if versuslist is None, empty, or contains 0 (which indicates a bad ID)
                if not challenge.versuslist or 0 in challenge.versuslist:
                    print(f"Fixing Challenge ID {challenge.id} (Current list: {challenge.versuslist})")
                    
                    # Generate new valid list using the injected session
                    new_list = create_random_versus(session)
                    
                    # Update the challenge
                    challenge.versuslist = new_list
                    
                    # Force SQLAlchemy to recognize the change (arrays are mutable)
                    from sqlalchemy.orm.attributes import flag_modified
                    flag_modified(challenge, "versuslist")
                    
                    fixed_count += 1
            
            # Commit is handled automatically by get_session context manager 
            # if no exception occurs, but explicit commit doesn't hurt here.
            session.commit()
            
            print("-" * 30)
            print(f"Repair complete. Fixed {fixed_count} challenges.")
            
    except Exception as e:
        print(f"An error occurred during repair: {e}")

if __name__ == "__main__":
    fix_broken_challenges()