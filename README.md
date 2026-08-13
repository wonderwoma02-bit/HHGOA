# HH Goa 2026 — Frame / Builder ID Generator

A small, self-contained web app. Upload a photo (or a few teammates'), pick a
color vibe, add your name and stack, and it generates a branded HH Goa 2026
frame with an auto-generated "builder class" — ready to download or share on X.

No build step, no install, no server required.

---

## 1. What changed in this version

This restyle takes its exact color palette straight from the HH Goa 2026
banner image you shared: deep green background, bold yellow display type,
hot-pink Devanagari accent badge, and black outlines. The working layout is
unchanged from the version right before this one — one page, two panels,
nothing to scroll through to actually use it.

- **Palette:** deep green (`#026735`) page background, bright yellow
  (`#FEE101`) headline/accent color, hot pink (`#FF0080`) badge accent, black
  outlines, and a cream (`#FFF7DE`) surface for the readable stub/input areas.
- **Wavy seam:** the straight line between the photo panel and the name/stack
  stub is back to the wavy cut-line from the very first version, redrawn in
  this new palette.
- **Sun + pink badge:** a small radiating sun icon and a tilted pink "गोवा"
  badge on the generated frame, echoing the reference banner directly.
- **Vibe swatches** (Sunset / Jungle / Tide / Bloom) still work the same way,
  just recolored to variations within this new green/yellow/pink palette.
- Multi-photo upload, auto-crop, name/stack fields, builder-class generator
  with 🎲 reroll, download, and 1-click share to X are all unchanged.

## 2. What's in this zip

```
hhgoa-frame-generator/
├── index.html    → page structure & controls
├── style.css     → the riso-print visual identity
├── app.js        → all logic: image handling, canvas drawing, builder-class
│                   generator, download, share
└── README.md     → this file
```

No `node_modules`, no build tool, no external image assets — the whole frame
is drawn in code.

---

## 3. How to run it

**Easiest way:** unzip the folder, double-click `index.html`. It opens in
your browser and works immediately — no install, nothing to download.

**If the Share button behaves oddly** (can happen when a page is opened as a
raw `file://` path instead of served over `http://`), run a tiny local
server instead:

```bash
cd hhgoa-frame-generator
python3 -m http.server 8000
```
Then open `http://localhost:8000`.

Or, if you have Node instead:
```bash
npx serve .
```

Either is optional — double-clicking `index.html` is enough for normal use.

---

## 4. How to use it

1. **Pick a vibe** — Sunset, Jungle, Tide, or Bloom. This sets the accent
   colors on your generated frame.
2. **Upload photo(s)** — yourself, or up to 3 teammates for a combined frame.
3. **Add your name and stack.**
4. Check your **builder class** — tap 🎲 to reroll it if you want a different one.
5. **Download** the PNG, or **Share to X** — this opens X with a
   `#FrameInGoa` caption pre-filled and downloads the image so you can attach
   it (see note below on why it can't attach automatically).

**Honest note on X sharing:** X's compose link can only pre-fill text, not
attach an image — that's a platform limitation, not something a website can
work around. On phones/browsers that support the native Web Share API, the
Share button attaches the image directly through the OS share sheet. Everywhere
else, it downloads the image and opens X with the caption ready, so attaching
it is one extra tap.

---

## 5. Customizing

- **Colors:** the `:root` variables at the top of `style.css`, and the
  `VIBES` object plus `PAPER`/`INK` constants at the top of `app.js` (canvas
  drawing can't read CSS variables, so they're duplicated intentionally —
  keep them in sync if you add a color).
- **Builder class word lists:** `ADJECTIVES`, `NOUN_MAP`, and `DEFAULT_NOUNS`
  in `app.js`.
- **Layout of the generated frame:** the `render()` function in `app.js`.
