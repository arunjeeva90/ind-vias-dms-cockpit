# DMS Telemetry Interface Documentation

## Overview

The IND-VIAS DualSight DMS Cockpit receives telemetry data from the DMS perception pipeline over a WebSocket connection. This document describes the interface contract, message format, and integration instructions.

## WebSocket Endpoint

| Property | Value |
|----------|-------|
| **Protocol** | WebSocket (ws://) |
| **Host** | localhost |
| **Port** | 8765 |
| **Path** | /dms |
| **Full URL** | `ws://localhost:8765/dms` |
| **Message Format** | JSON (UTF-8) |
| **Direction** | Server sends to Client (push model) |
| **Recommended Frequency** | 10 Hz (100ms between messages) |

## Message Schema (v1.0.0)

Each message is a single JSON object conforming to the `DmsTelemetryMessage` interface. All fields are required unless noted otherwise.

### Full JSON Example

```json
{
  "schemaVersion": "1.0.0",
  "source": "python-poc-sender",
  "timestampMs": 1718400000000,
  "frameId": 42,
  "fps": 10,
  "connection": {
    "latencyMs": 8.5,
    "droppedFrames": 0,
    "uptime": 120.3
  },
  "driverState": {
    "primary": "attentive",
    "secondary": null,
    "confidence": 0.92
  },
  "scores": {
    "drowsiness": 0.12,
    "distraction": 0.05,
    "fatigue": 0.08,
    "alertness": 0.91,
    "perclos": 0.03,
    "blinkRate": 0.35,
    "blinkDurationMs": 0.15,
    "yawnCount": 0.0,
    "phoneConfidence": 0.02
  },
  "headPose": {
    "yawDeg": -5.2,
    "pitchDeg": 3.1,
    "rollDeg": -1.0
  },
  "gaze": {
    "x": 0.52,
    "y": 0.48,
    "onRoad": true,
    "offRoadDurationMs": 0
  },
  "eyes": {
    "leftOpenness": 0.85,
    "rightOpenness": 0.87,
    "leftVisible": true,
    "rightVisible": true
  },
  "behaviour": {
    "seatbeltWorn": true,
    "seatbeltConfidence": 0.98,
    "phoneDetected": false,
    "phoneHandPosition": "none",
    "smokingDetected": false
  },
  "vehicle": {
    "speedKph": 85.3,
    "steeringAngleDeg": -2.1,
    "brakePressure": 0.0,
    "turnSignalActive": false
  },
  "adasFusion": {
    "ready": true,
    "laneKeepAssist": true,
    "collisionWarning": false,
    "speedAdaptation": false,
    "integrationScore": 0.82
  }
}
```

## Field Reference

### Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `schemaVersion` | string | Semantic version of the contract (currently `"1.0.0"`) |
| `source` | string | Identifier for the telemetry source (e.g., `"python-poc-sender"`, `"dms-pipeline-v2"`) |
| `timestampMs` | number | Unix timestamp in milliseconds when the frame was processed |
| `frameId` | number | Monotonically incrementing integer frame counter |
| `fps` | number | Nominal frames per second of the telemetry source |

### connection

Connection health metrics between the DMS pipeline and the cockpit.

| Field | Type | Unit | Description |
|-------|------|------|-------------|
| `latencyMs` | number | milliseconds | Round-trip latency of the WebSocket connection |
| `droppedFrames` | number | count | Cumulative number of frames dropped since start |
| `uptime` | number | seconds | Time elapsed since the sender started |

### driverState

The classified driver attention state.

| Field | Type | Description |
|-------|------|-------------|
| `primary` | string | One of: `"attentive"`, `"drowsy"`, `"fatigued"`, `"distracted"`, `"phone_use"` |
| `secondary` | string \| null | Optional secondary state (reserved for future use) |
| `confidence` | number | Confidence in the classification (0.0 to 1.0) |

### scores

Continuous metric scores from the DMS algorithms. All ratio-based scores are normalized to the **0.0 to 1.0** range.

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `drowsiness` | number | 0.0 - 1.0 | Composite drowsiness score |
| `distraction` | number | 0.0 - 1.0 | Composite distraction score |
| `fatigue` | number | 0.0 - 1.0 | Long-term fatigue accumulation |
| `alertness` | number | 0.0 - 1.0 | Overall alertness level (inverse of drowsiness + distraction) |
| `perclos` | number | 0.0 - 1.0 | Percentage of eye closure over time |
| `blinkRate` | number | 0.0 - 1.0 | Normalized blink frequency |
| `blinkDurationMs` | number | 0.0 - 1.0 | Normalized average blink duration |
| `yawnCount` | number | 0.0 - 1.0 | Normalized yawn frequency |
| `phoneConfidence` | number | 0.0 - 1.0 | Confidence of phone usage detection |

### headPose

3D head orientation in degrees relative to the camera frame.

| Field | Type | Unit | Description |
|-------|------|------|-------------|
| `yawDeg` | number | degrees | Horizontal rotation (negative = left, positive = right) |
| `pitchDeg` | number | degrees | Vertical rotation (negative = down, positive = up) |
| `rollDeg` | number | degrees | Tilt rotation (negative = left tilt, positive = right tilt) |

Typical ranges: yaw [-45, 45], pitch [-30, 30], roll [-20, 20] for normal driving.

### gaze

Driver gaze estimation on the windshield plane.

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `x` | number | 0.0 - 1.0 | Horizontal gaze position (0 = left edge, 1 = right edge) |
| `y` | number | 0.0 - 1.0 | Vertical gaze position (0 = top edge, 1 = bottom edge) |
| `onRoad` | boolean | - | Whether the driver's gaze is directed at the road |
| `offRoadDurationMs` | number | milliseconds | Continuous time the gaze has been off-road |

### eyes

Individual eye metrics from the DMS camera.

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `leftOpenness` | number | 0.0 - 1.0 | Left eye aperture (0 = closed, 1 = fully open) |
| `rightOpenness` | number | 0.0 - 1.0 | Right eye aperture (0 = closed, 1 = fully open) |
| `leftVisible` | boolean | - | Whether the left eye is visible to the camera |
| `rightVisible` | boolean | - | Whether the right eye is visible to the camera |

### behaviour

Non-driving behaviour detection results.

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `seatbeltWorn` | boolean | - | Whether the seatbelt is detected as worn |
| `seatbeltConfidence` | number | 0.0 - 1.0 | Confidence in seatbelt detection |
| `phoneDetected` | boolean | - | Whether a phone is detected in the driver's hand |
| `phoneHandPosition` | string | - | Hand holding the phone: `"left"`, `"right"`, `"both"`, or `"none"` |
| `smokingDetected` | boolean | - | Whether smoking behaviour is detected |

### vehicle

Vehicle state data (from CAN bus or simulation).

| Field | Type | Unit | Description |
|-------|------|------|-------------|
| `speedKph` | number | km/h | Current vehicle speed |
| `steeringAngleDeg` | number | degrees | Current steering wheel angle |
| `brakePressure` | number | 0.0 - 1.0 | Normalized brake pedal pressure |
| `turnSignalActive` | boolean | - | Whether a turn signal is currently active |

### adasFusion

ADAS (Advanced Driver Assistance Systems) integration status.

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `ready` | boolean | - | Whether the ADAS fusion system is ready |
| `laneKeepAssist` | boolean | - | Lane keep assist active |
| `collisionWarning` | boolean | - | Forward collision warning active |
| `speedAdaptation` | boolean | - | Adaptive speed control active |
| `integrationScore` | number | 0.0 - 1.0 | Overall ADAS-DMS integration quality |

## Running Modes

### Dummy Mode (No Server Needed)

The dashboard includes a built-in dummy telemetry provider that generates realistic simulated data. This mode is active by default when no WebSocket server is available.

To use dummy mode, simply start the dashboard:

```bash
cd ind-vias-dms-cockpit
npm install
npm run dev
```

The dashboard will attempt to connect to `ws://localhost:8765/dms`. If the server is not available, it automatically falls back to the dummy telemetry provider with a 6-state simulation machine (normal, getting_drowsy, drowsy, recovering, phone_check, distracted).

### Live PoC Sender

To test with a live WebSocket connection using the included Python sender:

**Terminal 1 - Start the Python telemetry sender:**

```bash
pip install websockets
python tools/dms_ws_sender_example.py
```

**Terminal 2 - Start the frontend dashboard:**

```bash
npm install
npm run dev
```

The sender will broadcast simulated telemetry at 10Hz to all connected clients. The dashboard connects automatically.

### Real DMS PoC Integration

To integrate your real DMS perception pipeline, your system must:

1. **Start a WebSocket server** on `ws://localhost:8765/dms` (or configure `VITE_DMS_WS_URL` in the frontend `.env` file).

2. **Send JSON messages** conforming to the `DmsTelemetryMessage` schema (see full example above) at approximately 10Hz.

3. **Include all required fields** - the frontend validates incoming messages and will discard malformed ones.

4. **Set the `schemaVersion`** to `"1.0.0"` to ensure compatibility.

5. **Use a descriptive `source`** identifier (e.g., `"ind-vias-dms-v2"`) for debugging.

Example integration pseudocode:

```python
import websockets
import json
import asyncio

async def serve_telemetry(websocket, path):
    while True:
        frame = your_dms_pipeline.get_latest_frame()
        message = {
            "schemaVersion": "1.0.0",
            "source": "your-dms-pipeline",
            "timestampMs": int(time.time() * 1000),
            "frameId": frame.id,
            "fps": 10,
            # ... all other fields from your pipeline
        }
        await websocket.send(json.dumps(message))
        await asyncio.sleep(0.1)  # 10Hz

asyncio.run(websockets.serve(serve_telemetry, "localhost", 8765))
```

### Custom WebSocket URL

To use a different WebSocket URL, set the environment variable before starting the frontend:

```bash
# Create or edit .env file
echo "VITE_DMS_WS_URL=ws://192.168.1.100:9000/dms" > .env

# Restart the dev server
npm run dev
```

## Troubleshooting

### Dashboard shows "Disconnected" or stays in Dummy mode

1. **Verify the WebSocket server is running:**
   ```bash
   # Check if port 8765 is in use
   lsof -i :8765          # macOS/Linux
   netstat -an | grep 8765 # Windows
   ```

2. **Check the endpoint path:** The server must serve on `/dms` path, not just the root.

3. **Verify JSON format:** Messages must be valid JSON matching the schema. Use the browser DevTools Network tab (WS filter) to inspect messages.

4. **Check CORS/firewall:** If the server is on a different machine, ensure the port is accessible.

### Messages are received but data looks wrong

1. **Verify score ranges:** All scores must be in the 0.0 to 1.0 range. Values outside this range will cause display issues.

2. **Check head pose units:** Head pose uses degrees, not radians.

3. **Verify gaze coordinates:** Gaze x and y must be normalized to 0.0-1.0.

4. **Check `schemaVersion`:** Must be `"1.0.0"` for the current dashboard version.

### High latency or dropped frames

1. **Reduce message frequency:** If your pipeline cannot sustain 10Hz, lower the rate. The dashboard handles variable rates gracefully.

2. **Minimize payload size:** Only include fields that have changed if bandwidth is limited (not recommended - send full messages for reliability).

3. **Check network:** Use `ping` to verify network latency between the DMS system and the dashboard host.

### Python sender crashes or won't start

1. **Install websockets:** `pip install websockets`
2. **Check Python version:** Requires Python 3.7+ (for asyncio.run)
3. **Port already in use:** Another process may be using port 8765. Kill it or change the PORT in the script.

## Message Frequency

| Scenario | Recommended Rate | Notes |
|----------|-----------------|-------|
| Real-time dashboard | 10 Hz | Matches camera frame rate |
| Low-bandwidth link | 5 Hz | Acceptable with minor lag |
| Recording/replay | 10 Hz | Matches original capture rate |
| Stress testing | 30 Hz | For performance validation |

The dashboard's UI updates at 60fps using requestAnimationFrame, interpolating between telemetry messages for smooth visualization regardless of the incoming message rate.
