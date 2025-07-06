// content.js
// process source list ok
// process source content ok
// process baptism ok
// process death ok
// process marriage ok


// assist functions
 function getAutoSaveEnabled() {
  return new Promise(resolve => {
    chrome.storage.local.get('autoSaveEnabled', data => {
      resolve(!!data.autoSaveEnabled);
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

function waitForAllElements(selectors, timeout = 4000, interval = 200) {
  return new Promise(resolve => {
    const start = Date.now();
    const check = () => {
      const allPresent = selectors.every(sel => document.querySelector(sel));
      if (allPresent) {
        resolve(true);
      } else if (Date.now() - start >= timeout) {
        resolve(false);
      } else {
        setTimeout(check, interval);
      }
    };
    check();
  });
}

function waitForDomStabilization(targetElement, quietPeriod = 300) {
  return new Promise(resolve => {
    let timer;

    const observer = new MutationObserver((mutationsList) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        observer.disconnect();
        console.log("[Observer] DOM stabilizálódott – feltételezhetően betöltődött.");
        resolve();
      }, quietPeriod);
    });

    observer.observe(targetElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
    });

    console.log("[Observer] DOM változás figyelés elindítva...");
  });
}


//data process functions
  function processBaptismOrBirth() {
    //console.log("keresztelő vagy születés esemény feldolgozása...");
	const rows = document.querySelectorAll('table tr');
    const data = {};
    const links = {};

    rows.forEach(row => {
      const th = row.querySelector('th')?.innerText?.trim().toLowerCase();
      const td = row.querySelector('td');
      const value = td?.innerText?.trim();

      if (th === "név" && value) {
        clearObject(data);
        clearObject(links);
      }

      if (th && value) {
        data[th] = value;
        links[th] = !!td.querySelector('a');
      }
    });

    // Debug
    // console.log("data tartalma", data);

    const name = data["név"] || "";
    const genderRaw = data["nem"] || "";
    const gender = genderRaw.toLowerCase();
    const birthDate = data["születési dátum"] || data["esemény dátuma"] || "";
    const eventDate = data["esemény dátuma"] || "";
    const birthYear = (birthDate.match(/\d{4}/) || [])[0] || "";
    const eventYear = (eventDate.match(/\d{4}/) || [])[0] || "";

    const fiaLanya = (gender === "m" || gender === "male" || gender === "férfi") ? "fia" :
      (gender === "f" || gender === "female" || gender === "női") ? "lánya" : "gyermeke";

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
    //console.log("...keresztelő vagy születés esemény feldolgozása befejeződött.");
  }

  function processMarriageEvent() {
    const rows = document.querySelectorAll('table tr');
    const data = {};
    const links = {};

    rows.forEach(row => {
      const th = row.querySelector('th')?.innerText?.trim().toLowerCase();
      const td = row.querySelector('td');
      const value = td?.innerText?.trim();

      if (th === "név" && value) {
        clearObject(data);
        clearObject(links);
      }

      if (th && value) {
        data[th] = value;
        links[th] = !!td.querySelector('a');
      }
    });

    // Debug
    // console.log(data);

    const personName = data["név"] || "";
    const personYear = data["születési dátum"] || "";
    let spouseName = data["házastárs neve"] || "";
    const spouseYear = data["házastárs születési dátuma"] || "";
    const marriageDate = data["esemény dátuma"] || "";

    // Remove redundant last name from spouseName, if present
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
    const data = {};
    const links = {};

    rows.forEach(row => {
      const th = row.querySelector('th')?.innerText?.trim().toLowerCase();
      const td = row.querySelector('td');
      const value = td?.innerText?.trim();

      if (th === "név" && value) {
        clearObject(data);
        clearObject(links);
      }

      if (th && value) {
        data[th] = value;
        links[th] = !!td.querySelector('a');
      }
    });

    // Debug
    //console.log(data);

    const name = data["név"] || "";
    const genderRaw = data["nem"] || "";
    const gender = genderRaw.toLowerCase();
    let spouseName = data["házastárs neve"] || "";

    // Find birth year key dynamically
    const szulKey = Object.keys(data).find(k => k.startsWith("születési"));
    const birthYear = (szulKey ? data[szulKey] : "").match(/\d{4}/)?.[0] || "";
    const deathYear = (data["elhalálozási dátum"] || "").match(/\d{4}/)?.[0] || "";
    const eventYear = (data["esemény dátuma"] || "").match(/\d{4}/)?.[0] || "";

    // Remove redundant last name from spouseName, if present
    const personLastName = name.split(" ")[0];
    const spouseParts = spouseName.split(" ");
    if (spouseParts.length > 2 && spouseParts.includes(personLastName)) {
      spouseParts.splice(spouseParts.indexOf(personLastName), 1);
      spouseName = spouseParts.join(" ");
    }

    const fiaLanya = (gender === "m" || gender === "male" || gender === "férfi") ? "fia" :
      (gender === "f" || gender === "female" || gender === "női") ? "lánya" : "gyermeke";
    const ferjeNeje = (gender === "m" || gender === "male" || gender === "férfi") ? "férje" :
      (gender === "f" || gender === "female" || gender === "női") ? "neje" : "házastársa";

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
        out = `${spouseName} itt ${ferjeNeje} ${name} ${birthYear} hlakv ${eventYear} (${deathYear})`;
      } else {
        const parentName = data[p.key + " neve"];
        out = `${parentName} itt ${fiaLanya} ${name} ${birthYear} hlakv ${eventYear} (${deathYear})`;
      }
      return {
        label: p.label,
        isDefault: p.key === defaultPersonKey,
        output: out
      };
    });
  }

