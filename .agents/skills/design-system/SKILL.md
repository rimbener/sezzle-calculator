---
name: sezzle-calculator-design
description: Use this skill to generate well-branded interfaces and assets for Sezzle Calculator, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for protoyping.
user-invocable: true
---

Read BRAND.md — it is the whole system. There are no component files to copy; write the markup yourself and follow the rules.

Link `styles.css` and style everything with the custom properties it defines (`var(--key-operator)`, `var(--shadow-key-lg)`, `var(--type-key)`). Never write a raw hex value. BRAND.md lists the literals only so you can recognise them — the tokens are the interface.

```html
<link rel="stylesheet" href="styles.css">
```

For a standalone artifact that must work as one file, inline the contents of `tokens/` into a `<style>` block rather than hardcoding colours.

If the user invokes this skill without other guidance, ask what they want to build, ask a few questions, then act as an expert designer producing either a standalone HTML artifact or production code.
