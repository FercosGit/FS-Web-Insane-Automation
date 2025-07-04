// content.js
// eventype működik
// eventlabel tesztelés

// assist functions
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

    console.log("[Observer] Figyelés elindítva...");
  });
}


//data process functions
  function processBaptismOrBirth() {
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
    console.log("data tartalma", data);

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
  let eventLabel = "";
  let eventFound = false;
 
  // Processing logic (placeholder)
  eventTypeRaw = detectEventType();
  eventType = eventTypeRaw.toLowerCase();
  
  // eventtype logic
  if (!eventTypeRaw) {
    eventFound = false;
	eventLabel = "nincs index";
  } else if (["házasság", "marriage"].some(k => eventType.includes(k))) {
    //const choices = processMarriageEvent();
    eventFound = true;
	eventLabel = "házasság";
    //sendStatisticEvent("resolved_event_" + eventTypeRaw.trim().toLowerCase().replace(/\s+/g, "_"), window.location.href);
  } else if (["baptism", "keresztelő", "birth registration"].some(k => eventType.includes(k))) {
    console.log("process baptism hívása");
	const choices = processBaptismOrBirth();
	console.log("process baptism vége van", choices);
	const defaultIdx = choices.findIndex(c => c.isDefault);
	console.log("defaultidx", defaultIdx);
    eventFound = true;
	eventLabel = choices[defaultIdx].output;    
    //sendStatisticEvent("resolved_event_" + eventTypeRaw.trim().toLowerCase().replace(/\s+/g, "_"), window.location.href);
  } else if (["death registration", "burial"].some(k => eventType.includes(k))) {
    //const choices = processDeathRegistration();
    eventFound = true;
	eventLabel = "elhalálozás";    
    //sendStatisticEvent("resolved_event_" + eventTypeRaw.trim().toLowerCase().replace(/\s+/g, "_"), window.location.href);
  } else {
    eventFound = false;
	eventLabel = "ismeretlen esemény";
    //sendStatisticEvent("unsopported_event_" + eventTypeRaw.trim().toLowerCase().replace(/\s+/g, "_"), window.location.href);
  }
  
  //eventLabel = "teszt esemény címke";
  //eventFound = true;

  return { eventType, eventLabel, eventFound };
}


async function processSourceList() {
  const result = [];

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
    const title = titleElement ? titleElement.textContent.trim() : "";

    result.push({ id, title });

    const button = child.querySelector("button");
    if (!button) {
      console.warn(`[click] Nincs gomb: ${id}`);
      continue;
    }

    // Nyitás
    button.click();
    console.log(`[click] Nyitás: ${title}`);

    // Várjuk a DOM stabilizálódását
    const body = document.querySelector("div[class^='cssSourceBody_']");
    if (body) {
      await waitForDomStabilization(body);
    } else {
      console.warn(`[wait] Nincs body blokk: ${id}`);
    }

    // Feldolgozás
    // Wait and check for source body and add-button to appear (max 2s)
    console.log("wait for open down source panel");
	const success = await waitForAllElements([
      "div[class^='cssSourcePanelOpen_']",
	  //"div[class^='cssSourceBody_']",
	  "tbody"
      // "button[data-testid='view-edit-notes-add-button']"
    ], 5000);
    //console.log("success", success); //debug
    //await delay(1000, 1500);

    let eventType = "";
    let eventLabel = "";
    let eventFound = false;

    if (success) {
      const result = processSourceContent();
      eventType = result.eventType;
      eventLabel = result.eventLabel;
      eventFound = result.eventFound;
    }

    results.push({
      title: titleText,
      loaded: success,
      eventFound,
      eventType,
      eventLabel
    });

  // console.log("[processSourceList] Talált rekordok:", result);

  // console.log("Eredmények:", results);

    //  Zárás
    button.click();
    console.log(`[click] Zárás: ${title}`);

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
