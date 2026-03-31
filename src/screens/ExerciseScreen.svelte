<svelte:options runes={true} />

<script>
  import { t } from '../i18n/index.js'
  import { LESSONS, getLearnedKeys, getFingerForKey, getShiftSide, needsShift, FINGER_VARS } from '../lessons/index.js'
  import { buildExerciseSequence, buildSentenceSequence, WORD_LISTS, SENTENCE_LISTS } from '../words/index.js'
  import { lang } from '../i18n/index.js'
  import { activeProfile, updateProgress } from '../stores/profiles.js'
  import { selectedLesson, goTo } from '../stores/screen.js'
  import { setResults } from '../stores/results.js'
  import PixelChick from '../components/PixelChick.svelte'
  import Keyboard from '../components/Keyboard.svelte'
  import HandHints from '../components/HandHints.svelte'
  import LetterTiles from '../components/LetterTiles.svelte'
  import { onMount, onDestroy, tick } from 'svelte'
  import { wipe, WIPE_MS } from '../transitions.js'
  import { arrowNav } from '../utils/keyboard.js'


  let chick = $state()
  let modalEl = $state()
  let cancelBtn = $state()
  let cursor = $state(0)
  let errors = $state(0)
  let mistakeLog = $state([])
  let keyLog = $state({})
  let startTime = $state(null)
  let sequence  = $state('')
  let introDismissedForLesson = $state(null)
  let showExitModal = $state(false)
  $effect(() => { if (showExitModal) tick().then(() => cancelBtn?.focus()) })

  const lesson      = $derived(LESSONS.find(l => l.id === $selectedLesson))
  const learnedKeys = $derived(lesson ? getLearnedKeys(lesson.id) : [])

  const newKeys     = $derived.by(() => {
    if (!lesson) return []
    const prevKeys = new Set(getLearnedKeys(lesson.id - 1))
    return lesson.keys.filter(k => !prevKeys.has(k))
  })
  const showIntro = $derived(!!(lesson && newKeys.length > 0 && introDismissedForLesson !== lesson.id))

  $effect(() => {
    if (lesson) {
      if (lesson.group === 'zinnen') {
        const sentenceList = SENTENCE_LISTS[$lang] ?? SENTENCE_LISTS.nl
        const stories = sentenceList[String(lesson.id)] ?? []
        const idx = Math.floor(Math.random() * stories.length)
        sequence = buildSentenceSequence(stories[idx] ?? [], 200)
      } else {
        sequence = buildExerciseSequence(learnedKeys, newKeys, 200, WORD_LISTS[$lang] ?? WORD_LISTS.nl)
      }
      cursor = 0; errors = 0; mistakeLog = []; keyLog = {}; startTime = null; scaleMeasured = false
    }
  })

  const activeKey = $derived(cursor < sequence.length ? sequence[cursor] : null)
  const progress  = $derived(sequence.length ? cursor / sequence.length : 0)
  const accuracy  = $derived(cursor > 0 ? Math.round(((cursor - errors) / cursor) * 100) : 100)

  function handleKeydown(e) {
    if (showExitModal) {
      if (e.key === 'Escape') showExitModal = false
      else if (modalEl) arrowNav(e, modalEl)
      return
    }
    if (showIntro) {
      if (e.key === 'Escape') { goTo('lessons'); return }
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); introDismissedForLesson = lesson.id }
      return
    }
    if (!sequence || cursor >= sequence.length) return
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (e.key === 'Escape') { confirmExit(); return }
    if (e.key.length !== 1) return   // ignore modifier-only events (Shift, CapsLock…)

    if (!startTime) startTime = Date.now()

    if (e.key === sequence[cursor]) {
      const k = sequence[cursor]
      if (!keyLog[k]) keyLog[k] = []
      keyLog[k].push(true)
      cursor++
      chick?.trigger('happy')
      if (cursor >= sequence.length) finish()
    } else {
      const k = sequence[cursor]
      if (!keyLog[k]) keyLog[k] = []
      keyLog[k].push(false)
      errors++
      mistakeLog = [...mistakeLog, { expected: k, typed: e.key }]
      chick?.trigger('error')
    }
  }

  function confirmExit() {
    if (cursor === 0) goTo('lessons')
    else showExitModal = true
  }

  function finish() {
    const total = sequence.replace(/ /g, '').length
    const acc   = Math.round(((total - errors) / total) * 100)
    const mins  = Math.max((Date.now() - startTime) / 60000, 1/60)
    const wpm   = Math.round((sequence.length / 5) / mins)
    const stars = acc >= 95 ? 3 : acc >= 80 ? 2 : 1
    if ($activeProfile) {
      const mistakes = {}
      for (const { expected, typed } of mistakeLog) {
        mistakes[expected] ??= {}
        mistakes[expected][typed] = (mistakes[expected][typed] ?? 0) + 1
      }
      updateProgress($activeProfile.id, lesson.id, { stars, bestAccuracy: acc, bestWpm: wpm, mistakes, keyLog })
    }
    setResults({ accuracy: acc, wpm, stars, lessonId: lesson.id })
    goTo('results')
  }

  let scale = $state(1)
  let scaleWrap = $state()
  let naturalH = $state(0)
  let verticalPad = $state(0)
  let scaleMeasured = $state(false)

  function measureAndScale() {
    if (!scaleWrap) return
    naturalH = scaleWrap.offsetHeight
    updateScale()
    scaleMeasured = true
  }

  function updateScale() {
    if (!naturalH) return
    const available = window.innerHeight - 32
    scale = Math.min(1, available / naturalH)
    verticalPad = Math.max(0, Math.floor((available - scale * naturalH) / 2))
  }

  $effect(() => {
    if (!showIntro && scaleWrap) setTimeout(measureAndScale, WIPE_MS * 2 + 50)
  })

  onMount(() => {
    document.body.style.overflow = 'hidden'
    window.addEventListener('resize', updateScale)
  })

  onDestroy(() => {
    document.body.style.overflow = ''
    window.removeEventListener('resize', updateScale)
  })
