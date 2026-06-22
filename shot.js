const { chromium } = require("playwright-core");
const path=require("path"); const fs=require("fs");
const CHROME=["/home/jeroen/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome","/usr/bin/google-chrome-stable"].find(p=>fs.existsSync(p));
const bundle=fs.readFileSync(path.resolve("node_modules/nostr-tools/lib/nostr.bundle.js"),"utf8");
(async()=>{
  const browser=await chromium.launch({executablePath:CHROME,headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
  const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:2});
  await page.route("**/unpkg.com/**",r=>r.fulfill({status:200,contentType:"application/javascript",body:bundle}));
  await page.routeWebSocket("**",()=>{}); // fixture for stable shot
  await page.goto("file://"+path.resolve("index.html"),{waitUntil:"domcontentloaded"});
  await page.waitForSelector(".card:not(.skeleton)",{timeout:12000});
  await page.waitForTimeout(400);
  await page.screenshot({path:"screenshot-deck.png"});
  // flip a card for the proof shot
  const c=page.locator(".card:not(.skeleton)").first();
  await c.locator('[data-act="flip"]').click(); await page.waitForTimeout(700);
  await page.screenshot({path:"screenshot-proof.png"});
  // tamper sandbox shot
  await c.locator('[data-act="tamper"]').click(); await page.waitForTimeout(300);
  await page.locator("#sandFlip").click(); await page.waitForTimeout(300);
  await page.screenshot({path:"screenshot-tamper.png"});
  await browser.close();
  for(const f of ["screenshot-deck.png","screenshot-proof.png","screenshot-tamper.png"]) console.log(f, fs.statSync(f).size,"bytes");
})().catch(e=>{console.error(e.message);process.exit(1)});
