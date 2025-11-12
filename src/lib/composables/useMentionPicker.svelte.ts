import { ndk } from '$lib/ndk.svelte';

interface MentionPickerState {
  show: boolean;
  searchQuery: string;
  startIndex: number;
  position: { top: number; left: number };
  markers: Map<string, string>;
}

export function useMentionPicker(textareaElement: () => HTMLTextAreaElement | undefined, value: () => string, setValue: (v: string) => void) {
  const state = $state<MentionPickerState>({
    show: false,
    searchQuery: '',
    startIndex: 0,
    position: { top: 0, left: 0 },
    markers: new Map()
  });

  function getCaretCoordinates(textarea: HTMLTextAreaElement) {
    const cursorPosition = textarea.selectionStart;

    // Create a mirror div to calculate position
    const div = document.createElement('div');
    const styles = window.getComputedStyle(textarea);
    const properties = [
      'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
      'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
      'lineHeight', 'fontFamily', 'textAlign', 'textTransform', 'textIndent',
      'textDecoration', 'letterSpacing', 'wordSpacing'
    ];

    properties.forEach(prop => {
      div.style[prop as any] = styles[prop as any];
    });

    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';

    document.body.appendChild(div);

    const textBeforeCursor = textarea.value.substring(0, cursorPosition);
    div.textContent = textBeforeCursor;

    const span = document.createElement('span');
    span.textContent = textarea.value.substring(cursorPosition) || '.';
    div.appendChild(span);

    const rect = textarea.getBoundingClientRect();
    const coordinates = {
      top: rect.top + span.offsetTop + parseInt(styles.borderTopWidth) - textarea.scrollTop + 20,
      left: rect.left + span.offsetLeft + parseInt(styles.borderLeftWidth)
    };

    document.body.removeChild(div);
    return coordinates;
  }

  function handleInput(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPosition);

    // Find the last @ before cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      const hasSpaceAfterAt = textAfterAt.includes(' ') || textAfterAt.includes('\n');

      if ((charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0) && !hasSpaceAfterAt) {
        state.startIndex = lastAtIndex;
        state.searchQuery = textAfterAt;
        state.position = getCaretCoordinates(textarea);
        state.show = true;
        return;
      }
    }

    state.show = false;
  }

  async function insertMention(nprofile: string) {
    const textarea = textareaElement();
    if (!textarea) return;

    const currentValue = value();
    const cursorPosition = textarea.selectionStart;

    // Extract pubkey from nprofile to get user's profile
    const pubkeyMatch = nprofile.match(/nostr:nprofile1([a-z0-9]+)/);
    if (!pubkeyMatch) return;

    // Fetch user to get their NIP-05
    const user = ndk.getUser({ nprofile: nprofile.replace('nostr:', '') });
    await user.fetchProfile();

    // Create a readable marker using NIP-05 or fallback to display name
    const marker = user.profile?.nip05
      ? `@${user.profile.nip05}`
      : `@${user.profile?.displayName || user.profile?.name || user.npub.slice(0, 12)}`;

    // Store the mapping from marker to nostr entity
    state.markers.set(marker, nprofile);

    // Replace from @ to cursor with the readable marker
    const beforeMention = currentValue.substring(0, state.startIndex);
    const afterMention = currentValue.substring(cursorPosition);

    setValue(beforeMention + marker + ' ' + afterMention);

    // Set cursor position after the mention
    const newCursorPos = state.startIndex + marker.length + 1;
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      textarea.focus();
    }, 0);

    state.show = false;
    state.searchQuery = '';
  }

  function closeMentionPicker() {
    state.show = false;
    state.searchQuery = '';
  }

  function getContentWithNostrEntities(content: string): string {
    let result = content;

    // Replace each marker with its nostr entity
    for (const [marker, entity] of state.markers) {
      while (result.includes(marker)) {
        result = result.replace(marker, entity);
      }
    }

    return result;
  }

  function reset() {
    state.markers.clear();
    state.show = false;
    state.searchQuery = '';
  }

  return {
    get show() { return state.show; },
    get searchQuery() { return state.searchQuery; },
    get position() { return state.position; },
    handleInput,
    insertMention,
    closeMentionPicker,
    getContentWithNostrEntities,
    reset
  };
}
