#!/usr/bin/env python3
"""
DMS Telemetry WebSocket Sender - PoC Example

Sends simulated DMS telemetry data at 10Hz over WebSocket.
The message format matches the DmsTelemetryMessage interface defined in
src/types/dmsTelemetryContract.ts.

Usage:
    pip install websockets && python tools/dms_ws_sender_example.py

This starts a WebSocket server on ws://localhost:8765/dms and broadcasts
simulated telemetry to all connected clients at 10Hz (100ms intervals).
"""

import asyncio
import json
import math
import time
import random
from typing import Set

try:
    import websockets
    from websockets.server import WebSocketServerProtocol
except ImportError:
    print("ERROR: 'websockets' package not found.")
    print("Install it with: pip install websockets")
    raise SystemExit(1)

# Configuration
HOST = "localhost"
PORT = 8765
PATH = "/dms"
SEND_RATE_HZ = 10
SEND_INTERVAL_S = 1.0 / SEND_RATE_HZ

# Connected clients
connected_clients: Set[WebSocketServerProtocol] = set()

# Frame counter
frame_id = 0
start_time = time.time()


def generate_telemetry_message(t: float, frame: int) -> dict:
    """
    Generate a DmsTelemetryMessage matching the TypeScript contract.

    Uses sin-wave patterns to simulate realistic changing values for
    head pose, gaze, drowsiness, and distraction.

    Args:
        t: elapsed time in seconds since start
        frame: current frame number
    """
    # Sin-wave helpers at different frequencies for variety
    sin_slow = math.sin(t * 0.3)       # ~20s period
    sin_med = math.sin(t * 0.7)        # ~9s period
    sin_fast = math.sin(t * 1.5)       # ~4s period
    sin_micro = math.sin(t * 3.0)      # ~2s period
    cos_slow = math.cos(t * 0.25)
    cos_med = math.cos(t * 0.6)

    # Head pose: simulate natural head movement in degrees
    yaw_deg = sin_slow * 25 + sin_fast * 5        # -30 to 30 deg
    pitch_deg = sin_med * 15 + sin_micro * 3       # -18 to 18 deg
    roll_deg = cos_slow * 8 + sin_fast * 2         # -10 to 10 deg

    # Gaze: normalized 0-1 with center bias
    gaze_x = 0.5 + sin_slow * 0.3 + sin_fast * 0.05
    gaze_y = 0.5 + cos_med * 0.2 + sin_micro * 0.05
    gaze_x = max(0.0, min(1.0, gaze_x))
    gaze_y = max(0.0, min(1.0, gaze_y))

    # On-road determination: off-road when gaze deviates significantly
    on_road = abs(gaze_x - 0.5) < 0.25 and abs(gaze_y - 0.5) < 0.3
    off_road_duration_ms = 0 if on_road else int(abs(sin_slow) * 3000)

    # Drowsiness: builds up with slow sin wave
    drowsiness_base = (sin_slow + 1.0) / 2.0  # 0 to 1
    drowsiness = max(0.0, min(1.0, drowsiness_base * 0.7 + sin_micro * 0.1))

    # Fatigue: correlated with drowsiness but lagging
    fatigue = max(0.0, min(1.0, drowsiness * 0.8 + cos_slow * 0.1))

    # Distraction: peaks when gaze goes off-road
    distraction = max(0.0, min(1.0, (1.0 - float(on_road)) * 0.7 + sin_fast * 0.15))

    # Alertness: inverse of drowsiness/distraction
    alertness = max(0.0, min(1.0, 1.0 - (drowsiness * 0.5 + distraction * 0.5)))

    # PERCLOS: percentage of eye closure over time
    perclos = max(0.0, min(1.0, drowsiness * 0.6 + sin_micro * 0.1))

    # Blink metrics
    blink_rate = max(0.0, min(1.0, 0.3 + drowsiness * 0.4 + sin_fast * 0.1))
    blink_duration_ms = max(0.0, min(1.0, 0.2 + drowsiness * 0.5))

    # Yawn count: increases with drowsiness
    yawn_count = max(0.0, min(1.0, drowsiness * 0.4))

    # Phone confidence: occasional spikes
    phone_spike = max(0.0, sin_slow * 0.3 + cos_med * 0.2)
    phone_confidence = max(0.0, min(1.0, phone_spike))

    # Driver state determination based on scores
    if drowsiness > 0.6:
        primary_state = "drowsy"
    elif fatigue > 0.5:
        primary_state = "fatigued"
    elif distraction > 0.5:
        primary_state = "distracted"
    elif phone_confidence > 0.4:
        primary_state = "phone_use"
    else:
        primary_state = "attentive"

    # State confidence: higher when clearly in a state
    state_confidence = max(0.6, min(1.0, 0.7 + abs(sin_med) * 0.3))

    # Eye openness: decreases with drowsiness
    left_openness = max(0.0, min(1.0, 0.9 - drowsiness * 0.5 + sin_micro * 0.05))
    right_openness = max(0.0, min(1.0, 0.9 - drowsiness * 0.5 + cos_med * 0.03))

    # Vehicle simulation
    speed_kph = 80 + sin_slow * 30 + sin_fast * 5       # 45-115 kph
    steering_angle = yaw_deg * 0.3 + sin_fast * 2       # correlated with head yaw
    brake_pressure = max(0.0, min(1.0, (1.0 + cos_med) * 0.15))
    turn_signal = abs(sin_slow) > 0.9                   # occasional

    # ADAS fusion
    integration_score = max(0.0, min(1.0, 0.7 + cos_slow * 0.2 + sin_fast * 0.05))
    collision_warning = distraction > 0.6 and speed_kph > 90

    # Connection stats
    uptime = t
    latency_ms = 5 + abs(sin_fast) * 10 + random.random() * 2
    dropped_frames = int(t * 0.01)  # slow accumulation

    message = {
        "schemaVersion": "1.0.0",
        "source": "python-poc-sender",
        "timestampMs": int(time.time() * 1000),
        "frameId": frame,
        "fps": SEND_RATE_HZ,
        "connection": {
            "latencyMs": round(latency_ms, 1),
            "droppedFrames": dropped_frames,
            "uptime": round(uptime, 1),
        },
        "driverState": {
            "primary": primary_state,
            "secondary": None,
            "confidence": round(state_confidence, 3),
        },
        "scores": {
            "drowsiness": round(drowsiness, 4),
            "distraction": round(distraction, 4),
            "fatigue": round(fatigue, 4),
            "alertness": round(alertness, 4),
            "perclos": round(perclos, 4),
            "blinkRate": round(blink_rate, 4),
            "blinkDurationMs": round(blink_duration_ms, 4),
            "yawnCount": round(yawn_count, 4),
            "phoneConfidence": round(phone_confidence, 4),
        },
        "headPose": {
            "yawDeg": round(yaw_deg, 2),
            "pitchDeg": round(pitch_deg, 2),
            "rollDeg": round(roll_deg, 2),
        },
        "gaze": {
            "x": round(gaze_x, 4),
            "y": round(gaze_y, 4),
            "onRoad": on_road,
            "offRoadDurationMs": off_road_duration_ms,
        },
        "eyes": {
            "leftOpenness": round(left_openness, 4),
            "rightOpenness": round(right_openness, 4),
            "leftVisible": True,
            "rightVisible": True,
        },
        "behaviour": {
            "seatbeltWorn": True,
            "seatbeltConfidence": 0.95,
            "phoneDetected": phone_confidence > 0.3,
            "phoneHandPosition": "right" if phone_confidence > 0.3 else "none",
            "smokingDetected": False,
        },
        "vehicle": {
            "speedKph": round(speed_kph, 1),
            "steeringAngleDeg": round(steering_angle, 1),
            "brakePressure": round(brake_pressure, 3),
            "turnSignalActive": turn_signal,
        },
        "adasFusion": {
            "ready": True,
            "laneKeepAssist": True,
            "collisionWarning": collision_warning,
            "speedAdaptation": speed_kph > 100,
            "integrationScore": round(integration_score, 4),
        },
    }

    return message


