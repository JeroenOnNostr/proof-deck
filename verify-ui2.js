const { chromium } = require("playwright-core");
const fs=require("fs");
const CHROME=["/home/jeroen/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome","/usr/bin/google-chrome-stable"].find(p=>fs.existsSync(p));
const URL="https://jeroenonnostr.github.io/proof-deck/";
(async()=>{
  let fails=0; const ok=(c,m)=>{console.log((c?"PASS":"FAIL")+" — "+m);if(!c)fails++;};
  const browser=await chromium.launch({executablePath:CHROME,headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const resp=await page.goto(URL,{waitUntil:"domcontentloaded",timeout:30000});
  ok(resp.status()===200,"live HTTP 200");
  await page.waitForFunction(()=>/Live|Sample/.test(document.querySelector("#statustext").textContent),{timeout:25000}).catch(()=>{});
  ok((await page.locator(".card:not(.skeleton)").count())===21,"21 cards live");
  // hashtag dropdown
  const more=page.locator("#tagMore");
  ok(await more.count()>0,"'+N more' tag dropdown present: "+(await more.count()?await more.textContent():"-"));
  const primaryShown=await page.locator("#tags .tagchip").count();
  await more.click(); await page.waitForTimeout(300);
  const afterExpand=await page.locator("#tags .tagchip").count();
  ok(afterExpand>primaryShown,"expanding shows the long tail ("+primaryShown+" -> "+afterExpand+")");
  await page.locator("#tagMore").click(); await page.waitForTimeout(200);
  ok((await page.locator("#tags .tagchip").count())===primaryShown,"collapsing hides it again");
  // proof face no scrollbar
  const c=page.locator(".card:not(.skeleton)").first();
  await c.locator(".front").click({force:true}); await page.waitForTimeout(500);
  const sb=await c.locator(".back").evaluate(el=>({sh:el.scrollHeight,ch:el.clientHeight}));
  ok(sb.sh<=sb.ch+2,"proof face has no inner scrollbar live (sh "+sb.sh+" <= ch "+sb.ch+")");
  await browser.close();
  console.log("\n"+(fails===0?"LIVE UI-2 VERIFICATION PASSED ✓":fails+" FAILED ✗"));
  process.exit(fails===0?0:1);
})().catch(e=>{console.error("ERR:",e.message);process.exit(2)});
