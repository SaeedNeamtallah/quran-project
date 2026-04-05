import os
import re
import json
import html
import time
import ipaddress
import tempfile
import requests
from threading import Lock
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

PAGE_LAYOUT_WORD_FIELDS = "position,verse_key,char_type_name,text_uthmani,text_qpc_hafs,code_v2,page_number,line_number,v2_page,line_v2"
VERSE_WORD_FIELDS = PAGE_LAYOUT_WORD_FIELDS

def get_env_int(name, default, minimum=None, maximum=None):
    raw_value = os.getenv(name)
    try:
        value = int(str(raw_value).strip()) if raw_value is not None else int(default)
    except (TypeError, ValueError):
        value = int(default)
    if minimum is not None:
        value = max(minimum, value)
    if maximum is not None:
        value = min(maximum, value)
    return value

def get_env_bool(name, default=False):
    raw_value = os.getenv(name)
    if raw_value is None:
        return default
    normalized = str(raw_value).strip().lower()
    return normalized not in {"0", "false", "no", "off"}

# Configuration
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
OAUTH_ENDPOINT = (os.getenv("OAUTH_ENDPOINT") or "").rstrip("/")
DEFAULT_TAFSIR_ID = os.getenv("DEFAULT_TAFSIR_ID")
GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY") or os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TAFSIR_ENHANCE_PROVIDER = (os.getenv("TAFSIR_ENHANCE_PROVIDER") or "auto").strip().lower()
GOOGLE_TAFSIR_ENHANCE_MODEL = os.getenv("GOOGLE_TAFSIR_ENHANCE_MODEL") or "gemma-3-27b-it"
GROQ_TAFSIR_ENHANCE_MODEL = os.getenv("GROQ_TAFSIR_ENHANCE_MODEL") or "llama-3.3-70b-versatile"
TAFSIR_ENHANCE_SHARED_SECRET = (os.getenv("TAFSIR_ENHANCE_SHARED_SECRET") or "").strip()
TAFSIR_ENHANCE_REQUIRE_LOOPBACK = get_env_bool("TAFSIR_ENHANCE_REQUIRE_LOOPBACK", True)
TAFSIR_ENHANCE_MAX_TEXT_LENGTH = get_env_int("TAFSIR_ENHANCE_MAX_TEXT_LENGTH", 12000, minimum=2000, maximum=50000)
TAFSIR_ENHANCE_RATE_LIMIT_WINDOW_SECONDS = get_env_int("TAFSIR_ENHANCE_RATE_LIMIT_WINDOW_SECONDS", 60, minimum=10, maximum=3600)
TAFSIR_ENHANCE_RATE_LIMIT_MAX_REQUESTS = get_env_int("TAFSIR_ENHANCE_RATE_LIMIT_MAX_REQUESTS", 8, minimum=1, maximum=200)

STATE_FILE = "state.json"
OFFLINE_FILE = "quran_offline.json"

# In-memory caches
oauth_token = None
token_expiry = 0
offline_data = None
tafsir_resource_cache = None
recitations_resource_cache = None
chapter_recitation_segments_cache = {}
tafsir_enhance_request_log = {}
tafsir_enhance_request_lock = Lock()
state_file_lock = Lock()

# Load offline data if available
if os.path.exists(OFFLINE_FILE):
    print(f"[offline] Loading offline Quran data from {OFFLINE_FILE}...")
    with open(OFFLINE_FILE, "r", encoding="utf-8") as f:
        offline_data = json.load(f)
    print(f"   Loaded: {len(offline_data.get('rubs', {}))} rubs, "
          f"{len(offline_data.get('pages', {}))} pages, "
          f"{len(offline_data.get('chapters', {}))} chapters")
    print("   Running in OFFLINE mode - no internet needed.")
else:
    print("No offline data found. Running in ONLINE mode.")
    print(f"   Run 'python download_quran.py' to download data for offline use.")

def load_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            current_rub = int(data.get("current_rub", 1))
            return {"current_rub": min(max(current_rub, 1), 240)}
        except (OSError, ValueError, TypeError, json.JSONDecodeError):
            return {"current_rub": 1}
    return {"current_rub": 1}

def save_state(state):
    safe_state = {"current_rub": min(max(int(state.get("current_rub", 1)), 1), 240)}
    with state_file_lock:
        temp_state_file = None
        try:
            with tempfile.NamedTemporaryFile("w", delete=False, encoding="utf-8", dir=".", prefix="state.", suffix=".tmp") as f:
                temp_state_file = f.name
                json.dump(safe_state, f, ensure_ascii=False)

            for attempt in range(5):
                try:
                    os.replace(temp_state_file, STATE_FILE)
                    temp_state_file = None
                    return
                except PermissionError:
                    if attempt >= 4:
                        raise
                    time.sleep(0.05 * (attempt + 1))
        finally:
            if temp_state_file and os.path.exists(temp_state_file):
                try:
                    os.remove(temp_state_file)
                except OSError:
                    pass

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

