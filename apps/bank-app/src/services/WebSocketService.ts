import { trafficTracer } from "./traffic-tracer";

class WebSocketService {
    private socket: WebSocket | null = null;
    private listeners: ((message: NotificationMessage) => void)[] = [];
    private currentUrl: string | null = null;

    connect(url: string) {
        if (this.socket) return;

        this.currentUrl = url;
        this.socket = new WebSocket(url);

        this.socket.onmessage = (event) => {
            trafficTracer.logWs({
                event: "message",
                url: this.currentUrl || undefined,
                payload: event.data
            });
            try {
                const data: NotificationMessage = JSON.parse(event.data);
                this.listeners.forEach((cb) => cb(data));
            } catch (e) {
                console.error("Failed to parse WebSocket message:", e);
            }
        };

        this.socket.onopen = () => {
            console.log("WebSocket connection opened");
            trafficTracer.logWs({
                event: "open",
                url: this.currentUrl || undefined
            });
        };

        this.socket.onclose = () => {
            console.warn("WebSocket connection closed");
            trafficTracer.logWs({
                event: "close",
                url: this.currentUrl || undefined
            });
            this.socket = null;
        };

        this.socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            trafficTracer.logWs({
                event: "error",
                url: this.currentUrl || undefined,
                details: "WebSocket error"
            });
        };
    }

    subscribe(callback: (msg: NotificationMessage) => void) {
        this.listeners.push(callback);
    }

    unsubscribe(callback: (msg: NotificationMessage) => void) {
        this.listeners = this.listeners.filter((cb) => cb !== callback);
    }
}

export type NotificationPayload = {
  msg: string;
  type: "info" | "success" | "warning" | "danger";
};

export type NotificationMessage = {
  id: string;
  type: "notification";
  message: NotificationPayload;
  user: string;
  timestamp: string;
  protocol: string;
};

const wsInstance = new WebSocketService();
export default wsInstance;
