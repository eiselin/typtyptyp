# Backup & Restore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a backup/restore modal to the home screen that lets users download their progress as a JSON file and restore it later, merging profiles by ID.

**Architecture:** `mergeProfiles` is added to the profiles store (the single source of truth for profile mutations). The modal lives entirely in `HomeScreen.svelte` — no new files needed. i18n strings are added to both locale files.

**Tech Stack:** Svelte 4, Vite, Vitest, localStorage, Browser FileReader API, Blob/URL download trick.

---

## File Map

| File | Change |
|---|---|
| `src/stores/profiles.js` | Export `mergeProfiles(importedProfiles)` — merge logic + activeProfile refresh |
| `src/i18n/en.json` | Add `home.backup` + 9 `backup.*` keys |
| `src/i18n/nl.json` | Add `home.backup` + 9 `backup.*` keys |
| `src/screens/HomeScreen.svelte` | Add backup button, modal markup, export/import/confirm logic |
| `tests/stores/profiles.test.js` | Add `mergeProfiles` test suite |

---

## Task 1: Add `mergeProfiles` to profiles store

**Files:**
- Modify: `src/stores/profiles.js`
- Test: `tests/stores/profiles.test.js`

- [ ] **Step 1: Write failing tests for `mergeProfiles`**

Add the following `describe` block at the end of `tests/stores/profiles.test.js`. Note the file already has a `storageMock` and a `beforeEach` pattern to follow — match it exactly.

```js
import { get } from 'svelte/store'
import { profiles, activeProfile, createProfile, selectProfile, deleteProfile, renameProfile, updateProgress, mergeProfiles, PROFILE_COLOURS } from '../../src/stores/profiles.js'
// (update the existing import line — add mergeProfiles)

describe('mergeProfiles', () => {
  beforeEach(() => { storageMock.clear(); profiles.set([]); activeProfile.set(null) })

  it('adds a new profile from the import', () => {
    const imported = [{
      id: 'abc-123', name: 'Imported', colour: '#00ffee',
      createdAt: Date.now(), lessonProgress: { 1: { stars: 2, bestAccuracy: 85, bestWpm: 20 } },
      lessonMistakes: {}, keyStats: {},
    }]
    const { added, updated } = mergeProfiles(imported)
    expect(added).toBe(1)
    expect(updated).toBe(0)
    expect(get(profiles)).toHaveLength(1)
    expect(get(profiles)[0].name).toBe('Imported')
  })

  it('merges lesson progress taking the max', () => {
    createProfile('Fleur')
    const id = get(profiles)[0].id
    updateProgress(id, 1, { stars: 2, bestAccuracy: 85, bestWpm: 20 })

    const imported = [{
      id,
      name: 'Fleur', colour: '#00ffee', createdAt: Date.now(),
      lessonProgress: { 1: { stars: 1, bestAccuracy: 90, bestWpm: 15 } },
      lessonMistakes: {}, keyStats: {},
    }]
    const { added, updated } = mergeProfiles(imported)
    expect(added).toBe(0)
    expect(updated).toBe(1)
    const lp = get(profiles)[0].lessonProgress[1]
    expect(lp.stars).toBe(2)         // local wins
    expect(lp.bestAccuracy).toBe(90) // imported wins
    expect(lp.bestWpm).toBe(20)      // local wins
  })

  it('keeps local name and colour on conflict', () => {
    createProfile('Fleur')
    const id = get(profiles)[0].id
    const localColour = get(profiles)[0].colour

    const imported = [{
      id, name: 'DIFFERENT', colour: '#ff0000',
      createdAt: Date.now(), lessonProgress: {}, lessonMistakes: {}, keyStats: {},
    }]
    mergeProfiles(imported)
    expect(get(profiles)[0].name).toBe('Fleur')
    expect(get(profiles)[0].colour).toBe(localColour)
  })

  it('takes imported arcade highScore when it is higher', () => {
    createProfile('Fleur')
    const id = get(profiles)[0].id

    const imported = [{
      id, name: 'Fleur', colour: '#00ffee', createdAt: Date.now(),
      lessonProgress: {}, lessonMistakes: {}, keyStats: {},
      arcadeProgress: { home: { highScore: 500, achievedAt: 9999 } },
    }]
    mergeProfiles(imported)
    expect(get(profiles)[0].arcadeProgress.home.highScore).toBe(500)
    expect(get(profiles)[0].arcadeProgress.home.achievedAt).toBe(9999)
  })

  it('keeps local arcade highScore when it is higher', () => {
    createProfile('Fleur')
    const id = get(profiles)[0].id
    profiles.update(ps => ps.map(p => p.id === id
      ? { ...p, arcadeProgress: { home: { highScore: 800, achievedAt: 1111 } } }
      : p))

    const imported = [{
      id, name: 'Fleur', colour: '#00ffee', createdAt: Date.now(),
      lessonProgress: {}, lessonMistakes: {}, keyStats: {},
      arcadeProgress: { home: { highScore: 300, achievedAt: 9999 } },
    }]
    mergeProfiles(imported)
    expect(get(profiles)[0].arcadeProgress.home.highScore).toBe(800)
    expect(get(profiles)[0].arcadeProgress.home.achievedAt).toBe(1111)
  })

  it('refreshes activeProfile after merge', () => {
    createProfile('Fleur')
    const id = get(profiles)[0].id
    selectProfile(id)

    const imported = [{
      id, name: 'Fleur', colour: '#00ffee', createdAt: Date.now(),
      lessonProgress: { 1: { stars: 3, bestAccuracy: 97, bestWpm: 30 } },
      lessonMistakes: {}, keyStats: {},
    }]
    mergeProfiles(imported)
    expect(get(activeProfile)?.lessonProgress[1].stars).toBe(3)
  })

  it('skips malformed profiles silently', () => {
    const imported = [
      { id: 'x' }, // missing name and lessonProgress
      null,
      { name: 'No ID', lessonProgress: {} },
    ]
    const { added, updated } = mergeProfiles(imported)
    expect(added).toBe(0)
    expect(updated).toBe(0)
    expect(get(profiles)).toHaveLength(0)
  })

  it('returns { added:0, updated:0 } for non-array input', () => {
    const result = mergeProfiles(null)
    expect(result).toEqual({ added: 0, updated: 0 })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/neiselin/Code/typtyptyp
npm test -- tests/stores/profiles.test.js
```

