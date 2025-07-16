// options.js

document.addEventListener('DOMContentLoaded', () => {
  // Betöltéskor lekérjük az értékeket
  chrome.storage.local.get(
    ["autoSaveEnabled", "kerakv", "szakv", "hzakv", "hlakv"],
    (result) => {
      document.getElementById("autoSaveEnabled").checked = result.autoSaveEnabled ?? true;
      document.getElementById("kerakv").value = result.kerakv ?? "kerakv";
      document.getElementById("szakv").value = result.szakv ?? "szakv";
      document.getElementById("hzakv").value = result.hzakv ?? "hzakv";
      document.getElementById("hlakv").value = result.hlakv ?? "hlakv";
    }
  );

  // Azonnali mentés checkbox esetén
  document.getElementById("autoSaveEnabled").addEventListener("change", (e) => {
    chrome.storage.local.set({ autoSaveEnabled: e.target.checked });
  });

  // Mentés gomb hozzáadása dinamikusan (vagy HTML-ben is lehet)
  const saveButton = document.createElement("button");
  saveButton.textContent = "Beállítások mentése JS";
  saveButton.style.marginTop = "1em";
  saveButton.style.padding = "0.5em 1em";
  saveButton.style.backgroundColor = "#006241";
  saveButton.style.color = "#fff";
  saveButton.style.border = "none";
  saveButton.style.borderRadius = "6px";
  saveButton.style.cursor = "pointer";
  document.body.appendChild(saveButton);

  saveButton.addEventListener("click", () => {
    const kerakv = document.getElementById("kerakv").value.trim();
    const szakv = document.getElementById("szakv").value.trim();
    const hzakv = document.getElementById("hzakv").value.trim();
    const hlakv = document.getElementById("hlakv").value.trim();

    chrome.storage.local.set({ kerakv, szakv, hzakv, hlakv }, () => {
      saveButton.textContent = "Mentve ✓";
      setTimeout(() => (saveButton.textContent = "Beállítások mentése"), 2000);
    });
  });
});
