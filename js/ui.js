/**
 * UI Helper Module
 * Handles DOM manipulation, theme switching, and UI state.
 */

import { t, getCurrentLang } from './i18n.js';

// --- Theme Management ---

const THEME_KEY = 'enchant-order-theme';

const THEMES = ['light', 'dark', 'wither', 'crimson', 'dirt', 'enderman', 'ocean', 'magma', 'sunflower'];

/**
 * Initialize theme from system preference or localStorage.
 */
export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved && THEMES.includes(saved)) {
    setTheme(saved);
    return;
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(prefersDark ? 'dark' : 'light');
}

/**
 * Set the active theme.
 */
export function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);

  // Update dropdown menu item active states
  document.querySelectorAll('.theme-menu-item').forEach(item => {
    item.classList.toggle('active', item.dataset.theme === theme);
  });

  // Update trigger button display
  const triggerDot = document.getElementById('theme-trigger-dot');
  const triggerName = document.getElementById('theme-trigger-name');
  if (triggerDot && triggerName) {
    const activeItem = document.querySelector(`.theme-menu-item[data-theme="${theme}"]`);
    if (activeItem) {
      const dotEl = activeItem.querySelector('.theme-dot');
      const nameEl = activeItem.querySelector('.theme-name');
      if (dotEl) triggerDot.style.background = dotEl.style.background;
      if (nameEl) triggerName.textContent = nameEl.textContent;
    }
  }
}

/**
 * Get all available themes.
 */
export function getThemes() {
  return THEMES;
}

// --- DOM Helpers ---

/**
 * Query a single element.
 */
export const $ = (selector) => document.querySelector(selector);

/**
 * Query multiple elements.
 */
export const $$ = (selector) => document.querySelectorAll(selector);

/**
 * Create an element with attributes and children.
 */
export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([k, v]) => el.dataset[k] = v);
    } else if (key === 'textContent' || key === 'innerHTML') {
      el[key] = value;
    } else {
      el.setAttribute(key, value);
    }
  }
  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child) {
      el.appendChild(child);
    }
  });
  return el;
}

// --- Item & Enchantment Rendering ---

/**
 * Build the item selector dropdown.
 */
export function buildItemSelector(selectEl, items, onChange) {
  selectEl.innerHTML = '';

  const defaultOpt = createElement('option', { value: '' }, [t('choose_an_item_to_enchant')]);
  selectEl.appendChild(defaultOpt);

  // Group items by category
  const categories = {
    armor: { label: '🛡️ Armor', items: [] },
    weapons: { label: '⚔️ Weapons', items: [] },
    ranged: { label: '🏹 Ranged', items: [] },
    tools: { label: '⛏️ Tools', items: [] },
    misc: { label: '✨ Misc', items: [] }
  };

  const categoryMap = {
    helmet: 'armor', chestplate: 'armor', leggings: 'armor', boots: 'armor',
    turtle_shell: 'armor', elytra: 'armor',
    sword: 'weapons', axe: 'weapons', mace: 'weapons', spear: 'weapons',
    trident: 'ranged', bow: 'ranged', crossbow: 'ranged',
    pickaxe: 'tools', shovel: 'tools', hoe: 'tools', shield: 'tools', brush: 'tools',
    fishing_rod: 'misc', shears: 'misc', flint_and_steel: 'misc',
    carrot_on_a_stick: 'misc', warped_fungus_on_a_stick: 'misc', pumpkin: 'misc', book: 'misc'
  };

  items.forEach(item => {
    const cat = categoryMap[item] || 'misc';
    categories[cat].items.push(item);
  });

  for (const [, cat] of Object.entries(categories)) {
    if (cat.items.length === 0) continue;
    const group = createElement('optgroup', { label: cat.label });
    cat.items.forEach(item => {
      const lang = getCurrentLang();
      const label = lang?.items?.[item] || item;
      group.appendChild(createElement('option', { value: item }, [label]));
    });
    selectEl.appendChild(group);
  }

  selectEl.addEventListener('change', () => onChange(selectEl.value));
}

/**
 * Build the enchantment grid for a given item.
 */
