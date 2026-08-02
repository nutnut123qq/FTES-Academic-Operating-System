# ponytail: hạ texture nhúng trong GLB (PNG 1024 → JPEG 512) rồi dựng lại file.
#
# Model mascot sinh từ TRELLIS nặng ~2 MB mà gần hết là một tấm PNG 1024 — thừa cho một nhân
# vật cao ~200px trên landing. glTF core chỉ nhận image/png và image/jpeg (WebP phải kèm
# extension EXT_texture_webp), nên hạ về JPEG cho chắc: mọi loader đọc được, không cần extension.
#
# Dùng: python scripts/shrink-glb-texture.py public/mascot/frostes.glb [size] [quality]
import io
import json
import struct
import sys
from pathlib import Path

from PIL import Image

JSON_CHUNK = 0x4E4F534A
BIN_CHUNK = 0x004E4942


def read_glb(path: Path) -> tuple[dict, bytes]:
    data = path.read_bytes()
    _, _, _ = struct.unpack("<III", data[:12])
    offset, js, binary = 12, None, b""
    while offset < len(data):
        length, kind = struct.unpack("<II", data[offset:offset + 8])
        chunk = data[offset + 8:offset + 8 + length]
        if kind == JSON_CHUNK:
            js = json.loads(chunk.decode("utf-8"))
        elif kind == BIN_CHUNK:
            binary = chunk
        offset += 8 + length
    if js is None:
        raise SystemExit("không đọc được chunk JSON")
    return js, binary


def write_glb(path: Path, js: dict, binary: bytes) -> None:
    js_bytes = json.dumps(js, separators=(",", ":")).encode("utf-8")
    js_bytes += b" " * (-len(js_bytes) % 4)
    binary += b"\x00" * (-len(binary) % 4)
    total = 12 + 8 + len(js_bytes) + 8 + len(binary)
    with path.open("wb") as f:
        f.write(struct.pack("<III", 0x46546C67, 2, total))
        f.write(struct.pack("<II", len(js_bytes), JSON_CHUNK))
        f.write(js_bytes)
        f.write(struct.pack("<II", len(binary), BIN_CHUNK))
        f.write(binary)


def main() -> int:
    path = Path(sys.argv[1])
    size = int(sys.argv[2]) if len(sys.argv) > 2 else 512
    quality = int(sys.argv[3]) if len(sys.argv) > 3 else 85

    js, binary = read_glb(path)
    before = path.stat().st_size

    # 1) nén từng ảnh nhúng
    new_blobs: dict[int, bytes] = {}
    for image in js.get("images", []):
        view_index = image.get("bufferView")
        if view_index is None:
            continue
        view = js["bufferViews"][view_index]
        start = view.get("byteOffset", 0)
        raw = binary[start:start + view["byteLength"]]
        img = Image.open(io.BytesIO(raw)).convert("RGB")
        img.thumbnail((size, size), Image.LANCZOS)
        out = io.BytesIO()
        img.save(out, "JPEG", quality=quality, optimize=True)
        new_blobs[view_index] = out.getvalue()
        image["mimeType"] = "image/jpeg"

    if not new_blobs:
        print("không có ảnh nhúng nào để nén")
        return 0

    # 2) dựng lại buffer: nối từng bufferView theo thứ tự, canh mốc 4 byte, cập nhật offset
    order = sorted(range(len(js["bufferViews"])), key=lambda i: js["bufferViews"][i].get("byteOffset", 0))
    rebuilt = bytearray()
    for view_index in order:
        view = js["bufferViews"][view_index]
        blob = new_blobs.get(view_index)
        if blob is None:
            start = view.get("byteOffset", 0)
            blob = binary[start:start + view["byteLength"]]
        rebuilt += b"\x00" * (-len(rebuilt) % 4)
        view["byteOffset"] = len(rebuilt)
        view["byteLength"] = len(blob)
        rebuilt += blob
    js["buffers"][0]["byteLength"] = len(rebuilt)

    write_glb(path, js, bytes(rebuilt))
    after = path.stat().st_size
    print(f"{path.name}: {before // 1024} KB → {after // 1024} KB (texture {size}px, JPEG q{quality})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
