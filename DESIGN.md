---
name: Who Texts First
description: A Y2K love letter that does maths. A pastel sticker-book phone screen where the numbers are exact and the AI only writes the one-liner.
colors:
  field: "#E3DCFC"
  screen-top: "#FBEFFC"
  screen-bottom: "#F9EEFC"
  ink: "#3F2F60"
  ink-2: "#5C4A80"
  ink-3: "#6B5A8E"
  heading-violet: "#7043CB"
  pill-ink: "#6A40C4"
  violet: "#8657D6"
  violet-deep: "#7650C9"
  orchid: "#9B45C0"
  icon-lilac: "#9C80EA"
  pill: "#EAE2FC"
  pink-panel: "#FCE4F5"
  pink-panel-2: "#FAD9F0"
  pink-line: "#F5C6E8"
  lilac-panel: "#F3EEFE"
  lilac-panel-2: "#ECE5FD"
  lilac-line: "#DCD2FA"
  title-violet-top: "#C6A2F6"
  title-violet-low: "#7E4CD6"
  title-orchid-top: "#E59BEF"
  title-orchid-low: "#9440CC"
  bubble-top: "#F29BE8"
  bubble-mid: "#DC68D4"
  bubble-low: "#C64DC2"
  lilac-top: "#B49AF5"
  lilac-low: "#855EE0"
  select-top: "#A88AF3"
  select-low: "#8460E0"
  bar-you-a: "#F6A6EA"
  bar-you-b: "#E166D8"
  bar-them-a: "#BDA6F6"
  bar-them-b: "#9478EC"
  track: "#EFE5FC"
  spark: "#B39CF0"
  spark-pink: "#F0A5DE"
  danger: "#B4307A"
  openai-mint: "#D9F5EE"
  openai-ink: "#245C4C"
  gemini-sky: "#DCE6FC"
  gemini-ink: "#2A4A8A"
  claude-peach: "#FDE3DF"
  claude-ink: "#8E3F2F"
typography:
  title:
    fontFamily: "Fredoka, Nunito, ui-rounded, system-ui, sans-serif"
    fontSize: "clamp(44px, 13vw, 58px)"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Fredoka, Nunito, ui-rounded, system-ui, sans-serif"
    fontSize: "clamp(23px, 6.8vw, 27px)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.005em"
  verdict:
    fontFamily: "Fredoka, Nunito, ui-rounded, system-ui, sans-serif"
    fontSize: "clamp(22px, 6.4vw, 26px)"
    fontWeight: 700
    lineHeight: 1.12
  pill:
    fontFamily: "Fredoka, Nunito, ui-rounded, system-ui, sans-serif"
    fontSize: "clamp(16px, 4.8vw, 21px)"
    fontWeight: 700
    lineHeight: 1.1
  numeral:
    fontFamily: "Fredoka, Nunito, ui-rounded, system-ui, sans-serif"
    fontSize: "46px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  button:
    fontFamily: "Fredoka, Nunito, ui-rounded, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.01em"
  button-big:
    fontFamily: "Fredoka, Nunito, ui-rounded, system-ui, sans-serif"
    fontSize: "23px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.01em"
  label:
    fontFamily: "Fredoka, Nunito, ui-rounded, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "Nunito, ui-rounded, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.45
  small:
    fontFamily: "Nunito, ui-rounded, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.4
  link:
    fontFamily: "Nunito, ui-rounded, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.3
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  input: "10px"
  inset: "14px"
  field: "16px"
  choice: "18px"
  tile: "22px"
  panel: "24px"
  drop: "26px"
  sheet: "28px"
  phone: "44px"
  pill: "999px"
spacing:
  gutter: "16px"
  gutter-narrow: "12px"
  gutter-wide: "22px"
  stack: "12px"
  route-gap: "14px"
  panel-pad: "16px"
  foot-clearance: "132px"
