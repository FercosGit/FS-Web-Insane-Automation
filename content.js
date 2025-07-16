// content.js
// version v1.0 readytorelease
// refactored by GitHub Co-Pilot
//removed const definition


// Constants
// (Delay constants will be inlined and removed as requested)

// Utility & Assist Functions
function sendStatisticEvent(eventName, url) {
  const baseUrl = url.split("/").slice(0, -1).join("/");
  const params = new URLSearchParams();
  params.append("event", eventName);
  params.append("url", baseUrl);

  fetch("https://script.google.com/macros/s/AKfycbyRVTp97VB0xbve8biOZ5-A-y0VcdGaNxoVWMOntH685oGx5KV0Frqa_iLbkkaJifJApg/exec", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  }).catch(err => console.warn("Tracker failed", err));
}

function loadMaterialIcons() {
  if (!document.getElementById("material-icons-font")) {
    const link = document.createElement("link");
    link.id = "material-icons-font";
    link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
}

function insertFactCheckIcon(targetElement, color = "black") {
  if (!targetElement) return;
  targetElement.style.display = "inline-flex";
  targetElement.style.alignItems = "flex-start";
  targetElement.style.gap = "4px";

  const iconSpan = document.createElement("span");
  iconSpan.className = "material-icons";
  iconSpan.innerText = "fact_check";
  iconSpan.style.color = color;
  iconSpan.style.fontSize = "20px";
  iconSpan.style.verticalAlign = "top";
  targetElement.prepend(iconSpan);
}

function showAlert(message, duration = 3000) {
  return new Promise(resolve => {
    const alertBox = document.createElement('div');
    alertBox.style.position = 'fixed';
    alertBox.style.top = '20px';
    alertBox.style.left = '50%';
    alertBox.style.transform = 'translateX(-50%)';
    alertBox.style.width = '320px';
    alertBox.style.backgroundColor = '#ffcc00';
    alertBox.style.color = '#000';
    alertBox.style.fontWeight = 'bold';
    alertBox.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
    alertBox.style.zIndex = '9999';
    alertBox.style.borderRadius = '8px';
    alertBox.style.pointerEvents = 'none';
    alertBox.style.overflow = 'hidden';
    alertBox.style.fontSize = '14px';
    alertBox.style.textAlign = 'center';

    const text = document.createElement('div');
    text.style.padding = '12px 16px';
    text.textContent = message;

    const bar = document.createElement('div');
    bar.style.height = '4px';
    bar.style.backgroundColor = '#444';
    bar.style.width = '100%';
    bar.style.transition = `width linear ${duration}ms`;

    alertBox.appendChild(text);
    alertBox.appendChild(bar);
    document.body.appendChild(alertBox);

    requestAnimationFrame(() => {
      bar.style.width = '0%';
    });

    setTimeout(() => {
      alertBox.remove();
      resolve();
    }, duration);
  });
}

function getAutoSaveEnabled() {
  return new Promise(resolve => {
    chrome.storage?.local.get('autoSaveEnabled', data => {
      resolve(!!data?.autoSaveEnabled);
    });
  });
}

function delay(minMs, maxMs) {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, ms));
}

function clearObject(obj) {
  Object.keys(obj).forEach(k => delete obj[k]);
}

function extractTableData(rows) {
  const data = {}, links = {};
  rows.forEach(row => {
    const th = row.querySelector('th')?.innerText?.trim().toLowerCase();
    const td = row.querySelector('td');
    let value = "";
    if (td) {
      const clone = td.cloneNode(true);
      clone.querySelectorAll('div[sides]').forEach(div => div.remove());
      value = clone.innerText.split('\n')[0].trim();
    }
    if (th && value) {
      data[th] = value;
      links[th] = !!td?.querySelector('a');
    }
  });
  return { data, links };
}

// DOM Waiters & Observers
function waitForAllElements(selectors, timeout = 4000, interval = 200, cancelText = null) {
  return new Promise(resolve => {
    const start = Date.now();
    const check = () => {
      if (cancelText) {
        const foundText = Array.from(document.querySelectorAll("*"))
          .some(el => el.innerText?.trim() === cancelText);
        if (foundText) return resolve(false);
      }
      const allPresent = selectors.every(sel => document.querySelector(sel));
      if (allPresent) return resolve(true);
      if (Date.now() - start >= timeout) return resolve(false);
      setTimeout(check, interval);
    };
    check();
  });
}

