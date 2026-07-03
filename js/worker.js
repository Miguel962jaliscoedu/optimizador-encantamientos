/**
 * Enchantment Calculator Web Worker
 * Runs the optimization algorithm in a background thread.
 * Calculates the cheapest way to combine enchantment books.
 */

const MAXIMUM_MERGE_LEVELS = 39;
let ID_LIST = {};
let ENCHANTMENT2WEIGHT = [];
let ITEM_NAME = '';
let results = {};

onmessage = (event) => {
  const { msg } = event.data;

  if (msg === 'set_data') {
    const { enchants } = event.data.data;
    let id = 0;
    for (const enchant in enchants) {
      ID_LIST[enchant] = id;
      ENCHANTMENT2WEIGHT[id] = enchants[enchant].weight;
      id++;
    }
    Object.freeze(ENCHANTMENT2WEIGHT);
    Object.freeze(ID_LIST);
  }

  if (msg === 'process') {
    process(event.data.item, event.data.enchants, event.data.mode);
  }
};

function process(item, enchants, mode = 'levels') {
  ITEM_NAME = item;
  Object.freeze(ITEM_NAME);

  // Create enchantment objects
  const enchantObjs = enchants.map(([name, level]) => {
    const id = ID_LIST[name];
    const eObj = new ItemObj('book', level * ENCHANTMENT2WEIGHT[id], [id]);
    eObj.c = { I: id, l: eObj.l, w: eObj.w };
    return eObj;
  });

  // Find the most expensive enchant
  let mostExpensive = findMostExpensive(enchantObjs);

  // Handle book vs item base
  let baseItem;
  if (ITEM_NAME === 'book') {
    const id = enchantObjs[mostExpensive].e[0];
    baseItem = new ItemObj(id, enchantObjs[mostExpensive].l);
    baseItem.e.push(id);
    enchantObjs.splice(mostExpensive, 1);
    mostExpensive = findMostExpensive(enchantObjs);
  } else {
    baseItem = new ItemObj('item');
  }

  // Merge most expensive enchant with base
  const mergedItem = new MergeEnchants(baseItem, enchantObjs[mostExpensive]);
  mergedItem.c.L = { I: baseItem.i, l: 0, w: 0 };
  enchantObjs.splice(mostExpensive, 1);

  // Find cheapest combination
  const allObjs = enchantObjs.concat(mergedItem);
  const cheapestItems = cheapestItemsFromList(allObjs);

  let cheapestCost = Infinity;
  let cheapestKey;
  for (const key in cheapestItems) {
    const itemCost = mode === 'levels' ? cheapestItems[key].x : cheapestItems[key].w;
    if (itemCost < cheapestCost) {
      cheapestCost = itemCost;
      cheapestKey = key;
    }
  }

  const cheapestItem = cheapestItems[cheapestKey];
  const instructions = getInstructions(cheapestItem.c);

  let maxLevels = 0;
  instructions.forEach(inst => {
    maxLevels += inst[2];
  });
  const maxXp = experience(maxLevels);

  postMessage({
    msg: 'complete',
    item_obj: cheapestItem,
    instructions,
    extra: [maxLevels, maxXp],
    enchants
  });

  results = {};
}

function findMostExpensive(objs) {
  return objs.reduce((maxIdx, item, idx, arr) =>
    item.l > arr[maxIdx].l ? idx : maxIdx, 0
  );
}

function getInstructions(comb) {
  const instructions = [];
  for (const key of ['L', 'R']) {
    if (typeof comb[key].I === 'undefined') {
      getInstructions(comb[key]).forEach(inst => instructions.push(inst));
    }
    if (Number.isInteger(comb[key].I)) {
      comb[key].I = Object.keys(ID_LIST).find(k => ID_LIST[k] === comb[key].I);
    } else if (typeof comb[key].I === 'string' && !Object.keys(ID_LIST).includes(comb[key].I)) {
      comb[key].I = ITEM_NAME;
    }
  }

  const mergeCost = Number.isInteger(comb.R.v)
    ? comb.R.v + 2 ** comb.L.w - 1 + 2 ** comb.R.w - 1
    : comb.R.l + 2 ** comb.L.w - 1 + 2 ** comb.R.w - 1;

  const work = Math.max(comb.L.w, comb.R.w) + 1;
  instructions.push([comb.L, comb.R, mergeCost, experience(mergeCost), 2 ** work - 1]);
  return instructions;
}

function combinations(set, k) {
  if (k > set.length || k <= 0) return [];
  if (k === set.length) return [set];
  if (k === 1) return set.map(item => [item]);

  const combs = [];
  for (let i = 0; i < set.length - k + 1; i++) {
    const head = set.slice(i, i + 1);
    const tailCombs = combinations(set.slice(i + 1), k - 1);
    tailCombs.forEach(tc => combs.push(head.concat(tc)));
  }
  return combs;
}

function hashFromItem(itemObj) {
  return [itemObj.i[0], [...itemObj.e].sort(), itemObj.w];
}

function memoizeHashFromArguments(args) {
  return args[0].map(item => hashFromItem(item));
}

const memoizeCheapest = (func) => {
  return (...args) => {
    const argsKey = memoizeHashFromArguments(args);
    if (!results[argsKey]) {
      results[argsKey] = func(...args);
    }
    return results[argsKey];
  };
};

