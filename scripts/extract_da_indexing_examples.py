"""Generate real Ni EBSD teaching assets from the copied DA.oh5 file."""

from __future__ import annotations

import sys
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from python_backend.indexing_core import (  # noqa: E402
    EXAMPLES_JSON,
    PUBLIC_DATA_DIR,
    background_correct,
    choose_representative_indices,
    metadata_json,
    normalize_image,
    read_pattern_by_linear_index,
    run_indexing,
    solver_hough_intermediates,
    write_json,
    make_detector,
    make_phase_list,
    load_options,
    read_scan_metadata,
)


def save_gray(path: Path, image: np.ndarray, cmap: str = "gray") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    plt.imsave(path, image, cmap=cmap)


def save_solver_hough_assets(pattern_dir: Path, raw: np.ndarray, indexer: object) -> dict[str, object]:
    solver_hough = solver_hough_intermediates(raw.astype(np.uint16), indexer)
    radon = np.asarray(solver_hough["displayArrays"]["radonAccumulator"], dtype=float)
    convolved = np.asarray(solver_hough["displayArrays"]["convolvedAccumulator"], dtype=float)
    maxima = np.asarray(solver_hough["displayArrays"]["localMaximaMask"], dtype=float)
    save_gray(pattern_dir / "solver_radon_accumulator.png", radon, cmap="gray")
    save_gray(pattern_dir / "solver_hough_convolved.png", convolved, cmap="gray")

    theta_axis = np.asarray(solver_hough["radonAxes"]["thetaDeg"], dtype=float)
    rho_axis = np.asarray(solver_hough["radonAxes"]["rhoPx"], dtype=float)
    fig, ax = plt.subplots(figsize=(6, 4), dpi=120)
    ax.imshow(
        convolved,
        cmap="gray",
        aspect="auto",
        extent=[
            theta_axis[0],
            theta_axis[-1],
            rho_axis[-1],
            rho_axis[0],
        ],
    )
    peak_theta = [peak["thetaDeg"] for peak in solver_hough["peaks"]]
    peak_rho = [peak["rhoPx"] for peak in solver_hough["peaks"]]
    ax.scatter(peak_theta, peak_rho, s=34, c="white", edgecolors="black", linewidths=0.6)
    ax.set_xlabel("theta / deg")
    ax.set_ylabel("rho / px")
    ax.set_title("PyEBSDIndex Hough peaks")
    fig.tight_layout()
    fig.savefig(pattern_dir / "solver_hough_peaks.png")
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(6, 4), dpi=120)
    ax.imshow(convolved, cmap="gray", aspect="auto")
    y, x = np.nonzero(maxima)
    ax.scatter(x, y, s=4, c="#dff8d3", alpha=0.35)
    ax.set_title("Local maxima mask over convolved Hough space")
    ax.set_axis_off()
    fig.tight_layout(pad=0)
    fig.savefig(pattern_dir / "solver_local_maxima.png")
    plt.close(fig)
    return {
        "solverHough": solver_hough,
        "houghPeakCount": int(len(solver_hough["peaks"])),
        "houghPeaks": solver_hough["peaks"],
    }


def draw_band_overlay(path: Path, image: np.ndarray, bands: list[dict[str, object]], title: str, show_hkl: bool = False) -> None:
    fig, ax = plt.subplots(figsize=(5.8, 5.8), dpi=140)
    ax.imshow(image, cmap="gray")
    height, width = image.shape
    for index, band in enumerate(bands):
        if not band.get("valid", True):
            continue
        x0 = float(band["x0"]) * (width - 1)
        y0 = float(band["y0"]) * (height - 1)
        x1 = float(band["x1"]) * (width - 1)
        y1 = float(band["y1"]) * (height - 1)
        ax.plot([x0, x1], [y0, y1], color="#62d7f0", linewidth=1.4, alpha=0.9)
        if show_hkl:
            label = str(band.get("hklLabel") or f"band {index + 1}")
            ax.text(x0 + 4, y0 + 12, label, color="#ffe7b1", fontsize=7, weight="bold")
    ax.set_title(title)
    ax.set_axis_off()
    fig.tight_layout(pad=0)
    fig.savefig(path)
    plt.close(fig)