Expected: failures mentioning `mergeProfiles is not a function`.

- [ ] **Step 3: Implement `mergeProfiles` in `src/stores/profiles.js`**

Add this at the end of the file, after `updateArcadeProgress`:

```js
export function mergeProfiles(importedProfiles) {
  if (!Array.isArray(importedProfiles)) return { added: 0, updated: 0 }

  let added = 0
  let updated = 0

  profiles.update(local => {
    const result = [...local]

    for (const imp of importedProfiles) {
      if (!imp?.id || !imp?.name || !imp?.lessonProgress) continue

      const idx = result.findIndex(p => p.id === imp.id)

      if (idx === -1) {
        result.push(imp)
        added++
      } else {
        const loc = result[idx]

        // Merge lessonProgress — take max per metric
        const mergedProgress = { ...loc.lessonProgress }
        for (const [lessonId, impLp] of Object.entries(imp.lessonProgress ?? {})) {
          const locLp = mergedProgress[lessonId] ?? { stars: 0, bestAccuracy: 0, bestWpm: 0 }
          mergedProgress[lessonId] = {
            stars:        Math.max(locLp.stars        ?? 0, impLp.stars        ?? 0),
            bestAccuracy: Math.max(locLp.bestAccuracy ?? 0, impLp.bestAccuracy ?? 0),
            bestWpm:      Math.max(locLp.bestWpm      ?? 0, impLp.bestWpm      ?? 0),
          }
        }

        // Merge lessonMistakes — sum counts
        const mergedMistakes = { ...(loc.lessonMistakes ?? {}) }
        for (const [lessonId, impMistakes] of Object.entries(imp.lessonMistakes ?? {})) {
          mergedMistakes[lessonId] ??= {}
          for (const [expected, typedMap] of Object.entries(impMistakes)) {
            mergedMistakes[lessonId][expected] ??= {}
            for (const [typed, count] of Object.entries(typedMap)) {
              mergedMistakes[lessonId][expected][typed] =
                (mergedMistakes[lessonId][expected][typed] ?? 0) + count
            }
          }
        }

        // Merge keyStats — concatenate (local first), trim to KEY_WINDOW
        const mergedKeyStats = { ...(loc.keyStats ?? {}) }
        for (const [key, impResults] of Object.entries(imp.keyStats ?? {})) {
          mergedKeyStats[key] = [...(mergedKeyStats[key] ?? []), ...impResults].slice(-KEY_WINDOW)
        }

        // Merge arcadeProgress — keep the higher highScore, achievedAt follows the winner
        const mergedArcade = { ...(loc.arcadeProgress ?? {}) }
        for (const [groupId, impArcade] of Object.entries(imp.arcadeProgress ?? {})) {
          const locArcade = mergedArcade[groupId] ?? { highScore: 0, achievedAt: null }
          if ((impArcade.highScore ?? 0) > (locArcade.highScore ?? 0)) {
            mergedArcade[groupId] = { highScore: impArcade.highScore, achievedAt: impArcade.achievedAt }
          }
        }

        result[idx] = {
          ...loc,
          lessonProgress: mergedProgress,
          lessonMistakes: mergedMistakes,
          keyStats:        mergedKeyStats,
          arcadeProgress:  mergedArcade,
        }
        updated++
      }
    }

    // Refresh activeProfile if its data changed
    const activeId = get(activeProfile)?.id
    if (activeId) {
      const refreshed = result.find(p => p.id === activeId)
      if (refreshed) activeProfile.set(refreshed)
    }

    return result
  })

  return { added, updated }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/stores/profiles.test.js
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/stores/profiles.js tests/stores/profiles.test.js
git commit -m "feat: add mergeProfiles to profiles store"
```

