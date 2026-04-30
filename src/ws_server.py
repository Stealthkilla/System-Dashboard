import asyncio
import json
import psutil
import websockets

async def cpu_live_handler(websocket):
    try:
        while True:
            cpu = psutil.cpu_percent(interval=None)
            await websocket.send(json.dumps({"cpu": cpu}))
            await asyncio.sleep(0.3)
    except websockets.exceptions.ConnectionClosed:
        pass


async def main():
    async with websockets.serve(cpu_live_handler, "127.0.0.1", 8765):
        print("WebSocket läuft auf ws://127.0.0.1:8765")
        await asyncio.Future()  # läuft für immer