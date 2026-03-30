import os
import json
import time
import requests
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Configuration
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
OAUTH_ENDPOINT = (os.getenv("OAUTH_ENDPOINT") or "").rstrip("/")

STATE_FILE = "state.json"
OFFLINE_FILE = "quran_offline.json"

# In-memory caches
oauth_token = None
token_expiry = 0
offline_data = None

# Load offline data if available
if os.path.exists(OFFLINE_FILE):
    print(f"📖 Loading offline Quran data from {OFFLINE_FILE}...")
    with open(OFFLINE_FILE, "r", encoding="utf-8") as f:
        offline_data = json.load(f)
    print(f"   ✓ Loaded: {len(offline_data.get('rubs', {}))} rubs, "
          f"{len(offline_data.get('pages', {}))} pages, "
          f"{len(offline_data.get('chapters', {}))} chapters")
    print(f"   🔌 Running in OFFLINE mode — no internet needed!")
else:
    print(f"⚡ No offline data found. Running in ONLINE mode.")
    print(f"   Run 'python download_quran.py' to download data for offline use.")

def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f:
            return json.load(f)
    return {"current_rub": 1}

def save_state(state):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f)

def require_api_config():
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
        raise RuntimeError(f"Missing API configuration: {', '.join(missing)}")

def get_access_token():
    global oauth_token, token_expiry
    if oauth_token and time.time() < token_expiry - 60:
        return oauth_token

    require_api_config()
    url = f"{OAUTH_ENDPOINT}/oauth2/token"
    response = requests.post(url, auth=(CLIENT_ID, CLIENT_SECRET), data={
        "grant_type": "client_credentials",
        "scope": "content"
    }, timeout=30)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch OAuth token: {response.text}")
    
    token_data = response.json()
    oauth_token = token_data.get("access_token")
    token_expiry = time.time() + token_data.get("expires_in", 3600)
    return oauth_token

def api_fetch(url):
    """Fetch from the Quran API (online mode only). Returns None on failure."""
    try:
        token = get_access_token()
        headers = {"x-auth-token": token, "x-client-id": CLIENT_ID}
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code != 200:
            return None
        return res.json()
    except Exception:
        return None

# ============================================================
#  API Endpoints — each checks offline_data first, then falls
#  back to the live API if offline data is not available.
# ============================================================

@app.get("/api/rub")
def get_rub(count: int = 1):
    state = load_state()
    rub_number = state.get("current_rub", 1)
    count = min(max(1, count), 8)
    
    all_verses = []
    current_fetch = rub_number
    
    for _ in range(count):
        if offline_data and str(current_fetch) in offline_data.get("rubs", {}):
            all_verses.extend(offline_data["rubs"][str(current_fetch)])
        else:
            data = api_fetch(
                f"https://apis.quran.foundation/content/api/v4/verses/by_rub/{current_fetch}?fields=text_uthmani"
            )
            if data:
                all_verses.extend(data.get("verses", []))
            else:
                raise HTTPException(status_code=503, detail="لا يوجد اتصال بالإنترنت ولم يتم تحميل بيانات أوفلاين. شغّل: python download_quran.py")
        
        current_fetch += 1
        if current_fetch > 240:
            current_fetch = 1
    
    state["current_rub"] = current_fetch
    save_state(state)
    
    return {
        "rub_number": f"{rub_number} - {current_fetch - 1}" if count > 1 else rub_number,
        "verses": all_verses
    }

@app.post("/api/set_rub")
def set_rub(rub: dict):
    new_rub = rub.get("rub_number")
    if not new_rub or not isinstance(new_rub, int) or new_rub < 1 or new_rub > 240:
        raise HTTPException(status_code=400, detail="Invalid rub number")
    
    state = load_state()
    state["current_rub"] = new_rub
    save_state(state)
    return {"message": "Success", "current_rub": new_rub}

@app.get("/api/surah_challenge")
def get_surah_challenge(chapter: int = 1, page: int = 1, per_page: int = 10):
    if offline_data and str(chapter) in offline_data.get("chapters", {}):
        all_verses = offline_data["chapters"][str(chapter)]
        # Manual pagination
        start = (page - 1) * per_page
        end = start + per_page
        page_verses = all_verses[start:end]
        next_page = page + 1 if end < len(all_verses) else None
        return {
            "verses": page_verses,
            "pagination": {
                "current_page": page,
                "next_page": next_page,
                "total_records": len(all_verses)
            }
        }
    else:
        result = api_fetch(
            f"https://apis.quran.foundation/content/api/v4/verses/by_chapter/{chapter}"
            f"?fields=text_uthmani&per_page={per_page}&page={page}"
        )
        if not result:
            raise HTTPException(status_code=503, detail="لا يوجد اتصال بالإنترنت. شغّل: python download_quran.py")
        return result

@app.get("/api/page")
def get_page(page: int = 1):
    if offline_data and str(page) in offline_data.get("pages", {}):
        return {"verses": offline_data["pages"][str(page)]}
    else:
        result = api_fetch(
            f"https://apis.quran.foundation/content/api/v4/verses/by_page/{page}?fields=text_uthmani"
        )
        if not result:
            raise HTTPException(status_code=503, detail="لا يوجد اتصال بالإنترنت. شغّل: python download_quran.py")
        return result

@app.get("/api/status")
def get_status():
    """Check if offline data is available and get current state."""
    state = load_state()
    return {
        "offline": offline_data is not None,
        "rubs": len(offline_data["rubs"]) if offline_data else 0,
        "pages": len(offline_data["pages"]) if offline_data else 0,
        "chapters": len(offline_data["chapters"]) if offline_data else 0,
        "current_rub": state.get("current_rub", 1)
    }

@app.get("/favicon.ico")
def favicon():
    # Return empty response to prevent 404 spam in logs
    return Response(content=b"", media_type="image/x-icon", status_code=204)

# Provide the frontend files
app.mount("/", StaticFiles(directory="static", html=True), name="static")
