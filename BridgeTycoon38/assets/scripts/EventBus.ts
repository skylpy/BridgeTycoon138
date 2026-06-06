// 轻量事件总线，避免模块之间直接互相依赖。
export type EventCallback<T = unknown> = (payload?: T) => void;

export class EventBus {
  private static events: Map<string, Set<EventCallback>> = new Map<string, Set<EventCallback>>();

  public static on<T = unknown>(eventName: string, callback: EventCallback<T>): void {
    if (!EventBus.events.has(eventName)) {
      EventBus.events.set(eventName, new Set<EventCallback>());
    }
    EventBus.events.get(eventName)?.add(callback as EventCallback);
  }

  public static off<T = unknown>(eventName: string, callback: EventCallback<T>): void {
    EventBus.events.get(eventName)?.delete(callback as EventCallback);
  }

  public static emit<T = unknown>(eventName: string, payload?: T): void {
    const callbacks = EventBus.events.get(eventName);
    if (!callbacks) {
      return;
    }
    callbacks.forEach((callback: EventCallback) => {
      try {
        callback(payload);
      } catch (error) {
        console.warn(`[EventBus] 事件 ${eventName} 执行失败`, error);
      }
    });
  }

  public static clear(): void {
    EventBus.events.clear();
  }
}

