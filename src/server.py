from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
import json
import mimetypes

from stats import collect_stats

WEB_ROOT = Path(__file__).parent.parent / "web"


print(WEB_ROOT)
print(WEB_ROOT.exists())


class StatsHandler(BaseHTTPRequestHandler):

    def do_GET(self):
        if self.path == "/stats":
            self.handle_stats()
        else:
            self.handle_static()

    def handle_stats(self):
        stats = collect_stats()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(stats).encode("utf-8"))

    def handle_static(self):
        if self.path == "/":
            file_path = WEB_ROOT / "index.html"
        else:
            file_path = WEB_ROOT / self.path.lstrip("/")

        if not file_path.exists() or not file_path.is_file():
            self.send_response(404)
            self.end_headers()
            return

        content_type, _ = mimetypes.guess_type(file_path)
        self.send_response(200)
        self.send_header("Content-Type", content_type or "application/octet-stream")
        self.end_headers()
        self.wfile.write(file_path.read_bytes())


def run_server():
    server = HTTPServer(("127.0.0.1", 8000), StatsHandler)
    print("Server läuft auf http://127.0.0.1:8000")
    server.serve_forever()