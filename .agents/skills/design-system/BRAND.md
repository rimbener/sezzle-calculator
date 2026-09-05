# Sezzle Calculator — brand guide

**Use the tokens, not these literals.** `styles.css` pulls in `tokens/` — seven files of custom properties covering colour, type, spacing, elevation and motion. Every value below has a token; the hex and pixel numbers are printed here so you can recognise the system, not so you can paste them.

A **1970s desk calculator**, rendered honestly. Warm plastic shell, hard black borders, offset shadows with no blur, chunky keys that physically shift when pressed, and a scanlined phosphor-green LCD readout. Simple, mechanical, unembarrassed about being a machine.

No logo exists. Set the product name in type: lowercase **sezzle** in Space Mono Bold with **calc** in mustard or sunset.

---

## Colour

```
--paper-0    #FBF6EA  cards, number keys
--paper-1    #F1E7D2  page background
--paper-2    #E3D5B8  shell, function keys
--paper-3    #CFBE9C  soft borders, disabled fill

--ink-0      #1C1915  every border, headings
--ink-1      #3B352C  body text
--ink-2      #6B6152  muted text
--ink-3      #9A8E7A  lamp off

--lcd-0      #242B20  readout glass    ← only inside the readout
--lcd-ink    #C3E86B  phosphor digits
--lcd-ink-dim #5E7A34 labels on glass

--mustard    #F0A93B  operator keys     --mustard-deep #C4801E
--teal       #2A8C7C  equals, success   --teal-deep    #1E6558
--sunset     #E4572E  clear key, danger --sunset-deep  #B23C1C
--sky        #4A7FA5  info, focus ring
```

Prefer the semantic aliases in components: `--surface-page`, `--surface-card`, `--surface-readout`, `--text-body`, `--text-muted`, `--text-readout`, `--border-strong`, `--key-number`, `--key-operator`, `--key-function`, `--key-equals`, `--key-clear`, `--state-danger`, `--state-warning`, `--state-success`, `--state-disabled`, `--focus-ring`.

Two background colours per screen maximum: paper page, shell panel. Everything else is a bordered object sitting on top. Never a gradient.

## Type

- **Space Mono** — wordmark, headings, key caps, all uppercase labels. The mechanical letterforms are the retro signal.
- **Archivo** — prose, hints, helper text.
- **Share Tech Mono** — readout digits only. Using it elsewhere breaks the illusion the LCD is a physical part.

All three from Google Fonts.

Families: `--font-display` (Space Mono), `--font-body` (Archivo), `--font-lcd` (Share Tech Mono), `--font-mono` (Space Mono).

Sizes `--text-2xs` → `--text-4xl`: 11 · 12 · 14 · 16 · 19 · 23 · 30 · 40 · 56, plus `--text-readout-sm|md|lg` at 28 · 44 · 60. Headings track `--tracking-tight` (-0.01em); uppercase labels `--tracking-widest` (+0.16em) at 11–12px.

Composite roles set font in one declaration: `--type-h1`, `--type-h2`, `--type-body`, `--type-small`, `--type-label`, `--type-key`, `--type-readout`. Use `font: var(--type-key)` rather than assembling family, weight and size by hand.

## Construction

- **Every object has a `var(--border-2) solid var(--border-strong)` edge.** `--border-3` on the outer shell. Nothing is borderless.
- **Shadows are hard offsets, zero blur**, down-and-right: `--shadow-key` (2px, buttons and chips), `--shadow-key-lg` (4px, keys), `--shadow-panel` (6px, cards), `--shadow-shell` (10px). Soft drop shadows are forbidden — they read as modern SaaS. The only insets are `--shadow-inset-lcd` and `--shadow-inset-well`.
- Radii stay small: `--radius-sm` 3px chips, `--radius-md` 6px keys and cards, `--radius-lg` 10px panels, `--radius-xl` 16px shell. `--radius-pill` only for indicator lamps.
- Spacing `--space-1` → `--space-9`: 2 / 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64. Keypad gutters `--space-3`, keys `--key-size` (60px), shell padding `--space-5`.
- `--shell-max` 420px for the calculator column, `--page-max` 960px for page content, centred. `--tap-min` 44px is the floor for any target. Nothing is fixed-position — no sticky headers, no floating buttons.
- Flat colour only. No photography, illustration, gradients, or noise. The single texture is the LCD's 1px-on-2px-off scanline. No transparency, no blur, no glassmorphism.

