const { chromium } = require("playwright-core");
const path=require("path"); const fs=require("fs");
const CHROME=["/home/jeroen/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome","/usr/bin/google-chrome-stable"].find(p=>fs.existsSync(p));
const bundle=fs.readFileSync(path.resolve("node_modules/nostr-tools/lib/nostr.bundle.js"),"utf8");
(async()=>{
  const browser=await chromium.launch({executablePath:CHROME,headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
  const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:2});
  await page.route("**/unpkg.com/**",r=>r.fulfill({status:200,contentType:"application/javascript",body:bundle}));
  await page.goto("file://"+path.resolve("index.html"),{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>/Live/.test(document.querySelector("#statustext").textContent),{timeout:20000}).catch(()=>{});
  await page.waitForTimeout(1500); // let avatars load
  await page.screenshot({path:"screenshot-live.png"});
  console.log("status:", await page.locator("#statustext").textContent());
  console.log("written screenshot-live.png");
  await browser.close();
})().catch(e=>{console.error(e.message);process.exit(1)});
