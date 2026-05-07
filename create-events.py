import argparse
import os
import sys
from datetime import datetime, date, time, timedelta
import uuid
import requests
import certifi
import random
import json

SUPABASE_URL = "https://jpicbqssqixagnwejefu.supabase.co"
SUPABASE_KEY = "sb_publishable_2N5OfZFZNISlfbjVUwL8KQ_AR45LsK_"
EVENTS_FILE = os.path.expandvars("$PROJECT_ROOT_FOLDER\\testevents.json")
ROLES = [
    "Non-Officiel",
    "Officiel",
    "Admin",
]
CATEGORIES = [
    "Concert et club",
    "Spectacle vivant",
    "Projection",
    "Art visuel",
    "Autres"
]
PARENTAL_GUIDE = [
    "Tout public",
    "Pour les enfants",
    "Déconseillé aux enfants"
]
TEST_TAGS = [
    "rock",
    "festival",
    "enfant",
    "cirque",
    "jazz",
    "theatre",
    "electro",
    "clown",
    "accoustique",
]

class BytesDumpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, bytes):
            return obj.decode()
        return json.JSONEncoder.default(self, obj)


class BytesDumpDecoder(json.JSONDecoder):
    def default(self, obj):
        if isinstance(obj, bytes):
            return obj.decode()
        return json.JSONDecoder.decode(self, obj)
    

def write_event_file(events: list):
    data = json.dumps(events, indent=4, ensure_ascii=False, cls=BytesDumpEncoder)
    with open(EVENTS_FILE, "wb") as _f:
        _f.write(data.encode('utf-8'))


def delete_events():
    pass


def generate_events(n: int):
    today = date.today()
    events = []

    for i in range(n):
        price = random.randrange(3)
        if price == 0:
            min_price = max_price = 0
            is_free_price = 0
        elif price == 1:
            min_price = max_price = 0
            is_free_price = 1
        else:
            min_price = round(random.choice([0, random.uniform(0.0, 4.0)]), 2)
            max_price = round(random.uniform(5.0, 40.0), 2)
            is_free_price = 0

        event = {
            "id": str(uuid.uuid4()),
            "title": f"Test Event #{i + 1}",
            "is_test": True,
            "category": random.randrange(5),
            "event_date": (today + timedelta(days=i)).isoformat(),
            "event_start_time": random.choice([None, time(hour=random.randrange(13, 23), minute=random.randrange(0, 59)).isoformat()]),
            "location_name": f"Test Place #{i + 1}",
            "location_address": f"",
            "is_free_price": is_free_price,
            "min_price": min_price,
            "max_price": max_price,
            "long_description": f"This is a generated test event.\n\nBe Cool.\nDon't panic.\nParty hard.\n\nhttps://github.com/rcsculture/rcsculture.github.io",
            "pending": False,
            "phone": random.choice([None, "06.01.12.13.14"]),
            "site_url": random.choice([None, "https://github.com/rcsculture/rcsculture.github.io"]),
            "to_eat": random.choice([True, False]),
            "parental_guide": random.randrange(3),
            "tags": random.sample(TEST_TAGS, k=random.randint(0, min(3, len(TEST_TAGS)))) + ["is_test"]
        }

        events.append(event)

    return events


def update_supabase(events: list):
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    for event in events:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/events",
            headers=headers,
            json=event,
            verify=False,
            timeout=10
        )

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("nb", type=int, help="number of test events to create (from today)")
    parser.add_argument("--delete", action="store_true", help="delete all test events")
    args = parser.parse_args()
        
    if args.delete:
        delete_events()
        sys.exit(0)

    events = generate_events(args.nb)
    write_event_file(events)
    update_supabase(events)

