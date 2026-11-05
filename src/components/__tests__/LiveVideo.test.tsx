import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { LiveVideo } from '../cockpit/LiveVideo';
beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); vi.useRealTimers(); });
it('retries image errors with cache busting, recovers and cleans up', () => {
  const status = vi.fn(); const { unmount } = render(<LiveVideo url="http://192.168.50.2:8080/video.mjpg" onStatus={status} />);
  expect(status).toHaveBeenLastCalledWith('connecting');
  fireEvent.error(screen.getByRole('img')); expect(status).toHaveBeenLastCalledWith('unavailable');
  expect(screen.getByRole('status')).toHaveTextContent('reconnecting');
  act(() => vi.advanceTimersByTime(2000)); expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringContaining('retry=1'));
  fireEvent.error(screen.getByRole('img')); act(() => vi.advanceTimersByTime(2000));
  expect(screen.getByRole('img')).toHaveAttribute('src', expect.stringContaining('retry=2'));
  fireEvent.load(screen.getByRole('img')); expect(status).toHaveBeenLastCalledWith('live'); expect(screen.queryByRole('status')).toBeNull();
  fireEvent.error(screen.getByRole('img')); unmount(); expect(vi.getTimerCount()).toBe(0);
});
