<script>
  import { t } from '../i18n/index.js'
  import { activeProfile } from '../stores/profiles.js'
  import { LESSONS, FINGER_VARS, getFingerForKey, getLearnedKeys } from '../lessons/index.js'
  import { selectLesson, goTo } from '../stores/screen.js'
  import ProfessorChick from '../components/ProfessorChick.svelte'

  const KEYBOARD_ROWS = [
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l'],
    ['z','x','c','v','b','n','m'],
  ]

  $: profile        = $activeProfile
  $: lessonMistakes = profile?.lessonMistakes ?? {}
  $: progress       = profile?.lessonProgress  ?? {}

  $: completedCount = Object.values(progress).filter(lp => lp.stars > 0).length
  $: maxDoneLesson  = Math.max(0, ...Object.keys(progress).filter(id => (progress[id]?.stars ?? 0) > 0).map(Number))
  $: learnedKeys    = new Set(maxDoneLesson > 0 ? getLearnedKeys(maxDoneLesson) : [])

  // Rolling window per key: boolean[] (true=correct), last 50 presses
  $: keyStats = profile?.keyStats ?? {}

  function keyAccuracy(key) {
    const results = keyStats[key]
    if (!results || results.length < 5) return null  // not enough data
    return results.reduce((s, v) => s + (v ? 1 : 0), 0) / results.length
  }

  function keyState(key) {
    if (!learnedKeys.has(key)) return 'locked'
    const acc = keyAccuracy(key)
    if (acc === null) return 'green'   // unlocked, not enough data yet
    if (acc >= 0.95) return 'green'
    if (acc >= 0.80) return 'orange'
    return 'red'
  }

  // Worst key: lowest accuracy (in rolling window) among unlocked keys with enough data
  $: worstKey = (() => {
    const candidates = Object.entries(keyStats)
      .filter(([key]) => learnedKeys.has(key))
      .map(([key]) => ({ key, acc: keyAccuracy(key) }))
      .filter(({ acc }) => acc !== null && acc < 1)
      .sort((a, b) => a.acc - b.acc)
    if (candidates.length === 0) return null
    const { key } = candidates[0]
    let topWrong = null, topCount = 0
    for (const lessonData of Object.values(lessonMistakes)) {
      if (lessonData[key]) {
        for (const [typed, c] of Object.entries(lessonData[key])) {
          if (c > topCount) { topWrong = typed; topCount = c }
        }
      }
    }
    return { key, topWrong }
  })()

  $: openingMsg = (() => {
    if (completedCount === 0) return $t('progress.coach.noLessons')
    const count = learnedKeys.size
    if (completedCount <= 2) return $t('progress.coach.earlyStart', { count })
    if (completedCount <= 7) return $t('progress.coach.goodProgress', { count })
    return $t('progress.coach.great', { count })
  })()

  $: tipMsg = (() => {
    if (!worstKey) return $t('progress.coach.noTip')
    const finger = getFingerForKey(worstKey.key)
    const fingerName = finger ? $t(`finger.${finger}`) : ''
    return $t('progress.coach.tip', {
      key: worstKey.key.toUpperCase(),
      finger: fingerName,
      wrong: (worstKey.topWrong ?? '?').toUpperCase(),
    })
  })()

  $: practiceLesson = worstKey
    ? LESSONS.find(l => l.keys.includes(worstKey.key)) ?? null
    : null
</script>

<svelte:window on:keydown={e => { if (e.key === 'Escape') goTo('lessons') }} />