</script>

<svelte:window onkeydown={handleKeydown} />

<div style="padding:{verticalPad}px 0; width:100%">
<div
  bind:this={scaleWrap}
  style="transform:scale({scale}); transform-origin:top center; margin-bottom:{(scale-1)*naturalH}px; width:100%; opacity:{scaleMeasured || showIntro ? 1 : 0}"
>
<div class="screen exercise">
  <div class="topbar">
    <button class="back-btn" onclick={confirmExit}>{$t('nav.back')}</button>
    <span class="lesson-lbl">{lesson ? lesson.label : ''}</span>
  </div>

  {#if showIntro}
    <div class="intro" out:wipe>
      <div class="intro-chick"><PixelChick size={90} state="happy" /></div>
      <div class="intro-title">{$t('exercise.newKeys')}</div>
      <div class="intro-desc">{$t('exercise.newKeysDesc')}</div>
      <div class="intro-key-grid">
        {#each (lesson?.group === 'zinnen' ? newKeys : newKeys.filter(k => /^[a-z]$/i.test(k))) as key}
          {#if key === 'shift'}
            <div class="intro-key-card intro-key-card--wide" style="--kc:{FINGER_VARS.lp}">
              <div class="intro-key-char" style="font-size:32px">SHIFT</div>
              <div class="intro-key-finger">{$t('finger.lp')} / {$t('finger.rp')}</div>
            </div>
          {:else}
            {@const finger = getFingerForKey(key)}
            {@const color  = finger ? FINGER_VARS[finger] : 'var(--text)'}
            <div class="intro-key-card" style="--kc:{color}">
              <div class="intro-key-char">{key.toUpperCase()}</div>
              <div class="intro-key-finger">{finger ? $t(`finger.${finger}`) : ''}</div>
            </div>
          {/if}
        {/each}
      </div>
      <button class="btn-begin" onclick={() => introDismissedForLesson = lesson.id}>{$t('exercise.begin')}</button>
    </div>
  {:else}
  <div class="inner" in:wipe={{delay:WIPE_MS}}>
    <div class="prog-row">
      <span>{$t('exercise.progress')}</span>
      <span>{cursor} / {sequence.length}</span>
    </div>
    <div class="pbar"><div class="pfill" style="width:{progress*100}%"></div></div>

    <div class="main-row">
      <div class="chick-wrap"><PixelChick bind:this={chick} size={100} /></div>
      <div class="tiles-wrap"><LetterTiles {sequence} {cursor} /></div>
    </div>

    <div class="kbd-block">
      <HandHints {activeKey} />
      <div class="divider"></div>
      <Keyboard {activeKey} />
    </div>

    <div class="stats-row">
      <span>{$t('exercise.accuracy')} <strong>{accuracy}%</strong></span>
    </div>
  </div>
  {/if}

  {#if showExitModal}
    <div class="modal-backdrop" onclick={() => showExitModal = false}>
      <div class="modal" bind:this={modalEl} onclick={(e) => e.stopPropagation()}>
        <div class="modal-title">{$t('exercise.confirmTitle')}</div>
        <div class="modal-desc">{$t('exercise.confirmDesc')}</div>
        <div class="modal-btns">
          <button class="modal-btn modal-btn--cancel" bind:this={cancelBtn} onclick={() => showExitModal = false}>{$t('exercise.confirmCancel')}</button>
          <button class="modal-btn modal-btn--leave" onclick={() => goTo('lessons')}>{$t('exercise.confirmLeave')}</button>
        </div>
      </div>
    </div>
  {/if}
</div>
</div>
</div>

<style>
  .screen.exercise { max-width:1400px; width:100%; margin:0 auto; position:relative; }
  .topbar { display:flex; justify-content:space-between; align-items:center; padding:20px 36px 0; }
  .back-btn { font-family:inherit; font-size:19px; color:var(--text); background:none; border:none; cursor:pointer; white-space:nowrap; }
  .lesson-lbl { font-size:19px; color:var(--text); letter-spacing:1px; }
  .inner { padding:18px 36px 30px; }
  .prog-row { display:flex; justify-content:space-between; font-size:16px; color:var(--text-muted); letter-spacing:1px; margin-bottom:8px; }
  .pbar { height:6px; background:var(--bg-sunken); border-radius:3px; margin-bottom:26px; overflow:hidden; }
  .pfill { height:100%; background:linear-gradient(90deg,var(--accent-cyan),var(--accent-green)); border-radius:3px; transition:width .1s; }
  .main-row { display:flex; align-items:center; gap:32px; margin-bottom:28px; }
  .main-row .chick-wrap { flex-shrink:0; }
  .main-row .tiles-wrap { flex:1; min-width:0; }
  .kbd-block { background:var(--bg-raised); border-radius:8px; padding:22px 20px 18px; border:1px solid var(--border); }
  .divider { height:1px; background:var(--border); margin:14px 0; }
  .stats-row { display:flex; gap:16px; margin-top:18px; padding-top:16px; border-top:1px solid var(--border); font-size:16px; color:var(--text-muted); letter-spacing:1px; }
  .stats-row strong { color:var(--accent-green); }

  /* ── Lesson intro ── */
  .intro { display:flex; flex-direction:column; align-items:center; padding:36px 26px 40px; gap:16px; }
  .intro-chick { margin-bottom:4px; }
  .intro-title { font-size:22px; font-weight:bold; letter-spacing:4px; color:var(--accent-cyan); text-shadow:0 0 16px color-mix(in srgb,var(--accent-cyan) 50%,transparent); }
  .intro-desc  { font-size:16px; color:var(--text-muted); letter-spacing:1px; }
  .intro-key-grid { display:flex; flex-wrap:wrap; justify-content:center; gap:20px; margin:16px 0 8px; }
  .intro-key-card {
    display:flex; flex-direction:column; align-items:center; gap:10px;
    background:var(--bg-raised); border:2px solid var(--kc);
    border-radius:8px; padding:20px 28px;
    box-shadow:0 0 18px color-mix(in srgb,var(--kc) 30%,transparent);
  }
  .intro-key-char   { font-size:56px; font-weight:bold; color:var(--kc); text-shadow:0 0 20px var(--kc); font-family:'Courier New',monospace; line-height:1; }
  .intro-key-finger { font-size:16px; color:var(--kc); letter-spacing:2px; opacity:.8; }
  .intro-key-card--wide { padding: 20px 48px; }
  .btn-begin {
    margin-top:8px; padding:16px 48px; font-size:18px; font-weight:bold; letter-spacing:3px;
    background:var(--accent-cyan); color:var(--bg); border-radius:4px; border:none; cursor:pointer;
    font-family:inherit; box-shadow:0 0 24px color-mix(in srgb,var(--accent-cyan) 40%,transparent);
  }

  /* ── Exit modal ── */
  .modal-backdrop {
    position:absolute; inset:0; border-radius:inherit;
    background:color-mix(in srgb,var(--bg) 70%,transparent);
    backdrop-filter:blur(4px);
    display:flex; align-items:center; justify-content:center;
    z-index:100;
  }
  .modal {
    background:var(--bg-raised); border:2px solid var(--accent-cyan);
    border-radius:8px; padding:32px 36px; text-align:center;
    box-shadow:0 0 40px color-mix(in srgb,var(--accent-cyan) 25%,transparent);
    display:flex; flex-direction:column; align-items:center; gap:12px;
  }
  .modal-title { font-size:22px; font-weight:bold; letter-spacing:4px; color:var(--accent-cyan); text-shadow:0 0 12px color-mix(in srgb,var(--accent-cyan) 50%,transparent); }
  .modal-desc  { font-size:16px; color:var(--text-muted); letter-spacing:1px; }
  .modal-btns  { display:flex; gap:12px; margin-top:8px; }
  .modal-btn {
    padding:10px 28px; font-size:17px; font-weight:bold; letter-spacing:2px;
    border-radius:4px; border:2px solid; cursor:pointer; font-family:inherit;
  }
  .modal-btn--cancel { background:transparent; color:var(--text-muted); border-color:var(--border); }
  .modal-btn--cancel:hover,
  .modal-btn--cancel:focus-visible { border-color:var(--text-muted); color:var(--text); box-shadow:0 0 12px color-mix(in srgb,var(--text-muted) 35%,transparent); }
  .modal-btn--leave  { background:transparent; color:var(--accent-red,#ff4455); border-color:var(--accent-red,#ff4455); box-shadow:0 0 12px color-mix(in srgb,#ff4455 25%,transparent); opacity:0.55; }
  .modal-btn--leave:hover,
  .modal-btn--leave:focus-visible { background:color-mix(in srgb,#ff4455 15%,transparent); box-shadow:0 0 20px color-mix(in srgb,#ff4455 55%,transparent); opacity:1; }
</style>