components:
  button-bubble:
    backgroundColor: "{colors.bubble-mid}"
    textColor: "#FFFFFF"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    height: "52px"
    padding: "0 28px"
  button-bubble-big:
    backgroundColor: "{colors.bubble-mid}"
    textColor: "#FFFFFF"
    typography: "{typography.button-big}"
    rounded: "{rounded.pill}"
    height: "60px"
    width: "min(100%, 320px)"
  button-bubble-lilac:
    backgroundColor: "{colors.lilac-low}"
    textColor: "#FFFFFF"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    height: "52px"
  button-mini:
    backgroundColor: "{colors.select-low}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    height: "40px"
    padding: "0 16px"
  button-mini-ghost:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.violet-deep}"
    rounded: "{rounded.pill}"
    height: "40px"
    padding: "0 16px"
  chip-provider-openai:
    backgroundColor: "{colors.openai-mint}"
    textColor: "{colors.openai-ink}"
    rounded: "{rounded.field}"
    height: "48px"
  chip-provider-gemini:
    backgroundColor: "{colors.gemini-sky}"
    textColor: "{colors.gemini-ink}"
    rounded: "{rounded.field}"
    height: "48px"
  chip-provider-claude:
    backgroundColor: "{colors.claude-peach}"
    textColor: "{colors.claude-ink}"
    rounded: "{rounded.field}"
    height: "48px"
  choice:
    backgroundColor: "rgba(255, 255, 255, 0.7)"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.choice}"
    height: "52px"
    padding: "6px 16px"
  choice-selected:
    backgroundColor: "{colors.select-low}"
    textColor: "#FFFFFF"
    typography: "{typography.label}"
    rounded: "{rounded.choice}"
  input-key:
    backgroundColor: "rgba(255, 255, 255, 0.86)"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    height: "52px"
    padding: "0 6px 0 14px"
  pill-heading:
    backgroundColor: "{colors.pill}"
    textColor: "{colors.pill-ink}"
    typography: "{typography.pill}"
    rounded: "{rounded.pill}"
    padding: "11px 16px"
  card-route-pink:
    backgroundColor: "{colors.pink-panel}"
    rounded: "{rounded.panel}"
    padding: "16px 16px 18px"
  card-route-lilac:
    backgroundColor: "{colors.lilac-panel}"
    rounded: "{rounded.panel}"
    padding: "16px 16px 18px"
  lane:
    backgroundColor: "rgba(255, 255, 255, 0.72)"
    rounded: "{rounded.tile}"
    padding: "14px 16px"
  tile-pink:
    backgroundColor: "{colors.pink-panel}"
    rounded: "{rounded.tile}"
    height: "148px"
  tile-lilac:
    backgroundColor: "{colors.lilac-panel}"
    rounded: "{rounded.tile}"
    height: "148px"
  verdict-card:
    backgroundColor: "{colors.pink-panel}"
    textColor: "{colors.heading-violet}"
    typography: "{typography.verdict}"
    rounded: "{rounded.panel}"
    padding: "16px 16px 18px 10px"
  drop-zone:
    backgroundColor: "rgba(255, 255, 255, 0.38)"
    rounded: "{rounded.drop}"
    padding: "26px 18px 22px"
---

# Design System: Who Texts First