async function simulateEditAndFillSourceTitle(newValue = "vajon sikerült a szöveg átírása?") {
    // 1. Find visible 'Szerkesztés' (Edit) button and click it
    const buttons = Array.from(document.querySelectorAll('button[data-testid^="source-button_edit"]'));
    const visibleButton = buttons.find(btn =>
      btn.offsetParent !== null &&
      !btn.disabled &&
      btn.getBoundingClientRect().height > 0
    );

    if (!visibleButton) {
        alert("Nem található látható, aktív 'Szerkesztés' gomb.");
        return false;
    }
    visibleButton.click();

    // 2. Wait for the input to appear (up to 2s)
    const ok = await waitForAllElements(['input[data-testid="source-title-field"'], 2000, 100);
    if (!ok) {
        alert("Nem található a 'Forrás címe' mező.");
        return false;
    }
    // 3. Fill in and trigger input/change events
    const input = document.querySelector('input[data-testid="source-title-field"]');
    input.value = newValue;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // 4. Check autosave, and click Save if enabled
	// for debug only
	const autoSaveEnabled = false;
	if (autoSaveEnabled) {
    // for debug only if (await getAutoSaveEnabled()) {
        const saveButton = document.querySelector('[data-testid="source-save-button"]');
        if (
            saveButton &&
            !saveButton.disabled &&
            saveButton.offsetParent !== null &&
            saveButton.getBoundingClientRect().height > 0
        ) {
            saveButton.click();
        } else {
            alert("A 'Mentés' gomb nem aktív vagy nem található.");
        }
    } else {
		console.log("auto save disabled, waiting for user to close dialog...");
		delay(5000,5500);
       const cancelButton = document.querySelector('[data-testid="source-cancel-button"]');
        if (
            cancelButton &&
            !cancelButton.disabled &&
            cancelButton.offsetParent !== null &&
            cancelButton.getBoundingClientRect().height > 0
        ) {
            cancelButton.click();
        } else {
            alert("A 'Elvetés' gomb nem aktív vagy nem található.");
		}

	}
    // wait a bit to ensure the UI processed it
    await delay(500, 800);
    return true;
}

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
 
  // Processing logic (placeholder)
  eventTypeRaw = detectEventType();
  eventType = eventTypeRaw.toLowerCase();
  
  // eventtype logic
  if (!eventTypeRaw) {
    eventFound = false;
	eventType = "nem jelölt";
	newTitle = "";

  } else if (["házasság", "marriage"].some(k => eventType.includes(k))) {
	const choices = processMarriageEvent();
	const defaultIdx = choices.findIndex(c => c.isDefault);
    eventFound = true;
	//eventType set before by detectEventType()
    newTitle = choices[defaultIdx].output; 
    //sendStatisticEvent("resolved_event_" + eventTypeRaw.trim().toLowerCase().replace(/\s+/g, "_"), window.location.href);

  } else if (["baptism", "keresztelő", "birth registration"].some(k => eventType.includes(k))) {
    //console.log("process baptism hívása");
	const choices = processBaptismOrBirth();
	//console.log("process baptism vége van", choices);
	const defaultIdx = choices.findIndex(c => c.isDefault);
	//console.log("defaultidx", defaultIdx);
    eventFound = true;
	//eventType set before by detectEventType()
	newTitle = choices[defaultIdx].output;
	
	//sendStatisticEvent("resolved_event_" + eventTypeRaw.trim().toLowerCase().replace(/\s+/g, "_"), window.location.href);

  } else if (["death registration", "burial"].some(k => eventType.includes(k))) {
    const choices = processDeathRegistration();
	const defaultIdx = choices.findIndex(c => c.isDefault);
	eventFound = true;
	//eventType set before by detectEventType()
	newTitle = choices[defaultIdx].output;
    //sendStatisticEvent("resolved_event_" + eventTypeRaw.trim().toLowerCase().replace(/\s+/g, "_"), window.location.href);

  } else {
    eventFound = false;
	//eventType set before by detectEventType()
	newTitle = "";
    //sendStatisticEvent("unsopported_event_" + eventTypeRaw.trim().toLowerCase().replace(/\s+/g, "_"), window.location.href);
  }
  
  return { eventFound, eventType, newTitle };
}


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
    const originalTitle = titleElement ? titleElement.textContent.trim() : "";

    const button = child.querySelector("button");
    let isButton = true;
	if (!button) {
	  isButton = false;	
      console.warn(`[click] Nincs gomb: ${id}`);
      continue;
    }
	

    // Nyitás
    button.click();
    console.log(`[click] Nyitás: ${originalTitle}`);

    // Várjuk a DOM stabilizálódását
    const body = document.querySelector("div[class^='cssSourceBody_']");
    if (body) {
      await waitForDomStabilization(body);
    } else {
      console.warn(`[wait] Nincs body blokk: ${id}`);
    }

    let indexed = false;
    // Feldolgozás
    // Wait and check for source body and add-button to appear (max 2s)
    console.log("[processSourceList] Várakozás forrás panel adatok elérhetőségére...");
		
	//lenyilt-e a forrás panel és betöltött-e a sorcebody?
	const indexedDataFound = await waitForAllElements([
      "div[class^='cssSourcePanelOpen_']",
	  //"div[class^='cssSourceBody_']",
	  "tbody"
      // "button[data-testid='view-edit-notes-add-button']"
    ], 2000);
	//console.log("success", success); //debug
    //await delay(1000, 1500);

    let eventFound = false;
    let eventType = "";
    let newTitle = "";

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
   
    // esemény cím kitöltése
	if ( newTitle !== originalTitle ) {
	console.log( "új forráscímet készítettem");
	await simulateEditAndFillSourceTitle(newTitle);
	} else {
	console.log( "eredeti forrás cím már megfelelő");
	}
	


  // console.log("[processSourceList] Talált rekordok:", result); result

  // console.log("Eredmények:", results);

    //  Zárás
    button.click();
    console.log(`[click] Zárás: ${originalTitle}`);

    await delay(300, 600); // várakozás emberi módon
  }

  console.log("[processSourceList] Minden forrás feldolgozva.");
}


/*
function waitForElement(selector, timeout = 2000, interval = 100) {
  return new Promise(resolve => {
    const start = Date.now();
    const check = () => {
      if (document.querySelector(selector)) {
        resolve(true);
      } else if (Date.now() - start >= timeout) {
        resolve(false);
      } else {
        setTimeout(check, interval);
      }
    };
    check();
  });
}
*/

processSourceList();
