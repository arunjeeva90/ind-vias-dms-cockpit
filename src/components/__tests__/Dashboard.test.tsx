import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Dashboard } from '../Dashboard';
import { useTelemetry } from '../../hooks/useTelemetry';
import { telemetryFixture } from '../../tests/telemetryFixture';
vi.mock('../../hooks/useTelemetry', () => ({ useTelemetry: vi.fn() }));
vi.mock('../../hooks/useBoardHealth', () => ({ useBoardHealth: () => ({ health: { version: 1, videoFrameCount: 100, telemetryFrameCount: 200 }, available: true }) }));
vi.mock('../cockpit/RightHeadPanel', () => ({ RightHeadPanel: () => <div>3D head</div> }));
vi.mock('../cockpit/BottomTimeline', () => ({ BottomTimeline: () => <div>Timeline</div> }));
describe('Dashboard', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_TELEMETRY_MODE', 'websocket');
    vi.mocked(useTelemetry).mockReturnValue({ data: telemetryFixture(), connected: true, mode: 'websocket', state: 'Live', stale: false });
  });
  afterEach(() => { cleanup(); vi.unstubAllEnvs(); });
  it('preserves the cards and 3D head around real video without a simulated cabin', () => {
    const { container } = render(<Dashboard />);
    expect(screen.getByText('IND-VIAS DualSight DMS Cockpit')).toBeInTheDocument(); expect(screen.getByText('3D head')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'http://192.168.50.2:8080/video.mjpg?retry=0');
    expect(container.querySelector('#cvp-bgGrad')).toBeNull(); expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByLabelText('Board diagnostics')).toHaveTextContent('Video frames: 100');
  });
  it('dims last values and shows a prominent stale warning', () => {
    vi.mocked(useTelemetry).mockReturnValue({ data: telemetryFixture(), connected: true, mode: 'websocket', state: 'Live', stale: true });
    render(<Dashboard />); expect(screen.getByRole('alert')).toHaveTextContent('Showing last known values');
    expect(screen.getByTestId('telemetry-panels')).toHaveStyle({ opacity: '0.4' }); expect(screen.getByText('Telemetry stale')).toBeInTheDocument();
  });
  it('shows video unavailable while telemetry remains live', () => {
    render(<Dashboard />); fireEvent.error(screen.getByRole('img'));
    expect(screen.getByText('Video unavailable')).toBeInTheDocument(); expect(screen.getByText('Live')).toBeInTheDocument();
  });
  it('loads video independently while waiting for telemetry', () => {
    vi.mocked(useTelemetry).mockReturnValue({ data: null, connected: false, mode: 'websocket', state: 'Connecting', stale: false });
    render(<Dashboard />); expect(screen.getByRole('img')).toBeInTheDocument(); expect(screen.getByText('Connecting')).toBeInTheDocument();
  });
  it.each(['Disconnected', 'Reconnecting'] as const)('shows %s', state => {
    vi.mocked(useTelemetry).mockReturnValue({ data: telemetryFixture(), connected: false, mode: 'websocket', state, stale: false });
    render(<Dashboard />); expect(screen.getByText(state)).toBeInTheDocument();
  });
  it('selects and labels explicit dummy mode from the environment', () => {
    vi.stubEnv('VITE_TELEMETRY_MODE', 'dummy');
    vi.mocked(useTelemetry).mockReturnValue({ data: telemetryFixture(), connected: true, mode: 'dummy', state: 'Connecting', stale: false });
    const { container } = render(<Dashboard />); expect(screen.getByText('Dummy mode')).toBeInTheDocument();
    expect(useTelemetry).toHaveBeenCalledWith(expect.objectContaining({ mode: 'dummy' }));
    expect(screen.queryByRole('img')).toBeNull(); expect(container.querySelector('#cvp-bgGrad')).not.toBeNull();
  });
});
