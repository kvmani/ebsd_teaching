"""Small EBSD indexing service used by the teaching app.

The code here deliberately mirrors only the minimal parts of the research
pipeline needed for teaching:

1. read two real Ni EBSD patterns from the copied DA.oh5 file
2. build a kikuchipy detector from the OH5 header pattern center and tilts
3. run kikuchipy/PyEBSDIndex Hough indexing for the selected pattern
4. return compact JSON for browser overlays

This is not a replacement for the full analyzer. It is a transparent bridge
between real indexing output and student-facing visuals.
"""

from __future__ import annotations

import json
import math
import shutil
import tempfile
from importlib import metadata as package_metadata
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import h5py
import kikuchipy as kp
import numpy as np
import yaml
from diffpy.structure import Atom, Lattice, Structure
from orix.crystal_map import Phase, PhaseList


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "da-ni"
PUBLIC_DATA_DIR = ROOT / "public" / "teaching-data" / "da-ni"
SOURCE_OH5 = DATA_DIR / "DA.oh5"
OPTIONS_YML = DATA_DIR / "bandDetectorOptionsDebug.yml"
EXAMPLES_JSON = PUBLIC_DATA_DIR / "da_indexing_examples.json"


@dataclass(frozen=True)
class ScanMetadata:
    scan_name: str
    n_rows: int
    n_columns: int
    pattern_shape: tuple[int, int]
    pattern_count: int
    pc: tuple[float, float, float]
    sample_tilt_deg: float
    camera_elevation_deg: float
    camera_azimuth_deg: float
    working_distance_mm: float
    phase_name: str
    space_group: int
    lattice: list[float]
    hkl_list: list[list[int]]


