/**
 * Main Application Module
 * Initializes the app, connects UI events to the worker.
 */

import { ENCHANTMENTS, ITEMS, getMaxEnchantmentLevel, getEnchantmentsForItem } from './data.js';
import { LANGUAGES, loadLanguage, getCurrentLang, getCurrentLangKey } from './i18n.js';
import {
  initTheme, setTheme, $, $$, createElement,
  buildItemSelector, buildEnchantmentGrid, displaySolution, setDataRef
} from './ui.js';

// --- State ---
let worker = null;
let startTime = 0;
let selectedEnchantments = []; // [[name, level], ...]
let currentItem = '';
const MAX_ENCHANTMENTS = 10;

// --- Init ---
window.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  setDataRef(ENCHANTMENTS);

  // Init worker
  worker = new Worker('./js/worker.js');
  worker.onmessage = (event) => {
    if (event.data.msg === 'complete') {
      displaySolution(event.data, startTime);
    }
  };
  worker.postMessage({ msg: 'set_data', data: { enchants: ENCHANTMENTS } });

  // Build language selector
  buildLanguageSelector();

  // Load saved language or default to Spanish
  const savedLang = localStorage.getItem('enchant-order-lang') || 'es-ES';
  await switchLanguage(savedLang);

  // Build item selector (after language is loaded so labels are available)
  buildItemSelector($('#item-select'), ITEMS, onItemSelect);

  // Theme dropdown toggle
  const dropdown = $('#theme-dropdown');
  const trigger = $('#theme-trigger');
  const menu = $('#theme-menu');

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
    trigger.setAttribute('aria-expanded', dropdown.classList.contains('open'));
  });

  // Theme menu item clicks
  $$('.theme-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      setTheme(item.dataset.theme);
      dropdown.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    });
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });

  // Close dropdown on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dropdown.classList.contains('open')) {
      dropdown.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    }
  });

  // Calculate button
  $('#calculate-btn').addEventListener('click', calculate);

  // Override checkboxes
  $('#allow-incompatible').addEventListener('change', onOverrideChange);
  $('#allow-many').addEventListener('change', onOverrideChange);
});

// --- Language ---
function buildLanguageSelector() {
  const select = $('#language-select');
  select.innerHTML = '';

  for (const [key, name] of Object.entries(LANGUAGES)) {
    const opt = createElement('option', { value: key }, [name]);
    select.appendChild(opt);
  }

  select.addEventListener('change', async () => {
    await switchLanguage(select.value);
  });
}

async function switchLanguage(langKey) {
  const data = await loadLanguage(langKey);
  if (!data) return;

  localStorage.setItem('enchant-order-lang', langKey);

  const select = $('#language-select');
  if (select) select.value = langKey;

  updateUITexts();

  // Rebuild enchantment grid if item is selected
  if (currentItem) {
    refreshEnchantmentGrid();
  }
}

function updateUITexts() {
  const lang = getCurrentLang();
  if (!lang) return;

  // Title and descriptions
  const titleEl = $('h1');
  if (titleEl) titleEl.textContent = lang.h1_title || 'Minecraft Enchantment Ordering Tool';

  // Labels
  const labels = {
    '#label-item': lang.choose_an_item_to_enchant,
    '#label-incompatible': lang.checkbox_label_incompatible,
    '#label-many': lang.checkbox_label_max_number,
    '#calculate-btn': lang.calculate || 'Calculate',
    '#optimize-label': lang.optimize_for,
    '#optimize-xp': lang.radio_label_optimize_xp,
    '#optimize-pwp': lang.radio_label_optimize_pwp,
    '#override-incompatible': lang.checkbox_label_incompatible,
    '#override-many': lang.checkbox_label_max_number,
  };

  for (const [selector, text] of Object.entries(labels)) {
    const el = $(selector);
    if (el && text) el.textContent = text;
  }

  // Summaries
  const summaries = {
    '#summary-enchants': lang.summary_1,
    '#summary-tool': lang.summary_2,
  };
  for (const [selector, text] of Object.entries(summaries)) {
    const el = $(selector);
    if (el) el.textContent = text;
  }

  // Paragraphs
  const paras = {
    '#paragraph-1': lang.paragraph_1,
    '#paragraph-2': lang.paragraph_2,
    '#paragraph-3': lang.paragraph_3,
  };
  for (const [selector, text] of Object.entries(paras)) {
    const el = $(selector);
    if (el && text) el.innerHTML = text;
  }

  // Step labels
  const steps = $('#solution h3');
  if (steps) steps.textContent = lang.steps || 'Steps:';
}

// --- Item Selection ---
function onItemSelect(itemNamespace) {
  currentItem = itemNamespace;
  selectedEnchantments = [];

  const enchantsContainer = $('#enchants-container');
  const overridesEl = $('#overrides');

  if (!itemNamespace) {
    enchantsContainer.style.display = 'none';
    overridesEl.style.display = 'none';
    return;
  }

  enchantsContainer.style.display = 'block';
  overridesEl.style.display = 'block';
  refreshEnchantmentGrid();
}