def has_api_config():
    return bool(CLIENT_ID and CLIENT_SECRET and OAUTH_ENDPOINT)

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

def public_api_fetch(url):
    """Fetch from the public Quran API fallback. Returns None on failure."""
    try:
        res = requests.get(url, timeout=15)
        if res.status_code != 200:
            return None
        return res.json()
    except Exception:
        return None

def extract_tafsir_plain_text(raw_text):
    normalized = str(raw_text or "").replace("\r\n", "\n").replace("\r", "\n")
    normalized = re.sub(r"(?i)<br\s*/?>", "\n", normalized)
    normalized = re.sub(r"(?i)</p\s*>", "\n\n", normalized)
    normalized = re.sub(r"(?i)</h[1-6]\s*>", "\n\n", normalized)
    normalized = re.sub(r"<[^>]+>", "", normalized)
    normalized = html.unescape(normalized).replace("\xa0", " ")
    normalized = re.sub(r"[ \t]+\n", "\n", normalized)
    normalized = re.sub(r"\n{3,}", "\n\n", normalized)
    return normalized.strip()

def build_tafsir_enhance_prompt(plain_text):
    return (
        "قسّم النص التالي إلى مقاطع عرض فقط بدون تغيير أي حرف إطلاقًا.\n"
        "ممنوع منعًا باتًا إضافة أو حذف أو استبدال أو إعادة ترتيب أي حرف أو مسافة أو علامة ترقيم أو تشكيل.\n"
        "لا تُعد كتابة النص. أعد فقط مواضع القطع داخل JSON.\n"
        "أخرج JSON فقط بالشكل التالي: {\"cuts\": [120, 240]}.\n"
        "كل رقم داخل cuts هو موضع نهاية مقطع محسوبًا بعدد الأحرف من بداية النص.\n"
        "مثال: إذا كان cuts = [2, 4] للنص ABCDE فالمقاطع ستكون AB ثم CD ثم E.\n"
        "اختر مواضع تجعل العرض أوضح. إذا كان النص قصيرًا جدًا يمكن أن تكون cuts فارغة.\n"
        "إذا كان النص متوسطًا أو طويلًا فحاول إنتاج 2 إلى 6 مقاطع.\n"
        "لا تضف أي شرح أو Markdown أو أسوار كود.\n\n"
        "النص الأصلي:\n"
        f"{plain_text}"
    )

def extract_json_object(raw_response):
    text = str(raw_response or "").strip()
    if not text:
        raise ValueError("Empty model response")

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, flags=re.DOTALL)
        if not match:
            raise ValueError("Model did not return JSON")
        return json.loads(match.group(0))

def validate_tafsir_segments(source_text, candidate_segments):
    if not isinstance(candidate_segments, list) or not candidate_segments:
        raise ValueError("Model returned no usable segments")

    if not all(isinstance(segment, str) for segment in candidate_segments):
        raise ValueError("Model returned invalid segment types")

    rebuilt_text = "".join(candidate_segments)
    if rebuilt_text != source_text:
        raise ValueError("Segmented text does not match the original text exactly")

    return candidate_segments

def validate_tafsir_cuts(source_text, candidate_cuts):
    if candidate_cuts is None:
        raise ValueError("Model returned no cuts")
    if not isinstance(candidate_cuts, list):
        raise ValueError("Model returned invalid cuts")

    text_length = len(source_text)
    normalized_cuts = []

    for value in candidate_cuts:
        try:
            cut = int(value)
        except (TypeError, ValueError):
            raise ValueError("Model returned non-integer cuts")
        if 0 < cut < text_length:
            normalized_cuts.append(cut)

    return sorted(set(normalized_cuts))

def build_segments_from_cuts(source_text, cuts):
    if not cuts:
        return [source_text]

    segments = []
    previous = 0
    for cut in cuts:
        segments.append(source_text[previous:cut])
        previous = cut
    segments.append(source_text[previous:])
    return validate_tafsir_segments(source_text, segments)

def extract_validated_segments(source_text, parsed_payload):
    if isinstance(parsed_payload, dict):
        if "cuts" in parsed_payload:
            cuts = validate_tafsir_cuts(source_text, parsed_payload.get("cuts"))
            return build_segments_from_cuts(source_text, cuts)
        if "segments" in parsed_payload:
            return validate_tafsir_segments(source_text, parsed_payload.get("segments"))
    raise ValueError("Model response did not contain usable cuts or segments")

def google_model_supports_structured_output(model_name: str):
    normalized = str(model_name or "").strip().lower()
    return normalized.startswith("gemini")

