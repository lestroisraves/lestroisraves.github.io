import argparse
import os
import sys
from datetime import datetime, date, time, timedelta
import supabase
import random
import json
import keyring

SUPABASE_URL = "https://jpicbqssqixagnwejefu.supabase.co"
SUPABASE_KEY = "sb_publishable_2N5OfZFZNISlfbjVUwL8KQ_AR45LsK_"
SUPABASE_IMAGE_STORAGE = f"{SUPABASE_URL}/storage/v1/object/public/event-images/"
EVENTS_FILE = os.path.expandvars("$PROJECT_ROOT_FOLDER\\test\\dummy-events.json")
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
    print("write events in file...")
    data = json.dumps(events, indent=4, ensure_ascii=False, cls=BytesDumpEncoder)
    with open(EVENTS_FILE, "wb") as _f:
        _f.write(data.encode('utf-8'))


def delete_events():
    print("delete all 'is_test' events...")
    supabase_db: supabase.Client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)
    supabase_db.auth.sign_in_with_password(
        {
            "email": "olivier.gohier@protonmail.com",
            "password": keyring.get_password("supabase.rcsculture", "olivier.gohier@protonmail.com"),
        }
    )
    supabase_db.table("events").delete().eq("is_test", True).execute()


def generate_events(n: int):
    today = date.today()
    events = []

    print("generate events...")
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

        category = random.randrange(5)
        if category == 0:
            image = "celine.webp"
            location_name = random.choice(["Bikini", "Le Rex", "Café des Sports", "Métronum"])
        elif category == 1:
            image = "cirque.webp"
            location_name = random.choice(["Colo N Co", "Le pré vert", "La briqueterie"])
        elif category == 2:
            image = "projection.webp"
            location_name = random.choice(["La Halle Rabastens", "Cinéma Albi", "Chez Vincent", "Promenade des Lices"])
        elif category == 3:
            image = "peinture.webp"
            location_name = random.choice(["Musé Des Arts", "Au Cercle", "Café du bord du monde", "Chez Jeanine"])
        else:
            image = "misc.webp"
            location_name = random.choice(["Café des Sports", "La Halle Rabastens", "Chez L'Olive", "Le Rouge qui tache"])

        event = {
            "created_by": "f2bb3c93-cb32-44e6-8f02-c3f819edb2c4",
            "title": f"Test Event #{i + 1}",
            "is_test": True,
            "category": category,
            "event_date": (today + timedelta(days=i)).isoformat(),
            "event_start_time": random.choice([None, time(hour=random.randrange(13, 23), minute=random.randrange(0, 45, step = 15)).isoformat()]),
            "location_name": location_name,
            "location_address": f"{random.randrange(1, 50)} {random.choice(["rue", "place", "avenue", "boulevard"])} {random.choice(["Saint Michel", "Général de Gaulle", "Du Printemps", "Jérome"])} 81{random.randrange(800, 899)} {random.choice(["Rabastens", "Coufouleux", "Saint-Sulpice", "Salvagnac", "Loupiac", "L'Isle-sur-Tarn"])}",
            "is_free_price": is_free_price,
            "min_price": min_price,
            "max_price": max_price,
            "long_description": f"This is a generated test event.\n\nBe Cool.\nDon't panic.\nParty hard.\n\nwww.github.com",
            "pending": False,
            "phone": random.choice([None, "06.01.12.13.14"]),
            "site_url": random.choice([None, "https://rcsculture.github.io"]),
            "to_eat": random.choice([True, False]),
            "parental_guide": random.randrange(3),
            "tags": random.sample(TEST_TAGS, k=random.randint(0, min(3, len(TEST_TAGS)))) + ["is_test"],
            "image_url": SUPABASE_IMAGE_STORAGE + image
        }

        events.append(event)

    return events


def update_supabase(events: list):
    print("update 'events' table...")
    supabase_db: supabase.Client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)
    supabase_db.auth.sign_in_with_password(
        {
            "email": "olivier.gohier@protonmail.com",
            "password": keyring.get_password("supabase.rcsculture", "olivier.gohier@protonmail.com"),
        }
    )
    for event in events:
        supabase_db.table("events").insert(event,).execute()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("nb", type=int, help="number of test events to create (from today)")
    args = parser.parse_args()
        
    delete_events()
    events = generate_events(args.nb)
    write_event_file(events)
    update_supabase(events)


if __name__ == "__main__":
    main()

    # supabase_db: supabase.Client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)
    # auth = supabase_db.auth.sign_in_with_password(
    #     {
    #         "email": "olivier.gohier@protonmail.com",
    #         "password": keyring.get_password("supabase.rcsculture", "olivier.gohier@protonmail.com"),
    #     }
    # )
    # response = (supabase_db.table("events")
    #     .insert({
    #         "created_by": "f2bb3c93-cb32-44e6-8f02-c3f819edb2c4",
    #         "title": "Test Event #1",
    #         "is_test": True,
    #         "category": 3,
    #         "event_date": "2026-05-07",
    #         "event_start_time": "22:19:00",
    #         "location_name": "Test Place #1",
    #         "location_address": "",
    #         "is_free_price": 0,
    #         "min_price": 0,
    #         "max_price": 0,
    #         "long_description": "This is a generated test event.\n\nBe Cool.\nDon't panic.\nParty hard.\n\nhttps://github.com/rcsculture/rcsculture.github.io",
    #         "pending": False,
    #         "phone": None,
    #         "site_url": "https://github.com/rcsculture/rcsculture.github.io",
    #         "to_eat": True,
    #         "parental_guide": 0,
    #         "tags": [
    #             "enfant",
    #             "is_test"
    #         ],
    #     },)
    #     .execute()
    # )

