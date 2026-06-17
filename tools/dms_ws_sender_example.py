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
    eyes_off_road_ms = 0 if on_road else int(abs(sin_slow) * 3000)

    # Gaze zone determination
    if on_road:
        gaze_zone = "forward"
    elif gaze_x < 0.3:
        gaze_zone = "left_mirror"
    elif gaze_x > 0.7:
        gaze_zone = "right_mirror"
    else:
        gaze_zone = "off_road"

    # Drowsiness: builds up with slow sin wave
    drowsiness_base = (sin_slow + 1.0) / 2.0  # 0 to 1
    drowsiness = max(0.0, min(1.0, drowsiness_base * 0.7 + sin_micro * 0.1))

    # Distraction: peaks when gaze goes off-road
    distraction = max(0.0, min(1.0, (1.0 - float(on_road)) * 0.7 + sin_fast * 0.15))

    # Attention: inverse of drowsiness/distraction
    attention = max(0.0, min(1.0, 1.0 - (drowsiness * 0.5 + distraction * 0.5)))

    # Availability
    availability = max(0.0, min(1.0, attention * 0.9))

    # DMS confidence and camera quality
    dms_confidence = max(0.0, min(1.0, 0.9 + cos_slow * 0.08))
    camera_quality = max(0.0, min(1.0, 0.85 + sin_fast * 0.1))

    # PERCLOS: percentage of eye closure over time
    perclos_5s = max(0.0, min(1.0, drowsiness * 0.5 + sin_micro * 0.08))
    perclos_60s = max(0.0, min(1.0, drowsiness * 0.6 + sin_micro * 0.05))

    # Blink metrics
    blink_rate_per_min = max(5.0, min(30.0, 15.0 + drowsiness * 8.0 + sin_fast * 3.0))
    blink_duration_ms = max(80.0, min(600.0, 150.0 + drowsiness * 300.0))

    # Eye openness: decreases with drowsiness
    left_openness = max(0.0, min(1.0, 0.9 - drowsiness * 0.5 + sin_micro * 0.05))
    right_openness = max(0.0, min(1.0, 0.9 - drowsiness * 0.5 + cos_med * 0.03))
    left_open = left_openness > 0.2
    right_open = right_openness > 0.2

    # Phone detection: occasional spikes
    phone_spike = max(0.0, sin_slow * 0.3 + cos_med * 0.2)
    phone_confidence = max(0.0, min(1.0, phone_spike))
    phone_detected = phone_confidence > 0.4

    # Yawn detection: more frequent during drowsiness
    yawn_detected = drowsiness > 0.5 and random.random() < 0.02

    # Driver state determination
    if drowsiness > 0.7:
        overall_state = "DANGER"
        drowsiness_state = "DANGER"
        recommended_action = "ADAS_ESCALATION"
        primary_cause = "severe_drowsiness"
    elif drowsiness > 0.5:
        overall_state = "WARNING"
        drowsiness_state = "WARNING"
        recommended_action = "AUDIO_WARNING"
        primary_cause = "drowsiness"
    elif distraction > 0.5:
        overall_state = "WARNING"
        drowsiness_state = "NORMAL"
        recommended_action = "VISUAL_WARNING"
        primary_cause = "gaze_off_road"
    elif drowsiness > 0.3 or distraction > 0.3:
        overall_state = "MONITOR"
        drowsiness_state = "MONITOR" if drowsiness > 0.3 else "NORMAL"
        recommended_action = "SILENT_MONITOR"
        primary_cause = "early_drowsiness" if drowsiness > distraction else "mild_distraction"
    else:
        overall_state = "NORMAL"
        drowsiness_state = "NORMAL"
        recommended_action = "NO_ACTION"
        primary_cause = "none"

    # Distraction state
    if distraction > 0.7:
        distraction_state = "DANGER"
    elif distraction > 0.5:
        distraction_state = "WARNING"
    elif distraction > 0.3:
        distraction_state = "MONITOR"
    else:
        distraction_state = "NORMAL"

    # Availability state
    if overall_state == "DANGER":
        availability_state = "UNAVAILABLE"
    elif overall_state == "WARNING":
        availability_state = "LIMITED"
    else:
        availability_state = "AVAILABLE"

    # Confidence state
    if dms_confidence > 0.8:
        confidence_state = "HIGH"
    elif dms_confidence > 0.6:
        confidence_state = "MEDIUM"
    elif dms_confidence > 0.4:
        confidence_state = "LOW"
    else:
        confidence_state = "DEGRADED"

    # Vehicle simulation
    speed_kph = 80 + sin_slow * 30 + sin_fast * 5       # 45-115 kph
    steering_angle = yaw_deg * 0.3 + sin_fast * 2       # correlated with head yaw

    # Indicator: occasional
    if abs(sin_slow) > 0.95:
        indicator = "LEFT" if sin_slow > 0 else "RIGHT"
    else:
        indicator = "OFF"

    # ADAS fusion
    adas_ready = drowsiness < 0.6 and distraction < 0.7
    integration_score = max(0.0, min(1.0, 0.7 + cos_slow * 0.2 + sin_fast * 0.05))
    forward_ttc_sec = 2.5 if distraction > 0.5 else None
    risk_fusion_state = "elevated" if drowsiness > 0.6 else "normal"

    message = {
        "schemaVersion": "1.0",
        "source": "python-poc-sender",
        "timestampMs": int(time.time() * 1000),
        "frameId": frame,
        "fps": SEND_RATE_HZ,
        "connection": {
            "pipelineMode": "LIVE",
            "cameraHealth": "OK",
            "trackingStatus": "LOCKED",
        },
        "driverState": {
            "overall": overall_state,
            "drowsinessState": drowsiness_state,
            "distractionState": distraction_state,
            "availabilityState": availability_state,
            "confidenceState": confidence_state,
            "primaryCause": primary_cause,
            "secondaryCause": "",
            "recommendedAction": recommended_action,
        },
        "scores": {
            "attention": round(attention, 4),
            "drowsiness": round(drowsiness, 4),
            "distraction": round(distraction, 4),
            "availability": round(availability, 4),
            "dmsConfidence": round(dms_confidence, 4),
            "cameraQuality": round(camera_quality, 4),
        },
        "headPose": {
            "yawDeg": round(yaw_deg, 2),
            "pitchDeg": round(pitch_deg, 2),
            "rollDeg": round(roll_deg, 2),
        },
        "gaze": {
            "x": round(gaze_x, 4),
            "y": round(gaze_y, 4),
            "zone": gaze_zone,
            "onRoad": on_road,
            "eyesOffRoadMs": eyes_off_road_ms,
            "confidence": round(dms_confidence, 4),
        },
        "eyes": {
            "leftOpen": left_open,
            "rightOpen": right_open,
            "leftOpenness": round(left_openness, 4),
            "rightOpenness": round(right_openness, 4),
            "blinkRatePerMin": round(blink_rate_per_min, 1),
            "blinkDurationMs": round(blink_duration_ms, 1),
            "perclos5s": round(perclos_5s, 4),
            "perclos60s": round(perclos_60s, 4),
        },
        "behaviour": {
            "seatbeltFastened": True,
            "phoneDetected": phone_detected,
            "phoneConfidence": round(phone_confidence, 4),
            "smokingDetected": False,
            "yawnDetected": yawn_detected,
            "occlusionDetected": False,
            "talkingDetected": False,
            "headDownDetected": False,
        },
        "vehicle": {
            "speedKph": round(speed_kph, 1),
            "steeringAngleDeg": round(steering_angle, 1),
            "indicator": indicator,
            "gear": "D",
        },
        "adasFusion": {
            "ready": adas_ready,
            "integrationScore": round(integration_score, 4),
            "forwardTtcSec": forward_ttc_sec,
            "riskFusionState": risk_fusion_state,
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
    print(f"{'=' * 60}")
    print(f"  DMS Telemetry WebSocket Sender (PoC)")
    print(f"  Endpoint: ws://{HOST}:{PORT}{PATH}")
    print(f"  Rate: {SEND_RATE_HZ} Hz")
    print(f"  Schema: v1.0")
    print(f"{'=' * 60}")
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