def enhance_tafsir_with_google(source_text):
    if not GOOGLE_AI_API_KEY:
        raise RuntimeError("Google AI API key is not configured")

    generation_config = {
        "temperature": 0,
    }
    if google_model_supports_structured_output(GOOGLE_TAFSIR_ENHANCE_MODEL):
        generation_config["responseMimeType"] = "application/json"

    response = requests.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/{GOOGLE_TAFSIR_ENHANCE_MODEL}:generateContent",
        headers={
            "x-goog-api-key": GOOGLE_AI_API_KEY,
            "Content-Type": "application/json",
        },
        json={
            "contents": [
                {
                    "parts": [
                        {"text": build_tafsir_enhance_prompt(source_text)}
                    ]
                }
            ],
            "generationConfig": generation_config
        },
        timeout=60
    )
    if response.status_code != 200:
        raise RuntimeError(f"Google AI request failed: {response.text}")

    payload = response.json()
    candidates = payload.get("candidates") or []
    parts = (((candidates[0] if candidates else {}).get("content") or {}).get("parts") or [])
    content = "".join(str(part.get("text") or "") for part in parts).strip()
    parsed = extract_json_object(content)
    segments = extract_validated_segments(source_text, parsed)
    return {
        "provider": "google",
        "model": GOOGLE_TAFSIR_ENHANCE_MODEL,
        "segments": segments
    }

def enhance_tafsir_with_groq(source_text):
    if not GROQ_API_KEY:
        raise RuntimeError("Groq API key is not configured")

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": GROQ_TAFSIR_ENHANCE_MODEL,
            "temperature": 0,
            "response_format": {"type": "json_object"},
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You only segment the exact input text into display chunks. "
                        "Never add, delete, replace, normalize, or reorder any character. "
                        "Return JSON only in the form {\"cuts\": [120, 240]}. "
                        "Each cut is a character count from the start of the original text where a display break should happen. "
                        "Do not rewrite the text itself."
                    )
                },
                {
                    "role": "user",
                    "content": build_tafsir_enhance_prompt(source_text)
                }
            ]
        },
        timeout=60
    )
    if response.status_code != 200:
        raise RuntimeError(f"Groq request failed: {response.text}")

    payload = response.json()
    choices = payload.get("choices") or []
    content = (((choices[0] if choices else {}).get("message") or {}).get("content") or "").strip()
    parsed = extract_json_object(content)
    segments = extract_validated_segments(source_text, parsed)
    return {
        "provider": "groq",
        "model": GROQ_TAFSIR_ENHANCE_MODEL,
        "segments": segments
    }

def enhance_tafsir_segments(source_text, requested_provider="auto"):
    provider = (requested_provider or TAFSIR_ENHANCE_PROVIDER or "auto").strip().lower()
    if provider not in {"auto", "google", "groq"}:
        provider = "auto"

    provider_order = ["google", "groq"] if provider == "auto" else [provider]
    attempts = []

    for candidate_provider in provider_order:
        try:
            if candidate_provider == "google":
                return enhance_tafsir_with_google(source_text)
            return enhance_tafsir_with_groq(source_text)
        except Exception as error:
            attempts.append(f"{candidate_provider}: {error}")

    raise HTTPException(
        status_code=503,
        detail="تعذر تحسين التفسير من مزودي الذكاء الاصطناعي. " + " | ".join(attempts)
    )

def get_request_ip(request: Request):
    forwarded_for = (request.headers.get("x-forwarded-for") or "").split(",", 1)[0].strip()
    if forwarded_for:
        return forwarded_for
    if request.client and request.client.host:
        return str(request.client.host).strip()
    return ""

def is_loopback_ip(value: str):
    normalized = str(value or "").strip().lower()
    if not normalized:
        return False
    if normalized == "localhost":
        return True
    try:
        return ipaddress.ip_address(normalized).is_loopback
    except ValueError:
        return False

def enforce_tafsir_enhance_guardrails(request: Request, plain_text: str):
    client_ip = get_request_ip(request) or "unknown"
    supplied_secret = (request.headers.get("x-tafsir-enhance-secret") or "").strip()
    secret_is_valid = bool(TAFSIR_ENHANCE_SHARED_SECRET) and supplied_secret == TAFSIR_ENHANCE_SHARED_SECRET
    is_loopback_request = is_loopback_ip(client_ip)

    if TAFSIR_ENHANCE_REQUIRE_LOOPBACK and not (is_loopback_request or secret_is_valid):
        raise HTTPException(
            status_code=403,
            detail="تحسين التفسير مسموح فقط للطلبات المحلية أو الطلبات الموقعة من البروكسي."
        )

    if TAFSIR_ENHANCE_SHARED_SECRET and not (secret_is_valid or is_loopback_request):
        raise HTTPException(
            status_code=403,
            detail="طلب تحسين التفسير غير مصرح به."
        )

    if len(plain_text) > TAFSIR_ENHANCE_MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=413,
            detail=f"نص التفسير أطول من الحد المسموح ({TAFSIR_ENHANCE_MAX_TEXT_LENGTH} حرفًا)."
        )

    now = time.time()
    cutoff = now - TAFSIR_ENHANCE_RATE_LIMIT_WINDOW_SECONDS
    with tafsir_enhance_request_lock:
        recent_requests = [
            stamp
            for stamp in tafsir_enhance_request_log.get(client_ip, [])
            if stamp >= cutoff
        ]
        if len(recent_requests) >= TAFSIR_ENHANCE_RATE_LIMIT_MAX_REQUESTS:
            raise HTTPException(
                status_code=429,
                detail=(
                    "تم تجاوز حد طلبات تحسين التفسير. "
                    f"حاول مرة أخرى بعد {TAFSIR_ENHANCE_RATE_LIMIT_WINDOW_SECONDS} ثانية."
                )
            )
        recent_requests.append(now)
        tafsir_enhance_request_log[client_ip] = recent_requests

