import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Dashboard } from '../Dashboard';

// Mock the useTelemetry hook
vi.mock('../../hooks/useTelemetry', () => ({
  useTelemetry: vi.fn(() => ({
    data: null,
    connected: false,
    mode: 'dummy',
  })),
}));

// Mock lucide-react to avoid SVG rendering issues in tests
vi.mock('lucide-react', () => ({
  Eye: () => <span data-testid="icon-eye">Eye</span>,
  AlertTriangle: () => <span data-testid="icon-alert">AlertTriangle</span>,
  Phone: () => <span data-testid="icon-phone">Phone</span>,
  Moon: () => <span data-testid="icon-moon">Moon</span>,
  Activity: () => <span data-testid="icon-activity">Activity</span>,
  Shield: () => <span data-testid="icon-shield">Shield</span>,
  Wifi: () => <span data-testid="icon-wifi">Wifi</span>,
  WifiOff: () => <span data-testid="icon-wifi-off">WifiOff</span>,
}));

describe('Dashboard', () => {
  it('renders without crashing', () => {
    const { container } = render(<Dashboard />);
    expect(container).toBeDefined();
  });

  it('displays the dashboard title', () => {
    render(<Dashboard />);
    expect(screen.getByText('IND-VIAS DualSight DMS Cockpit')).toBeInTheDocument();
  });

  it('shows DISCONNECTED status when not connected', () => {
    render(<Dashboard />);
    expect(screen.getByText('DISCONNECTED')).toBeInTheDocument();
  });

  it('shows initializing message when no data is available', () => {
    render(<Dashboard />);
    expect(screen.getByText('Initializing telemetry...')).toBeInTheDocument();
  });

  it('shows LIVE status when connected with data', async () => {
    const { useTelemetry } = await import('../../hooks/useTelemetry');
    const mockedUseTelemetry = vi.mocked(useTelemetry);

    mockedUseTelemetry.mockReturnValue({
      data: {
        timestamp: Date.now(),
        driverState: 'attentive' as any,
        headPose: { yaw: 0, pitch: 0, roll: 0 },
        gaze: { x: 0.5, y: 0.5, onRoad: true },
        drowsiness: { perclos: 5, blinkRate: 15, blinkDuration: 150, yawnCount: 0, score: 10 },
        distraction: { score: 5, gazeOffRoad: false, duration_ms: 0 },
        seatbelt: { worn: true, confidence: 0.99 },
        phoneSuspicion: { detected: false, confidence: 0, handPosition: 'on_wheel' },
        confidence: { overall: 0.95, faceDetected: true, eyesVisible: true, quality: 'good' },
        adasFusion: { ready: true, laneKeepAssist: true, collisionWarning: true, speedAdaptation: true, integrationScore: 95 },
      },
      connected: true,
      mode: 'dummy',
    });

    render(<Dashboard />);
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });
});
