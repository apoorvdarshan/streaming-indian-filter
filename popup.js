const enabledBox = document.getElementById("enabled");
const ambiguousBox = document.getElementById("hide-ambiguous");
const termsBox = document.getElementById("terms");
const savedNote = document.getElementById("saved");
const saveButton = document.getElementById("save");
document.getElementById("catalog-info").textContent =
  `${INDIAN_CATALOG.works.toLocaleString()} movies & shows · catalog ${INDIAN_CATALOG.updated}`;

function error(message) {
  savedNote.style.color = "#ff8a80";
  savedNote.textContent = message;
}

chrome.storage.sync.get({ enabled: true, extraTerms: [], hideAmbiguous: true }, (cfg) => {
  if (chrome.runtime.lastError) {
    error("Could not load settings. Reopen this popup to retry.");
    return;
  }
  enabledBox.checked = cfg.enabled !== false;
  ambiguousBox.checked = cfg.hideAmbiguous !== false;
  termsBox.value = Array.isArray(cfg.extraTerms) ? cfg.extraTerms.join("\n") : "";
  saveButton.disabled = false;
});

saveButton.addEventListener("click", () => {
  const extraTerms = [...new Set(termsBox.value
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean))];
  saveButton.disabled = true;
  chrome.storage.sync.set({ enabled: enabledBox.checked, hideAmbiguous: ambiguousBox.checked, extraTerms }, () => {
    saveButton.disabled = false;
    if (chrome.runtime.lastError) {
      error("Could not save. Try fewer or shorter extra terms.");
      return;
    }
    savedNote.style.color = "#46d369";
    savedNote.textContent = "Saved — applied to open streaming tabs";
  });
});
