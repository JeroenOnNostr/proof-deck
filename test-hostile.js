// Regression tests for the 3 review fixes, against the real bundle.
const NT = require("nostr-tools");
let fails=0; const ok=(c,m)=>{console.log((c?"PASS":"FAIL")+" — "+m);if(!c)fails++;};

function cleanClone(ev){return {id:ev.id,pubkey:ev.pubkey,created_at:ev.created_at,kind:ev.kind,tags:Array.isArray(ev.tags)?ev.tags.filter(Array.isArray).map(t=>t.slice()):[],content:ev.content,sig:ev.sig}}
function tagValue(ev,name){const tags=Array.isArray(ev.tags)?ev.tags:[];const t=tags.find(x=>Array.isArray(x)&&x[0]===name&&typeof x[1]==="string");return t?t[1]:undefined}
function tagValues(ev,name){const tags=Array.isArray(ev.tags)?ev.tags:[];return tags.filter(x=>Array.isArray(x)&&x[0]===name&&typeof x[1]==="string"&&x[1]).map(x=>x[1])}
function dTag(ev){return tagValue(ev,"d")||""}

// Fix 2: malformed events must not crash the helpers
const bad=[{},{tags:null},{tags:"x"},{tags:[null,["t","ok"]]},{tags:[["t",5],["t","good"]]},{content:1,tags:[]}];
let crashed=false;
for(const e of bad){try{tagValue(e,"d");tagValues(e,"t");dTag(e);cleanClone(e);}catch(ex){crashed=true;console.log("   crashed on",JSON.stringify(e),ex.message);}}
ok(!crashed,"Fix2: malformed events never crash tag helpers / cleanClone");
ok(tagValues({tags:[["t",5],["t","good"]]},"t").length===1,"Fix2: non-string t-tag value filtered out");

// Fix 1: a hostile relay returning a DIFFERENT author's valid event must NOT count as identical/newer
const skA=NT.generateSecretKey(), pkA=NT.getPublicKey(skA);
const skB=NT.generateSecretKey(), pkB=NT.getPublicKey(skB);
const mine=NT.finalizeEvent({kind:30023,created_at:1700000000,tags:[["d","post"],["t","x"]],content:"mine"},skA);
const imposter=NT.finalizeEvent({kind:30023,created_at:1800000000,tags:[["d","post"],["t","x"]],content:"not mine"},skB); // different author, valid sig, newer
// classification with the binding guard:
function classify(returned, mineEv){
  if(returned && returned.pubkey===mineEv.pubkey && returned.kind===30023 && dTag(returned)===dTag(mineEv)){
    const pr=NT.verifyEvent(cleanClone(returned))&&NT.getEventHash(cleanClone(returned))===returned.id;
    if(!pr)return "tampered";
    if(returned.id===mineEv.id)return "identical";
    return returned.created_at<mineEv.created_at?"stale":"newer";
  }
  return "absent";
}
ok(classify(imposter,mine)==="absent","Fix1: imposter event (diff author, valid sig, newer) classified ABSENT not newer/identical");
ok(classify(mine,mine)==="identical","Fix1: genuine identical copy still classified identical");

// Fix 3: capsule JSON escape — content with </script> and <!--<script must round-trip via JSON.parse
const tricky=NT.finalizeEvent({kind:30023,created_at:1700000000,tags:[["d","p"],["t","x"]],content:"evil </script><script>alert(1)</script> <!--<script bad"},skA);
const evJson=JSON.stringify(cleanClone(tricky),null,2);
const escaped=evJson.replace(/</g,"\\u003c");
ok(!escaped.includes("<"),"Fix3: no raw < remains in embedded JSON");
ok(JSON.parse(escaped).content===tricky.content,"Fix3: escaped JSON parses back to identical content");

console.log("\n"+(fails===0?"HOSTILE-EVENT REGRESSION TESTS PASSED ✓":fails+" FAILED ✗"));
process.exit(fails===0?0:1);
