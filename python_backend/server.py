"""Local HTTP backend for the real EBSD indexing teaching lab."""

from __future__ import annotations

import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from python_backend.indexing_core import EXAMPLES_JSON, metadata_json, run_indexing


HOST = "127.0.0.1"
PORT = 8765


class TeachingIndexingHandler(BaseHTTPRequestHandler):
    server_version = "EBSDTeachingIndexing/0.1"

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.end_headers()

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/health":
            self.write_json({"ok": True, "service": "EBSD teaching indexing backend"})
            return
        if path == "/api/examples":
            if EXAMPLES_JSON.exists():
                self.write_json(json.loads(EXAMPLES_JSON.read_text(encoding="utf-8")))
            else:
                self.write_json(
                    {
                        "metadata": metadata_json(),
                        "examples": [],
                        "message": "Run scripts/extract_da_indexing_examples.py first.",
                    }
                )
            return
        self.send_error(404, "Unknown endpoint")

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path != "/api/index":
            self.send_error(404, "Unknown endpoint")
            return
        try:
            body = self.read_json_body()
            pattern_index = int(body.get("patternIndex", 0))
            pc_raw = body.get("pc")
            pc = tuple(float(v) for v in pc_raw) if pc_raw is not None else None
            result = run_indexing(pattern_index, pc=pc)
            result["manualBands"] = body.get("manualBands", [])
            result["modeNote"] = (
                "Manual bands are compared in the browser. The current backend re-runs "
                "kikuchipy Hough indexing with the supplied pattern center."
            )
            self.write_json(result)
        except Exception as exc:
            self.write_json({"ok": False, "error": str(exc)}, status=500)

    def read_json_body(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def write_json(self, payload: dict, status: int = 200) -> None:
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, format: str, *args) -> None:
        print(f"{self.address_string()} - {format % args}")


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    print(f"Serving EBSD indexing backend from {root}")
    print(f"Open API health check: http://{HOST}:{PORT}/api/health")
    ThreadingHTTPServer((HOST, PORT), TeachingIndexingHandler).serve_forever()


if __name__ == "__main__":
    main()