def get_default_tafsir_id():
    global tafsir_resource_cache

    if DEFAULT_TAFSIR_ID:
        try:
            return int(DEFAULT_TAFSIR_ID)
        except ValueError:
            pass

    if not tafsir_resource_cache or not (tafsir_resource_cache.get("tafsirs") or []):
        tafsir_resource_cache = api_fetch(
            "https://apis.quran.foundation/content/api/v4/resources/tafsirs?language=ar"
        ) or {}

    tafsirs = tafsir_resource_cache.get("tafsirs") or []
    if not tafsirs:
        return None

    for tafsir in tafsirs:
        language_name = str(tafsir.get("language_name") or "").strip().lower()
        translated_name = tafsir.get("translated_name") or {}
        translated_lang = str(translated_name.get("language_name") or "").strip().lower()
        if "arab" in language_name or "arab" in translated_lang:
            return tafsir.get("id")

    return tafsirs[0].get("id")

def get_default_recitation_id():
    return 7

def normalize_audio_url(url: str):
    normalized = str(url or "").strip()
    if not normalized:
        return ""
    if normalized.startswith("http://") or normalized.startswith("https://"):
        return normalized
    return f"https://verses.quran.foundation/{normalized.lstrip('/')}"

def fetch_rub_recitation_audio_files(recitation_id: int, rub_number: int):
    audio_files = []
    page = 1

    while True:
        result = api_fetch(
            f"https://apis.quran.foundation/content/api/v4/recitations/{recitation_id}/by_rub_el_hizb/{rub_number}"
            f"?page={page}&per_page=50"
        )
        if not result:
            return None

        for audio_file in result.get("audio_files") or []:
            normalized_url = normalize_audio_url(audio_file.get("url"))
            if not normalized_url:
                continue
            audio_files.append({
                "verse_key": audio_file.get("verse_key", ""),
                "url": normalized_url
            })

        pagination = result.get("pagination") or {}
        next_page = pagination.get("next_page")
        if not next_page:
            break
        page = next_page

    return audio_files

def fetch_page_recitation_audio_files(recitation_id: int, page_number: int):
    audio_files = []
    api_page = 1

    while True:
        result = api_fetch(
            f"https://apis.quran.foundation/content/api/v4/recitations/{recitation_id}/by_page/{page_number}"
            f"?page={api_page}&per_page=50"
        )
        if not result:
            return None

        for audio_file in result.get("audio_files") or []:
            normalized_url = normalize_audio_url(audio_file.get("url"))
            verse_key = str(audio_file.get("verse_key") or "").strip()
            if not normalized_url or not verse_key:
                continue
            audio_files.append({
                "verse_key": verse_key,
                "url": normalized_url
            })

        pagination = result.get("pagination") or {}
        next_page = pagination.get("next_page")
        if not next_page:
            break
        api_page = next_page

    return audio_files

def fetch_paginated_verses(base_url: str):
    verses = []
    page = 1

    while True:
        separator = "&" if "?" in base_url else "?"
        url = f"{base_url}{separator}page={page}&per_page=50"
        result = api_fetch(url)
        if not result and "https://apis.quran.foundation/content/api/v4/" in base_url:
            public_url = url.replace("https://apis.quran.foundation/content/api/v4/", "https://api.quran.com/api/v4/")
            result = public_api_fetch(public_url)
        if not result:
            return None

        verses.extend(result.get("verses") or [])

        pagination = result.get("pagination") or {}
        next_page = pagination.get("next_page")
        if not next_page or next_page == page:
            break

        page = next_page

    return verses

def get_word_page_number(word: dict | None, fallback_page: int = 0):
    if not isinstance(word, dict):
        return int(fallback_page or 0)

    for key in ("v2_page", "page_number"):
        try:
            value = int(word.get(key) or 0)
        except (TypeError, ValueError):
            value = 0
        if value > 0:
            return value

    return int(fallback_page or 0)

def get_verse_page_numbers(verse: dict | None):
    if not isinstance(verse, dict):
        return []

    try:
        fallback_page = int(verse.get("page_number") or 0)
    except (TypeError, ValueError):
        fallback_page = 0

    page_numbers = []
    seen_page_numbers = set()

    for word in verse.get("words") or []:
        page_number = get_word_page_number(word, fallback_page)
        if page_number <= 0 or page_number in seen_page_numbers:
            continue
        seen_page_numbers.add(page_number)
        page_numbers.append(page_number)

    if not page_numbers and fallback_page > 0:
        return [fallback_page]

    return page_numbers

