"""Generate EBSD band-center overlays with PyEBSDIndex.

KikuchiPy delegates Hough/Radon band finding to PyEBSDIndex during indexing.
For this browser-only teaching app we use that same detector engine offline:
read each bundled EBSD image, find Radon peaks, convert them into normalized
canvas line endpoints, and write JSON for the JavaScript renderer.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
from PIL import Image
from pyebsdindex.band_detect import BandDetect


ROOT = Path(__file__).resolve().parents[1]
PATTERN_DIR = ROOT / "public" / "patterns"
OUTPUT_PATH = PATTERN_DIR / "kikuchipy-bands.json"

PATTERNS = [
    {
        "src": "/patterns/ebsd-si-001.png",
        "name": "Si (001), 20 kV",
        "file": PATTERN_DIR / "ebsd-si-001.png",
        "credit": "Wikimedia Commons, FuzzyMagma, CC0",
        "max_bands": 5,
    },
    {
        "src": "/patterns/ebsd-nist.jpg",
        "name": "NIST EBSD pattern",
        "file": PATTERN_DIR / "ebsd-nist.jpg",
        "credit": "NIST / Wikimedia Commons, public domain",
        "max_bands": 5,
    },
    {
        "src": "/patterns/ebsd-si-square.png",
        "name": "Si EBSD detail",
        "file": PATTERN_DIR / "ebsd-si-square.png",
        "credit": "Wikimedia Commons, FuzzyMagma, CC0",
        "max_bands": 6,
    },
]


def line_endpoints(theta_deg: float, rho: float, size: int) -> dict[str, float] | None:
    """Convert Radon normal angle/rho into normalized image endpoints."""
    theta = math.radians(theta_deg)
    cos_theta = math.cos(theta)
    sin_theta = math.sin(theta)
    half = size / 2
    points: list[tuple[float, float]] = []

    for x_centered in (-half, half):
        if abs(sin_theta) > 1e-6:
            y_centered = (rho - x_centered * cos_theta) / sin_theta
            if -half <= y_centered <= half:
                points.append((x_centered + half, y_centered + half))

    for y_centered in (-half, half):
        if abs(cos_theta) > 1e-6:
            x_centered = (rho - y_centered * sin_theta) / cos_theta
            if -half <= x_centered <= half:
                points.append((x_centered + half, y_centered + half))

    unique_points: list[tuple[float, float]] = []
    for point in points:
        if all(abs(point[0] - other[0]) > 1 or abs(point[1] - other[1]) > 1 for other in unique_points):
            unique_points.append(point)

    if len(unique_points) < 2:
        return None

    (x0, y0), (x1, y1) = unique_points[:2]
    return {
        "x0": round(x0 / size, 4),
        "y0": round(y0 / size, 4),
        "x1": round(x1 / size, 4),
        "y1": round(y1 / size, 4),
    }


def detect_pattern_bands(pattern: dict) -> dict:
    size = 420
    image = Image.open(pattern["file"]).convert("L").resize((size, size))
    image_array = np.asarray(image, dtype=np.float32)

    detector = BandDetect(
        patDim=image_array.shape,
        nBands=pattern["max_bands"],
        nTheta=180,
        nRho=90,
    )
    bands = detector.find_bands(image_array[None, :, :], verbose=0)[0]

    detected_bands = []
    for band in bands:
        rho_index = int(round(float(band["aveloc"][0])))
        theta_index = int(round(float(band["aveloc"][1])))
        theta_index = max(0, min(theta_index, len(detector.radonPlan.theta) - 1))
        rho_index = max(0, min(rho_index, len(detector.radonPlan.rho) - 1))
        theta = float(detector.radonPlan.theta[theta_index])
        rho = float(detector.radonPlan.rho[rho_index])
        endpoints = line_endpoints(theta, rho, size)
        if endpoints is None:
            continue

        detected_bands.append(
            {
                **endpoints,
                "thetaDeg": round(theta, 3),
                "rhoPx": round(rho, 3),
                "score": round(float(band["max"]), 6),
                "normalizedScore": round(float(band["normmax"]), 8),
            }
        )

    return {
        "src": pattern["src"],
        "name": pattern["name"],
        "credit": pattern["credit"],
        "bandCenters": detected_bands,
    }


def main() -> None:
    patterns = [detect_pattern_bands(pattern) for pattern in PATTERNS]
    output = {
        "method": "KikuchiPy/PyEBSDIndex offline Radon band detection",
        "notes": (
            "Generated with pyebsdindex.band_detect.BandDetect, the Hough/Radon "
            "band detector used by KikuchiPy's Hough indexing workflow."
        ),
        "patterns": patterns,
    }
    OUTPUT_PATH.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
