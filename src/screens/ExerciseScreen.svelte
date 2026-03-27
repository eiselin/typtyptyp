<script>
  import { get } from 'svelte/store'
  import { t } from '../i18n/index.js'
  import { LESSONS, getLearnedKeys, getFingerForKey } from '../lessons/index.js'
  import { buildExerciseSequence } from '../words/index.js'
  import { activeProfile, updateProgress } from '../stores/profiles.js'
  import { selectedLesson, goTo } from '../stores/screen.js'
  import { setResults } from '../stores/results.js'
  import PixelChick from '../components/PixelChick.svelte'
  import Keyboard from '../components/Keyboard.svelte'
  import HandHints from '../components/HandHints.svelte'
  import LetterTiles from '../components/LetterTiles.svelte'
  import { onMount, onDestroy } from 'svelte'

  const FINGER_VARS = {
    lp:'var(--f-lp)', lr:'var(--f-lr)', lm:'var(--f-lm)', li:'var(--f-li)',
    ri:'var(--f-ri)', rm:'var(--f-rm)', rr:'var(--f-rr)', rp:'var(--f-rp)',
  }

  let chick = $state()
  let cursor = $state(0)
  let errors = $state(0)
  let startTime = $state(null)
  let sequence  = $state('')
  let introDismissedForLesson = $state(null)

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
      sequence = buildExerciseSequence(learnedKeys, newKeys)
      cursor = 0; errors = 0; startTime = null
    }
  })

  const activeKey = $derived(cursor < sequence.length ? sequence[cursor] : null)
  const progress  = $derived(sequence.length ? cursor / sequence.length : 0)
  const accuracy  = $derived(cursor > 0 ? Math.round(((cursor - errors) / cursor) * 100) : 100)

  function handleKeydown(e) {
    if (showIntro) return
    if (!sequence || cursor >= sequence.length) return
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (e.key === 'Escape') { confirmExit(); return }
    if (e.key.length !== 1) return   // ignore modifier-only events (Shift, CapsLock…)

    if (!startTime) startTime = Date.now()

    if (e.key === sequence[cursor]) {
      cursor++
      chick?.trigger('happy')
      if (cursor >= sequence.length) finish()
    } else {
      errors++
      chick?.trigger('error')
    }
  }

  function confirmExit() {
    if (cursor === 0 || confirm($t('exercise.confirmExit'))) goTo('lessons')
  }

  function finish() {
    const total = sequence.replace(/ /g, '').length
    const acc   = Math.round(((total - errors) / total) * 100)
    const mins  = Math.max((Date.now() - startTime) / 60000, 1/60)
    const wpm   = Math.round(sequence.trim().split(' ').length / mins)
    const stars = acc >= 95 ? 3 : acc >= 80 ? 2 : 1
    if ($activeProfile) updateProgress($activeProfile.id, lesson.id, { stars, bestAccuracy: acc, bestWpm: wpm })
    setResults({ accuracy: acc, wpm, stars, lessonId: lesson.id })
    goTo('results')
  }

  let scale = $state(1)
  let scaleWrap = $state()
  let naturalH = $state(0)

  function measureAndScale() {
    if (!scaleWrap) return
    naturalH = scaleWrap.offsetHeight
    updateScale()
  }

  function updateScale() {
    if (!naturalH) return
    scale = Math.min(1, (window.innerHeight - 32) / naturalH)
  }

  $effect(() => {
    if (!showIntro && scaleWrap) measureAndScale()
  })

  onMount(() => {
    window.addEventListener('resize', updateScale)
  })

  onDestroy(() => window.removeEventListener('resize', updateScale))
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  bind:this={scaleWrap}
  style="transform:scale({scale}); transform-origin:top center; margin-bottom:{(scale-1)*naturalH}px; width:100%"
