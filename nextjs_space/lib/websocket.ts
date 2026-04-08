
// WebSocket client for real-time updates
export class RealtimeClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor(private url: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.notifyListeners(data.type, data.payload);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.handleReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.reconnectDelay);
    }
  }

  subscribe(eventType: string, callback: Function) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)?.add(callback);
  }

  unsubscribe(eventType: string, callback: Function) {
    this.listeners.get(eventType)?.delete(callback);
  }

  private notifyListeners(eventType: string, payload: any) {
    this.listeners.get(eventType)?.forEach((callback) => {
      callback(payload);
    });
  }

  send(eventType: string, payload: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: eventType, payload }));
    }
  }

  disconnect() {
    this.ws?.close();
  }
}

// Singleton instance
let realtimeClient: RealtimeClient | null = null;

export function getRealtimeClient(): RealtimeClient {
  if (!realtimeClient) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
    realtimeClient = new RealtimeClient(wsUrl);
  }
  return realtimeClient;
}
