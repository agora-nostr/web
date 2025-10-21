# Test Suite

This directory contains E2E tests for the Voces application using Playwright.

## Running Tests

### Run all tests
```bash
npx playwright test
```

### Run specific test file
```bash
npx playwright test invite-acceptance-notifications.spec.ts
```

### Run tests in UI mode (recommended for development)
```bash
npx playwright test --ui
```

### Run tests in headed mode (see the browser)
```bash
npx playwright test --headed
```

## Test Files

### `profile-editor.spec.ts`
Tests for the profile editor functionality including:
- Profile settings navigation
- Form field validation
- Image upload UI
- Markdown formatting
- Accessibility features

### `invite-acceptance-notifications.spec.ts`
Tests for kind 514 invite acceptance notifications including:
- Notification rendering with proper UI elements (green checkmark, celebration emoji)
- Follow button visibility based on follow status
- Follow button functionality (click, loading state, error handling)
- Tag detection and filtering (only shows notifications tagging current user)
- Accessibility (aria-labels, keyboard navigation)
- Edge cases (missing profile info, already following)
- Integration with notification filters

## Expected Test Results

### Invite Acceptance Notifications Tests

**Note**: Many of these tests will pass conditionally based on data availability:
- Tests check if invite notifications exist before validating their behavior
- If no kind 514 events exist, tests will pass with 0 count validations
- For full test coverage, you need:
  1. To be logged in as a user who has sent invites
  2. At least one kind 514 event where someone accepted your invite
  3. The kind 514 event must include a `p` tag with your pubkey

**Test Coverage**:
1. ✅ **Invites filter tab exists** - Always passes
2. ✅ **Filter shows only invite notifications** - Validates filtering logic
3. ✅ **Green checkmark icon appears** - Validates UI styling
4. ✅ **Celebration emoji (🎉) appears** - Validates notification text
5. ✅ **User avatar and name display** - Validates profile integration
6. ✅ **Timestamp shows** - Validates TimeAgo component
7. ✅ **Follow button appears when not following** - Validates reactive follow state
8. ✅ **Follow button has aria-label** - Validates accessibility
9. ✅ **Follow button shows loading state** - Validates UX during async operation
10. ✅ **Follow button is keyboard accessible** - Validates accessibility
11. ✅ **Handles missing profile gracefully** - Validates fallback logic
12. ✅ **Notifications sorted by timestamp** - Validates ordering
13. ✅ **Only shows notifications tagging current user** - Validates #p filter
14. ✅ **Invites appear in All filter** - Validates integration

## Running Tests in CI

Tests are configured to run in CI with the following settings:
- Retries: 2 (only in CI)
- Workers: 1 (only in CI)
- Reporter: HTML
- Browser: Chromium (Desktop Chrome)

## Authentication Required

Most tests require the user to be authenticated. In a development environment:
1. Log in to the app manually before running tests
2. OR: Set up test fixtures with pre-authenticated state
3. OR: Mock authentication in test setup

## Debugging Tests

### View test report after run
```bash
npx playwright show-report
```

### Debug specific test
```bash
npx playwright test invite-acceptance-notifications.spec.ts --debug
```

### Generate trace on failure
Traces are automatically generated on first retry (configured in `playwright.config.ts`).

View trace:
```bash
npx playwright show-trace trace.zip
```

## Writing New Tests

Follow the existing patterns:
1. Use descriptive test names
2. Group related tests in `test.describe` blocks
3. Use `beforeEach` for common setup
4. Check for element existence before asserting visibility
5. Add comments explaining conditional logic
6. Use proper accessibility selectors (`getByRole`, `getByLabel`)

## Expected Behavior

### Invite Acceptance Notifications

When a user accepts an invite you sent:
1. A kind 514 event is created by the invitee
2. The event includes a `p` tag with your pubkey (the inviter)
3. Your notifications subscription receives this event (due to #p filter)
4. The notification appears in your "All" and "Invites" feeds
5. If you're not following the invitee, a Follow button appears
6. Clicking Follow triggers the follow API and updates UI reactively
7. The notification shows the invitee's profile info (name, avatar, bio)
8. If no profile exists, shows first 8 chars of pubkey as fallback

### Tag Detection Verification

The subscription filter uses:
```typescript
{
  kinds: [1, 1111, 6, 16, 7, 9735, 514],
  '#p': [currentUser.pubkey],
  since: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30,
  limit: 500,
}
```

This ensures only events that explicitly tag the current user appear in notifications.
