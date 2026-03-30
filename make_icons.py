"""Creates icon PNG files for the Chrome extension using only stdlib (no Pillow needed)."""
import struct, zlib, os

def make_png(size, bg=(5, 150, 105), fg=(255, 255, 255)):
    """Generate a simple solid mint-green PNG with a white circle."""
    pixels = []
    cx, cy, r = size // 2, size // 2, int(size * 0.38)
    ring = int(size * 0.1)
    for y in range(size):
        row = []
        for x in range(size):
            dx, dy = x - cx, y - cy
            dist = (dx*dx + dy*dy) ** 0.5
            if dist < r - ring:        # inner white fill
                row += [fg[0], fg[1], fg[2]]
            elif dist < r:             # ring (mint)
                row += [bg[0], bg[1], bg[2]]
            elif dist < r + ring * 0.7: # outer white
                row += [fg[0], fg[1], fg[2]]
            else:
                row += [bg[0], bg[1], bg[2]]  # bg
        pixels.append(bytes([0] + row))

    raw  = b"".join(pixels)
    data = zlib.compress(raw, 9)

    def chunk(tag, body):
        buf = tag + body
        return struct.pack(">I", len(body)) + buf + struct.pack(">I", zlib.crc32(buf) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    return (b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", ihdr)
            + chunk(b"IDAT", data)
            + chunk(b"IEND", b""))

out_dir = os.path.join(os.path.dirname(__file__), "chrome-extension", "icons")
os.makedirs(out_dir, exist_ok=True)

for size in [16, 48, 128]:
    path = os.path.join(out_dir, f"icon{size}.png")
    with open(path, "wb") as f:
        f.write(make_png(size))
    print(f"Created icon{size}.png  ({os.path.getsize(path)} bytes)")

print("Icons done!")
