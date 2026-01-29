import React, { useEffect, useMemo, useState } from "react";
import { trafficTracer, TrafficLogEntry, HttpLogEntry, WsLogEntry } from "../services/traffic-tracer";

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString();

const stringifySafe = (value: unknown): string => {
  if (value === undefined || value === null) return "-";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const renderHttpEntry = (entry: HttpLogEntry) => {
  const statusClass = entry.responseStatus && entry.responseStatus >= 400
    ? "tracer-status tracer-status-error"
    : "tracer-status tracer-status-ok";

  const method = entry.method || "HTTP";
  const url = entry.url || "";

  return (
    <div key={entry.id} className="tracer-card">
      <div className="tracer-card-header">
        <div className="tracer-title">
          <span className="tracer-method">{method}</span>
          <code className="tracer-code" style={{ maxHeight: 30, padding: "2px 4px", fontSize: "0.9em", lineHeight: "1.2" }}>{url}</code>
        </div>
        <div className="tracer-meta">
          <span className="tracer-time">{formatTime(entry.timestamp)}</span>
          {entry.responseStatus !== undefined && (
            <span className={statusClass}>{entry.responseStatus}</span>
          )}
        </div>
      </div>
      <details className="tracer-details">
        <summary>Details</summary>
        <div className="tracer-details-grid">
          <div>
            <div className="tracer-label">Request Headers</div>
            <pre className="tracer-code">{stringifySafe(entry.requestHeaders)}</pre>
          </div>
          <div>
            <div className="tracer-label">Request Body</div>
            <pre className="tracer-code">{stringifySafe(entry.requestBody)}</pre>
          </div>
          <div>
            <div className="tracer-label">Response Headers</div>
            <pre className="tracer-code">{stringifySafe(entry.responseHeaders)}</pre>
          </div>
          <div>
            <div className="tracer-label">Response Body</div>
            <pre className={`tracer-code ${entry.error ? "tracer-code-error" : ""}`}>
              {stringifySafe(entry.responseBody || entry.error)}
            </pre>
          </div>
        </div>
      </details>
    </div>
  );
};

const renderWsEntry = (entry: WsLogEntry) => {
  const statusClass = entry.event === "error"
    ? "tracer-status tracer-status-error"
    : "tracer-status tracer-status-ws";

  return (
    <div key={entry.id} className="tracer-card">
      <div className="tracer-card-header">
        <div className="tracer-title">
          <span className="tracer-method">WS</span>
          <code className="tracer-code" style={{ maxHeight: 30, padding: "2px 4px", fontSize: "0.9em", lineHeight: "1.2" }}>{entry.url || ""}</code>
        </div>
        <div className="tracer-meta">
          <span className="tracer-time">{formatTime(entry.timestamp)}</span>
          <span className={statusClass}>{entry.event.toUpperCase()}</span>
        </div>
      </div>
      <details className="tracer-details">
        <summary>Details</summary>
        <div className="tracer-details-grid">
          <div>
            <div className="tracer-label">Payload</div>
            <pre className="tracer-code">{stringifySafe(entry.payload)}</pre>
          </div>
          <div>
            <div className="tracer-label">Info</div>
            <pre className="tracer-code">{stringifySafe(entry.details)}</pre>
          </div>
        </div>
      </details>
    </div>
  );
};

const TrafficTracerPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<TrafficLogEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "http" | "ws">("all");

  useEffect(() => trafficTracer.subscribe(setEntries), []);

  const counts = useMemo(() => {
    let http = 0;
    let ws = 0;
    entries.forEach((entry) => {
      if (entry.type === "http") http += 1;
      if (entry.type === "ws") ws += 1;
    });
    return { http, ws };
  }, [entries]);

  const filtered = useMemo(() => {
    if (filter === "all") return entries;
    return entries.filter((entry) => entry.type === filter);
  }, [entries, filter]);

  return (
    <>
      <button
        className={`traffic-tracer-toggle ${open ? "open" : ""}`}
        onClick={() => setOpen((value) => !value)}
        title="Toggle Under the Hood"
        type="button"
      >
        <span className="tracer-toggle-icon">⚙️</span>
        <span className="tracer-toggle-text">Under the Hood</span>
        <span className="tracer-toggle-count">{counts.http + counts.ws}</span>
      </button>

      <aside className={`traffic-tracer-panel ${open ? "open" : ""}`}>
        <header className="tracer-panel-header">
          <div className="tracer-panel-title">Under the Hood</div>
          <div className="tracer-panel-actions">
            <button
              className="tracer-button"
              type="button"
              onClick={() => trafficTracer.clear()}
            >
              Clear
            </button>
            <button
              className="tracer-button tracer-button-ghost"
              type="button"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>
        </header>

        <div className="tracer-panel-filters">
          <button
            type="button"
            className={`tracer-filter ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`tracer-filter ${filter === "http" ? "active" : ""}`}
            onClick={() => setFilter("http")}
          >
            HTTP ({counts.http})
          </button>
          <button
            type="button"
            className={`tracer-filter ${filter === "ws" ? "active" : ""}`}
            onClick={() => setFilter("ws")}
          >
            WS ({counts.ws})
          </button>
        </div>

        <div className="tracer-panel-content">
          {filtered.length === 0 ? (
            <div className="tracer-empty">No traffic yet</div>
          ) : (
            filtered.map((entry) =>
              entry.type === "http"
                ? renderHttpEntry(entry as HttpLogEntry)
                : renderWsEntry(entry as WsLogEntry)
            )
          )}
        </div>
      </aside>
    </>
  );
};

export default TrafficTracerPanel;
