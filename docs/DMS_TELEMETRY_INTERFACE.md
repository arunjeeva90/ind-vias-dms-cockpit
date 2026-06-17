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

## Message Schema (v1.0)

Each message is a single JSON object conforming to the `DmsTelemetryMessage` interface. All fields are required unless noted otherwise. All score values use 0.0 to 1.0 range unless explicitly named as ms, deg, sec, or kph.

### Full JSON Example

```json
{
  "schemaVersion": "1.0",
  "source": "python-poc-sender",
  "timestampMs": 1718400000000,
  "frameId": 42,
  "fps": 10,
  "connection": {
    "pipelineMode": "LIVE",
    "cameraHealth": "OK",
    "trackingStatus": "LOCKED"
  },
  "driverState": {
    "overall": "NORMAL",
    "drowsinessState": "NORMAL",
    "distractionState": "NORMAL",
    "availabilityState": "AVAILABLE",
    "confidenceState": "HIGH",
    "primaryCause": "none",
    "secondaryCause": "",
    "recommendedAction": "NO_ACTION"
  },
  "scores": {
    "attention": 0.91,
    "drowsiness": 0.12,
    "distraction": 0.05,
    "availability": 0.88,
    "dmsConfidence": 0.95,
    "cameraQuality": 0.92
  },
  "headPose": {
    "yawDeg": -5.2,
    "pitchDeg": 3.1,
    "rollDeg": -1.0
  },
  "gaze": {
    "x": 0.52,
    "y": 0.48,
    "zone": "forward",
    "onRoad": true,
    "eyesOffRoadMs": 0,
    "confidence": 0.95
  },
  "eyes": {
    "leftOpen": true,
    "rightOpen": true,
    "leftOpenness": 0.85,
    "rightOpenness": 0.87,
    "blinkRatePerMin": 15.2,
    "blinkDurationMs": 150,
    "perclos5s": 0.03,
    "perclos60s": 0.05
  },
  "behaviour": {
    "seatbeltFastened": true,
    "phoneDetected": false,
    "phoneConfidence": 0.02,
    "smokingDetected": false,
    "yawnDetected": false,
    "occlusionDetected": false,
    "talkingDetected": false,
    "headDownDetected": false
  },
  "vehicle": {
    "speedKph": 85.3,
    "steeringAngleDeg": -2.1,
    "indicator": "OFF",
    "gear": "D"
  },
  "adasFusion": {
    "ready": true,
    "integrationScore": 0.82,
    "forwardTtcSec": null,
    "riskFusionState": "normal"
  }
}
```

## Field Reference

### Top-Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `schemaVersion` | string | Schema version (currently `"1.0"`) |
| `source` | string | Identifier for the telemetry source (e.g., `"python-poc-sender"`, `"dms-pipeline-v2"`) |
| `timestampMs` | number | Unix timestamp in milliseconds when the frame was processed |
| `frameId` | number | Monotonically incrementing integer frame counter |
| `fps` | number | Nominal frames per second of the telemetry source |

### connection

Pipeline connection and health status.

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `pipelineMode` | string | `"DUMMY"`, `"LIVE"`, `"REPLAY"` | Current pipeline operating mode |
| `cameraHealth` | string | `"OK"`, `"DEGRADED"`, `"FAILED"` | Camera hardware health status |
| `trackingStatus` | string | `"LOCKED"`, `"SEARCHING"`, `"LOST"` | Face/head tracking lock status |

### driverState

The classified driver state output with severity levels.

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `overall` | string | `"NORMAL"`, `"MONITOR"`, `"WARNING"`, `"DANGER"`, `"DEGRADED"` | Overall driver state severity |
| `drowsinessState` | string | `"NORMAL"`, `"MONITOR"`, `"WARNING"`, `"DANGER"` | Drowsiness severity level |
| `distractionState` | string | `"NORMAL"`, `"MONITOR"`, `"WARNING"`, `"DANGER"` | Distraction severity level |
| `availabilityState` | string | `"AVAILABLE"`, `"LIMITED"`, `"UNAVAILABLE"` | Driver availability for takeover |
| `confidenceState` | string | `"HIGH"`, `"MEDIUM"`, `"LOW"`, `"DEGRADED"` | Confidence in the classification |
| `primaryCause` | string | - | Primary cause of the current state (e.g., `"none"`, `"drowsiness"`, `"phone_use"`) |
| `secondaryCause` | string | - | Secondary contributing cause |
| `recommendedAction` | string | `"NO_ACTION"`, `"SILENT_MONITOR"`, `"VISUAL_WARNING"`, `"AUDIO_WARNING"`, `"HAPTIC_WARNING"`, `"ADAS_ESCALATION"` | Recommended system response |

