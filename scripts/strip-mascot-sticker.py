# ponytail: bóc viền sticker trắng khỏi 4 pose mascot — peel từ mép vào, chỉ ăn pixel TRẮNG.
# Dừng ngay khi chạm pixel có màu (thân cáo) nên không gặm vào nhân vật.
import sys
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path("public/mascot")
OUT = SRC / "plain"
POSES = ["greeting", "explain", "point", "cheer"]

# pixel coi là "viền trắng": sáng và gần như không bão hoà
WHITE_MIN = 240
SAT_MAX = 10
MAX_PEEL = 60  # trần vòng lặp; thực tế dừng sớm khi không còn gì để bóc


def strip(path: Path) -> tuple[Image.Image, int]:
    im = Image.open(path).convert("RGBA")
    a = np.array(im).astype(np.int16)
    rgb, alpha = a[..., :3], a[..., 3]
    opaque = alpha > 128
    whiteish = (rgb.min(axis=2) >= WHITE_MIN) & (rgb.max(axis=2) - rgb.min(axis=2) <= SAT_MAX)

    peeled = 0
    for _ in range(MAX_PEEL):
        # mép ngoài = opaque nhưng có hàng xóm 4 hướng không opaque (pad True→ coi biên ảnh là trong)
        pad = np.pad(opaque, 1, constant_values=False)
        neighbour_hole = ~(pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:])
        edge = opaque & neighbour_hole & whiteish
        if not edge.any():
            break
        opaque &= ~edge
        peeled += int(edge.sum())

    out = np.array(im)
    out[..., 3] = np.where(opaque, out[..., 3], 0)
    # dọn rìa AA còn sót (alpha thấp) để không để lại quầng trắng mờ
    faint = (out[..., 3] > 0) & (out[..., 3] < 60)
    out[faint, 3] = 0
    return Image.fromarray(bleed_edges(out)), peeled


def bleed_edges(rgba: np.ndarray, rounds: int = 4) -> np.ndarray:
    """Loang MÀU của pixel đục ra vùng trong suốt (giữ nguyên alpha).

    Vùng trong suốt của file gốc mang RGB đen. GPU lọc bilinear/mipmap ở mép sẽ trộn lông
    với đám đen đó → viền tối bám quanh nhân vật khi render (thấy rõ lúc chụp scene 3D).
    Loang màu ra vài pixel thì mẫu lọc lấy trúng màu lông, hết viền tối.
    """
    out = rgba.copy()
    rgb = out[..., :3].astype(np.float32)
    known = out[..., 3] > 0
    for _ in range(rounds):
        pad_known = np.pad(known, 1, constant_values=False).astype(np.float32)
        # chỉ cộng màu của hàng xóm ĐÃ BIẾT, không thì màu đen vùng trong suốt lại lẫn vào
        pad_rgb = np.pad(rgb, ((1, 1), (1, 1), (0, 0))) * pad_known[..., None]
        neigh = (
            pad_rgb[:-2, 1:-1] + pad_rgb[2:, 1:-1] + pad_rgb[1:-1, :-2] + pad_rgb[1:-1, 2:]
        )
        count = (
            pad_known[:-2, 1:-1] + pad_known[2:, 1:-1] + pad_known[1:-1, :-2] + pad_known[1:-1, 2:]
        )
        fill = (~known) & (count > 0)
        if not fill.any():
            break
        avg = np.zeros_like(rgb)
        safe = np.maximum(count, 1)[..., None]
        avg = neigh / safe
        rgb[fill] = avg[fill]
        known = known | fill
    out[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    return out


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    for pose in POSES:
        src = SRC / f"{pose}.webp"
        img, peeled = strip(src)
        dst = OUT / f"{pose}.webp"
        img.save(dst, "WEBP", quality=90, method=6, exact=True)
        print(f"{pose}: bóc {peeled} px viền -> {dst} ({dst.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