function waitForDomStabilization(targetElement, quietPeriod = 300) {
  return new Promise(resolve => {
    let timer;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        observer.disconnect();
        console.log("[Observer] DOM stabilized.");
        resolve();
      }, quietPeriod);
    });
    observer.observe(targetElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
    });
    console.log("[Observer] DOM mutation observer started...");
  });
}

// Data Processing Functions
function processBaptismOrBirth() {
  const rows = document.querySelectorAll('table tr');
  const { data, links } = extractTableData(rows);
  let missingName = "";

  rows.forEach(row => {
    const th = row.querySelector('th')?.innerText?.trim().toLowerCase();
    const td = row.querySelector('td');
    let value = "";
    if (td) {
      const clone = td.cloneNode(true);
      clone.querySelectorAll('div[sides]').forEach(div => div.remove());
      value = clone.innerText.split('\n')[0].trim();
    }
    if (th === "név" && value && missingName === "") {
      missingName = value;
      clearObject(data);
      clearObject(links);
    }
  });

  if (!data["anya neve"]) {
    data["anya neve"] = missingName;
    links["anya neve"] = false;
  }
  if (!data["apa neve"]) {
    data["apa neve"] = missingName;
    links["apa neve"] = false;
  }

  const name = data["név"] || "";
  const genderRaw = data["nem"] || "";
  const gender = genderRaw.toLowerCase();
  const birthDate = data["születési dátum"] || data["esemény dátuma"] || "";
  const eventDate = data["esemény dátuma"] || "";
  const birthYear = (birthDate.match(/\d{4}/) || [])[0] || "";
  const eventYear = (eventDate.match(/\d{4}/) || [])[0] || "";

  const fiaLanya = (gender === "m" || gender === "male" || gender === "férfi") ? "fia" :
    (gender === "f" || gender === "female" || gender === "női" || gender === "nő") ? "lánya" : "gyermeke";

  const persons = [
    { key: "gyermek", label: name ? `${name} (${birthYear})` : "", sourceKey: "név" },
    { key: "apa", label: data["apa neve"] ? `${data["apa neve"]} (apa)` : "", sourceKey: "apa neve" },
    { key: "anya", label: data["anya neve"] ? `${data["anya neve"]} (anya)` : "", sourceKey: "anya neve" }
  ].filter(p => p.label && !p.label.includes("undefined") && p.label.trim() !== "()");

  const noLinkEntries = persons.filter(p => links[p.sourceKey] === false);
  const defaultPersonKey = noLinkEntries.length === 1 ? noLinkEntries[0].key : null;

  const labelType = (["baptism", "keresztelő"].some(k => (data["esemény típusa"] || "").toLowerCase().includes(k))) ? "kerakv" : "szakv";

  return persons.map(p => {
    let out = "";
    if (p.key === "gyermek") {
      out = `${name} ${birthYear} ${labelType} ${eventYear}`;
    } else {
      const parentName = data[p.key + " neve"];
      out = `${parentName} itt ${fiaLanya} ${name} ${birthYear} ${labelType} ${eventYear}`;
    }
    return {
      label: p.label,
      isDefault: p.key === defaultPersonKey,
      output: out
    };
  });
}