def build_visible_verse_keys_by_page(verses):
    visible_verse_keys_by_page = {}

    for verse in verses or []:
        verse_key = str(verse.get("verse_key") or "").strip()
        if not verse_key:
            continue

        for page_number in get_verse_page_numbers(verse):
            current_page_keys = visible_verse_keys_by_page.get(page_number) or set()
            current_page_keys.add(verse_key)
            visible_verse_keys_by_page[page_number] = current_page_keys

    return visible_verse_keys_by_page

def fetch_page_numbers_for_verse_range(verses):
    if not verses:
        return []

    first_verse_key = str((verses[0] or {}).get("verse_key") or "").strip()
    last_verse_key = str((verses[-1] or {}).get("verse_key") or "").strip()

    if first_verse_key and last_verse_key and has_api_config():
        lookup = api_fetch(
            f"https://apis.quran.foundation/content/api/v4/pages/lookup?mushaf=1&from={first_verse_key}&to={last_verse_key}"
        )
        pages = (lookup or {}).get("pages") or {}
        if pages:
            try:
                return sorted(int(page_number) for page_number in pages.keys())
            except (TypeError, ValueError):
                pass

    return sorted(build_visible_verse_keys_by_page(verses).keys())

def fetch_pages_lookup(from_verse_key: str, to_verse_key: str):
    normalized_from = str(from_verse_key or "").strip()
    normalized_to = str(to_verse_key or "").strip()
    if not normalized_from or not normalized_to:
        return {}

    if has_api_config():
        lookup = api_fetch(
            f"https://apis.quran.foundation/content/api/v4/pages/lookup?mushaf=1&from={normalized_from}&to={normalized_to}"
        ) or {}
        pages = lookup.get("pages") or {}
        if pages:
            return pages

    return {}

def parse_verse_key(verse_key: str):
    normalized = str(verse_key or "").strip()
    if ":" not in normalized:
        return None
    try:
        chapter_number, verse_number = normalized.split(":", 1)
        return int(chapter_number), int(verse_number)
    except (TypeError, ValueError):
        return None

def compare_verse_keys(left_key: str, right_key: str):
    left_parsed = parse_verse_key(left_key)
    right_parsed = parse_verse_key(right_key)
    if not left_parsed or not right_parsed:
        return 0
    if left_parsed < right_parsed:
        return -1
    if left_parsed > right_parsed:
        return 1
    return 0

def is_verse_key_in_range(verse_key: str, from_verse_key: str, to_verse_key: str):
    normalized_verse_key = str(verse_key or "").strip()
    if not normalized_verse_key:
        return False
    if from_verse_key and compare_verse_keys(normalized_verse_key, from_verse_key) < 0:
        return False
    if to_verse_key and compare_verse_keys(normalized_verse_key, to_verse_key) > 0:
        return False
    return True

def build_page_sources_for_verses(verses):
    normalized_verses = [verse for verse in (verses or []) if str((verse or {}).get("verse_key") or "").strip()]
    visible_verse_keys_by_page = build_visible_verse_keys_by_page(normalized_verses)
    if not visible_verse_keys_by_page or not normalized_verses:
        return []

    first_verse_key = str(normalized_verses[0].get("verse_key") or "").strip()
    last_verse_key = str(normalized_verses[-1].get("verse_key") or "").strip()
    pages_lookup = fetch_pages_lookup(first_verse_key, last_verse_key)
    page_sources = []
    page_numbers = sorted(int(page_number) for page_number in pages_lookup.keys()) if pages_lookup else fetch_page_numbers_for_verse_range(normalized_verses)

    for page_number in page_numbers:
        page_lookup_entry = pages_lookup.get(str(page_number)) or {}
        page_from = str(page_lookup_entry.get("from") or "").strip()
        page_to = str(page_lookup_entry.get("to") or "").strip()

        page_verses = fetch_page_verses(page_number, page_from or None, page_to or None)
        if page_verses is None:
            return []

        if pages_lookup and (page_from or page_to):
            page_verses = [
                verse
                for verse in page_verses
                if is_verse_key_in_range(str(verse.get("verse_key") or ""), page_from, page_to)
            ]

        if pages_lookup:
            visible_verse_keys = sorted({str(verse.get("verse_key") or "").strip() for verse in page_verses if str(verse.get("verse_key") or "").strip()})
        else:
            visible_verse_keys = sorted(visible_verse_keys_by_page.get(page_number) or [])

        page_sources.append({
            "page_number": page_number,
            "visible_verse_keys": visible_verse_keys,
            "verses": page_verses
        })

    return page_sources