export function buildEnchantmentGrid(container, itemNamespace, enchantments, maxLevel) {
  container.innerHTML = '';

  if (!itemNamespace) {
    container.style.display = 'none';
    return;
  }

  const lang = getCurrentLang();
  const table = createElement('table', { className: 'enchant-table' });

  let groupToggle = true;
  const processed = [];

  enchantments.forEach(enchantKey => {
    if (processed.includes(enchantKey)) return;

    // Get incompatible group
    const group = getIncompatibleGroupLocal(enchantKey, enchantments);
    group.forEach(g => {
      if (!processed.includes(g)) processed.push(g);
    });

    group.forEach(enchantKey => {
      const meta = ENCHANTMENTS_REF[enchantKey];
      if (!meta) return;

      const row = createElement('tr', { className: groupToggle ? 'group-even' : 'group-odd' });
      const name = lang?.enchants?.[enchantKey] || enchantKey;
      row.appendChild(createElement('td', { className: 'enchant-name' }, [name]));

      for (let level = 1; level <= maxLevel; level++) {
        const td = createElement('td');
        if (meta.levelMax >= level) {
          const btn = createElement('button', {
            className: 'level-btn off',
            dataset: { level: String(level), enchant: enchantKey }
          }, [String(level)]);
          td.appendChild(btn);
        }
        row.appendChild(td);
      }

      table.appendChild(row);
    });

    groupToggle = !groupToggle;
  });

  container.appendChild(table);
  container.style.display = 'block';
}

// Local reference to ENCHANTMENTS from data.js
let ENCHANTMENTS_REF = {};

export function setDataRef(data) {
  ENCHANTMENTS_REF = data;
}

function getIncompatibleGroupLocal(enchantKey, availableEnchants) {
  const queue = [enchantKey];
  const group = [];
  while (queue.length) {
    const current = queue.shift();
    if (group.includes(current)) continue;
    if (!availableEnchants.includes(current)) continue;
    group.push(current);
    const meta = ENCHANTMENTS_REF[current];
    if (meta) {
      meta.incompatible.forEach(inc => {
        if (!group.includes(inc) && !queue.includes(inc) && availableEnchants.includes(inc)) {
          queue.push(inc);
        }
      });
    }
  }
  return group.sort();
}

// --- Solution Display ---

/**
 * Display the optimization solution.
 */
export function displaySolution(msg, startTime) {
  const lang = getCurrentLang();
  const { instructions, extra } = msg;
  const elapsed = performance.now() - startTime;

  // Hide progress
  $('#progress').style.display = 'none';
  $('#phone-warn').style.display = 'none';

  // Show solution container
  const solutionEl = $('#solution');
  const headerEl = $('#solution-header');
  const stepsEl = $('#steps');
  const stepsHeader = $('#solution h3');
  const costLabel = $('#level-cost');
  const timingsEl = $('#timings');
  const xpNote = $('#xp-range-note');

  stepsEl.innerHTML = '';

  if (instructions.length === 0) {
    headerEl.textContent = lang?.no_solution_found || 'No solution found!';
    stepsHeader.textContent = '';
    costLabel.textContent = '0';
  } else {
    headerEl.textContent = lang?.optimal_solution_cumulative_levels || 'Optimal solution found!';
    stepsHeader.textContent = lang?.steps || 'Steps:';

    const maxLevels = extra[0];
    const maxXp = extra[1];
    costLabel.textContent = formatLevelXpDisplay(maxLevels, maxXp);

    instructions.forEach(inst => {
      const li = createInstructionElement(inst, msg.enchants);
      stepsEl.appendChild(li);
    });

    xpNote.style.display = (msg.item_obj.x && msg.item_obj.x !== maxXp) ? 'block' : 'none';
  }

  timingsEl.textContent = `${lang?.completed_in || 'Completed in '}${formatTimeDisplay(elapsed)}`;
  timingsEl.style.display = 'block';
  solutionEl.style.display = 'block';
}

