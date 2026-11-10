"""把 art-src/ 的原始 PNG 轉成遊戲用的 WebP，輸出到 public/art/。

- 立繪：從上、左、右三邊對白色背景做 flood fill 去背（不從下緣開始，
  因為白色 T 恤和襯衫會碰到圖片下緣），邊緣依亮度做半透明，避免白邊。
- 背景：直接轉 WebP。
- 女主識別證照片：從設定圖的特寫裁切。

只需要 Pillow：python tools/art/process.py
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "art-src"
OUT = ROOT / "public" / "art"

MARK = (255, 0, 255)
# 與白色的容許差（三個通道差值總和）。奶油色開襟衫約 78，淡紫白襯衫約 33，
# 開襟衫高光約 15–25，所以只吃接近純白的像素。
THRESH = 14
# 第二輪：離背景這麼近（px）的白色小區塊（髮絲間的空隙）也視為背景
POCKET_REACH = 14
SPRITE_HEIGHT = 1152
EXPRESSIONS = ("normal", "blush", "smile", "surprised")

# 女主設定圖中「特寫臉部」的裁切框（left, top, right, bottom），比例 7:8
BADGE_BOX = (990, 110, 1410, 590)


def cutout(src: Path) -> Image.Image:
    rgb = Image.open(src).convert("RGB")
    w, h = rgb.size
    filled = rgb.copy()
    seeds = [(x, 0) for x in range(0, w, 3)]
    seeds += [(0, y) for y in range(0, h, 3)] + [(w - 1, y) for y in range(0, h, 3)]
    px = filled.load()
    for xy in seeds:
        r, g, b = px[xy]
        if (255 - r) + (255 - g) + (255 - b) <= THRESH:
            ImageDraw.floodfill(filled, xy, MARK, thresh=THRESH)

    def mask() -> Image.Image:
        diff = ImageChops.difference(filled, Image.new("RGB", (w, h), MARK)).convert("L")
        return diff.point(lambda v: 255 if v == 0 else 0)

    # 第二輪：髮絲之間被包住的白色空隙。只從靠近背景的純白像素開始填，
    # 眼白和牙齒在臉中間，離背景遠，不會被影響。
    for _ in range(2):
        near = mask().filter(ImageFilter.MaxFilter(POCKET_REACH * 2 + 1)).load()
        for y in range(0, h, 2):
            for x in range(0, w, 2):
                if not near[x, y]:
                    continue
                r, g, b = px[x, y]
                if (r, g, b) != MARK and (255 - r) + (255 - g) + (255 - b) <= 6:
                    ImageDraw.floodfill(filled, (x, y), MARK, thresh=THRESH)

    # 背景遮罩：被填成 MARK 的像素
    bg = mask()

    # 邊緣帶：背景外擴 4px 的範圍內，越接近白色越透明
    band = ImageChops.subtract(bg.filter(ImageFilter.MaxFilter(9)), bg)
    lum = rgb.convert("L")
    edge_alpha = lum.point(lambda v: max(0, min(255, (255 - v) * 255 // 50)))
    edge_layer = Image.composite(edge_alpha, Image.new("L", (w, h), 255), band)
    alpha = ImageChops.darker(ImageChops.invert(bg), edge_layer)

    out = rgb.copy()
    out.putalpha(alpha)
    # 去掉完全透明的外框，保留下緣
    bbox = alpha.getbbox()
    if bbox:
        out = out.crop((bbox[0], bbox[1], bbox[2], h))
    return out


def save_webp(img: Image.Image, dest: Path, quality: int = 86) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "WEBP", quality=quality, method=6)
    print(f"{dest.relative_to(ROOT)}  {img.size[0]}x{img.size[1]}  {dest.stat().st_size // 1024} KB")


def process_sprites() -> None:
    for char_dir in sorted((SRC / "characters").iterdir()):
        for expr in EXPRESSIONS:
            src = char_dir / f"{expr}.png"
            if not src.exists():
                continue
            img = cutout(src)
            scale = SPRITE_HEIGHT / Image.open(src).size[1]
            img = img.resize((round(img.size[0] * scale), round(img.size[1] * scale)), Image.LANCZOS)
            save_webp(img, OUT / "characters" / char_dir.name / f"{expr}.webp")


def process_backgrounds() -> None:
    for src in sorted((SRC / "bg").glob("*.png")):
        save_webp(Image.open(src).convert("RGB"), OUT / "bg" / f"{src.stem}.webp", quality=82)


def process_badge() -> None:
    sheet = SRC / "characters" / "lin" / "sheet.png"
    if sheet.exists():
        crop = Image.open(sheet).convert("RGB").crop(BADGE_BOX).resize((280, 320), Image.LANCZOS)
        save_webp(crop, OUT / "characters" / "lin" / "badge.webp", quality=88)


if __name__ == "__main__":
    only = sys.argv[1] if len(sys.argv) > 1 else "all"
    if only in ("all", "sprites"):
        process_sprites()
    if only in ("all", "bg"):
        process_backgrounds()
    if only in ("all", "badge"):
        process_badge()
