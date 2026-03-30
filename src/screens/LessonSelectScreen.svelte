<script>
  import { t } from '../i18n/index.js'
  import { LESSONS, getRecommendedLesson } from '../lessons/index.js'
  import { activeProfile } from '../stores/profiles.js'
  import { goTo, selectLesson, startArcade } from '../stores/screen.js'
  import { arrowNav2D } from '../utils/keyboard.js'
  import { onMount } from 'svelte'
  import ProfessorChick from '../components/ProfessorChick.svelte'

  let screenEl

  onMount(() => {
    const first = screenEl?.querySelector('.ltile--recommended')
      ?? screenEl?.querySelector('.ltile--completed')
      ?? screenEl?.querySelector('button:not([disabled])')
    first?.focus()
  })

  const emptyProfile = { lessonProgress: {}, keyStats: {} }

  $: progress = $activeProfile?.lessonProgress ?? {}
  $: recommendedId = getRecommendedLesson($activeProfile ?? emptyProfile, LESSONS)?.id

  function tileState(lesson) {
    if (lesson.id === recommendedId) return 'recommended'
    if ((progress[lesson.id]?.stars ?? 0) >= 1) return 'completed'
    return 'unplayed'
  }

  function dots(stars) {
    return '●'.repeat(stars) + '○'.repeat(3 - stars)
  }

  const GROUPS = ['thuisrij','bovenrij','onderrij','zinnen']

  const GROUP_IDS = {
    thuisrij: 'home',
    bovenrij: 'top',
    onderrij: 'bottom',
    zinnen:   'sentences',
  }

  const NO_GAME_GROUPS = new Set(['zinnen'])
</script>

<svelte:window on:keydown={e => { if (e.key === 'Escape') goTo('home'); else if (screenEl) arrowNav2D(e, screenEl) }} />

