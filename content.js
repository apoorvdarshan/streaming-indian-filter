(() => {
  const SITE = /(^|\.)netflix\.com$/.test(location.hostname) ? "netflix" : "prime";
  const PRIME_LINKS = 'a[href*="/detail/"], a[href*="/dp/"], a[href*="/gp/product/"]';
  const PRIME_CARDS = 'article, [data-testid="card"], [data-testid="title-card"], [data-card-title]';
  const hidden = new Map();
  let enabled = false;
  let matcher = RegionalMatcher.create();
  let scanQueued = false;

  function setHidden(el, blocked) {
    if (blocked) {
      if (!hidden.has(el)) {
        hidden.set(el, [el.style.getPropertyValue("display"), el.style.getPropertyPriority("display")]);
        el.dataset.nifHidden = "1";
      }
      if (el.style.getPropertyValue("display") !== "none" || el.style.getPropertyPriority("display") !== "important") {
        el.style.setProperty("display", "none", "important");
      }
    } else if (hidden.has(el)) {
      const [value, priority] = hidden.get(el);
      if (value) el.style.setProperty("display", value, priority);
      else el.style.removeProperty("display");
      delete el.dataset.nifHidden;
      hidden.delete(el);
    }
  }

  function titleTexts(card) {
    const texts = new Set();
    const add = text => {
      if (text && text.trim().length <= 240) texts.add(text.trim());
    };
    function attributes(node) {
      for (const attr of ["data-card-title", "data-title", "aria-label", "title", "alt"]) add(node.getAttribute(attr));
    }
    attributes(card);
    card.querySelectorAll('[data-card-title], [data-title], img[alt], [aria-label], [title], .fallback-text, .billboard-title, h2, h3, [itemprop="name"]')
      .forEach(node => {
        attributes(node);
        if (node.matches('.fallback-text, .billboard-title, h2, h3, [itemprop="name"]')) add(node.textContent);
      });
    // Text-only cards occur in search and older site layouts. Never inspect
    // full synopsis/metadata text when an actual title is already available.
    if (!texts.size && card.textContent.trim().length < 100) add(card.textContent);
    return [...texts];
  }

  function originMetadata(card) {
    const origin = card.matches('[data-country-of-origin], [data-production-country]') ? card
      : card.querySelector('[data-country-of-origin], [data-production-country], [itemprop="countryOfOrigin"]');
    const date = card.matches('[data-release-year]') ? card
      : card.querySelector('[data-release-year], [itemprop="datePublished"], time[datetime]');
    return {
      country: origin && (origin.getAttribute("data-country-of-origin") || origin.getAttribute("data-production-country") || origin.getAttribute("content") || origin.textContent),
      year: (date && (date.getAttribute("data-release-year") || date.getAttribute("content") || date.getAttribute("datetime") || date.textContent))?.match(/\b(?:19|20)\d{2}\b/)?.[0]
    };
  }

  function scan() {
    scanQueued = false;
    if (!enabled) return;
    const decisions = new Map();
    function consider(container, blocked) {
      decisions.set(container, blocked || decisions.get(container) || false);
    }
    function card(container, source = container) {
      const metadata = originMetadata(source);
      const titles = titleTexts(source);
      consider(container, titles.some(title => matcher.isBlockedTitle(title, metadata)) ||
        (!titles.length && metadata.country && matcher.isBlockedTitle("", metadata)));
    }

    if (SITE === "netflix") {
      document.querySelectorAll('.lolomoRow, [data-list-context]').forEach(row => {
        const header = row.querySelector('.row-header-title, .rowHeader');
        consider(row, !!header && matcher.isBlockedCategory(header.textContent));
      });
      document.querySelectorAll('.title-card').forEach(el => card(el.closest('.slider-item') || el, el));
      document.querySelectorAll('.billboard-row').forEach(el => card(el));
    } else {
      document.querySelectorAll('section, [data-testid*="carousel"], [class*="tst-collection"]').forEach(row => {
        const header = row.querySelector('h2, h3');
        // A card title is not a category heading.
        if (header && !header.closest(PRIME_CARDS)) consider(row, matcher.isBlockedCategory(header.textContent));
      });
      const cards = new Set();
      document.querySelectorAll(PRIME_CARDS).forEach(el => {
        // Some carousels are themselves articles. Only treat leaf articles as
        // cards, so one matching recommendation cannot hide its neighbours.
        if (!el.querySelector('article')) {
          const leaf = el.closest('article') || el;
          cards.add(leaf.closest('li') || leaf);
        }
      });
      document.querySelectorAll(PRIME_LINKS).forEach(link => {
        if (link.closest('header, nav, footer')) return;
        cards.add(link.closest('li, article') || link);
      });
      cards.forEach(el => card(el));
    }

    // Re-evaluate hidden nodes too: both sites reuse cards during scrolling
    // and SPA navigation. Removing a term must immediately restore matches.
    for (const el of hidden.keys()) {
      if (!el.isConnected) hidden.delete(el);
      else if (!decisions.get(el)) setHidden(el, false);
    }
    for (const [el, blocked] of decisions) setHidden(el, blocked);
  }

  function queueScan() {
    if (!enabled || scanQueued) return;
    scanQueued = true;
    setTimeout(scan, 100);
  }

  function loadSettings() {
    chrome.storage.sync.get({ enabled: true, extraTerms: [], hideAmbiguous: true }, cfg => {
      if (chrome.runtime.lastError) return;
      enabled = cfg.enabled !== false;
      matcher = RegionalMatcher.create(Array.isArray(cfg.extraTerms) ? cfg.extraTerms : [], {
        hideAmbiguous: cfg.hideAmbiguous !== false
      });
      if (enabled) scan();
      else for (const el of hidden.keys()) setHidden(el, false);
    });
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && (changes.enabled || changes.extraTerms || changes.hideAmbiguous)) loadSettings();
  });
  new MutationObserver(mutations => {
    if (mutations.some(m => m.type !== "attributes" || m.attributeName !== "style" ||
      (hidden.has(m.target) && m.target.style.getPropertyValue("display") !== "none"))) queueScan();
  }).observe(document.documentElement, {
    childList: true, characterData: true, subtree: true, attributes: true,
    attributeFilter: ["alt", "title", "aria-label", "data-card-title", "data-title", "href",
      "data-country-of-origin", "data-production-country", "data-release-year", "content", "datetime", "style"]
  });
  window.addEventListener("pageshow", queueScan);
  window.addEventListener("popstate", queueScan);
  loadSettings();
})();