async def handler(websocket: WebSocketServerProtocol, path: str = "") -> None:
    """Handle a new WebSocket connection."""
    # Accept connections on /dms path (or root for flexibility)
    if path and path != PATH and path != "/":
        await websocket.close(4004, f"Invalid path: {path}. Use {PATH}")
        return

    connected_clients.add(websocket)
    client_addr = websocket.remote_address
    print(f"[+] Client connected: {client_addr} (total: {len(connected_clients)})")

    try:
        # Keep connection alive; we are sending, not receiving
        async for _ in websocket:
            pass  # Ignore any messages from clients
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        connected_clients.discard(websocket)
        print(f"[-] Client disconnected: {client_addr} (total: {len(connected_clients)})")


async def broadcast_telemetry() -> None:
    """Broadcast telemetry messages to all connected clients at 10Hz."""
    global frame_id

    print(f"[*] Broadcasting telemetry at {SEND_RATE_HZ}Hz...")

    while True:
        if connected_clients:
            elapsed = time.time() - start_time
            message = generate_telemetry_message(elapsed, frame_id)
            payload = json.dumps(message)

            # Broadcast to all connected clients
            disconnected = set()
            for client in connected_clients.copy():
                try:
                    await client.send(payload)
                except websockets.exceptions.ConnectionClosed:
                    disconnected.add(client)

            connected_clients.difference_update(disconnected)
            frame_id += 1

        await asyncio.sleep(SEND_INTERVAL_S)


async def main() -> None:
    """Start the WebSocket server and telemetry broadcast loop."""
    print(f"=" * 60)
    print(f"  DMS Telemetry WebSocket Sender (PoC)")
    print(f"  Endpoint: ws://{HOST}:{PORT}{PATH}")
    print(f"  Rate: {SEND_RATE_HZ} Hz")
    print(f"  Schema: v1.0.0")
    print(f"=" * 60)
    print()

    # Start WebSocket server
    server = await websockets.serve(handler, HOST, PORT)
    print(f"[*] WebSocket server listening on ws://{HOST}:{PORT}{PATH}")
    print(f"[*] Waiting for clients to connect...")
    print()

    # Start the broadcast loop
    broadcast_task = asyncio.create_task(broadcast_telemetry())

    try:
        await asyncio.Future()  # Run forever
    except asyncio.CancelledError:
        pass
    finally:
        broadcast_task.cancel()
        server.close()
        await server.wait_closed()
        print("\n[*] Server shut down.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[*] Interrupted by user. Shutting down...")
