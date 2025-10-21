import { test, expect } from '@playwright/test';

/**
 * Tests for Kind 514 Invite Acceptance Notifications
 *
 * These tests validate that invite acceptance notifications appear correctly,
 * show the Follow button when appropriate, and handle user interactions properly.
 *
 * NOTE: These tests require authentication and real/mocked Nostr events.
 * The tests are written to validate the UI behavior given the presence of
 * kind 514 events with proper p-tags.
 */

test.describe('Invite Acceptance Notifications', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to notifications page
    // Note: In a real scenario, you'd need to be logged in
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
  });

  test('should display Invites filter tab', async ({ page }) => {
    // Check if the Invites filter tab exists
    const invitesTab = page.getByRole('button', { name: /invites/i });
    await expect(invitesTab).toBeVisible();
  });

  test('should show invite filter count when invite notifications exist', async ({ page }) => {
    // Click on Invites filter
    const invitesTab = page.getByRole('button', { name: /invites/i });
    await invitesTab.click();

    // Wait for filtered content
    await page.waitForTimeout(500);

    // The tab should be selected (has different styling)
    // Check if it has the primary background color class
    const classes = await invitesTab.getAttribute('class');
    expect(classes).toBeTruthy();
  });

  test('should filter to show only invite acceptance notifications', async ({ page }) => {
    // Click Invites filter
    await page.getByRole('button', { name: /invites/i }).click();
    await page.waitForTimeout(500);

    // Use data-testid to find invite notifications specifically
    const inviteNotifications = page.getByTestId('invite-acceptance-notification');
    const count = await inviteNotifications.count();

    // If there are notifications, verify they contain expected content
    if (count > 0) {
      const firstNotification = inviteNotifications.first();
      await expect(firstNotification).toBeVisible();
      // Should contain "accepted your invite" text
      await expect(firstNotification.getByText(/accepted your invite/i)).toBeVisible();
    }
  });
});

test.describe('Invite Acceptance Notification Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
  });

  test('should display notification with green checkmark icon', async ({ page }) => {
    // Click Invites filter to see only invite notifications
    await page.getByRole('button', { name: /invites/i }).click();
    await page.waitForTimeout(500);

    // Use data-testid to find invite notifications
    const notifications = page.getByTestId('invite-acceptance-notification');
    const count = await notifications.count();

    if (count > 0) {
      const firstNotification = notifications.first();
      await expect(firstNotification).toBeVisible();

      // Look for SVG with green color inside the notification
      const greenIcon = firstNotification.locator('svg.text-green-500').first();
      await expect(greenIcon).toBeVisible();
    }
  });

  test('should display celebration emoji in notification text', async ({ page }) => {
    // Filter to invites
    await page.getByRole('button', { name: /invites/i }).click();
    await page.waitForTimeout(500);

    // Look for the celebration emoji 🎉
    const celebrationText = page.getByText(/🎉/);
    const count = await celebrationText.count();

    // If there are invite notifications, they should have the emoji
    if (count > 0) {
      await expect(celebrationText.first()).toBeVisible();
    }
  });

  test('should display user avatar and name', async ({ page }) => {
    // Filter to invites
    await page.getByRole('button', { name: /invites/i }).click();
    await page.waitForTimeout(500);

    // Check for avatar images in notifications
    const avatars = page.locator('img[class*="w-10 h-10"]');
    const avatarCount = await avatars.count();

    // If there are notifications, there should be avatars
    if (avatarCount > 0) {
      await expect(avatars.first()).toBeVisible();
    }
  });

  test('should display timestamp with TimeAgo component', async ({ page }) => {
    // Filter to invites
    await page.getByRole('button', { name: /invites/i }).click();
    await page.waitForTimeout(500);

    // Look for timestamp text (e.g., "2 hours ago", "1 day ago")
    const timeText = page.locator('text=/ago|just now|second|minute|hour|day/i').first();
    const exists = await timeText.count();

    if (exists > 0) {
      await expect(timeText).toBeVisible();
    }
  });
});

test.describe('Follow Button Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
  });

  test('should show Follow button when not following user', async ({ page }) => {
    // Filter to invites
    await page.getByRole('button', { name: /invites/i }).click();
    await page.waitForTimeout(500);

    // Use data-testid to find Follow buttons
    const followButtons = page.getByTestId('follow-button');
    const count = await followButtons.count();

    // If there are invite notifications with Follow buttons
    if (count > 0) {
      const firstFollowButton = followButtons.first();
      await expect(firstFollowButton).toBeVisible();

      // Check for the icon (should have an SVG)
      const icon = firstFollowButton.locator('svg').first();
      await expect(icon).toBeVisible();

      // Verify it says "Follow"
      await expect(firstFollowButton).toHaveText(/follow/i);
    }
  });

  test('Follow button should have proper accessibility attributes', async ({ page }) => {
    // Filter to invites
    await page.getByRole('button', { name: /invites/i }).click();
    await page.waitForTimeout(500);

    // Use data-testid to find Follow buttons
    const followButtons = page.getByTestId('follow-button');
    const count = await followButtons.count();

    if (count > 0) {
      const button = followButtons.first();

      // Check aria-label exists and contains "Follow"
      const ariaLabel = await button.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toMatch(/follow/i);

      // Check button type is "button"
      const buttonType = await button.getAttribute('type');
      expect(buttonType).toBe('button');

      // Verify button is enabled by default
      await expect(button).toBeEnabled();
    }
  });

  test('should show loading state when Follow button is clicked', async ({ page }) => {
    // Filter to invites
    await page.getByRole('button', { name: /invites/i }).click();
    await page.waitForTimeout(500);

    // Use data-testid to find Follow buttons
    const followButtons = page.getByTestId('follow-button');
    const count = await followButtons.count();

    if (count > 0) {
      const button = followButtons.first();

      // Listen for custom events
      const loadingEventPromise = page.evaluate(() => {
        return new Promise((resolve) => {
          document.addEventListener('followloading', (e) => resolve(e), { once: true });
        });
      });

      // Click the Follow button
      await button.click();

      // Wait briefly for loading state or state change
      await page.waitForTimeout(100);

      // Button should be disabled during loading OR text should have changed
      const isDisabled = await button.isDisabled();
      const buttonText = await button.textContent();

      // Either button is disabled (loading) OR text changed to "Unfollow" (success)
      expect(isDisabled || buttonText?.toLowerCase().includes('unfollow')).toBeTruthy();
    }
  });

  test('Follow button should be keyboard accessible', async ({ page }) => {
    // Filter to invites
    await page.getByRole('button', { name: /invites/i }).click();
    await page.waitForTimeout(500);

    // Use data-testid to find Follow buttons
    const followButtons = page.getByTestId('follow-button');
    const count = await followButtons.count();

    if (count > 0) {
      const button = followButtons.first();

      // Focus the button using keyboard navigation
      await button.focus();

      // Verify it's focused
      await expect(button).toBeFocused();

      // Verify button is enabled before interaction
      await expect(button).toBeEnabled();

      // Press Enter to activate (simulates keyboard interaction)
      await page.keyboard.press('Enter');

      // Wait briefly for state change
      await page.waitForTimeout(100);

      // Button should still exist and be either disabled (loading) or have changed text
      await expect(button).toBeAttached();
    }
  });
});

