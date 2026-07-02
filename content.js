// Netflix does not expose country-of-origin in the DOM, so filtering is
// heuristic: row/category names, a seed list of well-known Indian titles,
// Indic-script detection, and user-added terms from the popup.

const KEYWORDS = [
  "india", "indian", "bollywood", "tollywood", "kollywood", "mollywood",
  "hindi", "tamil", "telugu", "malayalam", "kannada", "punjabi", "marathi",
  "bengali", "gujarati", "bhojpuri", "desi", "south asian", "hindustani"
];

const SEED_TITLES = [
  "sacred games", "delhi crime", "mismatched", "kota factory", "heeramandi",
  "the railway men", "guns & gulaabs", "jamtara", "masaba masaba",
  "little things", "taj mahal 1989", "class", "rana naidu", "khakee",
  "scoop", "trial by fire", "kohrra", "ic 814", "amar singh chamkila",
  "maamla legal hai", "killer soup", "cat", "mai", "yeh kaali kaali ankhein",
  "fabulous lives of bollywood wives", "indian matchmaking", "the big day",
  "bombay begums", "aranyak", "feels like ishq", "decoupled",
  "eternally confused and eager for love", "minnal murali", "rrr",
  "baahubali", "kgf", "k.g.f", "pushpa", "jawan", "pathaan", "animal",
  "gangubai kathiawadi", "brahmastra", "dangal", "3 idiots", "pk", "lagaan",
  "sholay", "kabhi khushi kabhie gham", "dilwale dulhania le jayenge",
  "zindagi na milegi dobara", "queen", "andhadhun", "drishyam", "tumbbad",
  "haseen dillruba", "darlings", "monica o my darling", "ludo", "ak vs ak",
  "serious men", "the white tiger", "sardar udham", "lust stories",
  "ghost stories", "chopsticks", "bulbbul", "raat akeli hai", "gunjan saxena",
  "shershaah", "meenakshi sundareshwar", "gehraiyaan", "jaane jaan", "kill",
  "laapataa ladies", "12th fail", "maharaj", "sector 36", "cttc",
  "do patti", "the archies", "kaala paani", "farzi", "dahaad", "made in heaven",
  "mirzapur", "panchayat", "paatal lok", "the family man", "asur", "aashram"
];

// Devanagari through Malayalam blocks (covers Hindi, Bengali, Punjabi,
// Gujarati, Odia, Tamil, Telugu, Kannada, Malayalam).
const INDIC_SCRIPT = /[ऀ-ൿ]/;

let enabled = true;
let extraTerms = [];
let keywordRegex = null;
let blockedTitles = new Set();
let hiddenCount = 0;

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rebuildMatchers() {
  const words = KEYWORDS.concat(extraTerms).filter(Boolean).map(escapeRegex);
  keywordRegex = new RegExp("\\b(" + words.join("|") + ")\\b", "i");
  blockedTitles = new Set(
    SEED_TITLES.concat(extraTerms).map((t) => t.toLowerCase().trim())
  );
}

function isBlockedText(text) {
  if (!text) return false;
  const t = text.toLowerCase().trim();
  return blockedTitles.has(t) || keywordRegex.test(t) || INDIC_SCRIPT.test(t);
}

function hide(el) {
  if (!el || el.dataset.nifHidden) return;
  el.dataset.nifHidden = "1";
  el.style.setProperty("display", "none", "important");
  hiddenCount++;
}

function unhideAll() {
  document.querySelectorAll("[data-nif-hidden]").forEach((el) => {
    el.style.removeProperty("display");
    delete el.dataset.nifHidden;
  });
  hiddenCount = 0;
}

function cardText(card) {
  const labelled = card.matches("[aria-label]")
    ? card
    : card.querySelector("[aria-label]");
  if (labelled) return labelled.getAttribute("aria-label");
  const fallback = card.querySelector(".fallback-text");
  return fallback ? fallback.textContent : card.textContent;
}

function scan() {
  if (!enabled) return;

  // Whole browse rows whose category name matches ("Bollywood Movies",
  // "Indian TV Dramas", "Hindi-Language Films", ...).
  document.querySelectorAll(".lolomoRow, [data-list-context]").forEach((row) => {
    if (row.dataset.nifHidden) return;
    const header = row.querySelector(".row-header-title, .rowHeader");
    if (header && isBlockedText(header.textContent)) hide(row);
  });

  // Individual title cards in rows, search results, and galleries.
  document.querySelectorAll(".title-card").forEach((card) => {
    const container = card.closest(".slider-item") || card;
    if (container.dataset.nifHidden) return;
    if (isBlockedText(cardText(card))) hide(container);
  });

  // The big billboard banner at the top of browse pages.
  document.querySelectorAll(".billboard-row").forEach((billboard) => {
    if (billboard.dataset.nifHidden) return;
    const logo = billboard.querySelector(".billboard .logo, .title-logo");
    const text =
      (logo && (logo.getAttribute("alt") || logo.getAttribute("title"))) ||
      (billboard.querySelector(".billboard-title") || {}).textContent;
    if (isBlockedText(text)) hide(billboard);
  });
}

let scanQueued = false;
function queueScan() {
  if (scanQueued) return;
  scanQueued = true;
  setTimeout(() => {
    scanQueued = false;
    scan();
  }, 150);
}

function loadSettings() {
  chrome.storage.sync.get({ enabled: true, extraTerms: [] }, (cfg) => {
    enabled = cfg.enabled;
    extraTerms = cfg.extraTerms;
    rebuildMatchers();
    if (enabled) scan();
    else unhideAll();
  });
}

chrome.storage.onChanged.addListener(loadSettings);

rebuildMatchers();
loadSettings();

new MutationObserver(queueScan).observe(document.documentElement, {
  childList: true,
  subtree: true
});

// Safety net for SPA navigations the observer batches away.
setInterval(queueScan, 2000);
