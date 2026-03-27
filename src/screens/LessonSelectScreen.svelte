<script>
  import { t } from '../i18n/index.js'
  import { LESSONS } from '../lessons/index.js'
  import { activeProfile } from '../stores/profiles.js'
  import { goTo, selectLesson, startArcade } from '../stores/screen.js'

  $: progress = $activeProfile?.lessonProgress ?? {}

  function state(lesson) {
    if ((progress[lesson.id]?.stars ?? 0) > 0) return 'done'
    if (lesson.id === 1 || (progress[lesson.id - 1]?.stars ?? 0) >= 1) return 'available'
    return 'locked'
  }

  const GROUPS = ['thuisrij','bovenrij','onderrij','volledig']

  const GROUP_IDS = {
    thuisrij: 'home',
    bovenrij: 'top',
    onderrij: 'bottom',
    volledig:  'all',
  }

  const GROUP_LESSON_IDS = {
    home:   [1, 2, 3, 4, 5],
    top:    [6, 7, 8, 9, 10],
    bottom: [11, 12, 13, 14],
    all:    [15],
  }

  function isArcadeUnlocked(groupId) {
    const ids = GROUP_LESSON_IDS[groupId] ?? []
    return ids.every(id => (progress[id]?.stars ?? 0) >= 1)
  }
</script>

<div class="screen lessons">
  <div class="topbar">
    <button class="back-btn" on:click={() => goTo('home')}>{$t('nav.back')}</button>
    <span class="title"><span class="c1">TYP</span><span class="c2">TYP</span><span class="c3">TYP</span></span>
    <span class="sub">{$t('lessons.title')}</span>
  </div>
  <div class="inner">
    <button class="guide-btn" on:click={() => goTo('guide')}>
      <span class="guide-btn-title">{$t('lessons.guide')}</span>
      <span class="guide-btn-action">{$t('lessons.guideAction')}</span>
    </button>
    {#each GROUPS as group}
      {@const groupId = GROUP_IDS[group]}
      {@const unlocked = isArcadeUnlocked(groupId)}
      <div class="group-lbl">{$t(`lessons.group.${group}`)}</div>
      <div class="grid">
        {#each LESSONS.filter(l => l.group === group) as lesson}
          {@const s = state(lesson)}
          {@const stars = progress[lesson.id]?.stars ?? 0}
          <button class="lcard lcard--{s}" disabled={s === 'locked'}
            on:click={() => s !== 'locked' && selectLesson(lesson.id)}>
            <div class="lkeys">{lesson.group === 'volledig' ? $t('lessons.label.volledig') : lesson.label}</div>
            {#if s === 'done'}
              <div class="lstars">{'★'.repeat(stars)}{'☆'.repeat(3-stars)}</div>
            {:else if s === 'available'}
              <div class="lplay">{$t('lessons.play')}</div>
            {:else}
              <div class="llock">- - -</div>
            {/if}
          </button>
        {/each}
      </div>
      <button
        class="arcade-btn"
        class:arcade-btn--unlocked={unlocked}
        disabled={!unlocked}
        on:click={() => unlocked && startArcade(groupId)}
      >
        {unlocked ? $t('arcade.button') : $t('arcade.locked')}
      </button>
    {/each}
  </div>
</div>

<style>
  .screen.lessons { margin:0 auto; }
  .topbar { display:flex; justify-content:space-between; align-items:center; padding:14px 18px 0; }
  .back-btn { font-family:inherit; font-size:12px; color:var(--text); background:none; border:none; cursor:pointer; letter-spacing:1px; }
  .title { font-size:16px; font-weight:bold; letter-spacing:3px; }
  .c1 { color:var(--accent-cyan);   text-shadow:0 0 18px color-mix(in srgb,var(--accent-cyan)   60%,transparent); }
  .c2 { color:var(--accent-green);  text-shadow:0 0 18px color-mix(in srgb,var(--accent-green)  60%,transparent); }
  .c3 { color:var(--accent-yellow); text-shadow:0 0 18px color-mix(in srgb,var(--accent-yellow) 60%,transparent); }
  .sub { font-size:12px; color:var(--text); letter-spacing:1px; }
  .inner { padding:14px 18px 20px; }
  .group-lbl { font-size:12px; color:var(--text); letter-spacing:2px; margin:14px 0 10px; }
  .grid { display:flex; gap:8px; }
  .lcard { flex:1; background:var(--bg-raised); border:2px solid; border-radius:6px; padding:10px 8px; text-align:center; font-family:inherit; cursor:pointer; }
  .lcard--done      { border-color:#005533; }
  .lcard--available { border-color:var(--accent-cyan); box-shadow:0 0 10px color-mix(in srgb,var(--accent-cyan) 20%,transparent); }
  .lcard--locked    { border-color:var(--border); cursor:not-allowed; background:var(--bg-sunken); }
  .lkeys  { font-size:16px; font-weight:bold; color:var(--text); margin-bottom:4px; }
  .lcard--available .lkeys { color:var(--accent-cyan); }
  .lcard--done      .lkeys { color:var(--accent-green); }
  .lcard--locked    .lkeys { color:var(--text-muted); }
  .lcard--locked    .llock { opacity:.5; }
  .lstars { color:#ffcc00; font-size:13px; letter-spacing:1px; }
  .lplay  { font-size:10px; color:var(--accent-cyan); letter-spacing:1px; }
  .llock  { font-size:14px; }
  .guide-btn {
    display: block; width: 100%; text-align: center;
    background: var(--bg-raised); border: 2px solid var(--accent-cyan);
    border-radius: 6px; padding: 10px 14px; margin-bottom: 14px;
    cursor: pointer; font-family: inherit;
    box-shadow: 0 0 12px color-mix(in srgb, var(--accent-cyan) 12%, transparent);
    white-space: nowrap;
  }
  .guide-btn-title { display: block; font-size: 16px; font-weight: bold; color: var(--accent-cyan); letter-spacing: 2px; }
  .guide-btn-action { display: block; font-size: 10px; color: var(--accent-cyan); letter-spacing: 2px; opacity: 0.6; margin-top: 3px; }

  /* Arcade button */
  .arcade-btn {
    display: block; width: 100%; margin-top: 8px; margin-bottom: 4px;
    padding: 9px 14px; border-radius: 6px; font-family: inherit;
    font-size: 12px; font-weight: bold; letter-spacing: 2px;
    border: 2px solid var(--border); background: var(--bg-sunken);
    color: var(--text-muted); cursor: not-allowed;
  }
  .arcade-btn--unlocked {
    border-color: var(--accent-yellow);
    color: var(--accent-yellow);
    background: var(--bg-raised);
    cursor: pointer;
    box-shadow: 0 0 10px color-mix(in srgb, var(--accent-yellow) 20%, transparent);
  }
  .arcade-btn--unlocked:hover {
    box-shadow: 0 0 18px color-mix(in srgb, var(--accent-yellow) 40%, transparent);
  }
</style>
