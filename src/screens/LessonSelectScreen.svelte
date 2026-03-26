<script>
  import { t } from '../i18n/index.js'
  import { LESSONS } from '../lessons/index.js'
  import { activeProfile } from '../stores/profiles.js'
  import { goTo, selectLesson } from '../stores/screen.js'

  $: progress = $activeProfile?.lessonProgress ?? {}

  function state(lesson) {
    if ((progress[lesson.id]?.stars ?? 0) > 0) return 'done'
    if (lesson.id === 1 || (progress[lesson.id - 1]?.stars ?? 0) >= 1) return 'available'
    return 'locked'
  }

  const GROUPS = ['thuisrij','bovenrij','onderrij','cijfers','volledig']
</script>

<div class="screen lessons">
  <div class="topbar">
    <button class="back-btn" on:click={() => goTo('home')}>{$t('nav.back')}</button>
    <span class="title">TYPTYPTYP</span>
    <span class="sub">{$t('lessons.title')}</span>
  </div>
  <div class="inner">
    {#each GROUPS as group}
      <div class="group-lbl">{$t(`lessons.group.${group}`)}</div>
      <div class="grid">
        {#each LESSONS.filter(l => l.group === group) as lesson}
          {@const s = state(lesson)}
          {@const stars = progress[lesson.id]?.stars ?? 0}
          <button class="lcard lcard--{s}" disabled={s === 'locked'}
            on:click={() => s !== 'locked' && selectLesson(lesson.id)}>
            <div class="lkeys">{lesson.label}</div>
            {#if s === 'done'}
              <div class="lstars">{'★'.repeat(stars)}{'☆'.repeat(3-stars)}</div>
            {:else if s === 'available'}
              <div class="lplay">{$t('lessons.play')}</div>
            {:else}
              <div class="llock">🔒</div>
            {/if}
          </button>
        {/each}
      </div>
    {/each}
  </div>
</div>

<style>
  .screen.lessons { max-width:520px; margin:0 auto; }
  .topbar { display:flex; justify-content:space-between; align-items:center; padding:14px 18px 0; }
  .back-btn { font-family:inherit; font-size:11px; color:var(--text-muted); background:none; border:none; cursor:pointer; letter-spacing:1px; }
  .title { font-size:16px; font-weight:bold; letter-spacing:3px; color:var(--accent-cyan); }
  .sub { font-size:10px; color:var(--text-muted); letter-spacing:1px; }
  .inner { padding:14px 18px 20px; }
  .group-lbl { font-size:11px; color:var(--text-muted); letter-spacing:2px; margin:14px 0 10px; }
  .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
  .lcard { background:var(--bg-raised); border:2px solid; border-radius:6px; padding:10px 8px; text-align:center; font-family:inherit; cursor:pointer; }
  .lcard--done      { border-color:#005533; }
  .lcard--available { border-color:var(--accent-cyan); box-shadow:0 0 10px color-mix(in srgb,var(--accent-cyan) 20%,transparent); }
  .lcard--locked    { border-color:var(--border); opacity:.45; cursor:not-allowed; }
  .lkeys  { font-size:16px; font-weight:bold; color:var(--text); margin-bottom:4px; }
  .lcard--available .lkeys { color:var(--accent-cyan); }
  .lcard--done      .lkeys { color:var(--accent-green); }
  .lcard--locked    .lkeys { color:var(--text-muted); }
  .lstars { color:#ffcc00; font-size:13px; letter-spacing:1px; }
  .lplay  { font-size:10px; color:var(--accent-cyan); letter-spacing:1px; }
  .llock  { font-size:14px; }
</style>
