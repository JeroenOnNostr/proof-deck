// Generates 21 real, fully-signed kind:30023 events for the offline fixture.
// Run with: node gen-fixture.js  (requires the local nostr-tools install)
const NT = require("nostr-tools");
const fs = require("fs");

function mkAuthor(name) {
  const sk = NT.generateSecretKey();
  const pk = NT.getPublicKey(sk);
  return { sk, pk, name };
}
const authors = [mkAuthor("Satoshi Reads"), mkAuthor("orange.purple"), mkAuthor("nostr scribe")];
const now = Math.floor(Date.now() / 1000);

function art(author, dayOffset, title, summary, tags, content) {
  const created = now - dayOffset * 86400;
  const tmpl = {
    kind: 30023,
    created_at: created,
    tags: [
      ["d", title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")],
      ["title", title],
      ["summary", summary],
      ["published_at", String(created)],
      ...tags.map((t) => ["t", t]),
    ],
    content,
  };
  return NT.finalizeEvent(tmpl, author.sk);
}

const [A, B, C] = authors;

const events = [
  art(A, 1, "Why Signatures Beat Servers",
    "A short argument that on Nostr you should trust the key, not the host.",
    ["nostr", "bitcoin", "sovereignty", "freedomtech"],
    "On the old web, you trust a server. You point your browser at a domain, and whatever bytes come back, you read. If the server lies, you have no way to know.\n\nNostr inverts this. Every note carries a Schnorr signature. **It should not matter where information is published** — the signature travels with the bytes. Pull this article from a relay in Tokyo or a relay in your basement; if the signature checks out, it is the same article, untouched.\n\n## The quiet guarantee\n\nHere is the strange part: your client already verifies this signature. It just never tells you. Invalid events are dropped silently, and the guarantee stays invisible.\n\nThis reader makes it visible. It recomputes the event id from the canonical serialization and re-runs the signature check, right in your browser. Trust the math, not the host."),

  art(B, 2, "Purple and Orange",
    "Notes on the two colors that define this corner of the internet.",
    ["nostr", "bitcoin", "writing", "value4value"],
    "Purple is the protocol. Orange is the money.\n\nTogether they make a strange and wonderful thing: a place where words can be written down, signed, and carried anywhere — and where value can flow back to the people who wrote them, with no platform standing in the middle.\n\n> The orange future now has a purple hue.\n\nWe have a lot of building to do. This is one small brick."),

  art(C, 3, "The Number 21",
    "Why a single number keeps showing up.",
    ["bitcoin", "21", "philosophy"],
    "Twenty-one million. Not twenty, not twenty-two. A hard cap, chosen once, enforced by everyone, forever.\n\nThe number became a culture. 21 lessons. 21 ways. A glowing orange door with two numerals on it.\n\nThis page deals exactly **21** cards. Each one is an article you can verify yourself. That is the whole idea: not a feed you scroll, but a hand you can check."),

  art(A, 4, "Marginalia for Machines",
    "What highlights could become when they are signed events.",
    ["nostr", "reading", "writing"],
    "A highlight is a small act of attention. You drag your cursor across a sentence and say: this one matters.\n\nWhen a highlight becomes a signed event, it stops being trapped in one app. It becomes a portable signal — a lens the whole network can share."),

  art(B, 5, "Relays Are Not Your Home",
    "On treating relays as interchangeable mirrors, not landlords.",
    ["nostr", "relays", "sovereignty", "freedomtech"],
    "A relay is a dumb pipe that happens to remember things. That is its strength. You should never feel attached to one.\n\nIf an article lives on seven relays, no single operator can erase it. Pull it from any of them and verify the signature — they will all give you the same bytes, or they are lying, and the math will tell you which."),

  art(C, 6, "Self-Custody of Truth",
    "Holding your own proof, the way you hold your own keys.",
    ["bitcoin", "nostr", "sovereignty"],
    "We learned to hold our own keys. The next lesson is holding our own proofs.\n\nAn article you have verified and saved is yours. You can re-check it offline, with no relay, no server, no permission. The proof travels with the bytes."),

  art(A, 7, "Against the Walled Garden",
    "Why permissionless publishing changes the incentives.",
    ["writing", "nostr", "freedomtech"],
    "Medium and Substack are gardens with walls. Pretty inside, but the gate is owned by someone else.\n\nPermissionless publishing removes the gate. The cost is that you must bring your own trust. The signature is how you bring it."),

  art(B, 8, "A Lens on the Written Web",
    "Imagining an overlay of everything readers found worth keeping.",
    ["reading", "nostr", "value4value"],
    "Imagine every passage anyone ever found worth keeping, painted faintly over the text. Not a comment section — a lens.\n\nThe hard part was never the idea. It was the anchoring, and the incentives. Sats fix the second. Signed events make the first tractable."),

  art(C, 9, "What a Reader Owes a Writer",
    "Value-for-value, in one short note.",
    ["value4value", "bitcoin", "writing"],
    "Attention is cheap and easily faked. Sats are scarce and unforgeable.\n\nA zap is a reader telling a writer, in the only language that cannot be gamed: this was worth it."),

  art(A, 10, "The Splinter in Your Mind",
    "On the feeling that something is wrong with the money.",
    ["bitcoin", "philosophy", "21"],
    "You cannot quite say what it is. The prices, the rules, the way the ground shifts under your savings.\n\nThen you take the orange pill, and the splinter has a name."),

  art(B, 11, "Sound Money, Sound Writing",
    "What changes when the unit of account stops melting.",
    ["bitcoin", "writing", "philosophy"],
    "When money holds its value, time preference falls. You plan further out. You build things meant to last.\n\nWriting changes too. Less churn, more permanence. A signed article is meant to outlive the relay it was first posted to."),

  art(C, 12, "Permissionless by Default",
    "The quiet radicalism of not asking.",
    ["nostr", "freedomtech", "sovereignty"],
    "No application form. No approval. No account to be suspended.\n\nYou generate a key and you exist. That is the radical part, hiding in plain sight."),

  art(A, 13, "Notes on Canonical Form",
    "How an event id is computed, and why it matters.",
    ["nostr", "bitcoin"],
    "An event id is the SHA-256 of a canonical array: zero, pubkey, created_at, kind, tags, content. Serialize it the same way every time, hash it, and you get the id.\n\nChange one byte of content and the id changes. That is how this reader catches a relay that altered an article: it recomputes the id and compares."),

  art(B, 14, "The Address Book Made of Money",
    "Zaps turn pubkeys into payment endpoints.",
    ["bitcoin", "value4value", "nostr"],
    "Every profile can carry a lightning address. Suddenly the social graph is also a payment graph.\n\nTipping becomes as cheap as liking. And the willingness to send goes up as the friction goes down."),

  art(C, 15, "Read It Anywhere",
    "Source-agnostic reading as a feature, not an accident.",
    ["nostr", "reading", "sovereignty"],
    "Paste a reference and read. Do not ask where it came from. If the signature holds, the where is irrelevant.\n\nThis is location-independence as an everyday experience, not a slogan."),

  art(A, 16, "Optimism Is a Strategy",
    "Why builders in this space tend to be cheerful.",
    ["philosophy", "bitcoin", "21"],
    "Cynicism is easy and useless. Optimism is harder and it ships code.\n\nThe future is not given. It is built, one signed brick at a time."),

  art(B, 17, "The Honest Relay",
    "What it means for a relay to behave.",
    ["relays", "nostr", "freedomtech"],
    "An honest relay stores what it is given and serves it back unchanged. That is the whole job.\n\nYou do not have to trust it to be honest. You verify. A dishonest relay cannot forge a signature, and that is the end of its power."),

  art(C, 18, "Writing for Keys, Not Clicks",
    "How the incentive shifts when the audience holds keys.",
    ["writing", "value4value", "nostr"],
    "When your readers hold keys, they can pay you directly and follow you anywhere. You stop writing for an algorithm and start writing for people.\n\nIt is an old idea wearing new cryptography."),

  art(A, 19, "Provenance Without a Notary",
    "Timestamps, first-seen, and the absence of authority.",
    ["bitcoin", "nostr", "philosophy"],
    "Who needs a notary when you have a signature and a chain? Provenance stops being a service you buy and becomes a property you check.\n\nNo authority required. That is the recurring theme, in money and in words."),

  art(B, 20, "Small Tools, Sharp Edges",
    "In praise of single-file software you can read.",
    ["freedomtech", "nostr", "writing"],
    "The best tools are small enough to read in an afternoon. No build step, no black box, no dependency you cannot inspect.\n\nYou should be able to open the source and see exactly what it does. Sovereignty starts with legibility."),

  art(C, 21, "A Hand You Can Check",
    "Closing the loop: 21 articles, each one verifiable.",
    ["nostr", "bitcoin", "21", "sovereignty"],
    "Not a feed. A hand of twenty-one cards.\n\nFlip each one and watch the proof run. The point is not that the articles are interesting — though some are. The point is that you never had to take anyone's word for it."),
];

// integrity check
let ok = true;
for (const e of events) {
  if (!NT.verifyEvent(e)) { ok = false; console.error("INVALID", e.id); }
  if (NT.getEventHash(e) !== e.id) { ok = false; console.error("ID MISMATCH", e.id); }
}
console.log("events:", events.length, "all valid:", ok);

const profiles = {};
for (const a of authors) profiles[a.pk] = { name: a.name, picture: "" };

fs.writeFileSync("fixture-data.json", JSON.stringify({ events, profiles }));
console.log("wrote fixture-data.json", fs.statSync("fixture-data.json").size, "bytes");
