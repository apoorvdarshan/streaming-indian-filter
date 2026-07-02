const enabledBox = document.getElementById("enabled");
const termsBox = document.getElementById("terms");
const savedNote = document.getElementById("saved");

chrome.storage.sync.get({ enabled: true, extraTerms: [] }, (cfg) => {
  enabledBox.checked = cfg.enabled;
  termsBox.value = cfg.extraTerms.join("\n");
});

document.getElementById("save").addEventListener("click", () => {
  const extraTerms = termsBox.value
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
  chrome.storage.sync.set({ enabled: enabledBox.checked, extraTerms }, () => {
    savedNote.textContent = "Saved — refresh Netflix if needed";
    setTimeout(() => (savedNote.textContent = ""), 2000);
  });
});
