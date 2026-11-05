# IND-VIAS DualSight DMS Cockpit

React/TypeScript cockpit for a Vicharak AXON / RK3588 DMS board over Ethernet. The existing dark cockpit, telemetry cards, timelines, and Three.js head visualization are preserved. Live mode displays the board's annotated MJPEG stream directly in an HTML image; video frames never pass through React state or WebSocket.

## Ethernet setup

1. Connect the laptop and Vicharak board by Ethernet (direct cable or a switch).
2. Configure the board Ethernet address as `192.168.50.2/24` and the laptop Ethernet address as `192.168.50.1/24`. Use different addresses in the same subnet. A gateway is not required for a direct link; Wi-Fi can remain connected for internet access.
3. Start the board's DMS service, listening on `0.0.0.0:8080` or its Ethernet interface.
4. Verify `http://192.168.50.2:8080/health` and `http://192.168.50.2:8080/video.mjpg` from the laptop browser.

The board must expose:

| Endpoint | Purpose |
| --- | --- |
| `ws://192.168.50.2:8080/dms` | Version 1 JSON telemetry |
| `http://192.168.50.2:8080/video.mjpg` | Annotated multipart MJPEG video |
| `http://192.168.50.2:8080/health` | JSON protocol and frame counters |

The board must allow the laptop frontend origin (normally `http://localhost:3000`) for health fetches using CORS, and accept that origin on WebSocket connections. The image stream is loaded directly and does not require canvas access. Serve this local setup over HTTP; an HTTPS page cannot load insecure HTTP/WS board endpoints.

## Environment configuration

Copy `.env.example` to `.env`:

```dotenv
VITE_TELEMETRY_MODE=websocket
VITE_VICHARAK_HOST=192.168.50.2
VITE_VICHARAK_PORT=8080
```

Use a bare IPv4 address or hostname for `VITE_VICHARAK_HOST`, without a protocol, port, or path. All three URLs are built from the same host and port. Restart Vite after editing `.env`; for production, rebuild because Vite embeds these values at build time.

Set `VITE_TELEMETRY_MODE=dummy` for explicit offline simulation. Live connection failures never silently switch to dummy data. The top bar clearly labels Dummy mode, and only dummy mode displays the simulated cabin.

## Launch on the laptop

Use Node.js 22 LTS and npm. From the repository directory:

```bash
npm install
cp .env.example .env
npm run dev -- --host 0.0.0.0
```

In Windows PowerShell, `Copy-Item .env.example .env` is equivalent to `cp`.

Open **http://localhost:3000/** on the laptop. From another permitted machine on the LAN, use `http://<laptop-IP>:3000/`; that machine must also be able to reach the board. Port 3000 is strict: if occupied, stop the existing process before launching.

For repeatable dependency installation use `npm ci`; `package-lock.json` is committed.

```bash
npm run lint
npm run build
npm test -- --run
npm run preview -- --host 0.0.0.0
```

Preview uses Vite's preview port, normally 4173. Development uses port 3000.

## Connection and freshness behavior

The top bar displays Connecting, Live, Disconnected, Reconnecting, Telemetry stale, Video unavailable, and Dummy mode. Telemetry and video are independent: working telemetry remains live if video fails, with an additional Video unavailable badge.

Only a validated telemetry message makes the connection Live. If no valid message arrives for **2 seconds**, last known values remain visible but dimmed, with a prominent stale-data warning. Freshness uses local message arrival time, avoiding dependence on synchronized laptop/board clocks. Malformed JSON or invalid fields are rejected without refreshing freshness or replacing the last values.

WebSocket reconnection retries indefinitely at 1, 2, 4, 8, 16, then 30 seconds maximum. A valid message resets backoff. MJPEG errors show a reconnecting placeholder and retry every 2 seconds with a cache-busting URL. Socket handlers, timers, polling requests, and retry loops are cleaned up on unmount. The board provides the annotated driver video; the browser does not draw a second driver or fake cabin in live mode.

Health is fetched immediately and every **3 seconds**, with a 2.5-second request timeout. The diagnostic strip displays protocol version, video frame count, and telemetry frame count. Expected health response:

```json
{"version": 1, "videoFrameCount": 12842, "telemetryFrameCount": 12842}
```

