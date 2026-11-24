"""Snap full-page screenshots of a local HTML file with headless Chrome.

Usage: python -I shoot.py <html> <out_prefix> <width:height> [<width:height> ...]
Takes a tall window, then trims trailing rows that are plain page background.
"""
import pathlib
import subprocess
import sys
import tempfile

from PIL import Image

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"


def trim_bottom(path: pathlib.Path) -> tuple[int, int]:
    img = Image.open(path).convert("RGB")
    w, h = img.size
    bg = img.getpixel((w // 2, h - 1))
    px = img.load()
    cut = h
    for y in range(h - 1, 0, -1):
        row_has_content = False
        for x in range(0, w, 3):
            r, g, b = px[x, y]
            if abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) > 12:
                row_has_content = True
                break
        if row_has_content:
            cut = min(h, y + 49)  # keep the footer's bottom padding
            break
    img.crop((0, 0, w, cut)).save(path)
    return w, cut


def main() -> None:
    html = pathlib.Path(sys.argv[1]).resolve()
    prefix = pathlib.Path(sys.argv[2]).resolve()
    profile = tempfile.mkdtemp(prefix="shoot-profile-")
    for spec in sys.argv[3:]:
        width, height = (int(v) for v in spec.split(":"))
        out = prefix.with_name(f"{prefix.name}-{width}.png")
        target = html.as_uri()
        win_w = width
        if width < 600:
            # Headless Chrome won't make a window narrower than ~500px,
            # so render the page inside an iframe of the exact width.
            wrapper = pathlib.Path(profile) / "wrap.html"
            wrapper.write_text(
                '<!doctype html><body style="margin:0;background:#0a0a0c">'
                f'<iframe src="{target}" style="border:0;display:block;'
                f'width:{width}px;height:{height}px"></iframe>',
                encoding="utf-8",
            )
            target = wrapper.as_uri()
            win_w = 800
        subprocess.run(
            [
                CHROME,
                "--headless=new",
                "--disable-gpu",
                "--hide-scrollbars",
                "--force-device-scale-factor=1",
                "--allow-file-access-from-files",
                f"--user-data-dir={profile}",
                f"--window-size={win_w},{height}",
                "--virtual-time-budget=6000",
                f"--screenshot={out}",
                target,
            ],
            check=True,
            capture_output=True,
            timeout=90,
        )
        if win_w != width:
            Image.open(out).crop((0, 0, width, height)).save(out)
        print(out.name, trim_bottom(out))


if __name__ == "__main__":
    main()
