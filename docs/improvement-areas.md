# typtyptyp — Areas for Improvement & Feature Expansion

## Curriculum Gaps

- **No uppercase / Shift key** — the app teaches all 26 lowercase letters but never introduces holding Shift. Real typing requires it constantly.
- **No numbers row** — digits and the symbols on them are completely absent.
- **No common punctuation** — period, comma, apostrophe, and enter/return are essential for real-world typing but untaught.
- **Semicolon is the only non-alpha key** — it appears in the home row lessons but nothing builds on it.

## Learning Experience

- **Guide is static** — it shows diagrams but offers no interactive practice. A guided "place your fingers and press F" warm-up before the first lesson would be much more effective for beginners.
- **No wrong-key visual feedback in exercises** — when a child presses the wrong key, the character tile just stops advancing. A flash or shake on the wrong key would make the error feel more concrete.
- **Star thresholds are invisible** — kids don't know that 95% accuracy = 3 stars until they fail to get them. Showing the target upfront sets clear expectations.
- **No WPM goal** — accuracy is coached, speed is not. A gentle target ("you typed 18 WPM last time, aim for 20") would give returning players something to chase.

## Progression & Motivation

- **No achievements or badges** — beyond stars per lesson, there's nothing to collect. Kids respond strongly to unlocks, streaks, and milestone badges.
- **No daily streak tracking** — a simple "you've practiced X days in a row" would build the habit loop.
- **Coach tips are reactive, not proactive** — the coach only surfaces one weak key. It never celebrates improvement or suggests what to work on next.
- **Lesson unlock pace may frustrate** — only the next lesson unlocks after completion. A child who gets 1 star and wants to try the next anyway is blocked.

## Game / Arcade

- **Arcade game only accessible per group** — you can't play the game until you've earned ≥1 star on all lessons in a group. Kids may hit this wall before they're ready.
- **One arcade mode** — the frogger game is fun but there's only one. A second mode would extend replayability.
- **Leaderboard is device-local** — siblings on the same device share a leaderboard, but there's no cross-device competition.

## Polish & UX

- **No sound** — the arcade game in particular would benefit from audio feedback (hop, splash, combo chime). Lessons could use a subtle tick/buzz for correct/wrong keys.
- **Profile limit unclear** — there's no cap shown, but localStorage has limits. Creating many profiles could eventually silently fail.
- **No way to export or back up progress** — a child who clears their browser or switches devices loses everything with no warning.
- **Home screen has no "continue" shortcut** — returning users must open → see home → click profile → click start. A one-tap "continue as [name]" would be faster.

## Discoverability / Meta

- **No SEO / social meta** — the app has no `<title>`, Open Graph tags, or description. It won't be findable or shareable.
- **No PWA support** — it could run as an installable app on tablets. A manifest + service worker would enable offline use and home screen install.
