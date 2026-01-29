export type HttpLogEntry = {
  id: string;
  type: "http";
  timestamp: string;
  method: string;
  url: string;
  requestHeaders?: Record<string, string>;
  requestBody?: unknown;
  responseStatus?: number;
  responseStatusText?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: unknown;
  error?: string;
};

export type WsLogEntry = {
  id: string;
  type: "ws";
  timestamp: string;
  event: "open" | "close" | "error" | "message" | "send";
  url?: string;
  payload?: unknown;
  details?: string;
};

export type TrafficLogEntry = HttpLogEntry | WsLogEntry;

type Listener = (entries: TrafficLogEntry[]) => void;

class TrafficTracerStore {
  private entries: TrafficLogEntry[] = [];
  private listeners: Set<Listener> = new Set();
  private readonly maxEntries = 200;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.entries);
    return () => this.listeners.delete(listener);
  }

  clear(): void {
    this.entries = [];
    this.notify();
  }

  startHttp(entry: Omit<HttpLogEntry, "id" | "type" | "timestamp">): string {
    const id = this.createId();
    const newEntry: HttpLogEntry = {
      id,
      type: "http",
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.addEntry(newEntry);
    return id;
  }

  completeHttp(id: string, patch: Omit<Partial<HttpLogEntry>, "id" | "type" | "timestamp">): void {
    this.updateEntry(id, patch);
  }

  failHttp(id: string, error: string): void {
    this.updateEntry(id, {
      responseStatus: 0,
      responseStatusText: "Network Error",
      error,
    });
  }

  logWs(entry: Omit<WsLogEntry, "id" | "type" | "timestamp">): void {
    const newEntry: WsLogEntry = {
      id: this.createId(),
      type: "ws",
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.addEntry(newEntry);
  }

  private addEntry(entry: TrafficLogEntry): void {
    this.entries = [entry, ...this.entries].slice(0, this.maxEntries);
    this.notify();
  }

  private updateEntry(id: string, patch: Omit<Partial<HttpLogEntry>, "id" | "type" | "timestamp">): void {
    let updated = false;
    this.entries = this.entries.map((entry) => {
      if (entry.id !== id || entry.type !== "http") return entry;
      updated = true;
      return {
        ...entry,
        ...patch,
      } as HttpLogEntry;
    });

    if (!updated) {
      this.addEntry({
        id,
        type: "http",
        timestamp: new Date().toISOString(),
        method: "UNKNOWN",
        url: "",
        ...patch,
      });
      return;
    }

    this.notify();
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.entries));
  }

  private createId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

export const trafficTracer = new TrafficTracerStore();
