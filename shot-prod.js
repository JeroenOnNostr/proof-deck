const { chromium } = require("playwright-core");
const fs=require("fs");
const CHROME=["/home/jeroen/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome","/usr/bin/google-chrome-stable"].find(p=>fs.existsSync(p));
(async()=>{
  const browser=await chromium.launch({executablePath:CHROME,headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
  const page=await browser.newPage({viewport:{width:1280,height:880},deviceScaleFactor:2});
  await page.goto("https://jeroenonnostr.github.io/proof-deck/",{waitUntil:"domcontentloaded",timeout:30000});
  await page.waitForFunction(()=>/Live/.test(document.querySelector("#statustext").textContent),{timeout:25000}).catch(()=>{});
  await page.waitForTimeout(1500);
  // flip the 2nd card (Purple and Orange themed one if present) for a nice proof shot
  const c=page.locator(".card:not(.skeleton)").nth(0);
  await c.locator('[data-act="flip"]').click(); await page.waitForTimeout(700);
  await page.screenshot({path:"screenshot-production.png"});
  console.log("captured production screenshot");
  await browser.close();
})().catch(e=>{console.error(e.message);process.exit(1)});
