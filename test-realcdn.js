// Load the page with the REAL CDN (no mock) to confirm nostr-tools loads from unpkg/jsdelivr.
const { chromium } = require("playwright-core");
const path=require("path"); const fs=require("fs");
const CHROME=["/home/jeroen/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome","/usr/bin/google-chrome-stable"].find(p=>fs.existsSync(p));
(async()=>{
  let fails=0; const ok=(c,m)=>{console.log((c?"PASS":"FAIL")+" — "+m);if(!c)fails++;};
  const browser=await chromium.launch({executablePath:CHROME,headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
  const page=await browser.newPage();
  page.on("pageerror",e=>console.log("PAGEERR:",e.message));
  await page.goto("file://"+path.resolve("index.html"),{waitUntil:"domcontentloaded"});
  // confirm NostrTools actually loaded from a real CDN
  await page.waitForFunction(()=>!!window.NostrTools,{timeout:20000}).catch(()=>{});
  ok(await page.evaluate(()=>!!window.NostrTools),"window.NostrTools loaded from real CDN");
  await page.waitForSelector(".card:not(.skeleton)",{timeout:25000}).catch(()=>{});
  await page.waitForFunction(()=>/Live|Sample/.test(document.querySelector("#statustext").textContent),{timeout:25000}).catch(()=>{});
  const cards=await page.locator(".card:not(.skeleton)").count();
  ok(cards===21,"21 cards render with real CDN+relays (got "+cards+")");
  ok((await page.locator("#verifiedCount").textContent())==="21","all 21 verified");
  ok((await page.locator(".tagchip").count())>3,"tags render");
  const status=await page.locator("#statustext").textContent();
  console.log("   status:",status);
  // flip + proof
  const c=page.locator(".card:not(.skeleton)").first();
  await c.locator('[data-act="flip"]').click(); await page.waitForTimeout(400);
  ok(await c.locator(".back .verdict.ok").count()>0,"proof verifies with real bundle");
  await browser.close();
  console.log("\n"+(fails===0?"REAL-CDN TEST PASSED ✓":fails+" FAILED ✗"));
  process.exit(fails===0?0:1);
})().catch(e=>{console.error("ERR:",e.message);process.exit(2)});