function processMarriageEvent() {
  const rows = document.querySelectorAll('table tr');
  const { data, links } = extractTableData(rows);

  const personName = data["név"] || "";
  const personYear = data["születési dátum"] || "";
  let spouseName = data["házastárs neve"] || "";
  const spouseYear = data["házastárs születési dátuma"] || "";
  const marriageDate = data["esemény dátuma"] || "";

  // Remove redundant last name from spouseName if present
  const personLastName = personName.split(" ")[0];
  const spouseParts = spouseName.split(" ");
  if (spouseParts.length > 2 && spouseParts.includes(personLastName)) {
    spouseParts.splice(spouseParts.indexOf(personLastName), 1);
    spouseName = spouseParts.join(" ");
  }

  const marriageYear = (marriageDate.match(/\d{4}/) || [])[0] || "";

  const persons = [
    { key: "vőlegény", label: personName, sourceKey: "név", suffix: "(fő személy)" },
    { key: "menyasszony", label: spouseName, sourceKey: "házastárs neve", suffix: "(házastárs)" },
    { key: "apa", label: data["apa neve"] || "", sourceKey: "apa neve", suffix: "(apa)" },
    { key: "anya", label: data["anya neve"] || "", sourceKey: "anya neve", suffix: "(anya)" },
    { key: "házastárs apja", label: data["házastárs apjának neve"] || "", sourceKey: "házastárs apjának neve", suffix: "(házastárs apja)" },
    { key: "házastárs anyja", label: data["házastárs anyjának neve"] || "", sourceKey: "házastárs anyjának neve", suffix: "(házastárs anyja)" }
  ].filter(p => p.label && !p.label.includes("undefined") && p.label.trim() !== "()");

  const noLinkEntries = persons.filter(p => links[p.sourceKey] === false);
  const defaultPersonKey = noLinkEntries.length === 1 ? noLinkEntries[0].key : null;

  return persons.map(p => {
    let out = "";
    if (p.key === "vőlegény" || p.key === "menyasszony") {
      out = `${personName} ${personYear} és ${spouseName} ${spouseYear} hzakv ${marriageYear}`;
    } else if (p.key === "apa" || p.key === "anya") {
      out = `${data[p.key === "apa" ? "apa neve" : "anya neve"]} itt fia ${personName} ${personYear} és ${spouseName} ${spouseYear} hzakv ${marriageYear}`;
    } else if (p.key === "házastárs apja" || p.key === "házastárs anyja") {
      const other = p.key === "házastárs apja" ? "házastárs apjának neve" : "házastárs anyjának neve";
      out = `${data[other]} itt lánya ${spouseName} ${spouseYear} és ${personName} ${personYear} hzakv ${marriageYear}`;
    }
    return {
      label: `${p.label} ${p.suffix}`,
      isDefault: p.key === defaultPersonKey,
      output: out
    };
  });
}

function processDeathRegistration() {
  const rows = document.querySelectorAll('table tr');
  const { data, links } = extractTableData(rows);

  const name = data["név"] || "";
  const genderRaw = data["nem"] || "";
  const gender = genderRaw.toLowerCase();
  let spouseName = data["házastárs neve"] || "";

  // Find birth year key dynamically
  const szulKey = Object.keys(data).find(k => k.startsWith("születési"));
  const birthYear = (szulKey ? data[szulKey] : "").match(/\d{4}/)?.[0] || "";
  const deathYear = (data["elhalálozási dátum"] || "").match(/\d{4}/)?.[0] || "";
  const eventYear = (data["esemény dátuma"] || "").match(/\d{4}/)?.[0] || "";

  // Remove redundant last name from spouseName if present
  const personLastName = name.split(" ")[0];
  const spouseParts = spouseName.split(" ");
  if (spouseParts.length > 2 && spouseParts.includes(personLastName)) {
    spouseParts.splice(spouseParts.indexOf(personLastName), 1);
    spouseName = spouseParts.join(" ");
  }

  const fiaLanya = (gender === "m" || gender === "male" || gender === "férfi") ? "fia" :
    (gender === "f" || gender === "female" || gender === "női" || gender === "nő") ? "lánya" : "gyermeke";
  const ferjeNeje = (gender === "m" || gender === "male" || gender === "férfi") ? "férje" :
    (gender === "f" || gender === "female" || gender === "női" || gender === "nő") ? "neje" : "házastársa";

  const persons = [
    { key: "gyermek", label: name ? `${name} (${birthYear})` : "", sourceKey: "név" },
    { key: "apa", label: data["apa neve"] ? `${data["apa neve"]} (apa)` : "", sourceKey: "apa neve" },
    { key: "anya", label: data["anya neve"] ? `${data["anya neve"]} (anya)` : "", sourceKey: "anya neve" },
    { key: "házastárs", label: data["házastárs neve"] ? `${data["házastárs neve"]} (házastárs)` : "", sourceKey: "házastárs neve" }
  ].filter(p => p.label && !p.label.includes("undefined") && p.label.trim() !== "()");

  const noLinkEntries = persons.filter(p => links[p.sourceKey] === false);
  const defaultPersonKey = noLinkEntries.length === 1 ? noLinkEntries[0].key : null;

  return persons.map(p => {
    let out = "";
    if (p.key === "gyermek") {
      out = `${name} ${birthYear} hlakv ${eventYear} (${deathYear})`;
    } else if (p.key === "házastárs") {
      out = `${spouseName} itt ${ferjeNeje} ${name} ${birthYear} hlakv ${eventYear} (${deathYear || eventYear})`;
    } else {
      const parentName = data[p.key + " neve"];
      out = `${parentName} itt ${fiaLanya} ${name} ${birthYear} hlakv ${eventYear} (${deathYear || eventYear})`;
    }
    return {
      label: p.label,
      isDefault: p.key === defaultPersonKey,
      output: out
    };
  });
}

