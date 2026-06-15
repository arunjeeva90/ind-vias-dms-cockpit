import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DriverStatePanel } from '../DriverStatePanel';
import { DriverState } from '../../types/dms';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Eye: ({ className }: { className?: string }) => (
    <span data-testid="icon-eye" className={className}>Eye</span>
  ),
  AlertTriangle: ({ className }: { className?: string }) => (
    <span data-testid="icon-alert" className={className}>AlertTriangle</span>
  ),
  Phone: ({ className }: { className?: string }) => (
    <span data-testid="icon-phone" className={className}>Phone</span>
  ),
  Moon: ({ className }: { className?: string }) => (
    <span data-testid="icon-moon" className={className}>Moon</span>
  ),
  Activity: ({ className }: { className?: string }) => (
    <span data-testid="icon-activity" className={className}>Activity</span>
  ),
}));

describe('DriverStatePanel', () => {
  it('renders Attentive state correctly', () => {
    render(<DriverStatePanel state={DriverState.ATTENTIVE} />);
    expect(screen.getByText('Attentive')).toBeInTheDocument();
    expect(screen.getByText('Driver State')).toBeInTheDocument();
  });

  it('renders Drowsy state correctly', () => {
    render(<DriverStatePanel state={DriverState.DROWSY} />);
    expect(screen.getByText('Drowsy')).toBeInTheDocument();
  });

  it('renders Distracted state correctly', () => {
    render(<DriverStatePanel state={DriverState.DISTRACTED} />);
    expect(screen.getByText('Distracted')).toBeInTheDocument();
  });

  it('renders Fatigued state correctly', () => {
    render(<DriverStatePanel state={DriverState.FATIGUED} />);
    expect(screen.getByText('Fatigued')).toBeInTheDocument();
  });

  it('renders Phone Use state correctly', () => {
    render(<DriverStatePanel state={DriverState.PHONE_USE} />);
    expect(screen.getByText('Phone Use')).toBeInTheDocument();
  });

  it('applies success color class for Attentive state', () => {
    render(<DriverStatePanel state={DriverState.ATTENTIVE} />);
    const label = screen.getByText('Attentive');
    expect(label.className).toContain('text-dms-success');
  });

  it('applies yellow color class for Drowsy state', () => {
    render(<DriverStatePanel state={DriverState.DROWSY} />);
    const label = screen.getByText('Drowsy');
    expect(label.className).toContain('text-yellow-400');
  });

  it('applies warning color class for Distracted state', () => {
    render(<DriverStatePanel state={DriverState.DISTRACTED} />);
    const label = screen.getByText('Distracted');
    expect(label.className).toContain('text-dms-warning');
  });

  it('applies danger color class for Fatigued state', () => {
    render(<DriverStatePanel state={DriverState.FATIGUED} />);
    const label = screen.getByText('Fatigued');
    expect(label.className).toContain('text-dms-danger');
  });

  it('applies danger color class for Phone Use state', () => {
    render(<DriverStatePanel state={DriverState.PHONE_USE} />);
    const label = screen.getByText('Phone Use');
    expect(label.className).toContain('text-dms-danger');
  });

  it('renders the correct icon for each state', () => {
    const { rerender } = render(<DriverStatePanel state={DriverState.ATTENTIVE} />);
    expect(screen.getByTestId('icon-eye')).toBeInTheDocument();

    rerender(<DriverStatePanel state={DriverState.DROWSY} />);
    expect(screen.getByTestId('icon-moon')).toBeInTheDocument();

    rerender(<DriverStatePanel state={DriverState.DISTRACTED} />);
    expect(screen.getByTestId('icon-alert')).toBeInTheDocument();

    rerender(<DriverStatePanel state={DriverState.FATIGUED} />);
    expect(screen.getByTestId('icon-activity')).toBeInTheDocument();

    rerender(<DriverStatePanel state={DriverState.PHONE_USE} />);
    expect(screen.getByTestId('icon-phone')).toBeInTheDocument();
  });
});