def load_options() -> dict[str, Any]:
    with OPTIONS_YML.open("r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def temporary_h5_copy() -> Path:
    """Return a .h5 copy because this kikuchipy install does not read .oh5."""

    tmp = Path(tempfile.gettempdir()) / "ebsd_teaching_da.h5"
    shutil.copyfile(SOURCE_OH5, tmp)
    return tmp


def first_scan_name(h5: h5py.File) -> str:
    for name in h5:
        if name not in {"Manufacturer", "Version"}:
            return name
    raise ValueError("No EBSD scan group found in DA.oh5")


def read_scan_metadata() -> ScanMetadata:
    options = load_options()
    phase = options["phase_list"]
    with h5py.File(SOURCE_OH5, "r") as h5:
        scan_name = first_scan_name(h5)
        header = h5[f"{scan_name}/EBSD/Header"]
        data = h5[f"{scan_name}/EBSD/Data"]
        pc = (
            float(header["Pattern Center Calibration/x-star"][0]),
            float(header["Pattern Center Calibration/y-star"][0]),
            float(header["Pattern Center Calibration/z-star"][0]),
        )
        return ScanMetadata(
            scan_name=scan_name,
            n_rows=int(header["nRows"][0]),
            n_columns=int(header["nColumns"][0]),
            pattern_shape=(
                int(header["Pattern Height"][0]),
                int(header["Pattern Width"][0]),
            ),
            pattern_count=int(data["Pattern"].shape[0]),
            pc=pc,
            sample_tilt_deg=float(header["Sample Tilt"][0]),
            camera_elevation_deg=float(header["Camera Elevation Angle"][0]),
            camera_azimuth_deg=float(header["Camera Azimuthal Angle"][0]),
            working_distance_mm=float(header["Working Distance"][0]),
            phase_name=phase["name"],
            space_group=int(phase["space_group"]),
            lattice=[float(v) for v in phase["lattice"]],
            hkl_list=[[int(v) for v in hkl] for hkl in options["hkl_list"]],
        )


def read_pattern_by_linear_index(index: int) -> np.ndarray:
    with h5py.File(SOURCE_OH5, "r") as h5:
        scan_name = first_scan_name(h5)
        patterns = h5[f"{scan_name}/EBSD/Data/Pattern"]
        if index < 0 or index >= patterns.shape[0]:
            raise IndexError(f"Pattern index {index} outside real pattern stack")
        return np.asarray(patterns[index], dtype=np.float32)


def read_scalar_data(name: str) -> np.ndarray | None:
    with h5py.File(SOURCE_OH5, "r") as h5:
        scan_name = first_scan_name(h5)
        data = h5[f"{scan_name}/EBSD/Data"]
        if name not in data:
            return None
        return np.asarray(data[name])


def choose_representative_indices(count: int = 2) -> list[int]:
    """Pick real patterns with useful contrast without running indexing first."""

    curated_for_teaching = [21, 23]
    meta = read_scan_metadata()
    if all(index < meta.pattern_count for index in curated_for_teaching[:count]):
        # These DA-Ni pixels give the clearest visual correspondence between
        # selected PyEBSDIndex peaks and visible Kikuchi band centerlines.  The
        # choice is deliberately pedagogical: a worked example must be easy to
        # audit visually before students inspect the numerical tables.
        return curated_for_teaching[:count]

    iq = read_scalar_data("IQ")
    ci = read_scalar_data("CI")
    valid_limit = meta.pattern_count
    scores = []
    for idx in range(valid_limit):
        iq_score = float(iq[idx]) if iq is not None and idx < len(iq) else 0.0
        ci_score = float(ci[idx]) if ci is not None and idx < len(ci) else 0.0
        pattern = read_pattern_by_linear_index(idx)
        contrast_score = float(np.percentile(pattern, 99) - np.percentile(pattern, 1))
        scores.append((iq_score + 100.0 * ci_score + 0.01 * contrast_score, idx))
    scores.sort(reverse=True)
    if count == 1:
        return [scores[0][1]]
    # Use one very strong pattern and one central-field pattern when possible.
    first = scores[0][1]
    central_candidates = [idx for _, idx in scores if idx != first and 10 <= idx <= 28]
    second = central_candidates[0] if central_candidates else scores[1][1]
    return [first, second]


def make_phase_list() -> PhaseList:
    phase_cfg = load_options()["phase_list"]
    phase = Phase(
        name=phase_cfg["name"],
        space_group=int(phase_cfg["space_group"]),
        structure=Structure(
            lattice=Lattice(*phase_cfg["lattice"]),
            atoms=[
                Atom(atom["element"], atom["position"])
                for atom in phase_cfg.get("atoms", [{"element": phase_cfg["name"], "position": [0, 0, 0]}])
            ],
        ),
    )
    return PhaseList(phase)


def make_detector(pattern_shape: tuple[int, int], pc: tuple[float, float, float] | None = None):
    meta = read_scan_metadata()
    return kp.detectors.EBSDDetector(
        pattern_shape,
        sample_tilt=meta.sample_tilt_deg,
        tilt=meta.camera_elevation_deg,
        azimuthal=meta.camera_azimuth_deg,
        convention="edax",
        pc=pc or meta.pc,
    )


def normalize_image(pattern: np.ndarray) -> np.ndarray:
    lo, hi = np.percentile(pattern, [1, 99.5])
    if hi <= lo:
        hi = float(pattern.max() or 1)
        lo = float(pattern.min())
    return np.clip((pattern - lo) / (hi - lo), 0, 1)


def array_for_json(values: np.ndarray, digits: int = 6) -> list[Any]:
    """Round numeric arrays so offline teaching JSON stays readable."""

    return np.round(np.asarray(values, dtype=float), digits).tolist()


def fcc_reflector_lookup(hkl_list: list[list[int]], lattice_a_angstrom: float) -> list[dict[str, Any]]:
    """Return the small Ni phase lookup table used by the teaching UI.

    PyEBSDIndex receives a compact list of representative reflector families.
    For students, the important point is that indexing does not invent hkl
    labels from the image; it searches this phase-specific table and its
    symmetry equivalents.
    """

    rows: list[dict[str, Any]] = []
    for family_index, hkl in enumerate(hkl_list, start=1):
        h, k, l = (int(v) for v in hkl)
        norm = math.sqrt(h * h + k * k + l * l) or 1.0
        d_spacing = lattice_a_angstrom / norm
        rows.append(
            {
                "familyIndex": family_index,
                "familyLabel": f"{{{abs(h)}{abs(k)}{abs(l)}}}",
                "representativeHkl": [h, k, l],
                "dSpacingAngstrom": round(float(d_spacing), 6),
                "unitNormalCrystal": array_for_json(np.asarray([h, k, l], dtype=float) / norm),
                "selectionRule": "FCC reflections have h, k, l all odd or all even.",
                "teachingRole": "Candidate Ni plane family used during band voting.",
            }
        )
    return rows


def acute_hkl_angle_deg(first_hkl: list[int], second_hkl: list[int]) -> float:
    """Return the acute angle between two cubic plane normals.

    The lookup table is deliberately simple for teaching: Ni is cubic, so hkl
    plane normals can be compared directly as Cartesian vectors. Symmetry
    equivalents are handled by the indexer, while this table shows the
    representative-family angles students use to understand why a match is
    plausible.
    """

    first = np.asarray(first_hkl, dtype=float)
    second = np.asarray(second_hkl, dtype=float)
    denom = float(np.linalg.norm(first) * np.linalg.norm(second)) or 1.0
    cosine = float(np.clip(np.dot(first, second) / denom, -1.0, 1.0))
    angle = math.degrees(math.acos(cosine))
    return round(float(min(angle, 180.0 - angle)), 4)


def fcc_interplanar_angle_lookup(hkl_list: list[list[int]]) -> list[dict[str, Any]]:
    """All representative-family interplanar angles used in the Ni lookup."""

    rows: list[dict[str, Any]] = []
    for first_index, first_hkl in enumerate(hkl_list, start=1):
        for second_index, second_hkl in enumerate(hkl_list[first_index - 1 :], start=first_index):
            rows.append(
                {
                    "familyAIndex": first_index,
                    "familyBIndex": second_index,
                    "familyA": f"{{{''.join(str(abs(int(v))) for v in first_hkl)}}}",
                    "familyB": f"{{{''.join(str(abs(int(v))) for v in second_hkl)}}}",
                    "hklA": [int(v) for v in first_hkl],
                    "hklB": [int(v) for v in second_hkl],
                    "angleDeg": acute_hkl_angle_deg(first_hkl, second_hkl),
                }
            )
    return rows


def package_version(name: str) -> str:
    try:
        return package_metadata.version(name)
    except package_metadata.PackageNotFoundError:
        return "unknown"


def scientific_conventions(pc: tuple[float, float, float] | None = None) -> dict[str, Any]:
    """Reference-frame notes used by the browser worked example.

    Britton et al. define the pattern centre as the point where the central
    gnomonic projection axis meets the detector plane. The UI uses this
    compact convention block so students can see which vector frame each value
    belongs to before comparing the numerical solution.
    """

    meta = read_scan_metadata()
    pcx, pcy, dd = pc or meta.pc
    return {
        "primaryReference": {
            "name": "Britton et al., Tutorial: Crystal orientations and EBSD - Or which way is up?",
            "file": "references/britton_up_down_ebsd.pdf",
            "notes": [
                "Pattern centre is the detector-plane point where the central gnomonic projection axis intersects the screen.",
                "Gnomonic coordinates use x_g = x_d / z_d and y_g = y_d / z_d.",
                "Different EBSD vendors report PCy with different vertical origins; this dataset is read with kikuchipy's EDAX convention.",
            ],
        },
        "patternCenter": {
            "symbol": "PC",
            "components": {
                "PCx": float(pcx),
                "PCy": float(pcy),
                "DD": float(dd),
            },
            "tupleNotation": "PC = (PCx, PCy, DD)",
            "sourceConvention": "EDAX x-star/y-star/z-star from DA.oh5 header, passed to kikuchipy EBSDDetector(convention='edax')",
            "teachingNote": "DD is the normalized detector distance used by the projection model; it is not the SEM working distance.",
        },
        "referenceFrames": [
            {
                "id": "g",
                "name": "gnomonic detector plane",
                "basis": ["X_g", "Y_g"],
                "definition": "2D EBSP coordinate system with (x_g, y_g) = (0, 0) at PC.",
            },
            {
                "id": "d",
                "name": "detector frame",
                "basis": ["X_d", "Y_d", "Z_d"],
                "definition": "3D detector coordinates; Z_d points from the beam interaction point toward the detector screen.",
            },
            {
                "id": "s",
                "name": "sample/map frame",
                "basis": ["X_s", "Y_s", "Z_s"],
                "definition": "Sample coordinate frame used to report orientation relative to the EBSD map.",
            },
            {
                "id": "c",
                "name": "crystal Cartesian frame",
                "basis": ["X_c", "Y_c", "Z_c"],
                "definition": "Orthonormal crystal frame used for vector rotations.",
            },
            {
                "id": "k",
                "name": "lattice / Miller-index frame",
                "basis": ["a", "b", "c"],
                "definition": "Bravais lattice frame used for hkl plane normals and uvw directions.",
            },
        ],
        "orientationNotation": {
            "matrixSymbol": "g",
            "definition": "Orientation matrix mapping crystal Cartesian vectors into the sample frame for this worked example.",
            "eulerConvention": "Bunge ZXZ angles as returned by orix/kikuchipy, reported as (phi1, Phi, phi2).",
        },
    }


def background_correct(pattern: np.ndarray) -> np.ndarray:
    """Simple teaching correction: subtract a blurred background."""

    try:
        from scipy.ndimage import gaussian_filter

        smooth = gaussian_filter(pattern, sigma=18)
        corrected = pattern - smooth
        return normalize_image(corrected)
    except Exception:
        return normalize_image(pattern)


def gnomonic_line_vectors(theta_rad: float, rho: float) -> dict[str, Any]:
    """Return the Hough line's normal and direction in the gnomonic plane."""

    theta = float(theta_rad)
    normal = np.asarray([math.cos(theta), math.sin(theta)], dtype=float)
    direction = np.asarray([-math.sin(theta), math.cos(theta)], dtype=float)
    closest_point = float(rho) * normal
    return {
        "lineEquation": "rho = x_g cos(theta) + y_g sin(theta)",
        "normal_g": array_for_json(normal),
        "direction_g": array_for_json(direction),
        "closestPointToOrigin_g_px": array_for_json(closest_point),
    }


def line_from_theta_rho(theta_rad: float, rho: float, width: int, height: int) -> dict[str, float]:
    """Convert PyEBSDIndex theta/rho output into normalized canvas endpoints.

    ``radon2pole()`` stores ``theta`` in radians, not degrees. The earlier
    teaching overlay treated this value as degrees, which collapsed real Ni
    bands into near-vertical lines. Keeping the solver units explicit makes
    the overlay trace the same Hough peaks used by indexing.
    """

    theta = float(theta_rad)
    cos_t = math.cos(theta)
    sin_t = math.sin(theta)
    cx = width / 2.0
    cy = height / 2.0
    candidates: list[tuple[float, float]] = []
    # PyEBSDIndex converts the selected Radon peak with a bottom-left detector
    # origin after peak detection. Canvas drawing uses the usual top-left image
    # origin, so the vertical term changes sign when the line is projected back.
    # Bottom-left: (x - cx) cos(theta) + (y_bl - cy) sin(theta) = rho.
    # Top-left canvas: (x - cx) cos(theta) - (y_tl - cy) sin(theta) = rho.
    for x in (0.0, float(width - 1)):
        if abs(sin_t) > 1e-6:
            y = ((x - cx) * cos_t - rho) / sin_t + cy
            if 0 <= y <= height - 1:
                candidates.append((x, y))
    for y in (0.0, float(height - 1)):
        if abs(cos_t) > 1e-6:
            x = (rho + (y - cy) * sin_t) / cos_t + cx
            if 0 <= x <= width - 1:
                candidates.append((x, y))
    if len(candidates) < 2:
        # Fallback through the center when rho/theta convention differs.
        dx = -sin_t * width
        dy = cos_t * height
        candidates = [(cx - dx, cy - dy), (cx + dx, cy + dy)]
    p0, p1 = candidates[0], candidates[-1]
    return {
        "x0": float(p0[0] / max(1, width - 1)),
        "y0": float(p0[1] / max(1, height - 1)),
        "x1": float(p1[0] / max(1, width - 1)),
        "y1": float(p1[1] / max(1, height - 1)),
    }


def band_rows_to_json(band_rows: np.ndarray, width: int, height: int) -> list[dict[str, Any]]:
    bands: list[dict[str, Any]] = []
    for row in band_rows:
        valid = bool(row["valid"])
        theta_rad = float(row["theta"])
        theta_deg = math.degrees(theta_rad) % 180.0
        hough_peak_theta_deg = (180.0 - theta_deg) % 180.0
        rho = float(row["rho"])
        line = line_from_theta_rho(theta_rad, rho, width, height)
        match_index = np.asarray(row["band_match_index"]).astype(int).ravel().tolist()
        bands.append(
            {
                **line,
                "valid": valid,
                "thetaRad": theta_rad,
                "thetaDeg": theta_deg,
                "rhoPx": rho,
                "houghPeakThetaDeg": hough_peak_theta_deg,
                "houghPeakRhoPx": -rho,
                "houghMaxLocationIndex": array_for_json(row["maxloc"], digits=3),
                "houghAverageLocationIndex": array_for_json(row["aveloc"], digits=3),
                "widthPx": abs(float(row["width"])),
                "score": float(row["max"]),
                "normalizedScore": float(row["normmax"]),
                "bandMatchIndex": match_index,
                "vectorRepresentation": gnomonic_line_vectors(theta_rad, rho),
            }
        )
    return bands


def attach_matched_poles(
    indexer: Any,
    index_data: np.ndarray,
    indexed_band_data: np.ndarray,
    bands: list[dict[str, Any]],
) -> None:
    """Add matched Miller poles and solver-frame band normals to detected bands."""

    try:
        matched_hkl = indexer.getmatchedpole(index_data, indexed_band_data, float_out=False)[0]
        matched_sample = indexer.getmatchedpole(index_data, indexed_band_data, float_out=True)[0]
        detected_normals = indexer.bandDetectPlan.radonPlan.radon2pole(
            indexed_band_data,
            PC=indexer.PC,
            vendor=indexer.vendor,
        )[0]
    except Exception:
        return
    for band, hkl, sample_vector, detected_normal in zip(bands, matched_hkl, matched_sample, detected_normals):
        hkl_list = np.asarray(hkl, dtype=int).tolist()
        band["matchedCrystalPlane_k"] = hkl_list
        band["matchedSampleNormal_s"] = array_for_json(sample_vector)
        band["detectedBandNormal_d"] = array_for_json(detected_normal)
        band["hklLabel"] = f"({hkl_list[0]} {hkl_list[1]} {hkl_list[2]})"


def solver_hough_intermediates(pattern: np.ndarray, indexer: Any) -> dict[str, Any]:
    """Capture PyEBSDIndex band-detection intermediates for offline teaching.

    This follows the same sequence used inside ``BandDetect.find_bands``:
    Radon transform, convolution, local maxima, and band labeling. The arrays
    are normalized for display but the reported theta/rho values remain in the
    solver's own coordinate system.
    """

    band_plan = indexer.bandDetectPlan
    patterns = pattern.reshape(1, *pattern.shape)
    radon = band_plan.radonPlan.radon_faster(
        patterns,
        band_plan.padding,
        fixArtifacts=False,
        background=band_plan.backgroundsub,
    )
    radon_for_convolution = np.array(radon, copy=True)
    convolved, image_average = band_plan.rdn_conv(radon_for_convolution)
    local_maxima = band_plan.rdn_local_max(convolved)
    band_rows = band_plan.band_label(1, convolved, radon, local_maxima)
    band_rows["normmax"] /= image_average.clip(1e-7).reshape(1, 1)

    r_pad, theta_pad = (int(v) for v in band_plan.padding)
    radon_trim = radon[r_pad:-r_pad, theta_pad:-theta_pad, 0]
    convolved_trim = convolved[r_pad:-r_pad, theta_pad:-theta_pad, 0]
    maxima_trim = local_maxima[r_pad:-r_pad, theta_pad:-theta_pad, 0]
    peak_rows = []
    for row in band_rows[0]:
        rho_index = float(row["maxloc"][0])
        theta_index = float(row["maxloc"][1])
        average_rho_index = float(row["aveloc"][0])
        average_theta_index = float(row["aveloc"][1])
        rho_axis = np.asarray(band_plan.radonPlan.rho)
        theta_axis = np.asarray(band_plan.radonPlan.theta)
        peak_rows.append(
            {
                "thetaDeg": float(np.interp(theta_index, np.arange(len(theta_axis)), theta_axis)),
                "rhoPx": float(np.interp(rho_index, np.arange(len(rho_axis)), rho_axis)),
                "averageThetaDeg": float(np.interp(average_theta_index, np.arange(len(theta_axis)), theta_axis)),
                "averageRhoPx": float(np.interp(average_rho_index, np.arange(len(rho_axis)), rho_axis)),
                "score": float(row["max"]),
                "normalizedScore": float(row["normmax"]),
                "widthPx": abs(float(row["width"])),
                "maxLocationIndex": array_for_json(row["maxloc"], digits=3),
                "averageLocationIndex": array_for_json(row["aveloc"], digits=3),
            }
        )

    return {
        "algorithm": "PyEBSDIndex BandDetect Radon/Hough pipeline via kikuchipy",
        "radonAxes": {
            "thetaDeg": array_for_json(band_plan.radonPlan.theta, digits=3),
            "rhoPx": array_for_json(band_plan.radonPlan.rho, digits=3),
        },
        "parameters": {
            "nBands": int(band_plan.nBands),
            "nTheta": int(band_plan.nTheta),
            "nRho": int(band_plan.nRho),
            "dThetaDeg": float(band_plan.dTheta),
            "dRhoPx": float(band_plan.dRho),
            "rhoMaxPx": float(band_plan.rhoMax),
            "tSigma": float(band_plan.tSigma),
            "rSigma": float(band_plan.rSigma),
        },
        "displayArrays": {
            "radonAccumulator": array_for_json(normalize_image(radon_trim), digits=5),
            "convolvedAccumulator": array_for_json(normalize_image(convolved_trim), digits=5),
            "localMaximaMask": maxima_trim.astype(int).tolist(),
        },
        "peaks": peak_rows,
    }


def run_indexing(pattern_index: int, pc: tuple[float, float, float] | None = None) -> dict[str, Any]:
    meta = read_scan_metadata()
    pattern = read_pattern_by_linear_index(pattern_index).astype(np.uint16)
    signal = kp.signals.EBSD(pattern.reshape(1, 1, *pattern.shape))
    phase_list = make_phase_list()
    detector = make_detector(meta.pattern_shape, pc=pc)
    options = load_options()
    indexer = detector.get_indexer(
        phase_list,
        options["hkl_list"],
        nBands=8,
        tSigma=2,
        rSigma=2,
    )
    xmap, index_data, indexed_band_data = signal.hough_indexing(
        phase_list=phase_list,
        indexer=indexer,
        return_index_data=True,
        return_band_data=True,
        verbose=0,
    )
    euler_rad = xmap.rotations.to_euler()[0]
    euler_deg = [float(math.degrees(v) % 360.0) for v in euler_rad]
    orientation_matrix = np.asarray(xmap.rotations[0].to_matrix()[0], dtype=float)
    height, width = pattern.shape
    bands = band_rows_to_json(indexed_band_data[0], width, height)
    attach_matched_poles(indexer, index_data, indexed_band_data, bands)
    valid_bands = [band for band in bands if band["valid"]]
    return {
        "patternId": f"pattern-{pattern_index:03d}",
        "patternIndex": int(pattern_index),
        "pc": [float(v) for v in (pc or meta.pc)],
        "solverPc": array_for_json(np.asarray(indexer.PC, dtype=float)),
        "solverPcConvention": "kikuchipy/PyEBSDIndex detector PC; PCy is converted from the EDAX header origin before indexing.",
        "eulerDeg": euler_deg,
        "orientationMatrixG": array_for_json(orientation_matrix),
        "orientationMatrixDefinition": "g maps crystal Cartesian vectors in c into sample-frame vectors in s.",
        "fit": float(xmap.prop["fit"][0]),
        "confidence": float(xmap.prop["cm"][0]),
        "patternQuality": float(xmap.prop["pq"][0]),
        "nmatch": int(xmap.prop["nmatch"][0]),
        "indexData": {
            "phase": int(index_data[0, 0]["phase"]),
            "totalVotes": int(index_data[0, 0]["totvotes"]),
            "matchAttempts": np.asarray(index_data[0, 0]["matchattempts"]).astype(int).tolist(),
        },
        "detectedBands": bands,
        "validDetectedBands": valid_bands,
        "matchedBandCount": int(sum(1 for band in valid_bands if band.get("matchedCrystalPlane_k") != [0, 0, 0])),
    }


def metadata_json() -> dict[str, Any]:
    meta = read_scan_metadata()
    return {
        "scanName": meta.scan_name,
        "grid": {"rows": meta.n_rows, "columns": meta.n_columns},
        "patternShape": {"height": meta.pattern_shape[0], "width": meta.pattern_shape[1]},
        "realPatternCount": meta.pattern_count,
        "pc": list(meta.pc),
        "detector": {
            "sampleTiltDeg": meta.sample_tilt_deg,
            "cameraElevationDeg": meta.camera_elevation_deg,
            "cameraAzimuthDeg": meta.camera_azimuth_deg,
            "workingDistanceMm": meta.working_distance_mm,
        },
        "phase": {
            "name": meta.phase_name,
            "spaceGroup": meta.space_group,
            "lattice": meta.lattice,
            "hklList": meta.hkl_list,
            "lookupTable": fcc_reflector_lookup(meta.hkl_list, meta.lattice[0]),
            "interplanarAngles": fcc_interplanar_angle_lookup(meta.hkl_list),
        },
        "source": {
            "oh5": str(SOURCE_OH5.relative_to(ROOT)),
            "yaml": str(OPTIONS_YML.relative_to(ROOT)),
            "references": [
                "references/britton_up_down_ebsd.pdf",
                "references/Introduction_to_Texture_Analysis__Macrotexture_Microtexture_and_Orientation_Mapping.pdf",
            ],
            "schematics": [
                "references/schematic_1.png",
                "references/schematic_2.png",
                "references/schematic_3.png",
            ],
        },
        "software": {
            "kikuchipy": package_version("kikuchipy"),
            "pyebsdindex": package_version("pyebsdindex"),
            "orix": package_version("orix"),
            "h5py": package_version("h5py"),
        },
        "conventions": scientific_conventions(meta.pc),
    }


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
