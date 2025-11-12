interface RelayAuthRequest {
  relayUrl: string;
  onConfirm: () => void;
  onReject: () => void;
}

class RelayAuthModal {
  show = $state(false);
  request = $state<RelayAuthRequest | null>(null);

  confirm() {
    if (this.request) {
      this.request.onConfirm();
      this.show = false;
      this.request = null;
    }
  }

  reject() {
    if (this.request) {
      this.request.onReject();
      this.show = false;
      this.request = null;
    }
  }
}

export const relayAuthModal = new RelayAuthModal();
