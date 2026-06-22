// Authoritative test: drive the real page in Chromium.
// Blocks relay WebSockets + the CDN so it loads nostr-tools locally and falls back
// to the embedded fixture deterministically, then asserts the whole UI works.
const { chromium } = require("playwright-core");
const path = require("path");
const fs = require("fs");

const CHROME_CANDIDATES = [
  "/home/jeroen/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome",
  "/usr/bin/google-chrome-stable",
  "/opt/google/chrome/google-chrome",
];
const CHROME = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
const FILE_URL = "file://" + path.resolve("index.html");

(async () => {
  let fails = 0;
  const ok = (c, m) => { console.log((c ? "PASS" : "FAIL") + " — " + m); if (!c) fails++; };

  console.log("using chrome:", CHROME);
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });

  // Serve nostr-tools bundle locally (CDN may be blocked); intercept the unpkg URL.
  const bundle = fs.readFileSync(path.resolve("node_modules/nostr-tools/lib/nostr.bundle.js"), "utf8");
  await page.route("**/unpkg.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: bundle }));
  // Block all relay websockets so the fixture path is taken fast & deterministically.
  await page.routeWebSocket("**", (ws) => { /* never connect upstream; just hang */ });

  await page.goto(FILE_URL, { waitUntil: "domcontentloaded" });

  // Wait for the deck to render (fixture fallback fires after the fetch timeout, but
  // websockets are blocked so querySync resolves empty quickly).
  await page.waitForSelector(".card:not(.skeleton)", { timeout: 12000 }).catch(() => {});

  // ---- assertions ----
  const cardCount = await page.locator(".card:not(.skeleton)").count();
  ok(cardCount === 21, "deck renders 21 cards (got " + cardCount + ")");

  ok(await page.locator(".card-title").first().textContent().then((t) => !!t.trim()), "card has a title");
  ok(await page.locator(".author .name").first().textContent().then((t) => !!t.trim()), "card has author name");
  ok(await page.locator(".author .when").first().textContent().then((t) => /ago|\d/.test(t)), "card has timestamp");

  const tagCount = await page.locator(".tagchip").count();
  ok(tagCount > 3, "tag checkboxes rendered (" + tagCount + ")");
  const firstCnt = await page.locator(".tagchip .cnt").first().textContent();
  ok(/\d/.test(firstCnt), "tag shows a count (" + firstCnt + ")");

  ok((await page.locator("#verifiedCount").textContent()) === "21", "verified counter = 21");
  ok((await page.locator("#shownCount").textContent()) === "21", "shown count = 21");

  // filter: click #bitcoin
  const btcChip = page.locator('.tagchip[data-tag="bitcoin"]');
  const btcCount = parseInt(await btcChip.locator(".cnt").textContent(), 10);
  await btcChip.click();
  const afterBtc = parseInt(await page.locator("#shownCount").textContent(), 10);
  ok(afterBtc === btcCount, "filter #bitcoin shows " + btcCount + " (got " + afterBtc + ")");
  // add #nostr (ANY) then ALL
  await page.locator('.tagchip[data-tag="nostr"]').click();
  const anyShown = parseInt(await page.locator("#shownCount").textContent(), 10);
  ok(anyShown >= afterBtc, "ANY union >= single (" + anyShown + ">=" + afterBtc + ")");
  await page.locator("#modeAnd").click();
  const allShown = parseInt(await page.locator("#shownCount").textContent(), 10);
  ok(allShown <= anyShown, "ALL intersection <= ANY (" + allShown + "<=" + anyShown + ")");
  await page.locator("#clearTags").click();
  await page.locator("#modeOr").click();
  ok((await page.locator("#shownCount").textContent()) === "21", "clear restores 21");

  // flip first card -> proof OK
  const card0 = page.locator(".card:not(.skeleton)").first();
  await card0.locator('[data-act="flip"]').click();
  await page.waitForTimeout(150);
  ok((await card0.getAttribute("data-flipped")) === "1", "card flips");
  ok(await card0.locator(".back .verdict.ok").count() > 0, "proof face shows OK verdict");
  ok(await card0.locator(".kv .v.match").count() > 0, "inspector: computed id matches (green)");

  // read modal + markdown
  await card0.locator('[data-act="read"]').click();
  await page.waitForTimeout(150);
  ok(await page.locator("#scrim.show").count() > 0, "reader modal opens");
  const body = await page.locator("#readBody").innerHTML();
  ok(/<p>|<h\d/.test(body), "markdown rendered");
  ok(!/<script/i.test(body), "no script injected via markdown");

  // tamper sandbox
  await page.locator("#tabTamper").click();
  await page.waitForTimeout(100);
  ok(await page.locator("#sandVerdict.ok").count() > 0, "sandbox starts verified");
  await page.locator("#sandText").fill((await page.locator("#sandText").inputValue()) + " TAMPERED!");
  await page.waitForTimeout(150);
  ok(await page.locator("#sandVerdict.bad").count() > 0, "sandbox goes RED on tamper");
  const diffHtml = await page.locator("#sandDiff").innerHTML();
  ok(/class="add"|TAMPERED/.test(diffHtml), "diff shows added text");
  await page.locator("#sandReset").click();
  await page.waitForTimeout(100);
  ok(await page.locator("#sandVerdict.ok").count() > 0, "restore re-verifies");
  await page.locator("#sandFlip").click();
  await page.waitForTimeout(100);
  ok(await page.locator("#sandVerdict.bad").count() > 0, "'flip one byte' breaks it");
  await page.locator("#modalClose").click();

  // capsule download
  await page.waitForTimeout(100);
  const [dl] = await Promise.all([
    page.waitForEvent("download", { timeout: 4000 }).catch(() => null),
    card0.locator('[data-act="capsule"]').click(),
  ]);
  ok(!!dl, "minting a proof capsule triggers a download (" + (dl && dl.suggestedFilename()) + ")");
  if (dl) {
    const capPath = path.resolve("test-capsule.html");
    await dl.saveAs(capPath);
    const cap = fs.readFileSync(capPath, "utf8");
    ok(cap.includes("Proof Capsule") && cap.includes('id="event"'), "capsule contains event + verifier");
    ok(/getEventHash|verifyEvent/.test(cap), "capsule inlines verification logic");
    fs.unlinkSync(capPath);
  }

  ok(errors.length === 0, "no page/console errors" + (errors.length ? ": " + errors.slice(0, 3).join(" | ") : ""));

  await browser.close();
  console.log("\n" + (fails === 0 ? "ALL BROWSER TESTS PASSED ✓" : fails + " FAILED ✗"));
  process.exit(fails === 0 ? 0 : 1);
})().catch((e) => { console.error("HARNESS ERROR:", e); process.exit(2); });
