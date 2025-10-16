/**
 * Localized introduction hashtags for onboarding
 * Maps language codes to their localized introduction hashtag
 */
export const INTRODUCTION_HASHTAGS: Record<string, string> = {
  en: 'introduction',
  es: 'bienvenidas',
  fa: 'معرفی',
  km: 'ការណែនាំ',
  sn: 'kuzivisa',
} as const;

/**
 * Get the localized introduction hashtag for a given locale
 * Falls back to 'introduction' if locale is not found
 */
export function getIntroductionHashtag(locale: string | null | undefined): string {
  if (!locale) return INTRODUCTION_HASHTAGS.en;

  // Handle full locale codes like 'en-US' by taking just the language part
  const languageCode = locale.split('-')[0];

  return INTRODUCTION_HASHTAGS[languageCode] || INTRODUCTION_HASHTAGS.en;
}

/**
 * Get all hashtags for an introduction post (including the base 'introduction')
 * Returns an array of hashtags to be added to the post
 */
export function getIntroductionHashtags(locale: string | null | undefined): string[] {
  const localizedTag = getIntroductionHashtag(locale);

  // Always include 'introduction', plus the localized version if different
  if (localizedTag === INTRODUCTION_HASHTAGS.en) {
    return ['introduction'];
  }

  return ['introduction', localizedTag];
}
