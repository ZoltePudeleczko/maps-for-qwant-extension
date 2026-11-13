const $ = (id) => document.getElementById(id);

const sel = $("provider");
for (const [key, p] of Object.entries(QM_PROVIDERS)) {
  sel.add(new Option(p.name, key));
}

let timer;
function save() {
  chrome.storage.sync.set({
    provider: sel.value,
    newTab: $("newTab").checked,
    label: $("label").value.trim() || "Maps"
  }, () => {
    $("status").textContent = "Saved";
    clearTimeout(timer);
    timer = setTimeout(() => ($("status").textContent = ""), 1200);
  });
}

chrome.storage.sync.get(QM_DEFAULTS, (s) => {
  sel.value = QM_PROVIDERS[s.provider] ? s.provider : "google";
  $("newTab").checked = s.newTab;
  $("label").value = s.label;
});

sel.addEventListener("change", save);
$("newTab").addEventListener("change", save);
$("label").addEventListener("input", save);
