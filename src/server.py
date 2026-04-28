from http.server import BaseHTTPRequestHandler, HTTPServer
import json

from stats import collect_stats


class StatsHandler(BaseHTTPRequestHandler):

    def do_GET(self):
        # Pfad, nicht IP
        if self.path == "/stats":
            stats = collect_stats()

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()

            self.wfile.write(
                json.dumps(stats).encode("utf-8")
            )
        else:
            self.send_response(404)
            self.end_headers()


def run_server():
    # 0.0.0.0 = von außen erreichbar
    server = HTTPServer(("0.0.0.0", 8000), StatsHandler)
    print("Server läuft auf Port 8000")
    server.serve_forever()