const { chromium } = require("playwright-core");
const fs=require("fs");
const CHROME=["/home/jeroen/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome","/usr/bin/google-chrome-stable"].find(p=>fs.existsSync(p));
const URL="https://jeroenonnostr.github.io/proof-deck/";
(async()=>{
  let fails=0; const ok=(c,m)=>{console.log((c?"PASS":"FAIL")+" — "+m);if(!c)fails++;};
  const browser=await chromium.launch({executablePath:CHROME,headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
  const page=await browser.newPage({viewport:{width:1200,height:800}});
  const resp=await page.goto(URL,{waitUntil:"domcontentloaded",timeout:30000});
  ok(resp.status()===200,"live URL HTTP 200");
  await page.waitForFunction(()=>/Live|Sample/.test(document.querySelector("#statustext").textContent),{timeout:25000}).catch(()=>{});
  const cards=await page.locator(".card:not(.skeleton)").count();
  ok(cards===21,"21 cards on live site (got "+cards+")");
  // new: Verify button + Read link present on front
  const c=page.locator(".card:not(.skeleton)").first();
  ok(await c.locator(".front .flipbtn").count()>0,"front has a Verify button");
  ok(await c.locator(".front .readlink").count()>0,"front has a Read link");
  ok(await c.locator(".front .vchip").count()>0,"front has a verified status pill");
  // new: face click flips
  await c.locator(".front").click({force:true}); await page.waitForTimeout(300);
  ok((await c.getAttribute("data-flipped"))==="1","face click flips on live site");
  // new: live crypto readout in sandbox
  await c.locator('.back [data-act="tamper"]').click(); await page.waitForTimeout(300);
  ok(await page.locator("#cpComputed.allmatch").count()>0,"sandbox shows matching recomputed id");
  const before=await page.locator("#cpComputed").textContent();
  await page.locator("#sandText").fill((await page.locator("#sandText").inputValue())+" X");
  await page.waitForTimeout(150);
  const after=await page.locator("#cpComputed").textContent();
  ok(before!==after,"recomputed id changes live on edit");
  ok(await page.locator("#cpIdBadge.bad").count()>0,"id badge flips to changed");
  await page.locator("#modalClose").click(); await page.waitForTimeout(100);
  // new: collapse on scroll
  await page.evaluate(()=>window.scrollTo(0,600)); await page.waitForTimeout(250);
  ok(await page.locator(".toolbar.collapsed").count()>0,"tag list collapses on scroll (live)");
  await browser.close();
  console.log("\n"+(fails===0?"LIVE UX VERIFICATION PASSED ✓":fails+" FAILED ✗"));
  process.exit(fails===0?0:1);
})().catch(e=>{console.error("ERR:",e.message);process.exit(2)});