// Source Processing Logic
function detectEventType() {
  const rows = document.querySelectorAll('table tr');
  for (const row of rows) {
    const key = row.querySelector('th')?.innerText?.trim().toLowerCase();
    if (key === "esemény típusa") {
      const value = row.querySelector('td')?.innerText?.trim();
      return value || "";
    }
  }
  return "";
}

function processSourceContent() {
  let eventType = "";
  let eventTypeRaw = "";
  let newTitle = "";
  let eventFound = false;

  eventTypeRaw = detectEventType();
  eventType = eventTypeRaw.toLowerCase();
  console.log("[processSourceContent] eventType:", eventType);

  if (!eventTypeRaw) {
    eventFound = false;
    eventType = "nem jelölt";
    newTitle = "";
  } else if (["házasság", "marriage"].some(k => eventType.includes(k))) {
    const choices = processMarriageEvent();
    const defaultIdx = choices.findIndex(c => c.isDefault);
    eventFound = true;
    newTitle = choices[defaultIdx].output;
  } else if (["baptism", "keresztelő", "birth registration"].some(k => eventType.includes(k))) {
    const choices = processBaptismOrBirth();
    const defaultIdx = choices.findIndex(c => c.isDefault);
    eventFound = true;
    newTitle = choices[defaultIdx].output;
  } else if (["death registration", "burial", "death"].some(k => eventType.includes(k))) {
    const choices = processDeathRegistration();
    const defaultIdx = choices.findIndex(c => c.isDefault);
    eventFound = true;
    newTitle = choices[defaultIdx].output;
  } else {
    eventFound = false;
    newTitle = "";
  }

  return { eventFound, eventType, newTitle };
}

async function fillAndMark({ newTitle, originalTitle, indexed, eventFound, eventType, logPrefix = "" }) {
  const openPanel = document.querySelector("div[class^='cssSourcePanelOpen_']");
  const titleElement = openPanel?.querySelector("div[class^='cssSourceTitle_']");

  if ((newTitle !== originalTitle) && indexed && eventFound) {
    console.log(`>>[${logPrefix}] új forráscímet készítettem`);
    const fillSuccess = await simulateEditAndFillSourceTitle(newTitle);
    if (fillSuccess) {
      insertFactCheckIcon(titleElement, "green");
      sendStatisticEvent(("FS_SOFIA_resolved_event_" + eventType), window.location.href);
    } else {
      insertFactCheckIcon(titleElement, "red");
      sendStatisticEvent(("FS_SOFIA_resolved_event_unfilled_" + eventType), window.location.href);
    }
  } else {
    if (newTitle === originalTitle) {
      console.log(`>>[${logPrefix}] Eredeti forrás cím már megfelelő`);
      insertFactCheckIcon(titleElement, "blue");
      sendStatisticEvent(("FS_SOFIA_resolved_event_unchanged_" + eventType), window.location.href);
    }
    if (!indexed) {
      console.log(`>>[${logPrefix}] Nincs elérhető indexelt adat`);
      insertFactCheckIcon(titleElement, "orange");
      sendStatisticEvent(("FS_SOFIA_unresolved_event_" + eventType), window.location.href);
    }
  }
}