<div class="screen lessons" bind:this={screenEl}>
  <div class="topbar">
    <button class="back-btn" on:click={() => goTo('home')}>{$t('nav.back')}</button>
    <span class="title"><span class="c1">TYP</span><span class="c2">TYP</span><span class="c3">TYP</span></span>
    <span class="topbar-right">
      {#if $activeProfile}
        <span class="player-name" style="--pc:{$activeProfile.colour}">{$activeProfile.name.toUpperCase()}</span>
      {/if}
    </span>
  </div>

  <div class="inner">
    <!-- Guide tile -->
    <button class="util-tile guide-tile" on:click={() => goTo('guide')}>
      <div class="util-tile-body">
        <div class="util-tile-title">{$t('lessons.guide')}</div>
        <div class="util-tile-sub">{$t('lessons.guideSub')}</div>
      </div>
      <span class="util-tile-arrow">→</span>
    </button>

    <!-- Progress tile -->
    {#if $activeProfile}
      <button class="util-tile progress-tile" on:click={() => goTo('progress')}>
        <div class="util-tile-body">
          <div class="util-tile-title">{$t('lessons.progress')}</div>
          <div class="util-tile-sub">{$t('lessons.progressSub')}</div>
        </div>
        <span class="chick-wrap"><ProfessorChick height={52} /></span>
      </button>
    {/if}

    {#each GROUPS as group}
      {@const groupId = GROUP_IDS[group]}
      {@const groupLessons = LESSONS.filter(l => l.group === group)}

      <div class="group-lbl">{$t(`lessons.group.${group}`)}</div>

      <div class="lesson-row">
        {#each groupLessons as lesson}
          {@const s = tileState(lesson)}
          {@const stars = progress[lesson.id]?.stars ?? 0}
          {@const wide = lesson.keys.length >= 8}
          <button
            class="ltile ltile--{s}"
            class:ltile--wide={wide}
            on:click={() => selectLesson(lesson.id)}
          >
            <div class="lkeys">{lesson.label}</div>
            <div class="lstate">
              {#if s === 'completed'}{dots(stars)}
              {:else if s === 'recommended'}{$t('lessons.next')}
              {:else}·{/if}
            </div>
          </button>
        {/each}

        <!-- Game tile: always available (except groups with no game) -->
        {#if !NO_GAME_GROUPS.has(group)}
        <button
          class="game-tile game-tile--unlocked"
          on:click={() => startArcade(groupId)}
        >
          <div class="game-icon">▶▶</div>
          <div class="game-lbl">GAME</div>
        </button>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .screen.lessons { margin: 0 auto; }

  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 22px 14px;
  }
  .back-btn {
    font-family: inherit; font-size: 19px; color: var(--text);
    background: none; border: none; cursor: pointer; letter-spacing: 1px;
    white-space: nowrap; text-align: left; flex: 1;
  }
  .title { font-size: 22px; font-weight: bold; letter-spacing: 3px; }
  .c1 { color: var(--accent-cyan);   text-shadow: 0 0 18px color-mix(in srgb,var(--accent-cyan)   60%,transparent); }
  .c2 { color: var(--accent-green);  text-shadow: 0 0 18px color-mix(in srgb,var(--accent-green)  60%,transparent); }
  .c3 { color: var(--accent-yellow); text-shadow: 0 0 18px color-mix(in srgb,var(--accent-yellow) 60%,transparent); }
  .topbar-right { flex: 1; display: flex; justify-content: flex-end; align-items: center; }
  .player-name {
    font-size: 17px; font-weight: bold; letter-spacing: 2px;
    color: var(--pc, var(--accent-cyan));
    text-shadow: 0 0 10px color-mix(in srgb, var(--pc, var(--accent-cyan)) 70%, transparent);
  }

  .inner { padding: 0 22px 32px; }

  /* ── Utility tiles (guide / progress) ── */
  .util-tile {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    background: var(--bg-raised);
    border: 1.5px solid var(--border);
    border-radius: 7px;
    padding: 13px 16px;
    margin-bottom: 10px;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
  }
  .util-tile-body {}
  .util-tile-title { font-size: 19px; font-weight: bold; letter-spacing: 2px; }
  .util-tile-sub   { font-size: 16px; color: var(--text-muted); letter-spacing: 1px; margin-top: 3px; }
  .util-tile-arrow { font-size: 20px; flex-shrink: 0; }

  .guide-tile { border-color: color-mix(in srgb,var(--accent-green) 25%,var(--border)); }
  .guide-tile .util-tile-title { color: var(--accent-green); }
  .guide-tile .util-tile-arrow { color: color-mix(in srgb,var(--accent-green) 50%,transparent); }
  .guide-tile:hover { border-color: var(--accent-green); }

  .progress-tile { border-color: color-mix(in srgb,var(--accent-cyan) 20%,var(--border)); overflow: visible; }
  .chick-wrap { flex-shrink: 0; display: flex; align-items: center; }
  .progress-tile .util-tile-title { color: var(--accent-cyan); }
  .progress-tile .util-tile-arrow { color: color-mix(in srgb,var(--accent-cyan) 50%,transparent); }
  .progress-tile:hover { border-color: var(--accent-cyan); }

  /* ── Group label ── */
  .group-lbl {
    font-size: 17px;
    letter-spacing: 3px;
    color: var(--text-muted);
    margin: 20px 0 8px;
  }

  /* ── Lesson row ── */
  .lesson-row {
    display: flex;
    gap: 7px;
    align-items: stretch;
  }

  /* ── Lesson tiles ── */
  .ltile {
    flex: 1;
    background: var(--bg-raised);
    border: 1.5px solid var(--border);
    border-radius: 7px;
    padding: 11px 6px;
    text-align: center;
    font-family: inherit;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    min-height: 58px;
  }
  .ltile--wide { flex: 2; }

  .ltile--completed {
    border-color: color-mix(in srgb,var(--accent-green) 30%,var(--border));
  }
  .ltile--completed .lkeys  { color: var(--accent-green); }
  .ltile--completed .lstate { color: color-mix(in srgb,var(--accent-green) 40%,transparent); }
  .ltile--completed:hover { border-color: var(--accent-green); box-shadow: 0 0 10px color-mix(in srgb,var(--accent-green) 25%,transparent); }

  .ltile--recommended {
    border-color: var(--accent-yellow);
    box-shadow: 0 0 10px color-mix(in srgb,var(--accent-yellow) 30%,transparent);
  }
  .ltile--recommended:hover { box-shadow: 0 0 18px color-mix(in srgb,var(--accent-yellow) 55%,transparent); }
  .ltile--recommended .lkeys  { color: var(--accent-yellow); }
  .ltile--recommended .lstate {
    color: var(--accent-yellow);
    font-size: 13px;
    font-weight: bold;
    letter-spacing: 1px;
    text-shadow: 0 0 8px color-mix(in srgb,var(--accent-yellow) 60%,transparent);
  }

  .ltile--unplayed {
    border-color: color-mix(in srgb,var(--accent-cyan) 20%,var(--border));
  }
  .ltile--unplayed .lkeys  { color: var(--text-muted); }
  .ltile--unplayed .lstate { color: color-mix(in srgb,var(--text-muted) 40%,transparent); }
  .ltile--unplayed:hover { border-color: var(--accent-cyan); box-shadow: 0 0 10px color-mix(in srgb,var(--accent-cyan) 20%,transparent); }

  .lkeys  { font-size: 18px; font-weight: bold; letter-spacing: 1px; color: var(--text); }
  .lstate { font-size: 15px; letter-spacing: 1px; }

  /* ── Game tile ── */
  .game-tile {
    width: 64px;
    flex-shrink: 0;
    background: var(--bg-raised);
    border: 1.5px solid var(--border);
    border-radius: 7px;
    padding: 11px 6px;
    text-align: center;
    font-family: inherit;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    min-height: 58px;
    cursor: pointer;
  }
  .game-tile--unlocked {
    opacity: 1;
    border-color: color-mix(in srgb,var(--accent-yellow) 40%,var(--border));
    box-shadow: 0 0 8px color-mix(in srgb,var(--accent-yellow) 10%,transparent);
  }
  .game-tile--unlocked:hover {
    border-color: var(--accent-yellow);
    box-shadow: 0 0 14px color-mix(in srgb,var(--accent-yellow) 25%,transparent);
  }
  .game-icon { font-size: 17px; color: var(--accent-yellow); }
  .game-lbl  { font-size: 14px; letter-spacing: 1px; color: var(--accent-yellow); opacity: 0.7; }
</style>
