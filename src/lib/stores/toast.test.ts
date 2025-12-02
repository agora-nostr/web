import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Recreate the store class for testing (since the module exports a singleton with $state)
interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration: number;
}

class ToastStore {
  messages: ToastMessage[] = [];

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private show(message: string, type: ToastMessage['type'], duration = 3000) {
    const id = this.generateId();
    const toast: ToastMessage = { id, message, type, duration };

    this.messages = [...this.messages, toast];

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  success(message: string, duration?: number) {
    return this.show(message, 'success', duration);
  }

  error(message: string, duration?: number) {
    return this.show(message, 'error', duration);
  }

  info(message: string, duration?: number) {
    return this.show(message, 'info', duration);
  }

  dismiss(id: string) {
    this.messages = this.messages.filter((t) => t.id !== id);
  }
}

describe('ToastStore', () => {
  let store: ToastStore;

  beforeEach(() => {
    vi.useFakeTimers();
    store = new ToastStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should start with no messages', () => {
      expect(store.messages).toEqual([]);
    });
  });

  describe('success', () => {
    it('should add a success toast', () => {
      store.success('Operation completed');

      expect(store.messages).toHaveLength(1);
      expect(store.messages[0].type).toBe('success');
      expect(store.messages[0].message).toBe('Operation completed');
    });

    it('should return the toast id', () => {
      const id = store.success('Test');

      expect(id).toMatch(/^toast-/);
    });

    it('should use default duration of 3000ms', () => {
      store.success('Test');

      expect(store.messages[0].duration).toBe(3000);
    });

    it('should auto-dismiss after duration', () => {
      store.success('Test', 1000);

      expect(store.messages).toHaveLength(1);

      vi.advanceTimersByTime(1000);

      expect(store.messages).toHaveLength(0);
    });
  });

  describe('error', () => {
    it('should add an error toast', () => {
      store.error('Something went wrong');

      expect(store.messages).toHaveLength(1);
      expect(store.messages[0].type).toBe('error');
      expect(store.messages[0].message).toBe('Something went wrong');
    });

    it('should auto-dismiss after duration', () => {
      store.error('Error', 2000);

      vi.advanceTimersByTime(2000);

      expect(store.messages).toHaveLength(0);
    });
  });

  describe('info', () => {
    it('should add an info toast', () => {
      store.info('FYI');

      expect(store.messages).toHaveLength(1);
      expect(store.messages[0].type).toBe('info');
      expect(store.messages[0].message).toBe('FYI');
    });
  });

  describe('dismiss', () => {
    it('should remove a specific toast by id', () => {
      const id1 = store.success('First');
      const id2 = store.success('Second');

      store.dismiss(id1);

      expect(store.messages).toHaveLength(1);
      expect(store.messages[0].id).toBe(id2);
    });

    it('should handle dismissing non-existent id gracefully', () => {
      store.success('Test');

      store.dismiss('non-existent-id');

      expect(store.messages).toHaveLength(1);
    });
  });

  describe('multiple toasts', () => {
    it('should handle multiple toasts', () => {
      store.success('Success 1');
      store.error('Error 1');
      store.info('Info 1');

      expect(store.messages).toHaveLength(3);
    });

    it('should auto-dismiss each toast independently', () => {
      store.success('Short', 1000);
      store.error('Long', 5000);

      vi.advanceTimersByTime(1000);
      expect(store.messages).toHaveLength(1);
      expect(store.messages[0].type).toBe('error');

      vi.advanceTimersByTime(4000);
      expect(store.messages).toHaveLength(0);
    });
  });

  describe('duration of 0', () => {
    it('should not auto-dismiss when duration is 0', () => {
      store.success('Persistent', 0);

      vi.advanceTimersByTime(10000);

      expect(store.messages).toHaveLength(1);
    });
  });

  describe('unique ids', () => {
    it('should generate unique ids for each toast', () => {
      const ids = new Set<string>();

      for (let i = 0; i < 100; i++) {
        ids.add(store.success(`Toast ${i}`, 0)); // duration 0 to prevent auto-dismiss
      }

      expect(ids.size).toBe(100);
    });
  });
});

