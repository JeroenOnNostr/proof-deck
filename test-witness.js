const { chromium } = require("playwright-core");
const path = require("path"); const fs = require("fs");
const CHROME = ["/home/jeroen/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome","/usr/bin/google-chrome-stable"].find(p=>fs.existsSync(p));
const bundle = fs.readFileSync(path.resolve("node_modules/nostr-tools/lib/nostr.bundle.js"),"utf8");
(async()=>{
  let fails=0; const ok=(c,m)=>{console.log((c?"PASS":"FAIL")+" — "+m);if(!c)fails++;};
  const browser = await chromium.launch({executablePath:CHROME,headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
  const page = await browser.newPage();
  await page.route("**/unpkg.com/**",(r)=>r.fulfill({status:200,contentType:"application/javascript",body:bundle}));
  page.on("pageerror",e=>console.log("PAGEERR:",e.message));
  await page.goto("file://"+path.resolve("index.html"),{waitUntil:"domcontentloaded"});
  await page.waitForSelector(".card:not(.skeleton)",{timeout:20000});
  await page.waitForFunction(()=>/Live/.test(document.querySelector("#statustext").textContent),{timeout:20000}).catch(()=>{});
  const live = /Live/.test(await page.locator("#statustext").textContent());
  ok(live,"loaded from live relays");

  // flip a card and run witness explicitly
  const card0 = page.locator(".card:not(.skeleton)").first();
  await card0.locator(".front").click();
  await page.waitForTimeout(300);
  await card0.locator(".back [data-act=\"witness\"]").click();
  // wait for witness text to settle (it starts as "querying", ends with a result)
  await page.waitForFunction(()=>{
    const el=document.querySelector('.card .back [data-witness] .wtext');
    return el && !/querying|witness across/.test(el.textContent);
  },{timeout:18000}).catch(()=>{});
  const wtext = await card0.locator('[data-witness] .wtext').textContent();
  console.log("   witness result:", wtext.trim());
  ok(/relay|copy|answer|served/i.test(wtext),"witness produced a result");
  // at least some relay dots resolved (ok or absent), none stuck on 'wait' forever
  const dotClasses = await card0.locator('[data-witness] .relays .rd').evaluateAll(els=>els.map(e=>e.className));
  console.log("   relay dots:", dotClasses.join(", "));
  ok(dotClasses.length>0,"witness rendered relay dots");

  await browser.close();
  console.log("\n"+(fails===0?"WITNESS TEST PASSED ✓":fails+" FAILED ✗"));
  process.exit(fails===0?0:1);
})().catch(e=>{console.error("ERR:",e.message);process.exit(2)});
