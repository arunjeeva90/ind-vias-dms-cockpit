export class MockWebSocket {
  static instances: MockWebSocket[] = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  closed = false;
  constructor(public url: string) { MockWebSocket.instances.push(this); }
  open() { this.onopen?.(); }
  message(value: unknown) { this.onmessage?.({ data: JSON.stringify(value) }); }
  close() { this.closed = true; }
  drop() { this.onclose?.(); }
}
