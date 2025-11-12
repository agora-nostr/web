# Git Hooks

This directory contains git hooks managed by [husky](https://typicode.github.io/husky/).

## Pre-commit Hook

The pre-commit hook uses Claude CLI to automatically review your staged changes before committing.

### What it checks

1. **Styling violations**
   - Hardcoded hex colors (should use theme tokens)
   - @apply directives (deprecated in Tailwind v4)
   - Unnecessary :global() usage
   - Inconsistent spacing values

2. **Code quality issues**
   - Unused variables or imports
   - Console logs left in production code
   - Missing error handling
   - Security vulnerabilities (XSS, injection)

3. **Nostr/NDK specific issues**
   - Incorrect event kind numbers (GenericReply is 1111, not 1)
   - Improper event publishing patterns

### Usage

The AI review is **opt-in** to avoid costs and delays. To enable it:

```bash
# Enable for a single commit
ENABLE_AI_REVIEW=1 git commit -m "your message"

# Or export for your shell session
export ENABLE_AI_REVIEW=1
git commit -m "your message"

# Or add to your shell profile for persistent enable
echo 'export ENABLE_AI_REVIEW=1' >> ~/.zshrc
```

### Severity Levels

Claude categorizes issues as:

- **BLOCKING**: Must fix before commit (will block the commit)
- **WARNING**: Should fix soon (commit allowed but flagged)
- **INFO**: Nice to fix (informational only)

### Skipping the hook

If you need to bypass the hook:

```bash
git commit --no-verify -m "your message"
```

### Requirements

- [Claude CLI](https://claude.com/claude-code) installed and authenticated
- Active Claude API subscription

### How it works

1. Captures your staged changes (`git diff --cached`)
2. Pipes the diff and review instructions to Claude CLI
3. Parses Claude's response for BLOCKING issues
4. Blocks commit if BLOCKING issues found, otherwise proceeds with suggestions
