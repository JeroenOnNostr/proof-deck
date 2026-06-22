const { chromium } = require("playwright-core");
const fs=require("fs");
const CHROME=["/home/jeroen/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome","/usr/bin/google-chrome-stable"].find(p=>fs.existsSync(p));
(async()=>{
  const browser=await chromium.launch({executablePath:CHROME,headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
  const page=await browser.newPage();
  for(const url of [
    "https://unpkg.com/[email protected]/lib/nostr.bundle.js",
    "https://unpkg.com/nostr-tools/lib/nostr.bundle.js",
    "https://cdn.jsdelivr.net/npm/[email protected]/lib/nostr.bundle.js",
  ]){
    try{
      const r=await page.goto(url,{timeout:20000,waitUntil:"domcontentloaded"});
      const body=await r.text();
      console.log(r.status(), "len="+body.length, "hasNostrTools="+body.includes("NostrTools"), url);
    }catch(e){ console.log("ERR", e.message.slice(0,60), url); }
  }
  await browser.close();
})().catch(e=>{console.error(e.message);process.exit(1)});
