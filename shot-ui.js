const { chromium } = require("playwright-core");
const path=require("path"); const fs=require("fs");
const CHROME=["/home/jeroen/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome","/usr/bin/google-chrome-stable"].find(p=>fs.existsSync(p));
const bundle=fs.readFileSync(path.resolve("node_modules/nostr-tools/lib/nostr.bundle.js"),"utf8");
(async()=>{
  const browser=await chromium.launch({executablePath:CHROME,headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
  const page=await page2(browser);
  async function page2(b){const p=await b.newPage({viewport:{width:1280,height:900},deviceScaleFactor:2});await p.route("**/unpkg.com/**",r=>r.fulfill({status:200,contentType:"application/javascript",body:bundle}));return p;}
  // LIVE for the tag dropdown (count-1 long tail)
  await page.goto("https://jeroenonnostr.github.io/proof-deck/",{waitUntil:"domcontentloaded",timeout:30000}).catch(()=>{});
  await page.waitForFunction(()=>/Live|Sample/.test(document.querySelector("#statustext").textContent),{timeout:25000}).catch(()=>{});
  await page.waitForTimeout(1200);
  await page.screenshot({path:"shot-tags-collapsed.png"});
  // expand the long tail
  const more=page.locator("#tagMore");
  if(await more.count()){ console.log("tagMore label:", await more.textContent()); await more.click(); await page.waitForTimeout(300); await page.screenshot({path:"shot-tags-expanded.png"}); }
  else console.log("no tagMore button (deployed site may be old build)");
  // flip a card with a long proof to confirm no scrollbar — use fixture build locally instead for determinism
  await browser.close();

  // proof-face shot from local fixture (deterministic)
  const b2=await chromium.launch({executablePath:CHROME,headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
  const p=await b2.newPage({viewport:{width:1280,height:1000},deviceScaleFactor:2});
  await p.route("**/unpkg.com/**",r=>r.fulfill({status:200,contentType:"application/javascript",body:bundle}));
  await p.routeWebSocket("**",()=>{});
  await p.goto("file://"+path.resolve("index.html"),{waitUntil:"domcontentloaded"});
  await p.waitForSelector(".card:not(.skeleton)",{timeout:12000});
  await p.locator(".card:not(.skeleton)").first().locator(".front").click({force:true});
  await p.waitForTimeout(700);
  // also run witness so the proof face is at its tallest
  await p.locator('.card:not(.skeleton)').first().locator('.back [data-act="witness"]').click().catch(()=>{});
  await p.waitForTimeout(1500);
  await p.screenshot({path:"shot-proof-fit.png"});
  await b2.close();
  for(const f of ["shot-tags-collapsed.png","shot-tags-expanded.png","shot-proof-fit.png"]) if(fs.existsSync(f)) console.log(f,fs.statSync(f).size);
})().catch(e=>{console.error(e.message);process.exit(1)});
