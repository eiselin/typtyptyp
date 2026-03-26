<script>
  import { t } from '../i18n/index.js'
  import { LESSONS, getLearnedKeys } from '../lessons/index.js'
  import { buildExerciseSequence } from '../words/index.js'
  import { activeProfile, updateProgress } from '../stores/profiles.js'
  import { selectedLesson, goTo } from '../stores/screen.js'
  import { setResults } from '../stores/results.js'
  import PixelChick from '../components/PixelChick.svelte'
  import Keyboard from '../components/Keyboard.svelte'
  import HandHints from '../components/HandHints.svelte'
  import LetterTiles from '../components/LetterTiles.svelte'

  let chick
  let cursor = 0
  let errors = 0
  let startTime = null
  let sequence = ''

  $: lesson      = LESSONS.find(l => l.id === $selectedLesson)
  $: learnedKeys = lesson ? getLearnedKeys(lesson.id) : []
  $: lessonKeySet = new Set(lesson?.keys ?? [])

  $: if (lesson) { sequence = buildExerciseSequence(learnedKeys); cursor = 0; errors = 0; startTime = null }

  $: activeKey = (sequence[cursor] !== ' ' && sequence[cursor]) ? sequence[cursor] : null
  $: progress  = sequence.length ? cursor / sequence.length : 0
  $: accuracy  = cursor > 0 ? Math.round(((cursor - errors) / cursor) * 100) : 100

  function handleKeydown(e) {
    if (!sequence || cursor >= sequence.length) return
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (e.key === 'Escape') { confirmExit(); return }

    if (sequence[cursor] === ' ') { cursor++; return }
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
    const mins  = (Date.now() - startTime) / 60000
    const wpm   = Math.round(sequence.trim().split(' ').length / mins)
    const stars = acc >= 95 ? 3 : acc >= 80 ? 2 : 1
    if ($activeProfile) updateProgress($activeProfile.id, lesson.id, { stars, bestAccuracy: acc, bestWpm: wpm })
    setResults({ accuracy: acc, wpm, stars, lessonId: lesson.id })
    goTo('results')
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="screen exercise">
  <div class="topbar">
    <button class="back-btn" on:click={confirmExit}>{$t('nav.back')}</button>
    <span class="lesson-lbl">{lesson?.label ?? ''}</span>
  </div>
  <div class="inner">
    <div class="prog-row">
      <span>{$t('exercise.progress')}</span>
      <span>{cursor} / {sequence.length}</span>
    </div>
    <div class="pbar"><div class="pfill" style="width:{progress*100}%"></div></div>

    <div class="main-row">
      <PixelChick bind:this={chick} size={52} />
      <LetterTiles {sequence} {cursor} />
    </div>

    <div class="kbd-block">
      <HandHints {activeKey} />
      <div class="divider"></div>
      <Keyboard {activeKey} {lessonKeySet} />
    </div>

    <div class="stats-row">
      <span>{$t('exercise.accuracy')} <strong>{accuracy}%</strong></span>
    </div>
  </div>
</div>

<style>
  .screen.exercise { max-width:560px; margin:0 auto; }
  .topbar { display:flex; justify-content:space-between; align-items:center; padding:12px 18px 0; }
  .back-btn { font-family:inherit; font-size:11px; color:var(--text-muted); background:none; border:none; cursor:pointer; }
  .lesson-lbl { font-size:10px; color:var(--text-muted); letter-spacing:1px; }
  .inner { padding:10px 18px 16px; }
  .prog-row { display:flex; justify-content:space-between; font-size:9px; color:var(--text-muted); letter-spacing:1px; margin-bottom:4px; }
  .pbar { height:5px; background:var(--bg-sunken); border-radius:3px; margin-bottom:14px; overflow:hidden; }
  .pfill { height:100%; background:linear-gradient(90deg,var(--accent-cyan),var(--accent-green)); border-radius:3px; transition:width .1s; }
  .main-row { display:flex; align-items:center; gap:14px; margin-bottom:14px; }
  .kbd-block { background:var(--bg-raised); border-radius:8px; padding:12px 10px 8px; border:1px solid var(--border); }
  .divider { height:1px; background:var(--border); margin:8px 0; }
  .stats-row { display:flex; gap:16px; margin-top:10px; padding-top:10px; border-top:1px solid var(--border); font-size:10px; color:var(--text-muted); letter-spacing:1px; }
  .stats-row strong { color:var(--accent-green); }
</style>