async function simulateEditAndFillSourceTitle(newValue = "új szöveg") {
  const buttons = Array.from(document.querySelectorAll('button[data-testid^="source-button_edit"]'));
  const visibleButton = buttons.find(btn =>
    btn.offsetParent !== null &&
    !btn.disabled &&
    btn.getBoundingClientRect().height > 0
  );

  if (!visibleButton) {
    await showAlert("Nem található látható, aktív 'Szerkesztés' gomb.", 3000);
    return false;
  }
  visibleButton.click();

  // Wait for input to appear
  const ok = await waitForAllElements(['input[data-testid="source-title-field"'], 2500, 100);
  if (!ok) {
    await showAlert("Nem található a 'Forrás címe' mező.", 3000);
    return false;
  }
  await delay(500, 600);
  const input = document.querySelector('input[data-testid="source-title-field"]');
  input.value = newValue;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));

  // Assume autosave enabled
  const autoSaveEnabled = true;
  if (!autoSaveEnabled) {
    await showAlert("Szerkesztés lehetséges mentés előtt...", 5000);
  } else {
    await showAlert("Új forrás cím mentése...", 1000);
  }

  const saveButton = document.querySelector('[data-testid="source-save-button"]');
  if (
    saveButton &&
    saveButton.getAttribute("aria-disabled") !== "true" &&
    saveButton.offsetParent !== null &&
    saveButton.getBoundingClientRect().height > 0
  ) {
    saveButton.click();
  } else {
    await showAlert("Mentés' gomb nem aktív vagy nem található, változások elvetése", 2000);
    const cancelButton = document.querySelector('[data-testid="source-cancel-button"]');
    cancelButton?.click();
    return false;
  }

  await delay(1600, 2000);
  return true;
}

// Main Source List/Panel Functions
async function processSourceList() {
  const results = {};
  const container = document.querySelector("div[class^='cssSourceSpacing_']");
  if (!container) {
    console.warn("[processSourceList] Nem található cssSourceSpacing_ blokk.");
    return;
  }

  const children = Array.from(container.children);
  for (const child of children) {
    const id = child.id;
    if (!id) continue;
    const idPattern = /^[A-Z0-9]{4}-[A-Z0-9]{3}$/i;
    if (!idPattern.test(id)) continue;

    const titleElement = child.querySelector("div[class^='cssSourceTitle_']");
    const originalTitle = titleElement
      ? titleElement.querySelector("div")?.textContent.trim() || ""
      : "";

    const button = child.querySelector("button");
    let isButton = true;
    if (!button) {
      isButton = false;
      console.warn(`[click] Nincs gomb: ${id}`);
      continue;
    }

    // Open
    button.click();
    console.log(`[click] Nyitás: ${originalTitle}`);

    // Wait for DOM stabilization
    const body = document.querySelector("div[class^='cssSourceBody_']");
    if (body) {
      await waitForDomStabilization(body);
    } else {
      console.warn(`[processSourceList] Nincs body blokk: ${id}`);
    }

    let indexed = false;
    let eventFound = false;
    let eventType = "";
    let newTitle = "";

    // Wait and check for source body and add-button to appear
    console.log("[processSourceList] Várakozás forrás panel adatok elérhetőségére...");
    const indexedDataFound = await waitForAllElements([
      "div[class^='cssSourcePanelOpen_']",
      "tbody"
    ], 4000, 200,
      "Ez a feljegyzés még nem lett indexelve.");
    await delay(1000, 1300);

    if (indexedDataFound) {
      console.log("[processSourceList] ...forrásadatok elérhetőek");
      const SourceContent = processSourceContent();
      indexed = true;
      eventFound = SourceContent.eventFound;
      eventType = SourceContent.eventType;
      newTitle = SourceContent.newTitle;
    }
    results[id] = {
      FS_id: id,
      originalTitle,
      isButton,
      indexed,
      eventFound,
      eventType,
      newTitle
    };
    console.log("[processSourceList] forrás feldolgozás eredménye:", results[id]);

    // Esemény cím kitöltése
    await fillAndMark({ newTitle, originalTitle, indexed, eventFound, eventType, logPrefix: "processSourceList" });

    // Close
    button.click();
    console.log(`[click] Zárás: ${originalTitle}`);

    await delay(300, 600);
  }

  console.log("[processSourceList] Minden forrás feldolgozva.");
}

