# IND-VIAS DualSight DMS Cockpit

A professional automotive Driver Monitoring System dashboard for visualizing driver state, head pose, gaze, drowsiness, distraction, seatbelt, phone suspicion, DMS confidence, and future ADAS fusion readiness.

This repository currently runs in dummy telemetry mode and is designed to later connect to the real IND-VIAS DMS perception pipeline through WebSocket JSON telemetry.

![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![React](https://img.shields.io/badge/React-18.3-61dafb)
![Vite](https://img.shields.io/badge/Vite-5.4-646cff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

## Features

- **Driver State Monitoring** - Real-time display of driver attention state (attentive, drowsy, distracted, fatigued, phone use)
- **Head Pose Visualization** - 3-axis SVG arc gauges showing yaw, pitch, and roll
- **Gaze Tracking** - 2D windshield visualization with gaze point and trailing path
- **Drowsiness Detection** - PERCLOS gauge, blink rate, blink duration, yawn count, and composite score
- **Distraction Analysis** - Radial gauge with off-road gaze duration tracking
- **Seatbelt Status** - Visual indicator with confidence level
- **Phone Suspicion** - Phone detection with confidence bar and hand position
- **DMS System Confidence** - Overall confidence meter with face/eye detection status
- **ADAS Fusion Readiness** - Integration score with individual system indicators

## Tech Stack

- **React 18** - Component-based UI with hooks
- **TypeScript** - Full type safety with comprehensive DMS telemetry interfaces
- **Vite** - Fast development server and optimized builds
- **Tailwind CSS** - Dark automotive theme with custom colors
- **Recharts** - Data visualization (available for future chart additions)
- **Lucide React** - Professional icon set
- **Vitest** - Unit testing framework

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/arunjeeva90/ind-vias-dms-cockpit.git
cd ind-vias-dms-cockpit

# Install dependencies
npm install

# Start development server
npm run dev
```

The dashboard will be available at `http://localhost:3000`.

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Lint

```bash
npm run lint
```

## Architecture

```
src/
├── types/
│   └── dms.ts              # TypeScript interfaces for all DMS telemetry data
├── services/
│   ├── telemetry.ts        # Provider interface and factory function
│   ├── dummyTelemetry.ts   # Simulated data generator (10Hz, state machine)
│   └── websocketTelemetry.ts # WebSocket provider (for real DMS pipeline)
├── hooks/
│   └── useTelemetry.ts     # React hook for telemetry lifecycle management
├── components/
│   ├── Dashboard.tsx        # Main layout with responsive grid
│   ├── DriverStatePanel.tsx # Central driver state display
│   ├── HeadPoseGauge.tsx    # SVG arc gauges for head orientation
│   ├── GazeVisualization.tsx # 2D gaze tracking on windshield view
│   ├── DrowsinessIndicator.tsx # PERCLOS and drowsiness metrics
│   ├── DistractionIndicator.tsx # Distraction score radial gauge
│   ├── SeatbeltStatus.tsx   # Seatbelt worn/not-worn indicator
│   ├── PhoneSuspicion.tsx   # Phone detection panel
│   ├── DMSConfidence.tsx    # System confidence meter
│   └── ADASFusionReadiness.tsx # ADAS integration status
├── App.tsx                  # Root component
├── main.tsx                 # Entry point
└── index.css                # Tailwind directives and base styles
```

## Telemetry Modes

### Dummy Mode (Default)

The dashboard ships with a sophisticated dummy telemetry provider that:
- Generates data at 10Hz (100ms intervals)
- Uses a state machine to simulate realistic driver behavior patterns
- Smooth transitions between states using linear interpolation
- Simulates: normal driving, getting drowsy, drowsy/fatigued, recovering, phone checks, general distraction

### WebSocket Mode (Future)

To connect to the real IND-VIAS DMS perception pipeline:

```typescript
import { useTelemetry } from './hooks/useTelemetry';

// In your component:
const { data, connected } = useTelemetry({
  mode: 'websocket',
  url: 'ws://your-dms-server:8080/dms'
});
```

The WebSocket provider includes:
- Automatic reconnection with exponential backoff
- JSON message parsing conforming to the DMSTelemetry interface
- Connection status monitoring

## DMS Telemetry Data Format

```typescript
interface DMSTelemetry {
  timestamp: number;
  driverState: DriverState;    // attentive | drowsy | distracted | fatigued | phone_use
  headPose: HeadPose;          // yaw, pitch, roll (-90 to 90 degrees)
  gaze: GazeData;              // x, y (0-1 normalized), onRoad boolean
  drowsiness: DrowsinessMetrics;  // perclos, blinkRate, blinkDuration, yawnCount, score
  distraction: DistractionMetrics; // score, gazeOffRoad, duration_ms
  seatbelt: SeatbeltStatus;    // worn, confidence
  phoneSuspicion: PhoneSuspicion;  // detected, confidence, handPosition
  confidence: DMSConfidence;   // overall, faceDetected, eyesVisible, quality
  adasFusion: ADASFusion;      // ready, laneKeepAssist, collisionWarning, speedAdaptation, integrationScore
}
```

## Color Theme

The dashboard uses a dark automotive theme optimized for in-vehicle displays:

| Color | Hex | Usage |
|-------|-----|-------|
| DMS Dark | `#0a0e17` | Background |
| DMS Panel | `#131a2b` | Panel backgrounds |
| DMS Accent | `#00d4ff` | Primary accent, titles |
| DMS Success | `#00e676` | Attentive state, positive indicators |
| DMS Warning | `#ff6b35` | Distraction, caution |
| DMS Danger | `#ff2d55` | Fatigue, phone use, alerts |

## License

Private - All rights reserved.
