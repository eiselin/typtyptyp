# CLAUDE.md

Instructions for Claude Code when working in this repository.

---

## Core Values

### Kids-proof

The app is designed for kids. This applies to both usability and language:

- **Usability:** Interactions must be simple, forgiving, and intuitive. No confusing flows, no destructive actions without clear confirmation, no hidden or tricky UI patterns.
- **Language:** All copy, labels, error messages, and UI text must be appropriate for children. No adult themes, no complex jargon, no scary or negative language.

### Retro Arcade Neon Pixel Art Theme

The app has a core visual identity: retro arcade meets neon pixel art. Stay true to this in all UI work:

- Colors, fonts, icons, and animations should feel like a glowing arcade cabinet
- Pixel art aesthetics — sharp edges, limited palettes, chunky elements
- Neon glow effects, bright saturated colors on dark backgrounds
- Arcade-style language where appropriate (e.g. score, level, player, game over)
- Never introduce design elements that break this theme (e.g. flat minimalist, material, or corporate styles)
- **No emojis** — they break the pixel art aesthetic. Use pixel art SVGs instead.

---

## Commit and push workflow

**Never commit or push automatically after completing a change.**

Follow this sequence for every change request:

1. **Implement** the change
2. **Ask the user to test and verify** — wait for feedback
3. **Apply any fixes** needed based on feedback, then ask to test again if substantial
4. **Ask for permission to commit** — only commit after explicit approval
5. **Ask for permission to push** — only push after explicit approval, as a separate question

The commit and push steps are always separate asks, never bundled together.