> **Build record.** Built 12 Nov 2026 from the approved comp `../ui-concepts/effort/effort_b_y2k.png`. The comp is concept B, "Y2K love letter", which the author picked from four concepts. The build is comp-led and brief-pinned, so there was no concept roll. The comp is a three-screen board, and the build reproduces its three screens (pick how to run it, add your chat, who's putting in the effort). `.impeccable/review/hero-repro.png` lays the three built screens out at the comp's 1536x1024 board size; the final captures are in `screenshots/`.
>
> The finish review returned **fix** with eight material fixes. The verdict pass scored six of them resolved. One of those six, fix 1 (provider logos), was resolved as a cited adaptation: the chips are plain names, per DOUBLE_DOWN.md's "plain text, no logos". Fix 4 (ornament) and fix 5 (density) were scored partial, and the verdict pass found two regressions. All four remaining items got a last correction that was not re-scored, because the two-round budget had run out. So the ornament amount and the spacing density recorded below describe the build as shipped, not a settled rule.
>
> The four chrome heart stickers carry their Azure prompts (`gpt-image-2.5-flare`, comp as reference) in `assets/hearts/*.webp.json` sidecars, with the source PNGs in `.impeccable/assets-src/`. `assets/og.png`, the link preview, and the PNGs in `screenshots/` carry their origin (headless-Chrome captures of the made-up sample chat with a stubbed verdict) in an `impeccable:prompt` text chunk inside the PNG.

## Overview

**Creative North Star: "The Love Letter That Does Maths"**

The page is one phone screen from a pastel sticker book. A lavender field holds a blush-white screen. Blush-pink and lilac panels sit on it, with glossy liquid-chrome heart stickers tucked at their corners and four-point sparkles in the gaps. The lettering is chunky rounded Fredoka. The title has a glossy violet-to-orchid fill with a white rim. Buttons are candy bubbles with a gloss band across the top. The drop zone is a dashed love-letter outline.

The tone is cute, but the content is exact. Reply times, "you start N% of chats" and dry-reply counts are worked out on the phone and set as big Fredoka numerals with tabular figures. The AI writes only the one-line verdict, and its card is credited under the quote ("Claude's verdict"). The rejected anti-reference is the category default: a dark "AI analyser" dashboard.

The same world is drawn twice. The live page is built in CSS, and the share card is a 1080x1920 canvas (`js/card.js`) that repeats the palette, the glossy title, the lanes, the tiles and the verdict card at story size.

**Key Characteristics:**
- Lavender field, blush-white screen, pink and lilac panels.
- Pink is You and the main action; lilac is Them and selection.
- Fredoka for anything read at a glance, Nunito for sentences, JetBrains Mono only for text you paste into an AI.
- Raster chrome heart stickers and SVG four-point sparkles are the ornament.
- Gloss everywhere: white inset top lines, candy gradients, shadows tinted violet.
- Everything rounded; nothing sharp.

## Colors

The palette is a two-family candy pastel (pink and lilac) on lavender, written in deep violet ink. It is used with restraint: the hues are soft, and saturation is saved for the bubbles, the bars and the title.

### Primary
- **Candy Bubble Pink** (#DC68D4, with a #F29BE8 top and #C64DC2 base): the primary action. Copy prompt, Analyze, Share result and Download PNG are all this gradient. It also marks You: the You reply bar (#F6A6EA to #E166D8), the You avatar, the "You start" tile and the number-1 heart badge.
- **Heading Violet** (#7043CB): headings inside panels (route titles, "Drop your chat export here") and the verdict quote.

### Secondary
- **Lilac Bubble** (#855EE0, with a #B49AF5 top): the second button colour (Share in the sheet, the "done" state of Copy).
- **Selection Lilac** (#A88AF3 to #8460E0): a checked choice ("Last 3 months", the chosen name) and the small Try again button.
- **Them Lilac** (#BDA6F6 to #9478EC): the Them reply bar, avatar, the dry-replies tile and the number-2 heart badge.

### Tertiary
- **Provider tints**: OpenAI mint (#D9F5EE, ink #245C4C), Gemini sky (#DCE6FC, ink #2A4A8A), Claude peach (#FDE3DF, ink #8E3F2F). These are the only hues outside the pink and lilac families, and they appear only on the provider chips. When a chip is selected, its border and tick take a stronger ring of the same hue.

### Neutral
- **Lavender Field** (#E3DCFC): the page behind the phone, with two soft pink radial blooms.
- **Blush Screen** (#FBEFFC to #F9EEFC): the phone screen and the share sheet.
- **Plum Ink** (#3F2F60): body text and numbers in the lanes. **Ink 2** (#5C4A80) for lane leads and labels; **Ink 3** (#6B5A8E) for fine print, sub-lines and the verdict credit.
- **Pink Panel** (#FCE4F5 to #FAD9F0, line #F5C6E8) and **Lilac Panel** (#F3EEFE to #ECE5FD, line #DCD2FA): panel fills and their 1.5px borders.
- **Pill Lilac** (#EAE2FC, text #6A40C4): the screen-heading pill.
- **Icon Lilac** (#9C80EA): line icons and the sparkles in the pill.
- **Sparkle** (#B39CF0) and **Sparkle Pink** (#F0A5DE): the four-point sparkles; white sparkles appear only on bubbles and the field.
- **Track** (#EFE5FC): empty part of the reply bars.
- **Danger Raspberry** (#B4307A): error text (bad key, unreadable file). Errors stay inside the palette; there is no alarm red.

### Named Rules
**The Two Inks Rule.** Pink is You, route 1 and the main action. Lilac is Them, route 2 and selection. Every paired element follows the split: route cards, number hearts, avatars, reply bars and stat tiles.

**The Plain-Names Rule.** AI providers appear as plain names in tinted chips (mint, sky, peach), never as logos. Those three tints are not used anywhere else.

**The One Palette Rule.** The share card in `js/card.js` repeats the `:root` hex values as literals on a canvas. Change a colour in both places, or the card and the page drift apart.

## Typography

**Display Font:** Fredoka (variable 300–700, self-hosted), falling back to Nunito
**Body Font:** Nunito (variable 400–800, self-hosted)
**Label/Mono Font:** JetBrains Mono (400–600, self-hosted), only for the prompt and the model id

**Character:** Fredoka is round, chunky and friendly, like sticker lettering. Nunito is its quieter rounded cousin for sentences, so the two never fight.

### Hierarchy
- **Title** (Fredoka 700, clamp(44px, 13vw, 58px), line-height 0.9): "Who Texts / First" on two lines, each a vertical gradient (violet #C6A2F6 to #7E4CD6, then orchid #E59BEF to #9440CC) clipped to the text, with a 1.5px white rim and a soft violet drop shadow. 38px below 360px. On the card it is 150px with a 14px white stroke.
- **Pill** (Fredoka 700, clamp(16px, 4.8vw, 21px), line-height 1.1): the screen heading, one per screen, flanked by two small sparkles.
- **Headline** (Fredoka 700, clamp(23px, 6.8vw, 27px), line-height 1.05): route titles ("Copy the prompt", "Use your own API key") and the drop-zone title.
- **Verdict** (Fredoka 700, clamp(22px, 6.4vw, 26px), line-height 1.12, balanced wrap): the AI's one-liner, in curly quotes.
- **Numeral** (Fredoka 700, 46px, line-height 1, tabular figures): the tile stats. Lane times are Fredoka 700 at 20px, also tabular.
- **Button** (Fredoka 600, 20px; big bubbles 23px; sheet bubbles 18px): bubble labels, white with a plum text shadow.
- **Label** (Fredoka 600, 17px): choices, fieldset legends, the "All the numbers" summary.
- **Body** (Nunito 400, 16px, line-height 1.45): sentences. Steps are 14.5px, fine print 13.5px, both Ink 3, with bold lead words in Ink 2 at 800.
- **Link** (Nunito 700, 14px): text buttons and links, underlined (1.5px, 3px offset), violet-deep, orchid on hover.
- **Mono** (JetBrains Mono 400, 13.5px, line-height 1.6): the prompt preview, faded out at the bottom when collapsed.

### Named Rules
**The Glance-Or-Read Rule.** Anything a student reads at a glance (titles, buttons, numbers, choices, headings) is Fredoka. Anything read as a sentence is Nunito. Mono appears only for text meant to be pasted into a machine.

**The Exact Numbers Rule.** Every number the stats produce is set in tabular figures, so the counts look measured, not decorative.

## Layout

- **The phone:** one column, `max-width: 480px`, centred. The side gutter is 16px (12px below 360px, 22px at 560px and wider). The bottom padding is 132px plus the safe area, to clear the two-layer wave (110px) and the corner stickers at the foot.
- **560px and wider:** the column becomes a phone floating on the lavender field: 44px corners, a 1px white border, a violet shadow and 40px of body padding above and below. Three drifting chrome hearts and three sparkles sit in the field around it. Below 560px the field ornaments are hidden.
- **Masthead:** the centred two-line title, padded 52px left and right to make room for a chrome heart on each side, with sparkles under the title. On screens 2 and 3 a 42px round back button sits top-left.
- **Rhythm:** the screen pill sits 14px below the title and 18px above the content. Route cards are 14px apart. On the results screen, the lanes, the tile pair, the verdict and the receipts are 12px apart. Tiles and time-range choices are two equal columns; provider chips are three.
- **Share sheet:** `min(440px, 100vw - 24px)`, scrollable within `100dvh - 24px`.

## Elevation & Depth

The system is lifted and glossy, never flat. Depth comes from three things together: a 1px white inset line along the top edge of raised surfaces (the gloss), soft drop shadows with a large negative spread so they pool under the element, and colour tint. Every shadow is tinted plum, violet or orchid; none is grey or black. Chrome stickers carry their own `drop-shadow` filter.

### Shadow Vocabulary
- **Panel lift** (`0 1px 0 rgba(255,255,255,0.9) inset, 0 18px 30px -24px rgba(214,100,190,0.6)`; the lilac card uses `rgba(120,90,210,0.55)`): route cards.
- **Soft lift** (`0 10px 22px -20px rgba(120,80,200,0.6)`): lanes; similar values sit under the verdict card and file chip.
- **Bubble** (`0 0 0 2px rgba(255,255,255,0.35) inset, 0 -4px 8px rgba(150,30,140,0.22) inset, 0 12px 22px -10px rgba(200,70,190,0.7), 0 2px 4px rgba(170,60,170,0.2)`): candy buttons, with a white gloss band (`::before`, top 52%) inside.
- **Sticker** (`filter: drop-shadow(0 8px 10px rgba(150,90,200,0.28))`): chrome hearts on the page.
- **Phone** (`0 1px 0 rgba(255,255,255,0.9) inset, 0 40px 80px -36px rgba(110,70,190,0.45), 0 12px 30px -18px rgba(110,70,190,0.3)`): the phone frame at 560px and wider.
- **Sheet** (`0 30px 70px -20px rgba(80,40,150,0.55)`, backdrop `rgba(70,40,120,0.42)` with a 4px blur): the share dialog.

### Named Rules
**The Tinted Shadow Rule.** Every shadow takes the colour of the world (plum, violet, orchid). Grey and black shadows are out, and so are hard offset shadows.

**The Gloss Line Rule.** Raised panels, pills and the phone carry a 1px white inset line along the top edge. It is what makes a pastel panel read as glossy plastic rather than paper.

## Shapes

Everything is rounded and puffy, and corners grow with the size of the element: 10px on the small model input, 14px on inset notes, 16px on fields and chips, 18px on choices and the prompt box, 22px on lanes and tiles, 24px on route and verdict cards, 26px on the drop zone, 28px on the sheet, 44px on the phone, and full pills for bubbles, the screen heading, the file chip and the small buttons.

Borders are 1.5px in the panel's own line colour (pink line on pink, lilac line on lilac and white). The drop zone's outline is a dashed rounded rectangle drawn as an inline SVG background (#C3AEF3, 11/9 dash) so the dashes follow the 26px corners.

Recurring silhouettes: the heart (number badges with a gradient fill and a white highlight stroke, the tile icon, the chrome stickers), the four-point sparkle, the speech bubble, and the two-layer wave at the foot (#F3E3FB and #F8D9F1).

### Named Rules
**The Nothing Sharp Rule.** No corner is under 10px, and nothing is square.

## Components

### Buttons
Candy bubbles: plump, glossy, pressable.
- **Shape:** full pill (999px), 52px tall with 28px side padding; big bubbles (Analyze, Share result) are 60px tall and `min(100%, 320px)` wide, centred; "Add your chat" is full width.
- **Primary:** the Candy Bubble Pink gradient, white Fredoka label, an icon at 22px, and on the big bubbles a white sparkle at each end.
- **Hover / Active:** rise 1px and saturate 8% on hover; on press sink 1px, scale to 0.98 and flatten the shadow. Focus is a 3px violet outline 4px out, following the pill.
- **Disabled / Busy:** `aria-disabled` desaturates to 55% at 72% opacity; busy shows a progress cursor. After a copy, the bubble turns lilac ("done").
- **Secondary:** the lilac bubble (same shape). **Mini** (40px pill, selection-lilac gradient, Fredoka 600 15px) and **mini ghost** (white, violet-deep text, lilac line) for error actions.
- **Text buttons:** underlined Nunito 700 links ("How?", "Show the whole prompt", "Check another chat").

### Chips
- **Provider chips:** a three-column radio group. Each is a 48px tile with 16px corners in its own tint (mint, sky, peach) with a matching 1.5px border and Fredoka 600 16px name. Selected: the border becomes the stronger ring hue with a 1.5px inset ring and a tinted drop, it lifts 1px, and a check scales in on the left.
- **File chip:** a 60px white pill with a lilac line, a filled file icon, the file name (ellipsised) and a 40px round remove button.

### Choices
- **Style:** 52px boxes with 18px corners, a white wash at 70%, a lilac line, Fredoka 600 17px in Ink 2. A choice can carry a small Nunito sub-line (message count).
- **Selected:** the selection-lilac gradient, white text, no border, a gloss line and a violet drop. Press scales to 0.98.

### Cards / Containers
- **Route cards:** 24px corners, a three-stop vertical gradient of their family (pink for "Copy the prompt", lilac for "Use your own API key"), a 1.5px line and the panel lift. 16px padding. The head is a 50x48 gradient heart badge with a white Fredoka numeral, the headline, and a sparkle.
- **Prompt box:** white at 86%, 18px corners, a pink line; the mono preview is capped at 78px and fades out until "Show the whole prompt" opens it to 340px.
- **Lanes:** a 48px gradient avatar, "You reply in" in Nunito with the time in Fredoka, and a 13px reply bar on the track. 22px corners, white at 72%.
- **Stat tiles:** a pair, 148px minimum, 22px corners, pink ("You start N% of chats", heart icon) and lilac ("hmm" × N, speech-bubble icon), each with two small sparkles.
- **Receipts:** a `details` disclosure, "All the numbers" with a plus that turns 45° when open, then a tabular You/Them table with dashed row rules and a Nunito note on how each number is counted.

### Inputs / Fields
- **Style:** the key field is a 52px row with 16px corners: key icon, the masked input (Nunito 600 16px, 0.04em tracking, violet caret), and a 40px eye toggle. White at 86%, lilac line.
- **Focus:** the border deepens to #A98BEF with a 4px lilac halo (`rgba(150,110,235,0.18)`).
- **Error:** the border turns pink-raspberry and a Danger Raspberry message (Nunito 700 14px) appears under the field. The model id field is the small mono variant (40px, 10px corners).

### Navigation
There is no nav bar. Each screen is named by its pill heading, which takes focus when the screen changes. Screens 2 and 3 show a 42px round back button (white at 80%, lilac line, violet chevron) at the top left. Screens enter with a 0.42s fade, 14px rise and 3px blur clearing, on `cubic-bezier(0.16, 1, 0.3, 1)`.

### Drop Zone
The love-letter outline: 26px corners, the dashed lilac SVG outline, a white wash at 38% that deepens to lilac while a file is dragged over. Inside: an 84px line cloud that lifts 4px on hover, the headline "Drop your chat export here" and a Nunito sub-line. With a file, the cloud shrinks to 56px and the file chip and parse note appear inside.

### Verdict Card
The signature result. A 92px chrome heart with a face bobs on the left; on the right the quote is in Fredoka 700 heading violet, with the credit ("Claude's verdict") under it in Nunito 700 Ink 3. The card is a 135° pink-to-lilac gradient with a white bloom behind the heart, 24px corners and a pink line. States: loading shows a white typing bubble with three bouncing dots (1.1s) and a Nunito status line; error shows the message in Danger Raspberry with Try again and Change key; the quote types in with a blinking caret.

### Reply Race
The two bars race on reveal: each fill scales from 0 on the x axis over its own `--dur` (around 1.2s) on `cubic-bezier(0.3, 0.7, 0.4, 1)`, pink for You and lilac for Them, with a white gloss line along the top of each fill.

### Chrome Stickers and Sparkles
Four raster hearts (`assets/hearts/`): silver, pink, lilac, and a silver heart with a face for the verdict. They are tilted between 6° and 16°, sit at panel corners and beside the title, and bob 5px over 6s (staggered delays). Sparkles are one inline SVG four-point star in sparkle, sparkle-pink or white. The amount and placement of ornament was scored partial in review, so treat the current count as the build's, not a quota.

### Share Card
A 1080x1920 PNG drawn on a canvas in the browser, nothing uploaded: the glossy title flanked by silver and pink hearts, the pill, two lanes, the tile pair, the verdict card with the face heart and credit, two small hearts at the foot, the site address in Nunito 800 violet-deep and a Nunito line with the message count and range ("made-up sample chat" when it is the sample). Without a verdict, the content shifts down 150px. The share sheet shows it with Download PNG (pink bubble) and Share (lilac bubble, only where the Web Share API exists).

### Motion
All motion eases out on `cubic-bezier(0.16, 1, 0.3, 1)`: screen entry, the file chip, the sheet, chip ticks and the receipts plus. Loops are limited to the sticker bob, the typing dots and the caret. Under `prefers-reduced-motion` every animation and transition collapses to its final state and the stickers stop.

## Do's and Don'ts

### Do:
- **Do** keep the Two Inks split: pink for You, route 1 and the main action; lilac for Them, route 2 and selection.
- **Do** tint every shadow plum, violet or orchid, and give raised panels the 1px white inset gloss line.
- **Do** set titles, buttons, numbers, choices and headings in Fredoka, sentences in Nunito, and only paste-able machine text in JetBrains Mono.
- **Do** set every computed number in tabular figures.
- **Do** credit the AI under the verdict quote ("Claude's verdict") in Nunito 700 Ink 3.
- **Do** change `js/card.js` whenever a `:root` colour changes; the share card repeats the palette as literals.
- **Do** give every generated raster a `.json` provenance sidecar (model, reference, prompt, date) and keep its source in `.impeccable/assets-src/`.
- **Do** let `prefers-reduced-motion` stop the stickers, the bar race and the typing dots.

### Don't:
- **Don't** show provider logos; providers are plain names in their mint, sky and peach chips.
- **Don't** put a badge or label above the verdict quote; the credit goes under it.
- **Don't** use grey, black or hard offset shadows.
- **Don't** draw hearts or sparkles with emoji or icon fonts; use the chrome stickers, the inline SVG heart and the four-point SVG sparkle.
- **Don't** set white bubble labels below 18px; white on candy pink holds up only at that size with the plum text shadow.
- **Don't** use square or near-square corners (under 10px).
- **Don't** turn a screen into a dark "AI analyser" dashboard.
