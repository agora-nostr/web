type LoginState = 'signup' | 'login';

class LoginModal {
  show = $state(false);
  state = $state<LoginState>('signup');

  open(initialState: LoginState = 'signup') {
    this.state = initialState;
    this.show = true;
  }

  close() {
    this.show = false;
  }
}

export const loginModal = new LoginModal();
