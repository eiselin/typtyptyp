# typtyptyp — Critical Review

## Summary

The app has a solid foundation: structured lesson progression, per-key mistake tracking, real-time finger hints, and a genuinely fun arcade mode. The core educational loop works. These notes focus on where the experience breaks down or falls short of its potential.

---

## Touch Typing Education

### What works
- Home row → top row → bottom row sequencing is pedagogically correct.
- Nonsense word generation from learned keys means the learner is never asked to type something they haven't been taught yet.
- Finger colour-coding is consistent across the keyboard, hand hints, and letter tiles — this coherence reinforces the mental model.
- Punctuation is taught in context (sentences) rather than drills, which is more natural.

### Problems

**Accuracy-only star system undersells WPM**
Three stars require ≥95% accuracy, but there is no WPM target. A child who types 5 WPM at 96% accuracy earns three stars and is told they are done. Speed is the main practical skill after accuracy is established, and the app has no mechanism to push for it.

**No penalty for mashing keys**
Wrong key presses increment the error counter but the cursor does not move. A learner can hold down any key while waiting to see what letter comes next. This makes it possible to complete exercises without genuine touch typing. A brief lockout (e.g. 300ms before the next correct press is accepted) would discourage this.

**Nonsense words are hard to type and poor for building fluency**
When the learned-key vocabulary is too small for real words, patterns like `aabb`, `abab`, `bbaa` are used. These feel arbitrary and offer no linguistic rhythm. Repetitive patterns also mean the same bigrams appear over and over, which trains narrow muscle memory rather than flexible typing. Even at lesson 1 (F and J), two or three hand-crafted practice words like `jfjf` or `jff` would be more intentional.

**The intro card for new keys appears every session**
The "new keys" intro is shown every time the lesson is opened, not just the first time. A learner replaying a lesson to improve their score sees the same card they already read. It should be shown only on the first play.

**No explicit home position reminder during exercises**
The guide explains that fingers return to home row after each keystroke. The exercise never reinforces this — there is no visual or textual cue to return to home position. For beginners this is one of the most commonly broken habits.

**Lessons 14–18 teach punctuation but not Enter or Backspace**
Enter and Backspace are among the most-used keys in real typing. They are absent entirely.

---

## Usability

### What works
- Arrow-key navigation on the lesson screen is a nice touch for a keyboard-focused app.
- The exit confirmation modal in exercises prevents accidental data loss.
- Backup/restore is well thought out.

### Problems

**No way to exit the intro card with Enter**
The intro screen has a "BEGIN" button, but pressing Enter does not trigger it. A child who has learned to use the keyboard expects Enter to confirm actions. Having to reach for the mouse or trackpad on an app about keyboard use is jarring.

**The recommended lesson ("NEXT") is not explained**
The yellow-glowing NEXT label is never explained. First-time users do not know what it means or why one lesson is highlighted over others. A single tooltip or label ("Start here") would help.

**Lesson unlock logic is invisible**
There is no indication that only the next lesson unlocks after completing one. A child who earns one star and tries to skip ahead may click locked lessons without understanding why they cannot proceed. The lock state should be visible on the tile (a padlock icon) and tapping it should explain the condition.

**No in-exercise pause**
The arcade game can be paused with Escape. The exercise cannot. If a child is interrupted mid-lesson (teacher, sibling, phone), they either abandon progress or leave the screen running.

**Escape in exercises opens a confirmation modal, not a pause**
This is an asymmetry with the arcade game. Escape should pause, not immediately threaten to discard progress.

**The coach is buried in the lesson list**
The Coach tile is at the bottom of the lesson screen, after all the lesson tiles. Many users will never find it. This is the most instructive part of the app and should be more prominent — possibly surfaced on the home screen or after completing a lesson.

**Profile creation has no name length limit visible**
Long names overflow the profile card tiles visually. There is a check for empty names and duplicates but no constraint on length communicated to the user.

