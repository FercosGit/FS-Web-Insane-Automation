// content.js

function delay(minMs, maxMs) {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, ms));
}

function processSourceContent() {
  // Placeholder function for now
  return true; // Simulate successful processing
}

async function processSources() {
  const results = []; // To log each source's status
const sourceItems = Array.from(document.querySelectorAll("div[class^='cssNarrowSourceGrid_'], div[class^='cssSourceGridNarrow_'], div[class^='cssSourceGrid_']"));

//  const sourceItems = Array.from(document.querySelectorAll("div[class^='cssSourceGrid_']")); //cssNarrowSourceGrid_ cssSourceGridNarrow_ cssSourceGrid_

  for (const item of sourceItems) {
    const titleDiv = item.querySelector("div[class^='cssSourceTitle_'] div");
    const titleText = titleDiv?.innerText.trim();
    if (!titleText) continue;

    // Click to expand
    item.click();

    // Wait and check for source body to appear (max 2s)
    const success = await waitForElement("div[class^='cssSourceBody_']", 2000);

    results.push({
      title: titleText,
      loaded: success,
      processed: success ? processSourceContent() : false
    });

    // Wait before deactivating
    await delay(1000, 1500);
    item.click();
    await delay(500, 800); // Small gap before next iteration
  }

  console.log("Eredmények:", results);
}

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

processSources();