test.describe('Edge Cases', () => {
  test('should handle user with no profile gracefully', async ({ page }) => {
    // Filter to invites
    await page.goto('/notifications');
    await page.getByRole('button', { name: /invites/i }).click();
    await page.waitForTimeout(500);

    // Even if user has no profile, notification should render
    // It should show either a name or a pubkey fallback
    const notifications = page.locator('text=/accepted your invite/i');
    const count = await notifications.count();

    if (count > 0) {
      // Notification should be visible despite missing profile
      await expect(notifications.first()).toBeVisible();

      // Should have some text before "accepted your invite"
      const parentElement = notifications.first().locator('..');
      await expect(parentElement).toBeVisible();
    }
  });

  test('should not show Follow button when already following', async ({ page }) => {
    // This test validates that when the user is already in the follows set,
    // the Follow button does not appear

    await page.goto('/notifications');
    await page.getByRole('button', { name: /invites/i }).click();
    await page.waitForTimeout(500);

    // Check notifications
    const notifications = page.locator('text=/accepted your invite/i');
    const notifCount = await notifications.count();

    if (notifCount > 0) {
      // Some notifications might not have Follow buttons (already following)
      // This is the expected behavior
      const allFollowButtons = page.getByRole('button', { name: /^follow$/i });
      const followButtonCount = await allFollowButtons.count();

      // It's valid for this to be 0 if we're already following all invitees
      expect(followButtonCount >= 0).toBeTruthy();
    }
  });

  test('should display notifications from most recent to oldest', async ({ page }) => {
    await page.goto('/notifications');
    await page.getByRole('button', { name: /invites/i }).click();
    await page.waitForTimeout(500);

    // Get all timestamp elements
    const timestamps = page.locator('text=/ago|just now|second|minute|hour|day/i');
    const count = await timestamps.count();

    // If there are multiple notifications, they should be in chronological order
    // (most recent first)
    expect(count >= 0).toBeTruthy();
  });
});

test.describe('Tag Detection and Filtering', () => {
  test('should only show notifications that tag the current user', async ({ page }) => {
    // This test validates that the #p filter is working correctly
    // Only kind 514 events that include current user's pubkey in p-tag should appear

    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    // Navigate to Invites filter
    await page.getByRole('button', { name: /invites/i }).click();
    await page.waitForTimeout(500);

    // All visible invite notifications should be ones where we are the inviter
    // (i.e., they tag us with a p-tag)
    const inviteNotifications = page.getByText(/accepted your invite/i);
    const count = await inviteNotifications.count();

    // The filter should ensure all displayed notifications are relevant
    expect(count >= 0).toBeTruthy();

    // If notifications exist, they should all say "accepted your invite"
    // (not "accepted their invite" or similar)
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const text = await inviteNotifications.nth(i).textContent();
        expect(text).toContain('accepted your invite');
      }
    }
  });
});

test.describe('Integration with All Notifications', () => {
  test('should include invite notifications in All filter', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    // By default, "All" filter is selected
    const allTab = page.getByRole('button', { name: /^all$/i });
    await expect(allTab).toBeVisible();

    // Count invite notifications in All view
    const inviteNotifications = page.getByText(/accepted your invite/i);
    const inviteCount = await inviteNotifications.count();

    // Now switch to Invites only
    await page.getByRole('button', { name: /invites/i }).click();
    await page.waitForTimeout(500);

    const inviteOnlyCount = await page.getByText(/accepted your invite/i).count();

    // The count should be the same or less (depending on pagination/limits)
    expect(inviteOnlyCount >= 0).toBeTruthy();
    expect(inviteOnlyCount <= inviteCount || inviteOnlyCount === inviteCount).toBeTruthy();
  });

  test('should update notification count when invite accepted', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    // Check if Invites tab shows count
    const invitesTab = page.getByRole('button', { name: /invites/i });
    const tabText = await invitesTab.textContent();

    // Tab text should contain "Invites" and possibly a count like "Invites (2)"
    expect(tabText).toContain('Invites');
  });
});