**The "continue as" shortcut on the home screen disappears after profile selection**
Once a profile is selected, the active profile is highlighted and a START button appears — but if the user accidentally taps another profile, the state is confusing. It is not obvious how to re-select the original profile without refreshing.

---

## Consistency

### Problems

**Star display inconsistency**
Lesson tiles show stars using `●` and `○` characters. The results screen uses an animated three-star graphic. These feel disconnected. The same visual language should be used in both places.

**"NEXT" label vs. lesson number**
Lesson tiles show key labels (e.g. `F J`) as their identifier, not a lesson number. The recommended tile shows `NEXT` in place of the label. A learner trying to track their place in the curriculum cannot map `NEXT` to a position in the sequence.

**Language switch affects UI copy but not the lesson content in real-time**
Switching language on the home screen changes the UI language immediately, but any open lesson continues in the prior language. This is probably not a practical issue but is inconsistent.

**Keyboard layout switch has no confirmation or explanation**
Switching from US to NL adds an extra key on the keyboard (the ISO key between left Shift and Z). There is no indication that this changes anything, and no explanation of what the difference means for learners. A child who accidentally switches layouts will be confused by the mismatch between the physical and on-screen keyboards.

**WPM label differs between exercise and results screens**
During exercise it shows `WORDS/MIN`; on the results screen it shows `WPM`. These should be the same label.

**Coach tips use key names inconsistently**
Some tips reference the key by its character (e.g. `f`), others by its label (e.g. `F`). The shift-key tip format is noticeably more complex than the standard tip and may be hard for a child to parse.

---

## User Experience

### What works
- The arcade game is a genuine reward. It is fun on its own terms and directly relevant to the skills being taught.
- The Chick character creates a consistent mascot the child can relate to.
- The retro neon aesthetic is distinctive and well executed.
- Confetti on the results screen is satisfying.

### Problems

**No positive reinforcement during exercise**
The only mid-exercise feedback is the error counter going up. There is no positive signal for streaks, speed, or long correct runs. Even a subtle colour change or animation on a streak of correct keystrokes would be motivating.

**The guide is static and disconnected from lessons**
The guide explains home row, finger zones, and technique — but it is a separate screen that the learner must seek out. It is not linked from the first lesson, not surfaced for new users, and not referenced when a child is struggling. A first-time user who skips the guide will have no idea how to position their hands.

**Accuracy percentage shown during exercise may increase anxiety**
Showing a live accuracy number that decreases with each mistake can be discouraging for young learners. Many typing apps hide the accuracy during the exercise and only reveal it at the end. Alternatively, show a positive frame (e.g. number of correct keystrokes) rather than a falling percentage.

**Three stars on first attempt is very achievable early on**
Lessons 1–3 are short sequences of two keys. A child can three-star them in one attempt, which makes the star system feel trivial early on. Stars should scale with difficulty, or WPM should be factored in at higher lessons.

**No indication that the arcade game requires completing a full group**
The arcade tile shows `-- GAME` when locked, but there is no tooltip or explanation. A child who has completed three out of five lessons in a group and cannot unlock the game will not know how many more they need.

**Results screen offers no lesson-specific feedback**
The results screen shows accuracy and WPM but nothing specific to the lesson — no "you struggled with Q and P" or "your WPM improved by 4 since last time". The coach screen fills some of this gap, but it is not surfaced here.

**No sense of overall progress on the home screen**
The home screen shows the profile name and colour but no progress summary (lessons completed, current streak, stars earned). A child returning after a break has no idea how far along they are until they navigate to the lesson screen.

---

## Priority

| Area | Issue | Impact |
|------|-------|--------|
| Education | No WPM goal; speed is never coached | High |
| Usability | Enter key does not confirm BEGIN | High |
| Education | Intro card repeats on every replay | Medium |
| Usability | No pause in exercise mode | Medium |
| UX | Coach is buried; not surfaced after results | Medium |
| Education | No penalty for key mashing | Medium |
| Consistency | Star display differs between tiles and results | Low |
| UX | No mid-exercise positive reinforcement | Low |
| Usability | Lesson lock state not visible | Low |
