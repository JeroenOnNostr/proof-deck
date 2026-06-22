// 1) Mint a capsule from the running app, save it.
// 2) Open the saved capsule standalone in a fresh page (CDN served locally) and
//    assert it self-verifies (verdict OK, self-test passed).
// 3) Tamper the capsule's embedded event content and assert it now reports FAIL.
const { chromium } = require("playwright-core");
const path = require("path");
const fs = require("fs");

const CHROME = ["/home/jeroen/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome", "/usr/bin/google-chrome-stable"].find((p) => fs.existsSync(p));
const bundle = fs.readFileSync(path.resolve("node_modules/nostr-tools/lib/nostr.bundle.js"), "utf8");

(async () => {
  let fails = 0;
  const ok = (c, m) => { console.log((c ? "PASS" : "FAIL") + " — " + m); if (!c) fails++; };

  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.route("**/unpkg.com/**", (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: bundle }));
  await page.routeWebSocket("**", () => {});
  await page.goto("file://" + path.resolve("index.html"), { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".card:not(.skeleton)", { timeout: 12000 });

  // mint capsule
  const card0 = page.locator(".card:not(.skeleton)").first();
  await card0.locator('[data-act="flip"]').click();
  const [dl] = await Promise.all([
    page.waitForEvent("download"),
    card0.locator('[data-act="capsule"]').click(),
  ]);
  const capPath = path.resolve("_cap.html");
  await dl.saveAs(capPath);

  // open capsule standalone in a NEW page; serve the CDN bundle locally to simulate
  // "the verifier is available" (in the real world the first load caches it).
  const cap = await ctx.newPage();
  const capErrors = [];
  cap.on("pageerror", (e) => capErrors.push(e.message));
  await cap.route("**/unpkg.com/**", (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: bundle }));
  await cap.goto("file://" + capPath, { waitUntil: "domcontentloaded" });
  await cap.waitForFunction(() => /✓|✗/.test(document.querySelector("#verdict").textContent), { timeout: 8000 }).catch(() => {});
  const verdict = await cap.locator("#verdict").textContent();
  const selftest = await cap.locator("#selftest").textContent();
  ok(/✓|Verified/.test(verdict) && cap.locator("#verdict.ok"), "capsule self-verifies OK standalone: " + verdict.trim().slice(0, 60));
  ok(/passed/.test(selftest), "capsule self-test passed: " + selftest.trim());
  const claimedShown = await cap.locator("#cid").textContent();
  const computedShown = await cap.locator("#xid").textContent();
  ok(claimedShown && claimedShown === computedShown, "capsule: computed id == claimed id");
  ok(capErrors.length === 0, "capsule has no page errors" + (capErrors.length ? ": " + capErrors[0] : ""));

  // 3) tamper the capsule's embedded event content -> should FAIL
  let capSrc = fs.readFileSync(capPath, "utf8");
  // the event JSON is in a <script type="application/json" id="event">...; mutate one content char
  capSrc = capSrc.replace(/("content":\s*")([^"])/, '$1Z');  // prepend a Z to content
  const tamperedPath = path.resolve("_cap_tampered.html");
  fs.writeFileSync(tamperedPath, capSrc);
  const cap2 = await ctx.newPage();
  await cap2.route("**/unpkg.com/**", (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: bundle }));
  await cap2.goto("file://" + tamperedPath, { waitUntil: "domcontentloaded" });
  await cap2.waitForFunction(() => /✓|✗/.test(document.querySelector("#verdict").textContent), { timeout: 8000 }).catch(() => {});
  const v2 = await cap2.locator("#verdict").textContent();
  ok(/✗|failed/.test(v2), "tampered capsule reports FAILURE: " + v2.trim().slice(0, 60));

  fs.unlinkSync(capPath); fs.unlinkSync(tamperedPath);
  await browser.close();
  console.log("\n" + (fails === 0 ? "CAPSULE TESTS PASSED ✓" : fails + " FAILED ✗"));
  process.exit(fails === 0 ? 0 : 1);
})().catch((e) => { console.error("HARNESS ERROR:", e); process.exit(2); });
