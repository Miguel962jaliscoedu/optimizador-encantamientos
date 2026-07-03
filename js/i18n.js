/**
 * Internationalization (i18n) Module
 * Handles language loading, switching, and text formatting.
 */

export const LANGUAGES = {
  'en':    'English',
  'de':    'Deutsch',
  'es-ES': 'Español',
  'fr-FR': 'Français',
  'it-IT': 'Italiano',
  'id':    'Indonesia',
  'hu-HU': 'Magyar',
  'nl':    'Nederlands',
  'pl-PL': 'Polski',
  'pt-BR': 'Português',
  'vi-VN': 'Tiếng Việt',
  'tr-TR': 'Türkçe',
  'be-BY': 'Беларуская',
  'ru-RU': 'Русский',
  'ua-UA': 'Українська',
  'th-TH': 'ภาษาไทย',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'ja-JP': '日本語',
  'ko-KR': '한국어',
  'ar':    'اَلْعَرَبِيَّةُ',
};

let currentLang = null;
let currentLangData = null;

/**
 * Load a language file by its key.
 */
export async function loadLanguage(langKey) {
  const url = `./languages/${langKey}.json`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load language: ${langKey}`);
    currentLangData = await response.json();
    currentLang = langKey;
    return currentLangData;
  } catch (err) {
    console.error(`Error loading language ${langKey}:`, err);
    // Fallback to English
    if (langKey !== 'en') {
      return loadLanguage('en');
    }
    return null;
  }
}

/**
 * Get the current language data.
 */
export function getCurrentLang() {
  return currentLangData;
}

/**
 * Get the current language key.
 */
export function getCurrentLangKey() {
  return currentLang;
}

/**
 * Get a translated string by key.
 */
export function t(key) {
  if (!currentLangData) return key;
  return currentLangData[key] || key;
}

/**
 * Get the name of an enchantment in the current language.
 */
export function getEnchantmentName(namespace) {
  if (!currentLangData || !currentLangData.enchants) return namespace;
  return currentLangData.enchants[namespace] || namespace;
}

/**
 * Get the name of an item in the current language.
 */
export function getItemName(namespace) {
  if (!currentLangData || !currentLangData.items) return namespace;
  return currentLangData.items[namespace] || namespace;
}

/**
 * Pluralize a word based on count and language rules.
 */
export function pluralize(num, keyRoot) {
  if (!currentLangData) return `${num} ${keyRoot}`;

  // Russian plurals
  if (currentLangData.use_russian_plurals) {
    if ((num % 10 === 1) && (num < 10 || num > 15)) {
      return String(num) + currentLangData[keyRoot];
    } else if ((num % 10 === 2 || num % 10 === 3 || num % 10 === 4) && (num < 10 || num > 15)) {
      return String(num) + currentLangData[keyRoot + '_low'];
    } else {
      return String(num) + currentLangData[keyRoot + '_high'];
    }
  }

  // Default: singular/plural
  if (num === 1) {
    return String(num) + currentLangData[keyRoot];
  } else {
    return String(num) + currentLangData[keyRoot + '_s'];
  }
}

/**
 * Format a number with commas.
 */
export function commaify(n) {
  return n.toLocaleString();
}

/**
 * Format time display.
 */
export function formatTime(ms) {
  if (!currentLangData) return `${ms}ms`;

  if (ms < 1) {
    const us = Math.round(ms * 1000);
    return Math.round(us) + currentLangData.microseconds;
  } else if (ms < 1000) {
    return pluralize(Math.round(ms), 'millisecond');
  } else {
    return pluralize(Math.round(ms / 1000), 'second');
  }
}

/**
 * Format XP text.
 */
export function formatXp(xp, minimumXp = -1) {
  let text = "";
  if (minimumXp >= 0) {
    text += commaify(minimumXp) + "-";
  }
  text += commaify(xp) + (currentLangData?.xp || " xp");
  return text;
}

/**
 * Format level + XP text.
 */
export function formatLevelXp(levels, xp, minimumXp = -1) {
  const levelText = pluralize(levels, 'level');
  const xpText = formatXp(xp, minimumXp);
  return `${levelText} (${xpText})`;
}
