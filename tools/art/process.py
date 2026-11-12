"""把 art-src/ 的原始 PNG 轉成遊戲用的 WebP，輸出到 public/art/。

- 立繪：從上、左、右三邊對白色背景做 flood fill 去背（不從下緣開始，
  因為白色 T 恤和襯衫會碰到圖片下緣），邊緣依亮度做半透明，避免白邊。
- 背景：直接轉 WebP。
- 女主識別證照片：從設定圖的特寫裁切。
- 小遊戲：地板縮成 1280×720；Q 版角色與道具是一排白底圖組，四邊去背後依透明直欄切開。
- 結局 CG：寬度縮到 1600 以內轉 WebP。

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
EXPRESSIONS = ("normal", "blush", "smile", "surprised", "stern")

# 女主設定圖中「特寫臉部」的裁切框（left, top, right, bottom），比例 7:8
BADGE_BOX = (990, 110, 1410, 590)


def cutout(src: Path, bottom: bool = False) -> Image.Image:
    """bottom=True 時也從下緣去背，並裁掉下方的透明區域（用於整張白底的圖組）。"""
    rgb = Image.open(src).convert("RGB")
    w, h = rgb.size
    filled = rgb.copy()
    seeds = [(x, 0) for x in range(0, w, 3)]
    seeds += [(0, y) for y in range(0, h, 3)] + [(w - 1, y) for y in range(0, h, 3)]
    if bottom:
        seeds += [(x, h - 1) for x in range(0, w, 3)]
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
        out = out.crop(bbox if bottom else (bbox[0], bbox[1], bbox[2], h))
    return out


def split_pieces(img: Image.Image, names: tuple[str, ...]) -> dict[str, Image.Image]:
    """把一排白底去背後的圖組切成單張，由左到右對應 names。

    用連通區塊而不是透明直欄來切：相鄰角色的頭髮可能在水平方向重疊。
    最大的 len(names) 個區塊是主體，其他小碎塊歸給 x 中心最近的主體。
    """
    step = 4
    w, h = img.size
    small = img.getchannel("A").resize((w // step, h // step), Image.BOX)
    lab = small.point(lambda v: 255 if v > 96 else 0)
    sw, sh = lab.size
    px = lab.load()
    boxes: dict[int, list[int]] = {}
    label = 0
    for y in range(sh):
        for x in range(sw):
            if px[x, y] == 255:
                label += 1
                if label >= 255:
                    raise SystemExit("碎塊太多，無法切割")
                ImageDraw.floodfill(lab, (x, y), label)
    hist = lab.histogram()
    sizes = {i: hist[i] for i in range(1, label + 1)}
    main = sorted(sorted(sizes, key=sizes.get, reverse=True)[: len(names)],
                  key=lambda i: lab.point(lambda v, i=i: 255 if v == i else 0).getbbox()[0])
    if len(main) != len(names):
        raise SystemExit(f"找到 {len(main)} 個主體，預期 {len(names)} 個")
    centers = {}
    for i in sizes:
        b = lab.point(lambda v, i=i: 255 if v == i else 0).getbbox()
        centers[i] = (b[0] + b[2]) / 2
    owner = {i: min(main, key=lambda m: abs(centers[m] - centers[i])) for i in sizes}
    out = {}
    for name, m in zip(names, main):
        ids = {i for i, o in owner.items() if o == m}
        part = lab.point(lambda v, ids=ids: 255 if v in ids else 0)
        part = part.filter(ImageFilter.MaxFilter(3)).resize((w, h), Image.NEAREST)
        piece = img.copy()
        piece.putalpha(ImageChops.multiply(img.getchannel("A"), part))
        out[name] = piece.crop(piece.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox())
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


MINIGAME_TOKENS = ("lin", "zhou", "shen", "jia")
MINIGAME_PROPS = ("phone", "copy", "pen")
TOKEN_HEIGHT = 300
PROP_HEIGHT = 260


def process_minigame() -> None:
    src = SRC / "minigame"
    floor = src / "floor.png"
    if floor.exists():
        img = Image.open(floor).convert("RGB").resize((1280, 720), Image.LANCZOS)
        save_webp(img, OUT / "minigame" / "floor.webp", quality=84)
    for sheet, names, height in (
        ("tokens.png", MINIGAME_TOKENS, TOKEN_HEIGHT),
        ("props.png", MINIGAME_PROPS, PROP_HEIGHT),
    ):
        if not (src / sheet).exists():
            continue
        for name, piece in split_pieces(cutout(src / sheet, bottom=True), names).items():
            scale = height / piece.size[1]
            piece = piece.resize((round(piece.size[0] * scale), height), Image.LANCZOS)
            save_webp(piece, OUT / "minigame" / f"{name}.webp", quality=88)


def process_cg() -> None:
    for src in sorted((SRC / "cg").glob("*.png")):
        img = Image.open(src).convert("RGB")
        if img.size[0] > 1600:
            img = img.resize((1600, round(img.size[1] * 1600 / img.size[0])), Image.LANCZOS)
        save_webp(img, OUT / "cg" / f"{src.stem}.webp", quality=84)


if __name__ == "__main__":
    only = sys.argv[1] if len(sys.argv) > 1 else "all"
    if only in ("all", "sprites"):
        process_sprites()
    if only in ("all", "bg"):
        process_backgrounds()
    if only in ("all", "badge"):
        process_badge()
    if only in ("all", "minigame"):
        process_minigame()
    if only in ("all", "cg"):
        process_cg()