`protocolVersion`, `videoFrames`, and `telemetryFrames` are accepted aliases. Failed health requests mark diagnostics unavailable and label retained counters as the last response; health never substitutes for fresh telemetry. The board's health JSON shape was not otherwise specified, so align its counter names with this documented format.

## Telemetry contract

`src/types/dms.ts` extends the existing dashboard data model with `version`, `frameId`, `vehicle`, and `stream`. Those fields remain optional on the internal model for legacy simulation compatibility, but are required by the version 1 runtime validator on board messages. The active live path uses the existing `WebSocketTelemetryProvider`, not the older `schemaVersion: "1.0"` receiver contract documented in `docs/DMS_TELEMETRY_INTERFACE.md`.

```json
{
  "version": 1,
  "timestamp": 1793880000000,
  "frameId": 12842,
  "driverState": "attentive",
  "headPose": {"yaw": 2.4, "pitch": -1.2, "roll": 0.8},
  "gaze": {"x": 0.51, "y": 0.46, "onRoad": true},
  "drowsiness": {"perclos": 8.5, "blinkRate": 14.2, "blinkDuration": 165, "yawnCount": 0, "score": 7.3},
  "distraction": {"score": 5.0, "gazeOffRoad": false, "duration_ms": 0},
  "seatbelt": {"worn": true, "confidence": 0.96},
  "phoneSuspicion": {"detected": false, "confidence": 2.1, "handPosition": "unknown"},
  "confidence": {"overall": 0.94, "faceDetected": true, "eyesVisible": true, "quality": "good"},
  "adasFusion": {"ready": true, "laneKeepAssist": true, "collisionWarning": true, "speedAdaptation": true, "integrationScore": 94},
  "vehicle": {"speedKph": 25},
  "stream": {"videoUrl": "/video.mjpg", "healthUrl": "/health"}
}
```

Driver states: `attentive`, `drowsy`, `distracted`, `fatigued`, `phone_use`. Timestamp is Unix milliseconds; frameId and yawnCount are nonnegative integers. Gaze coordinates, seatbelt confidence, and overall confidence use 0-1. PERCLOS, drowsiness/distraction scores, phone confidence, and ADAS integration score use 0-100. Angles are degrees; durations are milliseconds; speed is km/h (or null when unavailable). Every consumed numeric value must be finite. The stream metadata is validated but endpoint requests use the configured board host and fixed paths.

## Troubleshooting

- **Wrong IP / no connection:** confirm both Ethernet addresses and subnet masks, check the cable and link LEDs, and open the board health URL directly. `ping 192.168.50.2` can help, although ICMP may be blocked. On Windows, `Test-NetConnection 192.168.50.2 -Port 8080` checks TCP reachability.
- **Firewall:** allow laptop-to-board TCP 8080 and ensure the board service listens on its Ethernet interface, not only loopback. For access to Vite from another machine, allow inbound TCP 3000 on the laptop's appropriate network profile.
- **Health unavailable but video works:** inspect the browser Network tab for CORS rejection and confirm the health counter names above.
- **Telemetry stale:** the board may be connected but not sending valid version 1 messages. Check `/dms` frames in browser developer tools, the version and units above, board processing load, and Ethernet drops. The warning clears only after a fresh valid message arrives.
- **Video unavailable:** open `/video.mjpg` directly; verify the board camera process and `multipart/x-mixed-replace` response with correctly delimited JPEG parts. The browser retries automatically.
- **Connecting indefinitely:** an open socket alone is insufficient; verify the board emits the version 1 payload, rather than the legacy schemaVersion contract.
- **Changes to environment ignored:** restart the dev server or rebuild the production bundle.

## Project layout

- `src/config/vicharak.ts`: shared environment configuration and endpoint URLs.
- `src/services/websocketTelemetry.ts`: validated live provider and reconnection.
- `src/services/validation/validateTelemetry.ts`: version 1 runtime validation.
- `src/hooks/useTelemetry.ts`: lifecycle and 2-second freshness detection.
- `src/hooks/useBoardHealth.ts`: health polling and diagnostic validation.
- `src/components/cockpit/`: cockpit cards, browser-managed video, 3D head, status, and timelines.
- `src/services/dummyTelemetry.ts`: explicit offline simulation.
- `src/services/receivers/` and `useDmsTelemetry`: retained legacy/replay APIs, not the active board path.
- `.github/workflows/ci.yml`: npm ci, lint, production build, and tests on pushes/PRs.

Private - All rights reserved.