const cheapestItemsFromList = memoizeCheapest((items) => {
  const work2item = {};
  const count = items.length;

  if (count === 1) {
    work2item[items[0].w] = items[0];
    return work2item;
  }

  if (count === 2) {
    const cheapest = cheapestItemFromItems2(items[0], items[1]);
    work2item[cheapest.w] = cheapest;
    return work2item;
  }

  return cheapestItemsFromListN(items, Math.floor(count / 2));
});

function cheapestItemFromItems2(left, right) {
  if (right.i === 'item') return new MergeEnchants(right, left);
  if (left.i === 'item') return new MergeEnchants(left, right);

  let normal;
  try {
    normal = new MergeEnchants(left, right);
  } catch {
    return new MergeEnchants(right, left);
  }

  let reversed;
  try {
    reversed = new MergeEnchants(right, left);
  } catch {
    return normal;
  }

  const cheapest = compareCheapest(normal, reversed);
  return cheapest[Object.keys(cheapest)[0]];
}

function cheapestItemsFromListN(items, maxSubcount) {
  const cheapestWork2item = {};
  const cheapestPriorWorks = [];

  for (let subcount = 1; subcount <= maxSubcount; subcount++) {
    combinations(items, subcount).forEach(leftItems => {
      const rightItems = items.filter(item => !leftItems.includes(item));
      const leftWork2item = cheapestItemsFromList(leftItems);
      const rightWork2item = cheapestItemsFromList(rightItems);
      const newWork2item = cheapestItemsFromDictionaries([leftWork2item, rightWork2item]);

      for (const work in newWork2item) {
        const newItem = newWork2item[work];
        if (cheapestPriorWorks.includes(work)) {
          const cheapest = compareCheapest(cheapestWork2item[work], newItem);
          cheapestWork2item[work] = cheapest[work];
        } else {
          cheapestWork2item[work] = newItem;
          cheapestPriorWorks.push(work);
        }
      }
    });
  }
  return cheapestWork2item;
}

function compareCheapest(item1, item2) {
  const work2item = {};
  const w1 = item1.w;
  const w2 = item2.w;

  if (w1 === w2) {
    if (item1.l === item2.l) {
      work2item[w1] = item1.x <= item2.x ? item1 : item2;
    } else {
      work2item[w1] = item1.l < item2.l ? item1 : item2;
    }
  } else {
    work2item[w1] = item1;
    work2item[w2] = item2;
  }
  return work2item;
}

function cheapestItemsFromDictionaries(work2items) {
  if (work2items.length === 1) return work2items[0];
  return cheapestItemsFromDictionaries2(work2items[0], work2items[1]);
}

function cheapestItemsFromDictionaries2(left, right) {
  const cheapestWork2item = {};
  const cheapestPriorWorks = [];

  for (const leftWork in left) {
    const leftItem = left[leftWork];
    for (const rightWork in right) {
      const rightItem = right[rightWork];
      let newWork2item;
      try {
        newWork2item = cheapestItemsFromList([leftItem, rightItem]);
      } catch (error) {
        if (!(error instanceof MergeLevelsTooExpensiveError)) throw error;
      }

      for (const work in newWork2item) {
        const newItem = newWork2item[work];
        if (cheapestPriorWorks.includes(work)) {
          const cheapest = compareCheapest(cheapestWork2item[work], newItem);
          cheapestWork2item[work] = cheapest[work];
        } else {
          cheapestWork2item[work] = newItem;
          cheapestPriorWorks.push(work);
        }
      }
    }
  }
  return removeExpensiveCandidates(cheapestWork2item);
}

function removeExpensiveCandidates(work2item) {
  const cleaned = {};
  let cheapestValue = Infinity;
  for (const work in work2item) {
    const item = work2item[work];
    if (item.l < cheapestValue) {
      cleaned[work] = item;
      cheapestValue = item.l;
    }
  }
  return cleaned;
}

// --- Classes ---

class ItemObj {
  constructor(name, value = 0, id = []) {
    this.i = name;
    this.e = id;
    this.c = {};
    this.w = 0;
    this.l = value;
    this.x = 0;
  }
}

class MergeEnchants extends ItemObj {
  constructor(left, right) {
    const mergeCost = right.l + 2 ** left.w - 1 + 2 ** right.w - 1;
    if (mergeCost > MAXIMUM_MERGE_LEVELS) {
      throw new MergeLevelsTooExpensiveError();
    }
    const newValue = left.l + right.l;
    super(left.i, newValue);
    this.e = left.e.concat(right.e);
    this.w = Math.max(left.w, right.w) + 1;
    this.x = left.x + right.x + experience(mergeCost);
    this.c = { L: left.c, R: right.c, l: mergeCost, w: this.w, v: this.l };
  }
}

class MergeLevelsTooExpensiveError extends Error {
  constructor(message = 'merge levels is above maximum allowed') {
    super(message);
    this.name = 'MergeLevelsTooExpensiveError';
  }
}

function experience(level) {
  if (level === 0) return 0;
  if (level <= 16) return level ** 2 + 6 * level;
  if (level <= 31) return 2.5 * level ** 2 - 40.5 * level + 360;
  return 4.5 * level ** 2 - 162.5 * level + 2220;
}