function createInstructionElement(instruction, enchantsList) {
  const lang = getCurrentLang();
  const left = instruction[0];
  const right = instruction[1];
  const levels = instruction[2];
  const xp = instruction[3];
  const work = instruction[4];

  const leftText = formatItemText(left, enchantsList);
  const rightText = formatItemText(right, enchantsList);

  const container = document.createElement('li');
  container.innerHTML = `
    <span class="step-combine">${lang?.combine || 'Combine'}</span>
    <span class="step-item">${leftText}</span>
    <span class="step-with">${lang?.with || 'with'}</span>
    <span class="step-item">${rightText}</span>
    <div class="step-details">
      <span class="step-cost">${lang?.cost || 'Cost: '}${formatLevelXpDisplay(levels, xp)}</span>
      <span class="step-work">${lang?.prior_work_penalty || 'PWP: '}${formatLevelsDisplay(work)}</span>
    </div>
  `;
  return container;
}

function formatItemText(itemObj, enchantsList) {
  const lang = getCurrentLang();
  let itemNamespace;
  const enchantNames = [];

  if (lang?.enchants?.[itemObj.I]) {
    enchantNames.push(itemObj.I);
    itemNamespace = 'book';
  } else if (typeof itemObj.I === 'string') {
    itemNamespace = itemObj.I;
  } else {
    itemNamespace = lang?.enchants?.[itemObj.L?.I] ? 'book' : itemObj.L?.I;
    const enchants = findEnchantmentsLocal(itemObj);
    enchants.forEach(e => enchantNames.push(e));
  }

  if (!itemNamespace) {
    itemNamespace = findItemNamespaceLocal(itemObj.L);
  }

  const icon = `<img src="./images/${itemNamespace}.gif" class="item-icon" alt="${itemNamespace}">`;
  const itemName = lang?.items?.[itemNamespace] || itemNamespace;
  const enchantText = formatEnchantmentsList(enchantNames, enchantsList);

  return `${icon} <strong>${itemName}</strong> ${enchantText}`;
}

function findEnchantmentsLocal(item) {
  const enchants = [];
  for (const key of ['L', 'R']) {
    if (item[key]) {
      if (!item[key].I) {
        findEnchantmentsLocal(item[key]).forEach(e => enchants.push(e));
      } else {
        enchants.push(item[key].I);
      }
    }
  }
  return enchants;
}

function findItemNamespaceLocal(item) {
  if (!item) return 'book';
  if (item.I) {
    const lang = getCurrentLang();
    return lang?.enchants?.[item.I] ? 'book' : item.I;
  }
  return findItemNamespaceLocal(item.L);
}

function formatEnchantmentsList(enchantNames, enchantsList) {
  if (enchantNames.length === 0) return '';
  const lang = getCurrentLang();
  const parts = enchantNames.map(e => {
    const name = lang?.enchants?.[e] || e;
    const data = ENCHANTMENTS_REF[e];
    if (data && data.levelMax > 1 && enchantsList) {
      const found = enchantsList.find(([entry]) => entry === e);
      return found ? `${name} ${found[1]}` : name;
    }
    return name;
  });
  return `<span class="enchant-list">(${parts.join(', ')})</span>`;
}

function formatLevelsDisplay(levels) {
  return pluralizeLocal(levels, 'level');
}

function formatLevelXpDisplay(levels, xp, minXp = -1) {
  const levelText = pluralizeLocal(levels, 'level');
  let xpText = '';
  if (minXp >= 0) xpText += `${minXp.toLocaleString()}-`;
  xpText += `${xp.toLocaleString()}${getCurrentLang()?.xp || ' xp'}`;
  return `${levelText} (${xpText})`;
}

function formatTimeDisplay(ms) {
  if (ms < 1) return `${Math.round(ms * 1000)}${getCurrentLang()?.microseconds || 'μs'}`;
  if (ms < 1000) return pluralizeLocal(Math.round(ms), 'millisecond');
  return pluralizeLocal(Math.round(ms / 1000), 'second');
}

function pluralizeLocal(num, keyRoot) {
  const lang = getCurrentLang();
  if (!lang) return `${num} ${keyRoot}`;
  if (lang.use_russian_plurals) {
    if ((num % 10 === 1) && (num < 10 || num > 15)) return String(num) + lang[keyRoot];
    if ((num % 10 >= 2 && num % 10 <= 4) && (num < 10 || num > 15)) return String(num) + lang[keyRoot + '_low'];
    return String(num) + lang[keyRoot + '_high'];
  }
  return num === 1 ? String(num) + lang[keyRoot] : String(num) + lang[keyRoot + '_s'];
}