---

## Task 2: Add i18n strings

**Files:**
- Modify: `src/i18n/en.json`
- Modify: `src/i18n/nl.json`

- [ ] **Step 1: Add keys to `src/i18n/en.json`**

Add `"home.backup"` alongside the existing `home.*` keys (after `"home.nameEmpty"`):

```json
"home.nameEmpty": "Enter a name",
"home.backup": "BACKUP",
```

Add the `backup.*` group at the end of the file, before the closing `}`:

```json
"backup.title": "BACKUP & RESTORE",
"backup.saveDesc": "Save your progress to a file on this device.",
"backup.save": "SAVE BACKUP",
"backup.loadDesc": "Restore from a previously saved file. New profiles are added; existing ones are updated with your best results.",
"backup.load": "LOAD BACKUP",
"backup.confirmDesc": "This will update existing profiles. Continue?",
"backup.confirmYes": "CONFIRM",
"backup.confirmNo": "CANCEL",
"backup.success": "Done! {added} added, {updated} updated.",
"backup.error": "Could not read backup file."
```

- [ ] **Step 2: Add keys to `src/i18n/nl.json`**

Add `"home.backup"` after `"home.nameEmpty"`:

```json
"home.nameEmpty": "Voer een naam in",
"home.backup": "BACKUP",
```

Add the `backup.*` group at the end, before the closing `}`:

```json
"backup.title": "BACKUP & HERSTEL",
"backup.saveDesc": "Sla je voortgang op als bestand op dit apparaat.",
"backup.save": "OPSLAAN",
"backup.loadDesc": "Herstel vanuit een eerder opgeslagen bestand. Nieuwe profielen worden toegevoegd; bestaande worden bijgewerkt met de beste resultaten.",
"backup.load": "LADEN",
"backup.confirmDesc": "Dit werkt bestaande profielen bij. Doorgaan?",
"backup.confirmYes": "BEVESTIGEN",
"backup.confirmNo": "ANNULEREN",
"backup.success": "Klaar! {added} toegevoegd, {updated} bijgewerkt.",
"backup.error": "Kon het back-upbestand niet lezen."
```

- [ ] **Step 3: Run i18n tests**

```bash
npm test -- tests/i18n/i18n.test.js
```

