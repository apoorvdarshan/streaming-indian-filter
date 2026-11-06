// Shared by the content script and popup. All matching happens on device.
const RegionalMatcher = (() => {
  function normalize(text) {
    return String(text || "").normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
      .replace(/&/g, " and ").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  }

  // Preserve v1 explicit blocks and short names absent from the origin catalog.
  const previousTitles = new Set(["sacred games", "delhi crime", "mismatched", "kota factory", "heeramandi", "the railway men", "guns & gulaabs", "jamtara", "masaba masaba", "little things", "taj mahal 1989", "class", "rana naidu", "khakee", "scoop", "trial by fire", "kohrra", "ic 814", "amar singh chamkila", "maamla legal hai", "killer soup", "cat", "mai", "yeh kaali kaali ankhein", "fabulous lives of bollywood wives", "indian matchmaking", "the big day", "bombay begums", "aranyak", "feels like ishq", "decoupled", "eternally confused and eager for love", "minnal murali", "rrr", "baahubali", "kgf", "k.g.f", "pushpa", "jawan", "pathaan", "animal", "gangubai kathiawadi", "brahmastra", "dangal", "3 idiots", "pk", "lagaan", "sholay", "kabhi khushi kabhie gham", "dilwale dulhania le jayenge", "zindagi na milegi dobara", "queen", "andhadhun", "drishyam", "tumbbad", "haseen dillruba", "darlings", "monica o my darling", "ludo", "ak vs ak", "serious men", "the white tiger", "sardar udham", "lust stories", "ghost stories", "chopsticks", "bulbbul", "raat akeli hai", "gunjan saxena", "shershaah", "meenakshi sundareshwar", "gehraiyaan", "jaane jaan", "kill", "laapataa ladies", "12th fail", "maharaj", "sector 36", "do patti", "the archies", "kaala paani", "farzi", "dahaad", "made in heaven", "mirzapur", "panchayat", "paatal lok", "the family man", "asur", "aashram", "bandish bandits", "breathe", "breathe: into the shadows", "four more shots please", "inside edge", "mumbai diaries 26/11", "jubilee", "gulmohar", "citadel: honey bunny", "call me bae", "poacher", "the forgotten army", "tandav", "soorarai pottru", "ponniyin selvan", "sita ramam", "kalki 2898 ad", "salaar", "hanu man", "maharaja", "vikram", "leo", "jailer", "master"].map(normalize));
  const ambiguous = new Set(INDIAN_CATALOG.ambiguous);
  const language = "hindi|tamil|telugu|malayalam|kannada|bengali|marathi|punjabi|gujarati|english|odia";
  const languageSuffix = new RegExp(`\\s*[([](?:${language})(?:\\s+(?:dubbed|version|audio))?[)\\]]\\s*$`, "i");
  const regionalRow = /\b(indian|bollywood|tollywood|kollywood|mollywood|hindi|tamil|telugu|malayalam|kannada|punjabi|marathi|bengali|gujarati|bhojpuri|odia)\b/i;

  function variants(raw) {
    const value = String(raw || "").trim().replace(/^(?:watch|play|resume)(?:\s+now)?\s*[:\-]?\s+/i, "")
      .replace(/\s*[|–—]\s*(?:netflix|prime video)\s*$/i, "");
    // Only remove known UI adornments, never match an arbitrary substring.
    const clean = value.replace(languageSuffix, "")
      .replace(/\s*\(?\b(?:19|20)\d{2}\)?\s*$/, "")
      .replace(languageSuffix, "")
      .replace(/\s*[-:–—,(]?\s*(?:season\s*\d+|s\d+)(?:\s*[,–—-]?\s*(?:episode\s*\d+|e\d+))?\)?\s*$/i, "");
    const title = normalize(clean);
    return [...new Set([normalize(value), title,
      title.replace(/ (?:the movie|official trailer|trailer)$/, "")])].filter(Boolean);
  }

  function create(extraTerms = [], { hideAmbiguous = true } = {}) {
    const terms = extraTerms.filter(t => typeof t === "string").map(normalize).filter(Boolean);
    function customMatch(title) {
      const normalized = ` ${normalize(title)} `;
      return terms.some(term => normalized.includes(` ${term} `));
    }
    function isBlockedTitle(raw, { year, country } = {}) {
      if (customMatch(raw)) return true;
      // Explicit origin is stronger evidence than a title match. Audio language
      // and the language used to render a poster are deliberately not origin.
      if (country) return /\bindia\b/i.test(country) || country.split(/[,;|]/).some(code => /^(IN|IND)$/i.test(code.trim()));
      const date = Number(year || String(raw).match(/(?:\(|\[|[-–—]\s+)((?:19|20)\d{2})(?:\)|\])?\s*$/)?.[1]);
      return variants(raw).some(title => {
        if (!Object.hasOwn(INDIAN_CATALOG.titles, title)) return previousTitles.has(title);
        const years = INDIAN_CATALOG.titles[title];
        if (date && years.length && !years.includes(date)) return false;
        return hideAmbiguous || !ambiguous.has(title);
      });
    }
    return {
      isBlockedTitle,
      isBlockedCategory: text => customMatch(text) || regionalRow.test(text)
    };
  }
  return { normalize, variants, create };
})();
