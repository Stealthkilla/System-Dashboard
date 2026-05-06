import asyncio
import json
import psutil
import websockets

async def handler(websocket):
    try:
        while True:
            cpu = psutil.cpu_percent(interval=None)
            await websocket.send(json.dumps({"cpu": cpu}))
            await asyncio.sleep(0.3)
    except websockets.exceptions.ConnectionClosed:
        pass

async def main():
    async with websockets.serve(handler, "0.0.0.0", 8765):
        print("WebSocket läuft auf ws://0.0.0.0:8765")
        await asyncio.Future()