Expected: all pass. The i18n test checks key parity between `en.json` and `nl.json` — both locale files must be updated before running it.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/en.json src/i18n/nl.json
git commit -m "feat: add backup/restore i18n strings"
```

---

## Task 3: Add backup modal to HomeScreen

**Files:**
- Modify: `src/screens/HomeScreen.svelte`

This task adds the BACKUP button, the modal markup, and all export/import/confirm logic.

**Context on existing patterns:**
- The file uses Svelte 4 syntax: `on:click`, `$:` reactive statements, `{#if}` blocks.
- `get(t)` is used for imperative translations (inside functions). `$t(...)` is used in template.
- The `$t` helper supports interpolation: `$t('key', { var: value })` — same for `get(t)('key', { var })`.
- The existing exit modal in `ExerciseScreen.svelte` shows the pattern for a scoped modal with arrow nav: `bind:this={modalEl}`, `arrowNav(e, modalEl)`, and a guard on the global handler.
- The `lang` store is already imported from `../i18n/index.js`.
- `mergeProfiles` must be imported from `../stores/profiles.js`.

- [ ] **Step 1: Add imports and state variables**

In the `<script>` block, add `mergeProfiles` to the profiles import:

```js
import { profiles, activeProfile, createProfile, selectProfile, mergeProfiles } from '../stores/profiles.js'
```

Add state variables after the existing `let nameError = ''`:

```js
let showBackup = false
let backupModalEl
let fileInput                // bound to hidden <input type="file">
let pendingImport = null     // Profile[] | null — parsed profiles awaiting confirm
let backupMsg = ''           // success or error message
let backupMsgIsError = false
```

- [ ] **Step 2: Add export function**

Add after `handleCreate`:

```js
function handleExport() {
  const data = {
    version: 1,
    exportedAt: Date.now(),
    lang: get(lang),
    profiles: get(profiles),
  }
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `typtyptyp-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 3: Add import/confirm functions**

```js
function handleImportFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result)
      if (!Array.isArray(data?.profiles)) throw new Error('invalid')
      const valid = data.profiles.filter(p => p?.id && p?.name && p?.lessonProgress)
      if (valid.length === 0) throw new Error('invalid')
      pendingImport = valid
      backupMsg = ''
      backupMsgIsError = false
    } catch {
      backupMsg = get(t)('backup.error')
      backupMsgIsError = true
      pendingImport = null
    }
    e.target.value = ''
  }
  reader.readAsText(file)
}

function handleConfirmImport() {
  const { added, updated } = mergeProfiles(pendingImport)
  pendingImport = null
  backupMsg = get(t)('backup.success', { added, updated })
  backupMsgIsError = false
}

function handleCancelImport() {
  pendingImport = null
  backupMsg = ''
}

function closeBackup() {
  showBackup = false
  pendingImport = null
  backupMsg = ''
  backupMsgIsError = false
}
```

- [ ] **Step 4: Guard global keydown handler and add Escape for modal**

Replace the existing `<svelte:window>` handler:

```svelte
<svelte:window on:keydown={e => {
  if (e.key === 'Escape' && showBackup) { closeBackup(); return }
  if (showBackup) { if (backupModalEl) arrowNav(e, backupModalEl); return }
  if ((e.key === ' ' || e.key === 'Enter') && document.activeElement?.dataset.profileCard !== undefined && $activeProfile) {
    e.preventDefault()
    goTo('lessons')
  } else if (screenEl) {
    arrowNav(e, screenEl)
  }
}} />
```

- [ ] **Step 5: Add BACKUP button to bottom row**

In the template, inside `.bottom-row`, add the backup button between `lang-row` and `about-btn`:

```svelte
<button class="backup-btn" tabindex="-1" on:click={() => showBackup = true}>{$t('home.backup')}</button>
```

The bottom-row div should look like:

```svelte
<div class="bottom-row">
  <div class="lang-row">
    <!-- existing flag buttons unchanged -->
  </div>
  <button class="backup-btn" tabindex="-1" on:click={() => showBackup = true}>{$t('home.backup')}</button>
  <button class="about-btn" tabindex="-1" on:click={() => goTo('about')}>{$t('about.title')}</button>
</div>
```

- [ ] **Step 6: Add modal markup**

Add the modal at the bottom of `.screen.home`, before the closing `</div>`:

```svelte
{#if showBackup}
  <div class="modal-overlay" on:click|self={closeBackup}>
    <div class="modal" bind:this={backupModalEl}>
      <button class="modal-close" on:click={closeBackup}>X</button>
      <div class="modal-title">{$t('backup.title')}</div>

      {#if pendingImport}
        <p class="modal-desc">{$t('backup.confirmDesc')}</p>
        <div class="modal-actions">
          <button class="btn-confirm" on:click={handleConfirmImport}>{$t('backup.confirmYes')}</button>
          <button class="btn-cancel" on:click={handleCancelImport}>{$t('backup.confirmNo')}</button>
        </div>
      {:else}
        <p class="modal-desc">{$t('backup.saveDesc')}</p>
        <button class="btn-save" on:click={handleExport}>{$t('backup.save')}</button>

        <p class="modal-desc">{$t('backup.loadDesc')}</p>
        <button class="btn-load" on:click={() => fileInput.click()}>{$t('backup.load')}</button>
        <input bind:this={fileInput} type="file" accept=".json" style="display:none"
          on:change={handleImportFile} />
      {/if}

      {#if backupMsg}
        <p class="modal-msg" class:modal-msg--error={backupMsgIsError}>{backupMsg}</p>
      {/if}
    </div>
  </div>
{/if}
```

`fileInput` was already declared in Step 1's variable block — no additional changes needed here.

- [ ] **Step 7: Add CSS**

Add to the `<style>` block:

```css
.backup-btn { background:none; border:1px solid var(--accent-cyan); border-radius:4px; cursor:pointer; font-family:inherit; font-size:13px; color:var(--accent-cyan); letter-spacing:1px; padding:5px 10px; text-shadow:0 0 8px color-mix(in srgb,var(--accent-cyan) 60%,transparent); box-shadow:0 0 6px color-mix(in srgb,var(--accent-cyan) 25%,transparent); }
.backup-btn:hover { box-shadow:0 0 14px color-mix(in srgb,var(--accent-cyan) 55%,transparent); }

.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:50; }
.modal { position:relative; background:var(--bg-raised); border:2px solid var(--accent-cyan); border-radius:8px; padding:32px 28px 28px; max-width:480px; width:calc(100% - 48px); box-shadow:0 0 32px color-mix(in srgb,var(--accent-cyan) 25%,transparent); }
.modal-close { position:absolute; top:12px; right:14px; background:none; border:none; cursor:pointer; font-size:18px; color:var(--text-muted); font-family:inherit; }
.modal-close:hover { color:var(--text); }
.modal-title { font-size:20px; font-weight:bold; letter-spacing:3px; color:var(--accent-cyan); text-shadow:0 0 10px color-mix(in srgb,var(--accent-cyan) 50%,transparent); margin-bottom:20px; }
.modal-desc { font-size:15px; color:var(--text-muted); line-height:1.6; margin:0 0 12px; }
.modal-actions { display:flex; gap:10px; margin-bottom:8px; }
.btn-save, .btn-load, .btn-confirm { background:var(--accent-cyan); color:var(--bg); border:none; border-radius:4px; padding:11px 18px; font-family:inherit; font-size:15px; font-weight:bold; letter-spacing:1px; cursor:pointer; margin-bottom:20px; display:block; }
.btn-cancel { background:none; border:2px solid var(--text-muted); color:var(--text-muted); border-radius:4px; padding:11px 18px; font-family:inherit; font-size:15px; font-weight:bold; letter-spacing:1px; cursor:pointer; }
.modal-msg { font-size:14px; margin:12px 0 0; letter-spacing:0.5px; }
.modal-msg--error { color:#ff4455; }
.modal-msg:not(.modal-msg--error) { color:var(--accent-green); }
```

- [ ] **Step 8: Verify in browser**

Start dev server:
```bash
npm run dev
```

Check:
- BACKUP button appears in the bottom row between the flags and ABOUT
- Clicking it opens the modal
- Escape closes the modal
- Clicking outside the modal (overlay) closes it
- Arrow keys navigate between SAVE BACKUP and LOAD BACKUP buttons
- SAVE BACKUP downloads a `.json` file with today's date in the filename
- LOAD BACKUP opens a file picker
- Loading a valid backup with a new profile → confirm prompt appears → CONFIRM adds the profile
- Loading a valid backup with an existing profile → confirm → progress is merged
- Loading a non-JSON file → error message appears
- CANCEL on confirmation dismisses without applying

- [ ] **Step 9: Commit**

```bash
git add src/screens/HomeScreen.svelte
git commit -m "feat: add backup/restore modal to home screen"
```
