const { chromium } = require("playwright-core");
const fs=require("fs");
const CHROME=["/home/jeroen/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome","/usr/bin/google-chrome-stable"].find(p=>fs.existsSync(p));
const URL="https://jeroenonnostr.github.io/proof-deck/";
(async()=>{
  const browser=await chromium.launch({executablePath:CHROME,headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
  const page=await browser.newPage();
  const resp=await page.goto(URL,{waitUntil:"domcontentloaded",timeout:30000}).catch(e=>({status:()=>"ERR:"+e.message}));
  const code=typeof resp.status==="function"?resp.status():"?";
  console.log("HTTP status:", code);
  if(code===404){ console.log("NOT LIVE YET (404)"); await browser.close(); process.exit(3); }
  // wait for the app to load from live relays
  await page.waitForSelector(".card:not(.skeleton)",{timeout:25000}).catch(()=>{});
  await page.waitForFunction(()=>/Live|Sample/.test(document.querySelector("#statustext").textContent),{timeout:25000}).catch(()=>{});
  const cards=await page.locator(".card:not(.skeleton)").count();
  const status=await page.locator("#statustext").textContent();
  const tags=await page.locator(".tagchip").count();
  const verified=await page.locator("#verifiedCount").textContent();
  console.log("cards:",cards," tags:",tags," verified:",verified," status:",status);
  // flip + check proof on the deployed site
  const c=page.locator(".card:not(.skeleton)").first();
  await c.locator(".front").click(); await page.waitForTimeout(400);
  const proofOk=await c.locator(".back .verdict.ok").count();
  console.log("proof verdict OK on deployed site:", proofOk>0);
  const pass = code===200 && cards===21 && tags>3 && proofOk>0;
  console.log("\n"+(pass?"DEPLOYED SITE VERIFIED ✓":"DEPLOY CHECK INCOMPLETE"));
  await browser.close();
  process.exit(pass?0:3);
})().catch(e=>{console.error("ERR:",e.message);process.exit(2)});