def fetch_page_verses(page_number: int, from_verse_key: str | None = None, to_verse_key: str | None = None):
    normalized_page = max(1, min(604, int(page_number)))
    normalized_from = str(from_verse_key or "").strip()
    normalized_to = str(to_verse_key or "").strip()

    page_query = (
        f"https://apis.quran.foundation/content/api/v4/verses/by_page/{normalized_page}"
        f"?fields=text_uthmani&mushaf=1&words=true&word_fields={PAGE_LAYOUT_WORD_FIELDS}"
    )
    if normalized_from:
        page_query += f"&from={normalized_from}"
    if normalized_to:
        page_query += f"&to={normalized_to}"

    result = fetch_paginated_verses(page_query)
    if result:
        return result

    if offline_data and str(normalized_page) in offline_data.get("pages", {}):
        page_verses = offline_data["pages"][str(normalized_page)]
        if not normalized_from and not normalized_to:
            return page_verses
        return [
            verse
            for verse in page_verses
            if is_verse_key_in_range(str(verse.get("verse_key") or ""), normalized_from, normalized_to)
        ]

    return None

def fetch_rub_verses(rub_number: int):
    normalized_rub = max(1, min(240, int(rub_number)))

    verses = fetch_paginated_verses(
        f"https://apis.quran.foundation/content/api/v4/verses/by_rub/{normalized_rub}"
        f"?fields=text_uthmani&mushaf=1&words=true&word_fields={VERSE_WORD_FIELDS}"
    )
    if verses is not None:
        return verses

    if offline_data and str(normalized_rub) in offline_data.get("rubs", {}):
        return offline_data["rubs"][str(normalized_rub)]

    return None

def parse_chapter_number(verse_key: str):
    try:
        return int(str(verse_key).split(":", 1)[0])
    except (TypeError, ValueError, AttributeError):
        return None

