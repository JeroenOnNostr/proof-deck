const { chromium } = require("playwright-core");
const path = require("path"); const fs = require("fs");
const CHROME = ["/home/jeroen/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome","/usr/bin/google-chrome-stable"].find(p=>fs.existsSync(p));
const bundle = fs.readFileSync(path.resolve("node_modules/nostr-tools/lib/nostr.bundle.js"),"utf8");
(async()=>{
  const browser = await chromium.launch({executablePath:CHROME,headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
  const page = await browser.newPage();
  // serve bundle locally (CDN may be blocked) but DO allow relay websockets through
  await page.route("**/unpkg.com/**",(r)=>r.fulfill({status:200,contentType:"application/javascript",body:bundle}));
  let wsOpened=0, wsMsgs=0;
  page.on("websocket", ws=>{ wsOpened++; ws.on("framereceived",()=>wsMsgs++); });
  await page.goto("file://"+path.resolve("index.html"),{waitUntil:"domcontentloaded"});
  // wait up to 15s for live load
  await page.waitForTimeout(15000);
  const status = await page.locator("#statustext").textContent();
  const cards = await page.locator(".card:not(.skeleton)").count();
  const banner = await page.locator("#banner.show").count();
  console.log("websockets opened:", wsOpened, "| frames received:", wsMsgs);
  console.log("status:", status);
  console.log("cards:", cards, "| fixture banner shown:", banner>0);
  // sample first card title to see if it's a real article (not fixture)
  const t = await page.locator(".card-title").first().textContent().catch(()=>"");
  console.log("first title:", t.trim().slice(0,60));
  await browser.close();
})().catch(e=>{console.error("ERR:",e.message);process.exit(1)});
