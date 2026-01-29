import { AppConfig } from "../config";
import { trafficTracer } from "./traffic-tracer";

const BANKING_CHANNELS = {
  SUPPORT: "🛟 General Support",
  PAYMENTS: "💳 Payments",
  TRANSFERS: "⇄ Transfers",
  CARDS: "🪪 Cards"
} as const;

export type BankingChannel = keyof typeof BANKING_CHANNELS;
export type ChatTab = "support" | "banking";

export interface ChatMessage {
  id: string;
  type: 'support' | 'payment' | 'transfer' | 'card' | 'system';
  message: string;
  user?: string;
  channel?: BankingChannel;
  timestamp: string;
}

export class ChatService {
  private ws: WebSocket | null = null;
  private currentTab: ChatTab = "support";
  private currentChannel: Exclude<BankingChannel, "SUPPORT"> = "PAYMENTS";
  private currentUrl: string | null = null;

  constructor(
    private readonly username: string,
    private onMessage: (msg: ChatMessage) => void,
    private onStatusChange: (status: string) => void
  ) {}

  private async processMessageEvent(event: MessageEvent): Promise<ChatMessage | null> {
    try {
      let data: any;
      
      if (event.data instanceof Blob) {
        const text = await event.data.text();
        data = JSON.parse(text);
      } else if (typeof event.data === 'string') {
        data = JSON.parse(event.data);
      } else {
        console.warn('Unknown message type received:', event.data);
        return null;
      }

      return {
        ...data,
        id: data.id || Date.now().toString(),
        channel: data.channel || (this.currentTab === "support" ? "SUPPORT" : this.currentChannel),
        timestamp: data.timestamp || new Date().toISOString()
      };
    } catch (err) {
      console.error("Failed to parse message:", err);
      return null;
    }
  }

  connect(tab: ChatTab, channel: Exclude<BankingChannel, "SUPPORT"> = "PAYMENTS") {
    this.disconnect();
    this.currentTab = tab;
    this.currentChannel = channel;

    const baseUrl = tab === "support" 
      ? AppConfig.WEBSOCKET_SUPPORT_URL 
      : AppConfig.WEBSOCKET_ROOMS_URL;

    let url = tab === "support"
      ? `${baseUrl}?user=${encodeURIComponent(this.username)}`
      : `${baseUrl}?room=${channel.toLowerCase()}&user=${encodeURIComponent(this.username)}`;

    if (AppConfig.USE_AUTH && AppConfig.TYPE == "KM") {
      console.log( AppConfig.TYPE);
      if (tab !== "support") {
        url = `${AppConfig.WEBSOCKET_ROOMS_URL}/${channel.toLowerCase()}?user=${encodeURIComponent(this.username)}`;
      }
      url += `&access_token=${localStorage.getItem("access_token")}`;
    }

    this.currentUrl = url;
    this.ws = new WebSocket(url);
    this.onStatusChange("Connecting...");

    this.ws.onopen = () => {
      this.onStatusChange("Connected");
      trafficTracer.logWs({
        event: "open",
        url: this.currentUrl || undefined
      });
      if (tab === "support") {
        this.sendSystemMessage(`${this.username} joined Support`, 'support');
      }
    };

    this.ws.onmessage = async (event) => {
      trafficTracer.logWs({
        event: "message",
        url: this.currentUrl || undefined,
        payload: event.data
      });
      const message = await this.processMessageEvent(event);
      if (message) {
        this.onMessage(message);
      }
    };

    this.ws.onclose = () => {
      this.onStatusChange("Disconnected");
      trafficTracer.logWs({
        event: "close",
        url: this.currentUrl || undefined
      });
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.onStatusChange("Connection error");
      trafficTracer.logWs({
        event: "error",
        url: this.currentUrl || undefined,
        details: "WebSocket error"
      });
    };

    return this;
  }

  disconnect() {
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        if (this.currentTab === "support") {
          this.sendSystemMessage(`${this.username} left Support`, 'support');
        }
        this.ws.close();
      }
      this.ws = null;
      this.currentUrl = null;
    }
    return this;
  }

  sendMessage(message: string): ChatMessage | null {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !message.trim()) {
      return null;
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: this.currentTab === "support" ? 'support' :
        this.currentChannel === 'PAYMENTS' ? 'payment' :
          this.currentChannel === 'TRANSFERS' ? 'transfer' : 'card',
      message: message.trim(),
      user: this.username,
      timestamp: new Date().toISOString(),
      channel: this.currentTab === "support" ? "SUPPORT" : this.currentChannel
    };

    this.ws.send(JSON.stringify(newMessage));
    trafficTracer.logWs({
      event: "send",
      url: this.currentUrl || undefined,
      payload: newMessage
    });
    return newMessage;
  }

  sendSystemMessage(message: string, type: 'support' | 'system' = 'system'): ChatMessage | null {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return null;
    }

    const systemMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date().toISOString()
    };

    this.ws.send(JSON.stringify(systemMessage));
    trafficTracer.logWs({
      event: "send",
      url: this.currentUrl || undefined,
      payload: systemMessage
    });
    return systemMessage;
  }

  static getBankingChannels() {
    return BANKING_CHANNELS;
  }
}
