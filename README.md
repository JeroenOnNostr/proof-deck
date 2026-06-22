# The Proof Deck

A single-page Nostr reader that deals **21** long-form articles (`kind:30023`) as a hand of cards —
and re-runs each one's cryptographic proof **in your browser**.

Most clients verify signatures silently and drop the bad ones, so you never see it happen. This one
flips that around. Every card has a purple face (who wrote it) and an orange back (what the math
says). Flip a card and it recomputes the event id from the canonical serialization and re-runs the
Schnorr signature check, right there — *bytes intact, signed by this key, untampered.*

> It should not matter where information is published.

**Live:** https://jeroenonnostr.github.io/proof-deck/

## What it does

- Fetches 21 `kind:30023` articles across several relays. Hashtag checkboxes (from `t` tags) with
  counts and an **ANY / ALL** toggle; selecting tags re-queries relays for up to 21 articles that
  actually carry them. Each card shows title, author name + picture, and date.
- **Re-verifies every article** client-side (id recompute + Schnorr), with a one-tap inspector
  showing pubkey, claimed id, and computed id side by side.
- **Tamper sandbox** — edit one character of the signed text and watch the proof snap red, with a
  word-level diff of what changed.
- **Witness across relays** — pulls the same article from each relay individually and confirms they
  served byte-identical copies. Location doesn't matter; the signature travels with the bytes.
- **Mint a proof capsule** — download a self-contained file that re-verifies the article offline,
  with no relay and no server. The proof travels with you.
- Paste any `naddr` / `npub` and read it — the source is irrelevant.

## Run it

It's one file. Open `index.html`, or serve it:

```sh
python3 -m http.server 8080   # then visit http://localhost:8080
```

No build step, no framework, no dependencies at runtime beyond
[nostr-tools](https://github.com/nbd-wtf/nostr-tools) (loaded from a CDN). View source — that's the
point.

## Repo

- `index.html` — the entire app.
- `gen-fixture.js`, `test-*.js` — the dev tooling used to generate the offline sample and to test the
  app in a real browser (not shipped to the page; see `package.json`).

## License

MIT
