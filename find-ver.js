const { chromium } = require("playwright-core");
const fs=require("fs");
const CHROME=["/home/jeroen/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome","/usr/bin/google-chrome-stable"].find(p=>fs.existsSync(p));
(async()=>{
  const browser=await chromium.launch({executablePath:CHROME,headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
  const page=await browser.newPage();
  // what does the unpinned latest resolve to?
  const r=await page.goto("https://unpkg.com/nostr-tools/lib/nostr.bundle.js",{timeout:20000});
  console.log("latest resolves to:", r.url());
  // installed local version
  console.log("local installed:", require("./node_modules/nostr-tools/package.json").version);
  // test pinning to the installed version on BOTH cdns
  const v=require("./node_modules/nostr-tools/package.json").version;
  for(const url of [
    `https://unpkg.com/nostr-tools@${v}/lib/nostr.bundle.js`,
    `https://cdn.jsdelivr.net/npm/nostr-tools@${v}/lib/nostr.bundle.js`,
  ]){
    try{const rr=await page.goto(url,{timeout:20000});const b=await rr.text();console.log(rr.status(),"len="+b.length,"hasNT="+b.includes("NostrTools"),url);}catch(e){console.log("ERR",e.message.slice(0,50),url);}
  }
  await browser.close();
})().catch(e=>{console.error(e.message);process.exit(1)});