async function processOneSource() {
  const results = {};
  const container = document.querySelector("div[class^='cssSourceSpacing_']");
  if (!container) {
    console.warn("[processOneSource] Nem található cssSourceSpacing_ blokk.");
    return;
  }

  const openPanel = container.querySelector("div[class^='cssSourcePanelOpen_']");
  if (!openPanel) {
    console.warn("[processOneSource] Nincs nyitott panel.");
    return;
  }

  const sourceBlock = openPanel.closest("div[id]");
  if (!sourceBlock) {
    console.warn("[processOneSource] Nem található a nyitott panel szülő blokkja.");
    return;
  }

  const id = sourceBlock.id;
  const idPattern = /^[A-Z0-9]{4}-[A-Z0-9]{3}$/i;
  if (!idPattern.test(id)) {
    console.warn(`[processOneSource] Azonosító nem felel meg a mintának: ${id}`);
    return;
  }

  const titleElement = sourceBlock.querySelector("div[class^='cssSourceTitle_']");
  const originalTitle = titleElement ? titleElement.querySelector("div")?.textContent.trim() || "" : "";

  const body = sourceBlock.querySelector("div[class^='cssSourceBody_']");
  if (body) {
    console.log(`[processOneSource] Van body blokk: ${id}`);
  } else {
    console.warn(`[processOneSource] Nincs body blokk: ${id}`);
  }

  console.log("[processOneSource] Várakozás forrás panel adatok elérhetőségére...");
  const indexedDataFound = await waitForAllElements([
    "div[class^='cssSourcePanelOpen_']",
    "tbody"
  ], 4000, 200,
    "Ez a feljegyzés még nem lett indexelve.");
  await delay(1000, 1300);

  let indexed = false;
  let eventFound = false;
  let eventType = "";
  let newTitle = "";

  if (indexedDataFound) {
    console.log("[processOneSource] ...forrásadatok elérhetőek");
    const SourceContent = processSourceContent();
    indexed = true;
    eventFound = SourceContent.eventFound;
    eventType = SourceContent.eventType;
    newTitle = SourceContent.newTitle;
  }

  results[id] = {
    FS_id: id,
    originalTitle,
    isButton: true,
    indexed,
    eventFound,
    eventType,
    newTitle
  };

  console.log("[processOneSource] forrás feldolgozás eredménye:", results[id]);
  await fillAndMark({ newTitle, originalTitle, indexed, eventFound, eventType, logPrefix: "processOneSource" });
  await delay(300, 600);
  console.log("[processOneSource] Egyetlen forrás feldolgozva.");
}

// Panel Scanning/Handling
async function scanSourcePanels() {
  const results = {};
  let indexCounter = 0;

  const container = document.querySelector("div[class^='cssSourceSpacing_']");
  if (!container) {
    console.warn("[scanSourcePanels] Nem található cssSourceSpacing_ blokk.");
    return results;
  }

  const children = Array.from(container.children);
  for (const child of children) {
    const id = child.id;
    if (!id) continue;
    indexCounter++;
    const idPattern = /^[A-Z0-9]{4}-[A-Z0-9]{3}$/i;
    if (!idPattern.test(id)) continue;

    const openPanel = child.querySelector("div[class^='cssSourcePanelOpen_']");
    const isOpen = !!openPanel;

    const titleElement = child.querySelector("div[class^='cssSourceTitle_']");
    const title = titleElement ? titleElement.textContent.trim() : "";

    const sourcePanelIndex = indexCounter.toString().padStart(4, '0');

    results[id] = {
      id,
      sourcePanelOpen: isOpen,
      title,
      sourcePanelIndex
    };
  }

  console.log("[scanSourcePanels] Eredmények:", results);
  return results;
}

async function handleSourceProcessing() {
  const panelMap = await scanSourcePanels();
  const openPanels = Object.values(panelMap).filter(item => item.sourcePanelOpen);
  const count = openPanels.length;

  console.log(`[handleSourceProcessing] Nyitott panelek száma: ${count}`);

  if (count === 1) {
    console.log("[handleSourceProcessing] Egy nyitott panel van → processOneSource() meghívása...");
    await showAlert("Elindítom az egyetlen nyitott forrás címének feldolgozását", 3000);
    await processOneSource();
  } else if (count === 0) {
    console.log("[handleSourceProcessing] Nincs nyitott panel → processSourceList() meghívása...");
    await showAlert("Elindítom az összes forrás cím feldolgozását", 3000);
    await processSourceList();
  } else {
    console.warn("[handleSourceProcessing] Több nyitott panel van. A feldolgozás leáll.");
    await showAlert("Több forrás panel is nyitva van, nem indul feldolgozás", 3000);
  }
}

// MAIN
loadMaterialIcons();
handleSourceProcessing();
