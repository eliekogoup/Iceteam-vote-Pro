type PerfEntry = { start: number };
type PerfMetric = { name: string; duration: number; ts: number; meta?: any; userAgent?: string };

const entries: Record<string, PerfEntry> = {};
const buffer: PerfMetric[] = [];
const BUFFER_LIMIT = 10;

export const perf = {
  start(name: string) {
    entries[name] = { start: Date.now() };
  },
  end(name: string, meta?: any) {
    const e = entries[name];
    if (!e) return null;
    const duration = Date.now() - e.start;
    const metric: PerfMetric = { name, duration, ts: Date.now(), meta, userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined };
    buffer.push(metric);
    console.log(`PERF ${name}: ${duration}ms`, meta || '');
    delete entries[name];
    if (buffer.length >= BUFFER_LIMIT) {
      this.flush();
    }
    return metric;
  },
  async flush() {
    if (buffer.length === 0) return;
    try {
      const payload = { metrics: buffer.splice(0, buffer.length) };
      // fire-and-forget
      await fetch('/api/perf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Perf flush failed', err);
    }
  }
};
