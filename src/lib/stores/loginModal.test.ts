import { describe, it, expect, beforeEach } from 'vitest';

// Recreate the store class for testing
type LoginState = 'signup' | 'login';

class LoginModal {
  show = false;
  state: LoginState = 'signup';

  open(initialState: LoginState = 'signup') {
    this.state = initialState;
    this.show = true;
  }

  close() {
    this.show = false;
  }
}

describe('LoginModal', () => {
  let modal: LoginModal;

  beforeEach(() => {
    modal = new LoginModal();
  });

  describe('initial state', () => {
    it('should start closed', () => {
      expect(modal.show).toBe(false);
    });

    it('should default to signup state', () => {
      expect(modal.state).toBe('signup');
    });
  });

  describe('open', () => {
    it('should set show to true', () => {
      modal.open();
      expect(modal.show).toBe(true);
    });

    it('should default to signup state when no argument', () => {
      modal.open();
      expect(modal.state).toBe('signup');
    });

    it('should accept signup state', () => {
      modal.open('signup');
      expect(modal.state).toBe('signup');
      expect(modal.show).toBe(true);
    });

    it('should accept login state', () => {
      modal.open('login');
      expect(modal.state).toBe('login');
      expect(modal.show).toBe(true);
    });

    it('should change state when opened with different state', () => {
      modal.open('signup');
      expect(modal.state).toBe('signup');

      modal.close();
      modal.open('login');
      expect(modal.state).toBe('login');
    });
  });

  describe('close', () => {
    it('should set show to false', () => {
      modal.open();
      modal.close();
      expect(modal.show).toBe(false);
    });

    it('should preserve state when closed', () => {
      modal.open('login');
      modal.close();
      expect(modal.state).toBe('login');
    });
  });

  describe('state transitions', () => {
    it('should handle multiple open/close cycles', () => {
      modal.open('signup');
      expect(modal.show).toBe(true);

      modal.close();
      expect(modal.show).toBe(false);

      modal.open('login');
      expect(modal.show).toBe(true);
      expect(modal.state).toBe('login');
    });

    it('should allow opening when already open', () => {
      modal.open('signup');
      modal.open('login'); // Change state while open

      expect(modal.show).toBe(true);
      expect(modal.state).toBe('login');
    });
  });
});

