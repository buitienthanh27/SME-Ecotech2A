type Listener = (data: any) => void;

class RealtimeService {
  private static instance: RealtimeService;
  private listeners: { [event: string]: Listener[] } = {};

  private constructor() {}

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  public on(event: string, listener: Listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
    return () => this.off(event, listener);
  }

  public off(event: string, listener: Listener) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== listener);
  }

  public emit(event: string, data: any) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(listener => listener(data));
  }

  public simulateEvent(eventName: string, data: any) {
    // Simulate network delay
    setTimeout(() => {
      this.emit(eventName, data);
    }, 300);
  }
}

export const realtimeService = RealtimeService.getInstance();
