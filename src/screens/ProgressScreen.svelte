<script>
  import { t } from '../i18n/index.js'
  import { activeProfile } from '../stores/profiles.js'
  import { FINGER_VARS, getFingerForKey, getLearnedKeys, needsShift, getPhysicalKey, getShiftSide } from '../lessons/index.js'
  import { selectLesson, goTo } from '../stores/screen.js'
  import { kbLayout } from '../keyboards/index.js'
  import ProfessorChick from '../components/ProfessorChick.svelte'
  import { arrowNav } from '../utils/keyboard.js'
  import { keyState, getWorstKey, getPracticeLesson } from '../utils/progress.js'

  let screenEl

  $: KEYBOARD_ROWS      = $kbLayout.rows
  $: PHYSICAL_TO_LOGICAL = $kbLayout.physicalToLogical

  $: profile        = $activeProfile
  $: lessonMistakes = profile?.lessonMistakes ?? {}
  $: progress       = profile?.lessonProgress  ?? {}

  $: completedCount = Object.values(progress).filter(lp => lp.stars > 0).length
  $: maxDoneLesson  = Math.max(0, ...Object.keys(progress).filter(id => (progress[id]?.stars ?? 0) > 0).map(Number))
  $: learnedKeys    = new Set(maxDoneLesson > 0 ? getLearnedKeys(maxDoneLesson) : [])
  $: keyStats       = profile?.keyStats ?? {}

  $: worstKey       = getWorstKey(keyStats, learnedKeys, lessonMistakes)
  $: practiceLesson = getPracticeLesson(worstKey, profile)

  function heatmapState(key) {
    return keyState(keyStats, learnedKeys, PHYSICAL_TO_LOGICAL, key)
  }

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
    const wrongLabel = (!worstKey.topWrong || worstKey.topWrong === ' ') ? $t('keyboard.space') : worstKey.topWrong.toUpperCase()
    if (needsShift(worstKey.key)) {
      const shiftSide = getShiftSide(worstKey.key)
      const shiftFingerId = shiftSide === 'shift_l' ? 'lp' : 'rp'
      const isCapital = worstKey.key >= 'A' && worstKey.key <= 'Z'
      const params = {
        key: worstKey.key.toUpperCase(),
        baseKey: worstKey.key.toUpperCase(),
        finger: fingerName,
        shiftFinger: $t(`finger.${shiftFingerId}`),
        wrong: wrongLabel,
      }
      if (isCapital) return $t('progress.coach.tipCapital', params)
      return $t('progress.coach.tipShift', { ...params, physKey: getPhysicalKey(worstKey.key).toUpperCase() })
    }
    return $t('progress.coach.tip', {
      key: worstKey.key.toUpperCase(),
      finger: fingerName,
      wrong: wrongLabel,
    })
  })()
</script>

<svelte:window on:keydown={e => { if (e.key === 'Escape') goTo('lessons'); else if (screenEl) arrowNav(e, screenEl) }} />

<div class="screen progress" bind:this={screenEl}>
  <div class="topbar">
    <button class="back-btn" on:click={() => goTo('lessons')}>{$t('nav.back')}</button>
    <span class="title">{$t('progress.title')}</span>
  </div>

  <div class="inner">
    <!-- Keyboard heatmap -->
    <div class="heatmap">
      {#each KEYBOARD_ROWS as row, ri}
        <div class="hmap-row" style="padding-left:{$kbLayout.rowStagger[ri] ?? 0}px">
          {#if ri === 3}
            <div class="hmap-key hmap-key--shift hmap-key--{heatmapState('shift_l')}">SHIFT</div>
            {#if $kbLayout.isoExtraKey}
              <div class="hmap-key hmap-key--locked hmap-key--iso-extra">{$kbLayout.isoExtraKey.toUpperCase()}</div>
            {/if}
          {/if}
          {#each row as key}
            {@const s = heatmapState(key)}
            <div class="hmap-key hmap-key--{s}">{key.toUpperCase()}</div>
          {/each}
          {#if ri === 3}
            <div class="hmap-key hmap-key--shift hmap-key--{heatmapState('shift_r')}">SHIFT</div>
          {/if}
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
        {$t('progress.coach.practice', { label: practiceLesson.label })}
      </button>
    {/if}
  </div>
</div>

<style>
  .title { font-size:22px; color:var(--text); letter-spacing:3px; font-weight:bold; }

  .inner { padding:28px 28px 44px; }

  /* Keyboard heatmap */
  .heatmap { display:flex; flex-direction:column; gap:8px; }
  .hmap-row { display:flex; gap:8px; }
  .hmap-key {
    width:60px; height:60px;
    display:flex; align-items:center; justify-content:center;
    font-family:'Courier New',monospace; font-size:22px; font-weight:bold;
    border-radius:6px; border:2px solid;
  }
  .hmap-key--shift { width:auto; min-width:60px; padding:0 10px; font-size:11px; letter-spacing:1px; }
  .hmap-key--iso-extra { font-size:16px; }
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
  .legend { display:flex; gap:24px; margin-top:18px; margin-bottom:36px; }
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
    display:block; width:100%; margin-top:28px;
    padding:18px; font-family:inherit; font-size:19px; font-weight:bold; letter-spacing:3px;
    background:var(--accent-green); color:var(--bg);
    border:none; border-radius:6px; cursor:pointer;
    box-shadow:0 0 24px color-mix(in srgb,var(--accent-green) 40%,transparent);
  }
  .practice-btn:hover { box-shadow:0 0 36px color-mix(in srgb,var(--accent-green) 60%,transparent); }
  .practice-btn:focus-visible { box-shadow: 0 0 6px var(--accent-green), 0 0 28px color-mix(in srgb,var(--accent-green) 60%,transparent); }
</style>