## States

- **Hover** darkens the fill one step. No lift, no scale, no shadow growth.
- **Press** is the signature: the element translates `--press-offset` (2px, buttons) or 4px (keys) down-and-right and its shadow vanishes — it lands flush. `--dur-fast`, no bounce, no ripple.
- **Latched** operator keys stay in the pressed position while selected.
- **Busy** blinks — 1s hard `steps(1,end)`, never a pulsing fade or a spinner.
- **Focus** is a 3px sky-blue outline at 2px offset. Never a glow.
- **Disabled** fills `--state-disabled`, drops the shadow, dims text to `--ink-2`.
- Durations `--dur-instant|fast|med|slow` = 60 / 120 / 200 / 360ms. Default easing `--ease-out`; mechanical controls snap with `--ease-mech` (`steps(2,end)`). The `lcd-blink` keyframe and `--blink` (1s) ship in `tokens/motion.css`.

## Iconography

**There is no icon set, deliberately.** The interface communicates with three things:

1. **Mathematical glyphs as type** in Space Mono: `+ − × ÷ = √ % ± xʸ`. Unicode characters, not icons — never substitute an SVG.
2. **Colour-coded key faces** — mustard operator, teal equals, sunset clear. Role is carried by fill, so no icon is needed.
3. **Indicator lamps** — a 10px bordered circle that blinks or glows, standing in for every status icon.

No emoji, ever. No decorative illustration. If a surface genuinely needs UI icons, use Lucide at 2px stroke and say you did.

## Voice

A plain-spoken machine. Short declarative sentences. No marketing, no exclamation, no jokes.

- Address the user as *you*. Never *we* or *I*.
- **Errors are a sentence plus evidence:** "Cannot divide by zero" · `DIVISION_BY_ZERO`. Never a raw exception or a bare status code.
- Sentence case for prose. **UPPERCASE only for labels, badges and lamps** — `READY`, `WORKING`, `ERROR`, `GATEWAY :3000`. Never a full uppercase sentence.
- Contractions are good. Em dash for the trailing instruction: "— try again".
- Numbers stay literal: `15 % 200`, never "fifteen percent of two hundred". Percentage always means *x% of y*.
- Say "the calculator" to users, "gateway" and "calc-service" to developers. Never "server" or "backend" in the UI.
- Error copy: one sentence, twelve words or fewer. Buttons: 1–2 words, uppercase.

## Token files

```
styles.css        @import list only — link this one file
tokens/
  fonts.css       Google Fonts import + family tokens
  colors.css      paper, ink, LCD, accents + semantic aliases
  typography.css  scale, leading, tracking, weights, composite roles
  spacing.css     space scale, radii, border widths, key + layout sizes
  elevation.css   hard offset shadows, insets, LCD glow, press offset
  motion.css      durations, easings, blink keyframes
  base.css        element resets, link colours, focus ring
```

`base.css` already styles `body`, `h1`–`h3`, `p`, `a`, `a:hover` and `:focus-visible` — don't redeclare them.

## Elements

**Key** — 60px minimum, 2px border, 4px shadow, Space Mono. Number keys paper, operators mustard, functions shell-grey, equals teal, clear sunset. Optional 11px caption under the glyph.

**Display** — dark glass, right-aligned phosphor digits, scanline overlay, inset shadow. An uppercase status word top-left, the pending expression top-right. Announce it with `aria-live="polite"`.

**Card** — paper fill, 2px border, 6px shadow, 10px radius. Optional uppercase eyebrow above the title, dashed top border on the footer.

**Callout** — 10px colour bar down the left inside the border, uppercase title, machine code beside it, one-sentence body. Danger gets `role="alert"`.

**Input** — uppercase label above, inset well, mono text, optional bordered suffix slot for units.

**Lamp** — 10px bordered circle with a coloured glow: teal up, mustard busy and blinking, sunset down, grey idle. Uppercase label beside it.

## Accessibility

WCAG 2.2 AA is a hard requirement. Ink on paper is ~14:1, phosphor on glass ~9:1; sunset and teal keys carry paper-coloured text. Label every control, keep targets at 44px minimum, and drop the blink to a static dim state under `prefers-reduced-motion`.
