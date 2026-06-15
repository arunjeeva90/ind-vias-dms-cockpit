import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DummyTelemetryProvider } from '../dummyTelemetry';
import { DriverState } from '../../types/dms';
import type { DMSTelemetry } from '../../types/dms';

describe('DummyTelemetryProvider', () => {
  let provider: DummyTelemetryProvider;

  beforeEach(() => {
    vi.useFakeTimers();
    provider = new DummyTelemetryProvider();
  });

  afterEach(() => {
    provider.disconnect();
    vi.useRealTimers();
  });

  describe('connection lifecycle', () => {
    it('should not be connected initially', () => {
      expect(provider.isConnected()).toBe(false);
    });

    it('should be connected after calling connect()', () => {
      provider.connect();
      expect(provider.isConnected()).toBe(true);
    });

    it('should not be connected after calling disconnect()', () => {
      provider.connect();
      provider.disconnect();
      expect(provider.isConnected()).toBe(false);
    });

    it('should handle multiple connect calls gracefully', () => {
      provider.connect();
      provider.connect();
      expect(provider.isConnected()).toBe(true);
    });

    it('should handle disconnect without connect', () => {
      provider.disconnect();
      expect(provider.isConnected()).toBe(false);
    });
  });

  describe('data emission', () => {
    it('should emit data through the callback after connect', () => {
      const callback = vi.fn();
      provider.onData(callback);
      provider.connect();

      // Advance time to trigger at least one data emission (100ms interval)
      vi.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalled();
    });

    it('should emit data at approximately 10Hz (every 100ms)', () => {
      const callback = vi.fn();
      provider.onData(callback);
      provider.connect();

      vi.advanceTimersByTime(1000);

      // Should have approximately 10 calls in 1 second
      expect(callback).toHaveBeenCalledTimes(10);
    });

    it('should not emit data after disconnect', () => {
      const callback = vi.fn();
      provider.onData(callback);
      provider.connect();

      vi.advanceTimersByTime(200);
      const callCountBeforeDisconnect = callback.mock.calls.length;

      provider.disconnect();
      vi.advanceTimersByTime(500);

      expect(callback).toHaveBeenCalledTimes(callCountBeforeDisconnect);
    });
  });

  describe('data shape and interface conformance', () => {
    let receivedData: DMSTelemetry;

    beforeEach(() => {
      const callback = vi.fn();
      provider.onData(callback);
      provider.connect();
      vi.advanceTimersByTime(100);
      receivedData = callback.mock.calls[0][0];
    });

    it('should include a valid timestamp', () => {
      expect(receivedData.timestamp).toBeDefined();
      expect(typeof receivedData.timestamp).toBe('number');
      expect(receivedData.timestamp).toBeGreaterThan(0);
    });

    it('should include a valid driverState enum value', () => {
      const validStates = Object.values(DriverState);
      expect(validStates).toContain(receivedData.driverState);
    });

    it('should include headPose with yaw, pitch, roll', () => {
      expect(receivedData.headPose).toBeDefined();
      expect(typeof receivedData.headPose.yaw).toBe('number');
      expect(typeof receivedData.headPose.pitch).toBe('number');
      expect(typeof receivedData.headPose.roll).toBe('number');
    });

    it('should include gaze data with x, y, and onRoad', () => {
      expect(receivedData.gaze).toBeDefined();
      expect(typeof receivedData.gaze.x).toBe('number');
      expect(typeof receivedData.gaze.y).toBe('number');
      expect(typeof receivedData.gaze.onRoad).toBe('boolean');
    });

    it('should include drowsiness metrics', () => {
      expect(receivedData.drowsiness).toBeDefined();
      expect(typeof receivedData.drowsiness.perclos).toBe('number');
      expect(typeof receivedData.drowsiness.blinkRate).toBe('number');
      expect(typeof receivedData.drowsiness.blinkDuration).toBe('number');
      expect(typeof receivedData.drowsiness.yawnCount).toBe('number');
      expect(typeof receivedData.drowsiness.score).toBe('number');
    });

    it('should include distraction metrics', () => {
      expect(receivedData.distraction).toBeDefined();
      expect(typeof receivedData.distraction.score).toBe('number');
      expect(typeof receivedData.distraction.gazeOffRoad).toBe('boolean');
      expect(typeof receivedData.distraction.duration_ms).toBe('number');
    });

    it('should include seatbelt status', () => {
      expect(receivedData.seatbelt).toBeDefined();
      expect(typeof receivedData.seatbelt.worn).toBe('boolean');
      expect(typeof receivedData.seatbelt.confidence).toBe('number');
    });

    it('should include phone suspicion data', () => {
      expect(receivedData.phoneSuspicion).toBeDefined();
      expect(typeof receivedData.phoneSuspicion.detected).toBe('boolean');
      expect(typeof receivedData.phoneSuspicion.confidence).toBe('number');
      expect(typeof receivedData.phoneSuspicion.handPosition).toBe('string');
    });

    it('should include DMS confidence data', () => {
      expect(receivedData.confidence).toBeDefined();
      expect(typeof receivedData.confidence.overall).toBe('number');
      expect(typeof receivedData.confidence.faceDetected).toBe('boolean');
      expect(typeof receivedData.confidence.eyesVisible).toBe('boolean');
      expect(typeof receivedData.confidence.quality).toBe('string');
    });

    it('should include ADAS fusion data', () => {
      expect(receivedData.adasFusion).toBeDefined();
      expect(typeof receivedData.adasFusion.ready).toBe('boolean');
      expect(typeof receivedData.adasFusion.laneKeepAssist).toBe('boolean');
      expect(typeof receivedData.adasFusion.collisionWarning).toBe('boolean');
      expect(typeof receivedData.adasFusion.speedAdaptation).toBe('boolean');
      expect(typeof receivedData.adasFusion.integrationScore).toBe('number');
    });
  });

  describe('value ranges', () => {
    it('should produce scores between 0 and 100', () => {
      const callback = vi.fn();
      provider.onData(callback);
      provider.connect();

      // Collect multiple data points
      vi.advanceTimersByTime(5000);

      const allData: DMSTelemetry[] = callback.mock.calls.map((call) => call[0]);

      for (const data of allData) {
        expect(data.drowsiness.score).toBeGreaterThanOrEqual(0);
        expect(data.drowsiness.score).toBeLessThanOrEqual(100);
        expect(data.distraction.score).toBeGreaterThanOrEqual(0);
        expect(data.distraction.score).toBeLessThanOrEqual(100);
        expect(data.adasFusion.integrationScore).toBeGreaterThanOrEqual(0);
        expect(data.adasFusion.integrationScore).toBeLessThanOrEqual(100);
      }
    });

    it('should produce head pose angles between -90 and 90 degrees', () => {
      const callback = vi.fn();
      provider.onData(callback);
      provider.connect();

      vi.advanceTimersByTime(5000);

      const allData: DMSTelemetry[] = callback.mock.calls.map((call) => call[0]);

      for (const data of allData) {
        expect(data.headPose.yaw).toBeGreaterThanOrEqual(-90);
        expect(data.headPose.yaw).toBeLessThanOrEqual(90);
        expect(data.headPose.pitch).toBeGreaterThanOrEqual(-90);
        expect(data.headPose.pitch).toBeLessThanOrEqual(90);
        expect(data.headPose.roll).toBeGreaterThanOrEqual(-90);
        expect(data.headPose.roll).toBeLessThanOrEqual(90);
      }
    });

    it('should produce gaze coordinates between 0 and 1', () => {
      const callback = vi.fn();
      provider.onData(callback);
      provider.connect();

      vi.advanceTimersByTime(5000);

      const allData: DMSTelemetry[] = callback.mock.calls.map((call) => call[0]);

      for (const data of allData) {
        expect(data.gaze.x).toBeGreaterThanOrEqual(0);
        expect(data.gaze.x).toBeLessThanOrEqual(1);
        expect(data.gaze.y).toBeGreaterThanOrEqual(0);
        expect(data.gaze.y).toBeLessThanOrEqual(1);
      }
    });

    it('should produce confidence overall values in reasonable range', () => {
      const callback = vi.fn();
      provider.onData(callback);
      provider.connect();

      vi.advanceTimersByTime(5000);

      const allData: DMSTelemetry[] = callback.mock.calls.map((call) => call[0]);

      for (const data of allData) {
        expect(data.confidence.overall).toBeGreaterThanOrEqual(0);
        expect(data.confidence.overall).toBeLessThanOrEqual(1);
      }
    });

    it('should produce seatbelt confidence between 0 and 1', () => {
      const callback = vi.fn();
      provider.onData(callback);
      provider.connect();

      vi.advanceTimersByTime(5000);

      const allData: DMSTelemetry[] = callback.mock.calls.map((call) => call[0]);

      for (const data of allData) {
        expect(data.seatbelt.confidence).toBeGreaterThanOrEqual(0);
        expect(data.seatbelt.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should produce phone suspicion confidence between 0 and 100', () => {
      const callback = vi.fn();
      provider.onData(callback);
      provider.connect();

      vi.advanceTimersByTime(5000);

      const allData: DMSTelemetry[] = callback.mock.calls.map((call) => call[0]);

      for (const data of allData) {
        expect(data.phoneSuspicion.confidence).toBeGreaterThanOrEqual(0);
        expect(data.phoneSuspicion.confidence).toBeLessThanOrEqual(100);
      }
    });
  });
});
