# Vicharak Ethernet integration report

Browser URL on the laptop: **http://localhost:3000/**

Launch: `npm install`, `cp .env.example .env`, `npm run dev -- --host 0.0.0.0`.

Implemented environment-based board endpoints, version 1 runtime validation through the existing WebSocketTelemetryProvider, infinite exponential reconnection, explicit dummy fallback, direct browser-managed annotated MJPEG video, video retries, 2-second stale-data warning with dimmed last values, and 3-second health polling. The cockpit styling, surrounding information cards, and Three.js head are retained. Live mode does not render a simulated cabin or driver.

## Validation

- `npm ci`: passed from the committed lockfile.
- Requested dev command launched on `0.0.0.0:3000`; laptop HTML and Dashboard module both returned HTTP 200.

- `npm run lint`: passed with zero warnings.
- `npm run build`: passed. Vite retains a non-blocking warning about the existing large Three.js/chart bundle.
- `npm test -- --run`: 68 tests passed across 7 test files.
- Tests cover valid/malformed payloads, environment URLs, freshness, WebSocket reconnect/backoff/cleanup, video failure/retry/recovery, dashboard warnings, explicit dummy mode, health cadence/failure/cleanup, and existing simulation/driver-state behavior.
- Physical board health at `http://192.168.50.2:8080/health` timed out during a 3-second connectivity check. Actual annotated camera output and board telemetry require verification after Ethernet setup. No Ethernet settings were changed automatically.
- Health JSON field assumptions and accepted aliases are documented in README.md because a health response schema was not supplied.

The local `.env` was copied from `.env.example` for the launch check and is ignored by Git.

## All modified or added files

- `.env.example`
- `.eslintrc.cjs`
- `.github/workflows/ci.yml`
- `.gitignore`
- `README.md`
- `docs/VICHARAK_IMPLEMENTATION_REPORT.md`
- `package-lock.json`
- `src/components/Dashboard.tsx`
- `src/components/__tests__/Dashboard.test.tsx`
- `src/components/__tests__/LiveVideo.test.tsx`
- `src/components/cockpit/BottomTimeline.tsx`
- `src/components/cockpit/CenterVideoPanel.tsx`
- `src/components/cockpit/LiveVideo.tsx`
- `src/components/cockpit/RightHeadPanel.tsx`
- `src/components/cockpit/StatusBar.tsx`
- `src/config/vicharak.ts`
- `src/hooks/useBoardHealth.test.tsx`
- `src/hooks/useBoardHealth.ts`
- `src/hooks/useTelemetry.test.tsx`
- `src/hooks/useTelemetry.ts`
- `src/services/__tests__/liveTelemetry.test.ts`
- `src/services/receivers/WebSocketDmsReceiver.ts`
- `src/services/receivers/createDmsReceiver.ts`
- `src/services/telemetry.ts`
- `src/services/validation/validateTelemetry.ts`
- `src/services/websocketTelemetry.ts`
- `src/tests/MockWebSocket.ts`
- `src/tests/telemetryFixture.ts`
- `src/types/dms.ts`
- `src/vite-env.d.ts`
- `tsconfig.json`
- `vite.config.ts`