### scores

Continuous metric scores from the DMS algorithms. All values normalized to **0.0 to 1.0** range.

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `attention` | number | 0.0 - 1.0 | Overall attention score |
| `drowsiness` | number | 0.0 - 1.0 | Composite drowsiness score |
| `distraction` | number | 0.0 - 1.0 | Composite distraction score |
| `availability` | number | 0.0 - 1.0 | Driver availability score |
| `dmsConfidence` | number | 0.0 - 1.0 | Overall DMS system confidence |
| `cameraQuality` | number | 0.0 - 1.0 | Camera image quality score |

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
| `zone` | string | - | Named gaze zone (e.g., `"forward"`, `"left_mirror"`, `"right_mirror"`, `"off_road"`) |
| `onRoad` | boolean | - | Whether the driver's gaze is directed at the road |
| `eyesOffRoadMs` | number | milliseconds | Continuous time eyes have been off-road |
| `confidence` | number | 0.0 - 1.0 | Confidence in gaze estimation |

### eyes

Individual eye metrics from the DMS camera.

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `leftOpen` | boolean | - | Whether the left eye is open |
| `rightOpen` | boolean | - | Whether the right eye is open |
| `leftOpenness` | number | 0.0 - 1.0 | Left eye aperture (0 = closed, 1 = fully open) |
| `rightOpenness` | number | 0.0 - 1.0 | Right eye aperture (0 = closed, 1 = fully open) |
| `blinkRatePerMin` | number | blinks/min | Blink frequency in blinks per minute |
| `blinkDurationMs` | number | milliseconds | Average blink duration |
| `perclos5s` | number | 0.0 - 1.0 | PERCLOS over the last 5 seconds |
| `perclos60s` | number | 0.0 - 1.0 | PERCLOS over the last 60 seconds |

### behaviour

Non-driving behaviour detection results.

| Field | Type | Description |
|-------|------|-------------|
| `seatbeltFastened` | boolean | Whether the seatbelt is detected as fastened |
| `phoneDetected` | boolean | Whether a phone is detected in the driver's hand |
| `phoneConfidence` | number | Confidence in phone detection (0.0 - 1.0) |
| `smokingDetected` | boolean | Whether smoking behaviour is detected |
| `yawnDetected` | boolean | Whether a yawn is currently detected |
| `occlusionDetected` | boolean | Whether face occlusion is detected |
| `talkingDetected` | boolean | Whether the driver appears to be talking |
| `headDownDetected` | boolean | Whether head-down posture is detected |

### vehicle

Vehicle state data (from CAN bus or simulation). Nullable fields may be `null` when data is unavailable.

| Field | Type | Unit | Description |
|-------|------|------|-------------|
| `speedKph` | number \| null | km/h | Current vehicle speed |
| `steeringAngleDeg` | number \| null | degrees | Current steering wheel angle |
| `indicator` | string \| null | - | Turn indicator state: `"OFF"`, `"LEFT"`, `"RIGHT"`, `"HAZARD"`, or `null` |
| `gear` | string \| null | - | Current gear (e.g., `"D"`, `"R"`, `"P"`, `"N"`) or `null` |

### adasFusion

ADAS (Advanced Driver Assistance Systems) integration status.

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `ready` | boolean | - | Whether the ADAS fusion system is ready |
| `integrationScore` | number | 0.0 - 1.0 | Overall ADAS-DMS integration quality |
| `forwardTtcSec` | number \| null | seconds | Time-to-collision estimate (null when not applicable) |
| `riskFusionState` | string | - | Risk fusion assessment (e.g., `"normal"`, `"elevated"`, `"critical"`) |

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

4. **Set the `schemaVersion`** to `"1.0"` to ensure compatibility.

5. **Use a descriptive `source`** identifier (e.g., `"ind-vias-dms-v2"`) for debugging.

Example integration pseudocode:

```python
import websockets
import json
import asyncio
import time

async def serve_telemetry(websocket, path):
    frame_id = 0
    while True:
        frame = your_dms_pipeline.get_latest_frame()
        message = {
            "schemaVersion": "1.0",
            "source": "your-dms-pipeline",
            "timestampMs": int(time.time() * 1000),
            "frameId": frame_id,
            "fps": 10,
            "connection": {
                "pipelineMode": "LIVE",
                "cameraHealth": "OK",
                "trackingStatus": "LOCKED"
            },
            # ... all other fields from your pipeline
        }
        await websocket.send(json.dumps(message))
        frame_id += 1
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

4. **Check `schemaVersion`:** Must be `"1.0"` for the current dashboard version.

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