def build_examples() -> dict[str, object]:
    PUBLIC_DATA_DIR.mkdir(parents=True, exist_ok=True)
    indices = choose_representative_indices(2)
    meta = read_scan_metadata()
    phase_list = make_phase_list()
    detector = make_detector(meta.pattern_shape)
    options = load_options()
    indexer = detector.get_indexer(
        phase_list,
        options["hkl_list"],
        nBands=8,
        tSigma=2,
        rSigma=2,
    )
    examples = []
    for example_number, pattern_index in enumerate(indices):
        pattern_id = f"pattern-{pattern_index:03d}"
        pattern_dir = PUBLIC_DATA_DIR / pattern_id
        raw = read_pattern_by_linear_index(pattern_index)
        raw_normalized = normalize_image(raw)
        corrected = background_correct(raw)
        save_gray(pattern_dir / "raw.png", raw_normalized)
        save_gray(pattern_dir / "corrected.png", corrected)
        hough_payload = save_solver_hough_assets(pattern_dir, raw, indexer)
        indexing = run_indexing(pattern_index)
        draw_band_overlay(
            pattern_dir / "bands_overlay.png",
            corrected,
            indexing["validDetectedBands"],
            "Selected Hough peaks projected on corrected pattern",
        )
        draw_band_overlay(
            pattern_dir / "solved_indexed_overlay.png",
            corrected,
            indexing["validDetectedBands"],
            "Solved Ni band assignment",
            show_hkl=True,
        )
        write_json(pattern_dir / "indexing_summary.json", {**indexing, **hough_payload})
        examples.append(
            {
                "id": pattern_id,
                "role": "mainWorkedExample" if example_number == 0 else "comparisonPattern",
                "patternIndex": pattern_index,
                "rawImage": f"/teaching-data/da-ni/{pattern_id}/raw.png",
                "correctedImage": f"/teaching-data/da-ni/{pattern_id}/corrected.png",
                "houghImage": f"/teaching-data/da-ni/{pattern_id}/solver_radon_accumulator.png",
                "houghConvolvedImage": f"/teaching-data/da-ni/{pattern_id}/solver_hough_convolved.png",
                "houghPeaksImage": f"/teaching-data/da-ni/{pattern_id}/solver_hough_peaks.png",
                "houghLocalMaximaImage": f"/teaching-data/da-ni/{pattern_id}/solver_local_maxima.png",
                "bandsOverlayImage": f"/teaching-data/da-ni/{pattern_id}/bands_overlay.png",
                "solvedOverlayImage": f"/teaching-data/da-ni/{pattern_id}/solved_indexed_overlay.png",
                "summary": {**indexing, **hough_payload},
            }
        )
    payload = {
        "metadata": metadata_json(),
        "examples": examples,
        "manifestVersion": 2,
        "teachingNotes": [
            "The Hough/Radon accumulator, convolved accumulator, local maxima, and peaks are generated from the PyEBSDIndex band-detection pipeline used by kikuchipy.",
            "The indexing values are real kikuchipy/PyEBSDIndex outputs for the copied DA Ni scan, with Britton et al. used for reference-frame nomenclature.",
            "Manual student bands in the browser are compared against the current solved overlay; they are not yet passed directly into PyEBSDIndex.",
        ],
    }
    write_json(EXAMPLES_JSON, payload)
    return payload


def main() -> None:
    payload = build_examples()
    print(f"Wrote {EXAMPLES_JSON}")
    for example in payload["examples"]:
        print(
            f"{example['id']}: index={example['patternIndex']} "
            f"fit={example['summary']['fit']:.3f} "
            f"confidence={example['summary']['confidence']:.3f}"
        )


if __name__ == "__main__":
    main()
