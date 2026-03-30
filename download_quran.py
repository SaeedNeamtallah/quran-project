"""
Download all 240 rubs, 604 pages, and 114 surahs from Quran API for offline use.
Run this once while connected to the internet.
"""
import json
import os
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
OAUTH_ENDPOINT = (os.getenv("OAUTH_ENDPOINT") or "").rstrip("/")
OUTPUT_FILE = Path("quran_offline.json")
TEMP_OUTPUT_FILE = Path("quran_offline.json.tmp")
EXPECTED_COUNTS = {"rubs": 240, "pages": 604, "chapters": 114}


def require_env():
    missing = [
        name
        for name, value in (
            ("CLIENT_ID", CLIENT_ID),
            ("CLIENT_SECRET", CLIENT_SECRET),
            ("OAUTH_ENDPOINT", OAUTH_ENDPOINT),
        )
        if not value
    ]
    if missing:
        raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")


def get_token():
    url = f"{OAUTH_ENDPOINT}/oauth2/token"
    res = requests.post(
        url,
        auth=(CLIENT_ID, CLIENT_SECRET),
        data={"grant_type": "client_credentials", "scope": "content"},
        timeout=30,
    )
    res.raise_for_status()
    return res.json()["access_token"]


def fetch_with_retry(url, headers, max_retries=3):
    for attempt in range(max_retries):
        try:
            res = requests.get(url, headers=headers, timeout=30)
            if res.status_code == 200:
                return res.json()
            if res.status_code == 429:
                wait = 5 * (attempt + 1)
                print(f"  Rate limited, waiting {wait}s...")
                time.sleep(wait)
            else:
                print(f"  Error {res.status_code}: {res.text[:100]}")
                time.sleep(2)
        except requests.RequestException as exc:
            print(f"  Connection error: {exc}, retrying...")
            time.sleep(3)
    return None


def refresh_token(headers):
    try:
        headers["x-auth-token"] = get_token()
    except requests.RequestException as exc:
        print(f"  Warning: token refresh failed: {exc}")


def verify_dataset(data):
    counts = {name: len(values) for name, values in data.items()}
    missing = {
        name: EXPECTED_COUNTS[name] - counts.get(name, 0)
        for name in EXPECTED_COUNTS
        if counts.get(name, 0) != EXPECTED_COUNTS[name]
    }
    return counts, missing


def save_output(data):
    with TEMP_OUTPUT_FILE.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False)
    os.replace(TEMP_OUTPUT_FILE, OUTPUT_FILE)


def main():
    require_env()

    print("=" * 50)
    print("  Quran Offline Data Downloader")
    print("=" * 50)

    token = get_token()
    headers = {"x-auth-token": token, "x-client-id": CLIENT_ID}
    data = {"rubs": {}, "pages": {}, "chapters": {}}
    failures = []

    print("\nDownloading 240 Rub' el Hizb...")
    for rub in range(1, 241):
        url = f"https://apis.quran.foundation/content/api/v4/verses/by_rub/{rub}?fields=text_uthmani"
        result = fetch_with_retry(url, headers)
        if result:
            data["rubs"][str(rub)] = result.get("verses", [])
            print(f"  OK Rub {rub}/240", end="\r")
        else:
            failures.append(f"Rub {rub}")
            print(f"  Failed Rub {rub}")

        if rub % 50 == 0:
            refresh_token(headers)
        time.sleep(0.3)

    print(f"\n  Downloaded rubs: {len(data['rubs'])}/240")

    print("\nDownloading 604 Mushaf pages...")
    for page in range(1, 605):
        url = f"https://apis.quran.foundation/content/api/v4/verses/by_page/{page}?fields=text_uthmani"
        result = fetch_with_retry(url, headers)
        if result:
            data["pages"][str(page)] = result.get("verses", [])
            print(f"  OK Page {page}/604", end="\r")
        else:
            failures.append(f"Page {page}")
            print(f"  Failed Page {page}")

        if page % 50 == 0:
            refresh_token(headers)
        time.sleep(0.3)

    print(f"\n  Downloaded pages: {len(data['pages'])}/604")

    print("\nDownloading 114 Surahs...")
    for chapter in range(1, 115):
        all_verses = []
        page = 1
        chapter_complete = True

        while True:
            url = (
                f"https://apis.quran.foundation/content/api/v4/verses/by_chapter/{chapter}"
                f"?fields=text_uthmani&per_page=50&page={page}"
            )
            result = fetch_with_retry(url, headers)
            if not result:
                failures.append(f"Surah {chapter} page {page}")
                chapter_complete = False
                break

            verses = result.get("verses", [])
            all_verses.extend(verses)
            pagination = result.get("pagination", {})
            next_page = pagination.get("next_page")
            if not next_page:
                break
            page = next_page
            time.sleep(0.3)

        if chapter_complete:
            data["chapters"][str(chapter)] = all_verses
            print(f"  OK Surah {chapter}/114 ({len(all_verses)} verses)")
        else:
            print(f"  Failed Surah {chapter}/114")

        if chapter % 20 == 0:
            refresh_token(headers)

    print(f"\n  Downloaded surahs: {len(data['chapters'])}/114")

    counts, missing = verify_dataset(data)
    if failures or missing:
        print("\nDataset verification failed. The existing offline file was left unchanged.")
        if failures:
            print("  Failed requests:")
            for failure in failures[:20]:
                print(f"    - {failure}")
            if len(failures) > 20:
                print(f"    - ... and {len(failures) - 20} more")
        if missing:
            print("  Missing records:")
            for name, count in missing.items():
                print(f"    - {name}: missing {count}")
        raise SystemExit(1)

    print(f"\nSaving to {OUTPUT_FILE}...")
    save_output(data)

    size_mb = OUTPUT_FILE.stat().st_size / (1024 * 1024)
    print(f"  Saved successfully. File size: {size_mb:.1f} MB")
    print(
        "  Counts: "
        f"{counts['rubs']} rubs, {counts['pages']} pages, {counts['chapters']} surahs"
    )


if __name__ == "__main__":
    main()
