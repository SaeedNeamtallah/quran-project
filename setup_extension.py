"""
setup_extension.py — إعداد إضافة كروم بومودورو قرآني
شغّله مرة واحدة: python setup_extension.py
"""
import shutil
from pathlib import Path

BASE  = Path(__file__).parent
EXT   = BASE / "chrome-extension"
ICONS = EXT / "icons"

print("=" * 45)
print("   إعداد إضافة كروم — بومودورو قرآني")
print("=" * 45)

# 1) Create icons folder
ICONS.mkdir(parents=True, exist_ok=True)
print("\n[1/3] مجلد الأيقونات ✓")

# 2) Resize icon using Pillow
try:
    from PIL import Image

    # Look for a source icon
    candidates = [ICONS / "icon_src.png"] + list(BASE.glob("*.png")) + list((BASE / "static").glob("*.png"))
    src = next((candidate for candidate in candidates if candidate.exists()), None)

    if src:
        img = Image.open(src).convert("RGBA")
        for size in [16, 48, 128]:
            out = ICONS / f"icon{size}.png"
            img.resize((size, size), Image.LANCZOS).save(out, "PNG")
            print(f"         icon{size}.png ✓")
        print("[2/3] الأيقونات ✓")
    else:
        # Create simple colored square as fallback
        img = Image.new("RGBA", (128, 128), (5, 150, 105, 255))
        for size in [16, 48, 128]:
            img.resize((size, size)).save(ICONS / f"icon{size}.png", "PNG")
        print("[2/3] أيقونات بديلة (مينت) ✓")

except ImportError:
    # Fallback: write minimal valid 1x1 green PNG as placeholder
    import struct, zlib

    def make_png(size=16, color=(5, 150, 105)):
        """Create a simple solid-color PNG."""
        def chunk(name, data):
            c = name + data
            return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)
        ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
        raw  = b"".join(b"\x00" + bytes(color) * size for _ in range(size))
        idat = zlib.compress(raw)
        return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")

    for size in [16, 48, 128]:
        (ICONS / f"icon{size}.png").write_bytes(make_png(size))
    print("[2/3] أيقونات بسيطة (بدون Pillow) ✓")
    print("       لتحسينها: pip install pillow && python setup_extension.py")

# 3) Copy quran data
print("\n[3/3] نسخ الملفات الكبيرة...")

quran_src = BASE / "quran_offline.json"
quran_dst = EXT  / "quran_offline.json"
if quran_src.exists():
    action = "تحديث" if quran_dst.exists() else "نسخ"
    print(f"      جاري {action} quran_offline.json (~8MB)...", end="", flush=True)
    shutil.copy2(quran_src, quran_dst)
    print(" ✓")
else:
    print("      ✗ quran_offline.json غير موجود!")
    print("        شغّل أولاً: python download_quran.py")

alarm_src = BASE / "static" / "alarm.m4a"
alarm_dst = EXT  / "alarm.m4a"
if alarm_src.exists():
    shutil.copy2(alarm_src, alarm_dst)
    print("      alarm.m4a ✓")
else:
    print("      alarm.m4a غير موجود (الإضافة ستعمل بدون صوت)")

# 4) Summary
print("\n" + "=" * 45)
print("   ✅ الإعداد مكتمل!")
print("=" * 45)
print(f"\nمجلد الإضافة:\n  {EXT}\n")
print("لتثبيت الإضافة في كروم:")
print("  1. افتح:  chrome://extensions")
print("  2. فعّل:  Developer mode  (أعلى يمين)")
print("  3. اضغط: Load unpacked")
print(f"  4. اختر:  {EXT}")
print()

# List what's in the folder
print("الملفات الموجودة:")
for f in sorted(EXT.rglob("*")):
    if f.is_file():
        size = f.stat().st_size
        label = f"{size/1024:.0f}KB" if size > 1024 else f"{size}B"
        print(f"  {f.relative_to(EXT)}  [{label}]")