def fetch_chapter_recitation_segments(recitation_id: int, chapter_number: int):
    cache_key = (int(recitation_id), int(chapter_number))
    if cache_key in chapter_recitation_segments_cache:
        return chapter_recitation_segments_cache[cache_key]

    result = api_fetch(
        f"https://apis.quran.foundation/content/api/v4/chapter_recitations/{recitation_id}/{chapter_number}?segments=true"
    )
    if not result:
        return None

    audio_file = result.get("audio_file") or {}
    timestamps = audio_file.get("timestamps") or []
    verse_timings = {}

    for entry in timestamps:
        verse_key = entry.get("verse_key")
        if not verse_key:
            continue

        verse_start = int(entry.get("timestamp_from") or 0)
        verse_end = int(entry.get("timestamp_to") or 0)
        normalized_segments = []

        for segment in entry.get("segments") or []:
            if not isinstance(segment, list) or len(segment) < 3:
                continue

            try:
                word_position = int(segment[0])
                start_ms = max(0, int(segment[1]) - verse_start)
                end_ms = max(start_ms, int(segment[2]) - verse_start)
            except (TypeError, ValueError):
                continue

            normalized_segments.append({
                "position": word_position,
                "start_ms": start_ms,
                "end_ms": end_ms
            })

        verse_timings[verse_key] = {
            "verse_start_ms": verse_start,
            "verse_end_ms": verse_end,
            "segments": normalized_segments
        }

    chapter_recitation_segments_cache[cache_key] = verse_timings
    return verse_timings

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
        verses = fetch_rub_verses(current_fetch)
        if verses is None:
            raise HTTPException(status_code=503, detail="لا يوجد اتصال بالإنترنت ولم يتم تحميل بيانات أوفلاين. شغّل: python download_quran.py")
        all_verses.extend(verses)
        
        current_fetch += 1
        if current_fetch > 240:
            current_fetch = 1
    
    state["current_rub"] = current_fetch
    save_state(state)

    end_rub = current_fetch - 1 if current_fetch > 1 else 240
    
    return {
        "rub_number": f"{rub_number} - {end_rub}" if count > 1 else rub_number,
        "verses": all_verses,
        "page_sources": build_page_sources_for_verses(all_verses)
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
    if has_api_config():
        result = api_fetch(
            f"https://apis.quran.foundation/content/api/v4/verses/by_chapter/{chapter}"
            f"?fields=text_uthmani&words=true&word_fields={VERSE_WORD_FIELDS}&per_page={per_page}&page={page}"
        )
        if result:
            return result

    if offline_data and str(chapter) in offline_data.get("chapters", {}):
        all_verses = offline_data["chapters"][str(chapter)]
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

    raise HTTPException(status_code=503, detail="لا يوجد اتصال بالإنترنت. شغّل: python download_quran.py")

@app.get("/api/page")
def get_page(page: int = 1, from_verse: str | None = Query(None, alias="from"), to_verse: str | None = Query(None, alias="to")):
    result = fetch_page_verses(page, from_verse, to_verse)
    if result is not None:
        return {"verses": result}

    raise HTTPException(status_code=503, detail="لا يوجد اتصال بالإنترنت. شغّل: python download_quran.py")

@app.get("/api/page_recitation")
def get_page_recitation(page_number: int, recitation_id: int | None = None):
    normalized_page = max(1, min(604, int(page_number)))
    resolved_recitation_id = recitation_id or get_default_recitation_id()

    audio_files = fetch_page_recitation_audio_files(resolved_recitation_id, normalized_page)
    if audio_files is None:
        raise HTTPException(status_code=503, detail="تعذر تحميل تلاوة الصفحة من المزود")
    if not audio_files:
        raise HTTPException(status_code=404, detail="لا توجد ملفات صوتية متاحة لهذه الصفحة")

    return {
        "page_number": normalized_page,
        "recitation_id": resolved_recitation_id,
        "audio_files": audio_files
    }

@app.get("/api/page_word_timings")
def get_page_word_timings(page_number: int, recitation_id: int | None = None):
    normalized_page = max(1, min(604, int(page_number)))
    resolved_recitation_id = recitation_id or get_default_recitation_id()

    verses = fetch_page_verses(normalized_page)
    if verses is None:
        raise HTTPException(status_code=503, detail="تعذر تحميل آيات الصفحة الحالية لتوقيتات الكلمات")

    verse_keys = []
    chapter_numbers = set()

    for verse in verses:
        verse_key = verse.get("verse_key")
        if not verse_key:
            continue
        verse_keys.append(verse_key)
        chapter_number = verse.get("chapter_id") or parse_chapter_number(verse_key)
        if chapter_number:
            chapter_numbers.add(int(chapter_number))

    if not verse_keys:
        raise HTTPException(status_code=404, detail="لا توجد آيات متاحة لتوقيتات كلمات الصفحة")

    verse_key_set = set(verse_keys)
    word_timings = {}

    for chapter_number in sorted(chapter_numbers):
        chapter_timings = fetch_chapter_recitation_segments(resolved_recitation_id, chapter_number)
        if not chapter_timings:
            continue
        for verse_key, timing_data in chapter_timings.items():
            if verse_key in verse_key_set:
                word_timings[verse_key] = timing_data

    return {
        "page_number": normalized_page,
        "recitation_id": resolved_recitation_id,
        "word_timings": word_timings
    }

@app.get("/api/tafsir")
def get_ayah_tafsir(verse_key: str, tafsir_id: int | None = None):
    normalized_key = (verse_key or "").strip()
    if ":" not in normalized_key:
        raise HTTPException(status_code=400, detail="صيغة verse_key غير صحيحة")

    resolved_tafsir_id = tafsir_id or get_default_tafsir_id()
    if not resolved_tafsir_id:
        raise HTTPException(status_code=503, detail="تعذر تحديد مصدر تفسير مناسب")

    result = api_fetch(
        f"https://apis.quran.foundation/content/api/v4/verses/by_key/{normalized_key}"
        f"?fields=text_uthmani&words=false&tafsirs={resolved_tafsir_id}"
    )
    if not result:
        raise HTTPException(status_code=503, detail="تعذر تحميل التفسير من المزود")

    verse = result.get("verse")
    if not verse:
        raise HTTPException(status_code=404, detail="الآية المطلوبة غير موجودة")

    tafsirs = verse.get("tafsirs") or []
    tafsir = tafsirs[0] if tafsirs else None
    if not tafsir:
        raise HTTPException(status_code=404, detail="لا يوجد تفسير متاح لهذه الآية")

    return {
        "verse_key": verse.get("verse_key", normalized_key),
        "verse_text": verse.get("text_uthmani", ""),
        "tafsir": {
            "resource_id": tafsir.get("resource_id", resolved_tafsir_id),
            "name": tafsir.get("name") or "التفسير",
            "language_name": tafsir.get("language_name") or "",
            "text": tafsir.get("text") or "",
            "plain_text": extract_tafsir_plain_text(tafsir.get("text") or "")
        }
    }

@app.post("/api/tafsir_enhance")
def enhance_tafsir(payload: dict, request: Request):
    raw_text = payload.get("text") if isinstance(payload, dict) else ""
    provider = payload.get("provider") if isinstance(payload, dict) else "auto"
    plain_text = extract_tafsir_plain_text(raw_text)

    if not plain_text:
        raise HTTPException(status_code=400, detail="لا يوجد نص تفسير صالح للتحسين")

    enforce_tafsir_enhance_guardrails(request, plain_text)

    result = enhance_tafsir_segments(plain_text, provider)
    return {
        "plain_text": plain_text,
        "provider": result["provider"],
        "model": result["model"],
        "segments": result["segments"]
    }

@app.get("/api/verse_audio")
def get_verse_audio(verse_key: str, recitation_id: int | None = None):
    normalized_key = (verse_key or "").strip()
    if ":" not in normalized_key:
        raise HTTPException(status_code=400, detail="صيغة verse_key غير صحيحة")

    resolved_recitation_id = recitation_id or get_default_recitation_id()
    result = api_fetch(
        f"https://apis.quran.foundation/content/api/v4/verses/by_key/{normalized_key}"
        f"?fields=text_uthmani&audio={resolved_recitation_id}"
    )
    if not result:
        raise HTTPException(status_code=503, detail="تعذر تحميل صوت الآية من المزود")

    verse = result.get("verse")
    if not verse:
        raise HTTPException(status_code=404, detail="الآية المطلوبة غير موجودة")

    audio = verse.get("audio") or {}
    audio_url = normalize_audio_url(audio.get("url"))
    if not audio_url:
        raise HTTPException(status_code=404, detail="لا يوجد ملف صوتي متاح لهذه الآية")

    return {
        "verse_key": verse.get("verse_key", normalized_key),
        "verse_text": verse.get("text_uthmani", ""),
        "recitation_id": resolved_recitation_id,
        "audio_url": audio_url
    }

@app.get("/api/recitations")
def get_recitations():
    global recitations_resource_cache

    if not recitations_resource_cache or not (recitations_resource_cache.get("recitations") or []):
        recitations_resource_cache = api_fetch(
            "https://apis.quran.foundation/content/api/v4/resources/recitations?language=ar"
        ) or {}

    recitations = []
    for recitation in recitations_resource_cache.get("recitations") or []:
        translated_name = recitation.get("translated_name") or {}
        style = str(recitation.get("style") or "").strip()
        translated_style = f" - {style}" if style else ""
        display_name = translated_name.get("name") or recitation.get("reciter_name") or f"القارئ {recitation.get('id')}"
        recitations.append({
            "id": recitation.get("id"),
            "name": display_name,
            "style": style,
            "label": f"{display_name}{translated_style}"
        })

    if not recitations:
        raise HTTPException(status_code=503, detail="تعذر تحميل قائمة القراء")

    return {
        "default_recitation_id": get_default_recitation_id(),
        "recitations": recitations
    }

@app.get("/api/rub_recitation")
def get_rub_recitation(rub_number: int, recitation_id: int | None = None, count: int = 1):
    normalized_rub = max(1, min(240, int(rub_number)))
    normalized_count = max(1, min(8, int(count)))
    resolved_recitation_id = recitation_id or get_default_recitation_id()

    audio_files = []
    current_rub = normalized_rub

    for _ in range(normalized_count):
        current_audio_files = fetch_rub_recitation_audio_files(resolved_recitation_id, current_rub)
        if current_audio_files is None:
            raise HTTPException(status_code=503, detail="تعذر تحميل تلاوة الربع من المزود")
        audio_files.extend(current_audio_files)
        current_rub = 1 if current_rub >= 240 else current_rub + 1

    if not audio_files:
        raise HTTPException(status_code=404, detail="لا توجد ملفات صوتية متاحة لهذا الربع")

    return {
        "rub_number": normalized_rub,
        "count": normalized_count,
        "recitation_id": resolved_recitation_id,
        "audio_files": audio_files
    }

@app.get("/api/rub_word_timings")
def get_rub_word_timings(rub_number: int, recitation_id: int | None = None, count: int = 1):
    normalized_rub = max(1, min(240, int(rub_number)))
    normalized_count = max(1, min(8, int(count)))
    resolved_recitation_id = recitation_id or get_default_recitation_id()

    verse_keys = []
    chapter_numbers = set()
    current_rub = normalized_rub

    for _ in range(normalized_count):
        if offline_data and str(current_rub) in offline_data.get("rubs", {}):
            verses = offline_data["rubs"][str(current_rub)]
        else:
            verses = fetch_paginated_verses(
                f"https://apis.quran.foundation/content/api/v4/verses/by_rub/{current_rub}?fields=text_uthmani"
            )
            if verses is None:
                raise HTTPException(status_code=503, detail="تعذر تحميل توقيتات كلمات الربع من المزود")

        for verse in verses:
            verse_key = verse.get("verse_key")
            if not verse_key:
                continue
            verse_keys.append(verse_key)
            chapter_number = verse.get("chapter_id") or parse_chapter_number(verse_key)
            if chapter_number:
                chapter_numbers.add(int(chapter_number))

        current_rub = 1 if current_rub >= 240 else current_rub + 1

    if not verse_keys:
        raise HTTPException(status_code=404, detail="لا توجد آيات متاحة لتوقيتات الكلمات")

    verse_key_set = set(verse_keys)
    word_timings = {}

    for chapter_number in sorted(chapter_numbers):
        chapter_timings = fetch_chapter_recitation_segments(resolved_recitation_id, chapter_number)
        if not chapter_timings:
            continue
        for verse_key, timing_data in chapter_timings.items():
            if verse_key in verse_key_set:
                word_timings[verse_key] = timing_data

    return {
        "rub_number": normalized_rub,
        "count": normalized_count,
        "recitation_id": resolved_recitation_id,
        "word_timings": word_timings
    }

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

@app.get("/quran_offline.json")
def get_offline_json():
    # Serve the offline dataset directly for PWA functionality
    if os.path.exists(OFFLINE_FILE):
        with open(OFFLINE_FILE, "r", encoding="utf-8") as f:
            return Response(content=f.read(), media_type="application/json")
    raise HTTPException(status_code=404, detail="File not found")

# Mount legacy static UI only when the folder exists.
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