<div class="screen progress">
  <div class="topbar">
    <button class="back-btn" on:click={() => goTo('lessons')}>{$t('nav.back')}</button>
    <span class="title">{$t('progress.title')}</span>
  </div>

  <div class="inner">
    <!-- Keyboard heatmap -->
    <div class="heatmap">
      {#each KEYBOARD_ROWS as row, ri}
        <div class="hmap-row" style="padding-left:{ri === 1 ? 22 : ri === 2 ? 44 : 0}px">
          {#each row as key}
            {@const s = keyState(key)}
            <div class="hmap-key hmap-key--{s}">{key.toUpperCase()}</div>
          {/each}
        </div>
      {/each}
    </div>

    <!-- Legend -->
    <div class="legend">
      <span class="legend-item"><span class="dot dot--green"></span>{$t('progress.legend.good')}</span>
      <span class="legend-item"><span class="dot dot--orange"></span>{$t('progress.legend.some')}</span>
      <span class="legend-item"><span class="dot dot--red"></span>{$t('progress.legend.needs')}</span>
    </div>

    <!-- Coach -->
    <div class="coach">
      <div class="coach-chick">
        <ProfessorChick height={96} />
      </div>
      <div class="bubble">
        <p class="bubble-main">{openingMsg}</p>
        {#if completedCount > 0}
          <p class="bubble-tip">{tipMsg}</p>
        {/if}
      </div>
    </div>

    {#if practiceLesson}
      <button class="practice-btn" on:click={() => selectLesson(practiceLesson.id)}>
        {$t('progress.coach.practice', { label: practiceLesson.group === 'volledig' ? $t('lessons.label.volledig') : practiceLesson.label })}
      </button>
    {/if}
  </div>
</div>

<style>
  .screen.progress { max-width:640px; margin:0 auto; }
  .topbar { display:flex; justify-content:space-between; align-items:center; padding:18px 22px 0; }
  .back-btn { font-family:inherit; font-size:19px; color:var(--text); background:none; border:none; cursor:pointer; letter-spacing:1px; white-space:nowrap; }
  .title { font-size:22px; color:var(--text); letter-spacing:3px; font-weight:bold; }

  .inner { padding:20px 22px 36px; }

  /* Keyboard heatmap */
  .heatmap { display:flex; flex-direction:column; gap:6px; }
  .hmap-row { display:flex; gap:6px; }
  .hmap-key {
    width:52px; height:52px;
    display:flex; align-items:center; justify-content:center;
    font-family:'Courier New',monospace; font-size:20px; font-weight:bold;
    border-radius:6px; border:2px solid;
  }
  .hmap-key--locked  { color:var(--text-muted); border-color:var(--border); background:var(--bg-sunken); opacity:0.3; }
  .hmap-key--green   {
    color:var(--accent-green); border-color:var(--accent-green);
    background:color-mix(in srgb,var(--accent-green) 10%,var(--bg-raised));
    box-shadow:0 0 10px color-mix(in srgb,var(--accent-green) 30%,transparent);
    text-shadow:0 0 10px var(--accent-green);
  }
  .hmap-key--orange  {
    color:#ff8844; border-color:#ff8844;
    background:color-mix(in srgb,#ff8844 10%,var(--bg-raised));
    box-shadow:0 0 10px color-mix(in srgb,#ff8844 30%,transparent);
    text-shadow:0 0 10px #ff8844;
  }
  .hmap-key--red     {
    color:#ff4455; border-color:#ff4455;
    background:color-mix(in srgb,#ff4455 15%,var(--bg-raised));
    box-shadow:0 0 12px color-mix(in srgb,#ff4455 40%,transparent);
    text-shadow:0 0 12px #ff4455;
  }

  /* Legend */
  .legend { display:flex; gap:24px; margin-top:12px; margin-bottom:28px; }
  .legend-item { display:flex; align-items:center; gap:8px; font-size:16px; color:var(--text-muted); letter-spacing:1px; }
  .dot { width:11px; height:11px; border-radius:50%; flex-shrink:0; }
  .dot--green  { background:var(--accent-green);  box-shadow:0 0 6px var(--accent-green); }
  .dot--orange { background:#ff8844; box-shadow:0 0 6px #ff8844; }
  .dot--red    { background:#ff4455; box-shadow:0 0 6px #ff4455; }

  /* Coach section */
  .coach { display:flex; align-items:flex-start; gap:18px; }
  .coach-chick { flex-shrink:0; }

  .bubble {
    position:relative;
    background:var(--bg-raised); border:2px solid var(--accent-cyan);
    border-radius:10px; padding:18px 20px;
    box-shadow:0 0 16px color-mix(in srgb,var(--accent-cyan) 15%,transparent);
    flex:1;
  }
  .bubble::before {
    content:'';
    position:absolute; left:-10px; top:32px;
    border:8px solid transparent;
    border-right-color:var(--accent-cyan);
  }
  .bubble::after {
    content:'';
    position:absolute; left:-6px; top:34px;
    border:6px solid transparent;
    border-right-color:var(--bg-raised);
  }
  .bubble-main { margin:0 0 12px; font-size:18px; color:var(--text); letter-spacing:1px; line-height:1.5; }
  .bubble-tip  { margin:0; font-size:17px; color:var(--text-muted); letter-spacing:1px; line-height:1.6; border-top:1px solid var(--border); padding-top:12px; }

  /* Practice CTA */
  .practice-btn {
    display:block; width:100%; margin-top:18px;
    padding:18px; font-family:inherit; font-size:19px; font-weight:bold; letter-spacing:3px;
    background:var(--accent-green); color:var(--bg);
    border:none; border-radius:6px; cursor:pointer;
    box-shadow:0 0 24px color-mix(in srgb,var(--accent-green) 40%,transparent);
  }
  .practice-btn:hover { box-shadow:0 0 36px color-mix(in srgb,var(--accent-green) 60%,transparent); }
</style>