function refreshEnchantmentGrid() {
  const available = getEnchantmentsForItem(currentItem);
  const maxLevel = getMaxEnchantmentLevel();
  const gridContainer = $('#enchant-grid');

  buildEnchantmentGrid(gridContainer, currentItem, available, maxLevel);

  // Restore selected enchantments
  selectedEnchantments.forEach(([name, level]) => {
    const btn = gridContainer.querySelector(`button[data-enchant="${name}"][data-level="${level}"]`);
    if (btn) {
      btn.classList.remove('off');
      btn.classList.add('on');
    }
  });

  // Add click handlers
  gridContainer.addEventListener('click', onEnchantClick);

  updateCalculateButton();
  updateEnchantCount();
}

// --- Enchantment Selection ---
function onEnchantClick(e) {
  const btn = e.target.closest('button.level-btn');
  if (!btn) return;

  const enchant = btn.dataset.enchant;
  const level = parseInt(btn.dataset.level, 10);

  if (btn.classList.contains('on')) {
    // Deselect
    btn.classList.remove('on');
    btn.classList.add('off');
    selectedEnchantments = selectedEnchantments.filter(
      ([name, lv]) => !(name === enchant && lv === level)
    );
  } else {
    // Check incompatible
    const allowIncompatible = $('#allow-incompatible').checked;
    if (!allowIncompatible) {
      // Remove any existing enchantment in the same incompatible group
      const existing = selectedEnchantments.find(([name]) => {
        const group1 = getIncompatibleGroupForKey(enchant);
        const group2 = getIncompatibleGroupForKey(name);
        return group1.includes(name) || group2.includes(enchant);
      });
      if (existing) {
        const oldBtn = $(`button[data-enchant="${existing[0]}"][data-level="${existing[1]}"]`);
        if (oldBtn) {
          oldBtn.classList.remove('on');
          oldBtn.classList.add('off');
        }
        selectedEnchantments = selectedEnchantments.filter(
          ([name, lv]) => !(name === existing[0] && lv === existing[1])
        );
      }
    }

    // Select new
    btn.classList.remove('off');
    btn.classList.add('on');
    selectedEnchantments.push([enchant, level]);
  }

  updateCalculateButton();
  updateEnchantCount();
}

function getIncompatibleGroupForKey(enchantKey) {
  const meta = ENCHANTMENTS[enchantKey];
  if (!meta) return [];
  const group = [enchantKey];
  meta.incompatible.forEach(inc => {
    if (!group.includes(inc)) group.push(inc);
  });
  return group;
}

function updateEnchantCount() {
  const countEl = $('#enchant-count');
  if (countEl) {
    countEl.textContent = `${selectedEnchantments.length} / ${MAX_ENCHANTMENTS}`;
  }
}

function updateCalculateButton() {
  const btn = $('#calculate-btn');
  const count = selectedEnchantments.length;
  const allowMany = $('#allow-many').checked;

  btn.disabled = count === 0 || (!allowMany && count > MAX_ENCHANTMENTS);
}

function onOverrideChange() {
  const allowIncompatible = $('#allow-incompatible').checked;
  if (!allowIncompatible) {
    // Remove incompatible selections (keep first of each group)
    const toRemove = [];
    const processed = new Set();

    selectedEnchantments.forEach(([name, level]) => {
      if (processed.has(name)) return;
      const group = getIncompatibleGroupForKey(name);
      const inGroup = selectedEnchantments.filter(([n]) => group.includes(n));
      if (inGroup.length > 1) {
        // Keep only the first one
        inGroup.slice(1).forEach(([n, l]) => toRemove.push([n, l]));
      }
      group.forEach(g => processed.add(g));
    });

    toRemove.forEach(([name, level]) => {
      const btn = $(`button[data-enchant="${name}"][data-level="${level}"]`);
      if (btn) {
        btn.classList.remove('on');
        btn.classList.add('off');
      }
    });

    selectedEnchantments = selectedEnchantments.filter(
      ([name, level]) => !toRemove.some(([n, l]) => n === name && l === level)
    );
  }

  updateCalculateButton();
  updateEnchantCount();
}

// --- Calculation ---
function calculate() {
  if (selectedEnchantments.length === 0) return;

  const mode = $('input[name="cheapness-mode"]:checked')?.value || 'levels';

  // Show progress
  $('#progress').style.display = 'flex';
  $('#solution').style.display = 'none';
  $('#phone-warn').style.display = 'none';

  const lang = getCurrentLang();
  const progressText = $('#progress-text');
  if (progressText) {
    progressText.textContent = lang?.calculating_solution || 'Calculating solution...';
  }

  startTime = performance.now();

  // Warn on mobile with many enchants
  if (selectedEnchantments.length > 7 && /Mobi|Android/i.test(navigator.userAgent)) {
    $('#phone-warn').style.display = 'block';
  }

  worker.postMessage({
    msg: 'process',
    item: currentItem,
    enchants: selectedEnchantments,
    mode
  });
}
