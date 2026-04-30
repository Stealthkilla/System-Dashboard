import threading
import asyncio

from server import run_server
import ws_server


def start_http():
    run_server()


def start_ws():
    asyncio.run(ws_server.main())


if __name__ == "__main__":
    threading.Thread(target=start_http, daemon=True).start()
    threading.Thread(target=start_ws, daemon=True).start()

    print("HTTP + WebSocket laufen (STRG+C zum Beenden)")
    input()