const { chromium } = require("playwright-core");
const path=require("path"); const fs=require("fs");
const CHROME=["/home/jeroen/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome","/usr/bin/google-chrome-stable"].find(p=>fs.existsSync(p));
const bundle=fs.readFileSync(path.resolve("node_modules/nostr-tools/lib/nostr.bundle.js"),"utf8");
(async()=>{
  const browser=await chromium.launch({executablePath:CHROME,headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
  const p=await browser.newPage({viewport:{width:1280,height:760},deviceScaleFactor:2});
  await p.route("**/unpkg.com/**",r=>r.fulfill({status:200,contentType:"application/javascript",body:bundle}));
  // LOCAL build (new code) + LIVE relays (long tail of count-1 tags)
  await p.goto("file://"+path.resolve("index.html"),{waitUntil:"domcontentloaded"});
  await p.waitForFunction(()=>/Live/.test(document.querySelector("#statustext").textContent),{timeout:25000}).catch(()=>{});
  await p.waitForTimeout(1000);
  await p.screenshot({path:"shot-tags-collapsed.png"});
  const more=p.locator("#tagMore");
  const has=await more.count();
  console.log("tagMore present:",has, has?("label: "+(await more.textContent())):"");
  const primaryCount=await p.locator("#tags .tagchip").count();
  console.log("primary chips shown (before expand):",primaryCount);
  if(has){ await more.click(); await p.waitForTimeout(300);
    const allCount=await p.locator("#tags .tagchip").count();
    console.log("chips after expand:",allCount);
    await p.screenshot({path:"shot-tags-expanded.png"}); }
  await browser.close();
})().catch(e=>{console.error(e.message);process.exit(1)});
