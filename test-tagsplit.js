// Unit test the primary/long-tail split used by renderTags.
let fails=0; const ok=(c,m)=>{console.log((c?"PASS":"FAIL")+" — "+m);if(!c)fails++;};
function split(counts, selected){
  const sel = new Set(selected||[]);
  const primary = counts.filter(([t,c])=>c>=2||sel.has(t));
  const rest = counts.filter(([t,c])=>c<2&&!sel.has(t));
  return {primary, rest};
}
// realistic distribution: a few common, many count-1
const counts=[["nostr",16],["bitcoin",12],["finance",3],["lightning",2],["quant",2],
  ["agents",1],["bch",1],["china",1],["crypto",1],["discord",1],["malaysia",1],["xmr",1],["thc原油",1]];
let r=split(counts);
ok(r.primary.length===5,"primary = count>=2 tags (got "+r.primary.length+")");
ok(r.rest.length===8,"rest = count-1 long tail (got "+r.rest.length+")");
ok(r.primary.every(([t,c])=>c>=2),"every primary has count>=2");
ok(r.rest.every(([t,c])=>c<2),"every rest has count<2");
// a selected count-1 tag stays in primary (so you always see your active filter)
r=split(counts,["xmr"]);
ok(r.primary.some(([t])=>t==="xmr"),"selected count-1 tag pinned to primary");
ok(!r.rest.some(([t])=>t==="xmr"),"selected tag removed from rest");
ok(r.rest.length===7,"rest shrinks by the pinned tag");
console.log("\n"+(fails===0?"TAG-SPLIT TESTS PASSED ✓":fails+" FAILED ✗"));
process.exit(fails===0?0:1);
