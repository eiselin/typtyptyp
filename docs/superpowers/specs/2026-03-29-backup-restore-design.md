# Backup & Restore — Design Spec

## Overview

Users can export all profile data to a local `.json` file and restore it later. Restore merges imported profiles into the current app state by profile ID, taking the best progress from both sides.

---

## Trigger

A "BACKUP" button is added to the bottom row of `HomeScreen`, alongside the existing language flags and About button. It uses a cyan neon style to visually distinguish it from the yellow About button.

---

## Modal

Rendered inline in `HomeScreen.svelte`. Shown when `showBackup` is true. Dismissed by clicking close, pressing Escape, or clicking the overlay.

### Layout

```
┌─────────────────────────────────┐
│  BACKUP & RESTORE           [X] │
│                                 │
│  Save your progress to a file   │
│  on this device.                │
│  [ SAVE BACKUP ]                │
│                                 │
│  Restore from a previously      │
│  saved file. New profiles are   │
│  added; existing profiles are   │
│  updated with the best results. │
│  [ LOAD BACKUP ]                │
│                                 │
│  [error message if any]         │
└─────────────────────────────────┘
```

### Keyboard navigation

When the modal is open (`showBackup === true`), the global `keydown` handler in `HomeScreen` is guarded so it does not run `arrowNav` against the profile list behind the modal. The modal uses its own scoped `arrowNav(e, modalEl)` call. Escape closes the modal at the window level regardless.

---

## Export

Triggered by "SAVE BACKUP". Collects:

```json
{
  "version": 1,
  "exportedAt": 1234567890,
  "lang": "nl",
  "profiles": [ ...full profile objects... ]
}
```

Serialised to JSON and downloaded as `typtyptyp-backup-YYYY-MM-DD.json` via a temporary `<a download>` element.

No async work, no server involved.

---

## Import

Triggered by "LOAD BACKUP". Opens a hidden `<input type="file" accept=".json">`.

### Validation

1. File must be valid JSON → else show error, abort.
2. Parsed object must have `profiles` array → else show error, abort.
3. Each profile must have at least `id`, `name`, `lessonProgress` → malformed profiles are skipped silently.

### Merge logic (per imported profile)

**Case A — profile ID not in app:** add the imported profile as-is.

**Case B — profile ID already exists:** merge field by field:

| Field | Rule |
|---|---|
| `name`, `colour`, `createdAt` | Keep local (don't overwrite identity) |
| `lessonProgress[lessonId].stars` | `Math.max(local, imported)` |
| `lessonProgress[lessonId].bestAccuracy` | `Math.max(local, imported)` |
| `lessonProgress[lessonId].bestWpm` | `Math.max(local, imported)` |
| `lessonMistakes[lessonId][key][typed]` | Sum counts |
| `keyStats[key]` | Concatenate arrays (local first), trim to last 50. Note: the resulting sequence is not chronological — this is acceptable since keyStats are diagnostic data, not progress data. |
| `arcadeProgress[groupId].highScore` | `Math.max(local, imported)`; `achievedAt` follows whichever side wins the highScore comparison |

After merge, the `profiles` store is updated and saved to localStorage. Active profile is refreshed if its ID was affected.

### Confirmation step

Before applying the merge, the modal shows a confirmation prompt: "This will update existing profiles. Continue?" with CONFIRM and CANCEL buttons. Only on CONFIRM is the merge applied. This protects against accidental taps.

### Result feedback

Success: inline message in modal — "Done! {added} added, {updated} updated." — rendered as `$t('backup.success', { added, updated })`.
Error: inline message — "Could not read backup file." — rendered as `$t('backup.error')`.

---

## i18n Keys

Both `en.json` and `nl.json` receive:

`home.backup` is added alongside existing `home.*` keys. All remaining keys are added in a `backup.*` group at the end of the file.

| Key | EN | NL |
|---|---|---|
| `home.backup` | `BACKUP` | `BACKUP` |
| `backup.title` | `BACKUP & RESTORE` | `BACKUP & HERSTEL` |
| `backup.saveDesc` | `Save your progress to a file on this device.` | `Sla je voortgang op als bestand op dit apparaat.` |
| `backup.save` | `SAVE BACKUP` | `OPSLAAN` |
| `backup.loadDesc` | `Restore from a previously saved file. New profiles are added; existing ones are updated with your best results.` | `Herstel vanuit een eerder opgeslagen bestand. Nieuwe profielen worden toegevoegd; bestaande worden bijgewerkt met de beste resultaten.` |
| `backup.load` | `LOAD BACKUP` | `LADEN` |
| `backup.confirmDesc` | `This will update existing profiles. Continue?` | `Dit werkt bestaande profielen bij. Doorgaan?` |
| `backup.confirmYes` | `CONFIRM` | `BEVESTIGEN` |
| `backup.confirmNo` | `CANCEL` | `ANNULEREN` |
| `backup.success` | `Done! {added} added, {updated} updated.` | `Klaar! {added} toegevoegd, {updated} bijgewerkt.` |
| `backup.error` | `Could not read backup file.` | `Kon het back-upbestand niet lezen.` |

---

## Files Changed

| File | Change |
|---|---|
| `src/screens/HomeScreen.svelte` | Add backup button, modal markup, export/import logic, i18n wiring |
| `src/stores/profiles.js` | Export `mergeProfiles(importedProfiles)` function |
| `src/i18n/en.json` | Add 1 `home.backup` key + 9 `backup.*` keys (10 total) |
| `src/i18n/nl.json` | Add 1 `home.backup` key + 9 `backup.*` keys (10 total) |

No new files or screens needed.

---

## Out of Scope

- Cloud sync
- Auto-backup / scheduled export
- Partial restore (select which profiles to import)
- Backup encryption