>
<div class="screen exercise">
  <div class="topbar">
    <button class="back-btn" onclick={confirmExit}>{$t('nav.back')}</button>
    <span class="lesson-lbl">{lesson?.label ?? ''}</span>
  </div>

  {#if showIntro}
    <div class="intro">
      <div class="intro-chick"><PixelChick size={90} state="happy" /></div>
      <div class="intro-title">{$t('exercise.newKeys')}</div>
      <div class="intro-desc">{$t('exercise.newKeysDesc')}</div>
      <div class="intro-key-grid">
        {#each newKeys as key}
          {@const finger = getFingerForKey(key)}
          {@const color  = finger ? FINGER_VARS[finger] : 'var(--text)'}
          <div class="intro-key-card" style="--kc:{color}">
            <div class="intro-key-char">{key.toUpperCase()}</div>
            <div class="intro-key-finger">{finger ? $t(`finger.${finger}`) : ''}</div>
          </div>
        {/each}
      </div>
      <button class="btn-begin" onclick={() => introDismissedForLesson = lesson.id}>{$t('exercise.begin')}</button>
    </div>
  {:else}
  <div class="inner">
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
</div>
</div>

<style>
  .screen.exercise { max-width:1400px; width:100%; margin:0 auto; }
  .topbar { display:flex; justify-content:space-between; align-items:center; padding:20px 36px 0; }
  .back-btn { font-family:inherit; font-size:13px; color:var(--text); background:none; border:none; cursor:pointer; }
  .lesson-lbl { font-size:13px; color:var(--text); letter-spacing:1px; }
  .inner { padding:18px 36px 30px; }
  .prog-row { display:flex; justify-content:space-between; font-size:12px; color:var(--text-muted); letter-spacing:1px; margin-bottom:8px; }
  .pbar { height:6px; background:var(--bg-sunken); border-radius:3px; margin-bottom:26px; overflow:hidden; }
  .pfill { height:100%; background:linear-gradient(90deg,var(--accent-cyan),var(--accent-green)); border-radius:3px; transition:width .1s; }
  .main-row { display:flex; align-items:center; gap:32px; margin-bottom:28px; }
  .main-row .chick-wrap { flex-shrink:0; }
  .main-row .tiles-wrap { flex:1; min-width:0; }
  .kbd-block { background:var(--bg-raised); border-radius:8px; padding:22px 20px 18px; border:1px solid var(--border); }
  .divider { height:1px; background:var(--border); margin:14px 0; }
  .stats-row { display:flex; gap:16px; margin-top:18px; padding-top:16px; border-top:1px solid var(--border); font-size:13px; color:var(--text-muted); letter-spacing:1px; }
  .stats-row strong { color:var(--accent-green); }

  /* ── Lesson intro ── */
  .intro { display:flex; flex-direction:column; align-items:center; padding:36px 26px 40px; gap:16px; }
  .intro-chick { margin-bottom:4px; }
  .intro-title { font-size:22px; font-weight:bold; letter-spacing:4px; color:var(--accent-cyan); text-shadow:0 0 16px color-mix(in srgb,var(--accent-cyan) 50%,transparent); }
  .intro-desc  { font-size:13px; color:var(--text-muted); letter-spacing:1px; }
  .intro-key-grid { display:flex; flex-wrap:wrap; justify-content:center; gap:20px; margin:16px 0 8px; }
  .intro-key-card {
    display:flex; flex-direction:column; align-items:center; gap:10px;
    background:var(--bg-raised); border:2px solid var(--kc);
    border-radius:8px; padding:20px 28px;
    box-shadow:0 0 18px color-mix(in srgb,var(--kc) 30%,transparent);
  }
  .intro-key-char   { font-size:56px; font-weight:bold; color:var(--kc); text-shadow:0 0 20px var(--kc); font-family:'Courier New',monospace; line-height:1; }
  .intro-key-finger { font-size:12px; color:var(--kc); letter-spacing:2px; opacity:.8; }
  .btn-begin {
    margin-top:8px; padding:16px 48px; font-size:18px; font-weight:bold; letter-spacing:3px;
    background:var(--accent-cyan); color:var(--bg); border-radius:4px; border:none; cursor:pointer;
    font-family:inherit; box-shadow:0 0 24px color-mix(in srgb,var(--accent-cyan) 40%,transparent);
  }
</style>
