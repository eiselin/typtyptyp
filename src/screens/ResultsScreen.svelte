<script>
  import { t } from '../i18n/index.js'
  import { results } from '../stores/results.js'
  import { gameResults } from '../stores/game.js'
  import { LESSONS } from '../lessons/index.js'
  import { goTo, selectLesson, startArcade } from '../stores/screen.js'
  import { getLeaderboard } from '../stores/leaderboard.js'
  import PixelChick from '../components/PixelChick.svelte'

  // ── Practice mode ───────────────────────────────────────────
  $: r = $results ?? { stars:0, accuracy:0, wpm:0, lessonId:1 }
  $: nextLesson = LESSONS.find(l => l.id === r.lessonId + 1)

  // ── Arcade mode ─────────────────────────────────────────────
  $: gr = $gameResults
  $: leaderboard = gr ? getLeaderboard() : []
  $: isNewBest = gr && gr.score > gr.prevBest

  // ── Shared confetti ─────────────────────────────────────────
  const CC = ['var(--accent-green)','var(--accent-cyan)','var(--accent-yellow)','var(--f-lp)','var(--f-rm)','var(--f-lr)','var(--f-rp)','var(--f-lm)']
  const confetti = Array.from({length:12}, (_,i) => ({
    left:`${6 + i*8}%`,
    colour: CC[i % CC.length],
    delay: `${(i*0.15).toFixed(2)}s`,
    anim: ['c1','c2','c3'][i%3],
  }))
</script>

<svelte:window on:keydown={e => { if (e.key === 'Escape') { if (gr) gameResults.set(null); goTo('lessons') } }} />

<div class="screen results">
  {#if gr}
    <!-- ── ARCADE RESULTS ── -->
    <div class="confetti-layer" aria-hidden="true">
      {#each confetti as c}
        <div class="cp" style="left:{c.left};background:{c.colour};animation:{c.anim} 2s ease-in {c.delay} infinite"></div>
      {/each}
    </div>
    <div class="inner">
      <div class="chick-wrap"><PixelChick size={80} state="happy" /></div>

      {#if isNewBest}
        <div class="new-best">{$t('arcade.newBest')}</div>
      {/if}

      <div class="arcade-score">{gr.score}</div>
      <div class="score-label">{$t('arcade.hud.score')}</div>

      <div class="stat-cards">
        <div class="stat-card">
          <div class="sv" style="color:var(--accent-green)">{gr.crossings}</div>
          <div class="sl">{$t('arcade.crossings')}</div>
        </div>
        <div class="stat-card">
          <div class="sv" style="color:var(--text-muted); font-size:16px">{gr.prevBest}</div>
          <div class="sl">{$t('arcade.hud.best')}</div>
        </div>
      </div>

      <!-- Leaderboard -->
      <div class="lb-title">{$t('arcade.leaderboard')}</div>
      <div class="lb">
        {#each leaderboard as entry, i}
          <div class="lb-row" class:lb-row--me={entry.score === gr.score && entry.profileName === gr.profileName && entry.groupId === gr.groupId}>
            <span class="lb-rank">#{i+1}</span>
            <span class="lb-name">{entry.profileName}</span>
            <span class="lb-score">{entry.score}</span>
          </div>
        {/each}
      </div>

      <div class="btn-row">
        <button class="btn-retry" on:click={() => { gameResults.set(null); startArcade(gr.groupId) }}>
          {$t('arcade.playAgain')}
        </button>
        <button class="btn-next" on:click={() => { gameResults.set(null); goTo('lessons') }}>
          {$t('arcade.backToLessons')}
        </button>
      </div>
    </div>

  {:else}
    <!-- ── PRACTICE RESULTS ── -->
    <div class="confetti-layer" aria-hidden="true">
      {#each confetti as c}
        <div class="cp" style="left:{c.left};background:{c.colour};animation:{c.anim} 2s ease-in {c.delay} infinite"></div>
      {/each}
    </div>
    <div class="inner">
      <div class="chick-wrap"><PixelChick size={120} state="happy" /></div>

      <div class="stars-wrap">
        <div class="stars-lbl">{$t('results.score')}</div>
        <div class="stars">
          {#each [1,2,3] as n}
            <svg class="star" width="38" height="38" viewBox="0 0 10 10" style="animation-delay:{n*0.2}s">
              <polygon points="5,0 6,3.5 10,3.5 7,5.8 8,9.5 5,7.5 2,9.5 3,5.8 0,3.5 4,3.5"
                fill={n <= r.stars ? '#ffcc00' : 'var(--bg-sunken)'}
                stroke={n <= r.stars ? '#f0a000' : 'var(--border)'} stroke-width="0.3"/>
            </svg>
          {/each}
        </div>
      </div>

      <div class="stat-cards">
        <div class="stat-card">
          <div class="sv" style="color:var(--accent-green)">{r.accuracy}%</div>
          <div class="sl">{$t('results.accuracy')}</div>
        </div>
        <div class="stat-card">
          <div class="sv" style="color:var(--accent-cyan)">{r.wpm}</div>
          <div class="sl">{$t('results.wpm')}</div>
        </div>
      </div>

      <div class="btn-row">
        <button class="btn-retry" on:click={() => selectLesson(r.lessonId)}>{$t('nav.retry')}</button>
        {#if nextLesson}
          <button class="btn-next" on:click={() => selectLesson(nextLesson.id)}>{$t('nav.nextLesson')}</button>
        {:else}
          <button class="btn-next" on:click={() => goTo('lessons')}>{$t('arcade.backToLessons')}</button>
        {/if}
      </div>
      {#if nextLesson}
        <button class="btn-lessons" on:click={() => goTo('lessons')}>{$t('arcade.backToLessons')}</button>
      {/if}
    </div>
  {/if}
</div>

<style>
  @keyframes c1 { 0%{transform:translateY(-10px) rotate(0);opacity:1} 100%{transform:translateY(90px) rotate(360deg);opacity:0} }
  @keyframes c2 { 0%{transform:translateY(-10px) rotate(0);opacity:1} 100%{transform:translateY(70px) rotate(-240deg);opacity:0} }
  @keyframes c3 { 0%{transform:translateY(-10px) rotate(0);opacity:1} 100%{transform:translateY(80px) rotate(180deg);opacity:0} }
  @keyframes star-pop { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }

  .screen.results { max-width:480px; margin:0 auto; }
  .confetti-layer { position:absolute; top:0; left:0; right:0; height:110px; overflow:hidden; pointer-events:none; }
  .cp { position:absolute; top:0; width:6px; height:6px; border-radius:1px; }
  .inner { padding:24px 22px; text-align:center; }
  .chick-wrap { display:flex; justify-content:center; margin-bottom:10px; }

  /* Practice */
  .stars-lbl { font-size:16px; color:var(--text-muted); letter-spacing:2px; margin-bottom:8px; }
  .stars { display:flex; gap:8px; justify-content:center; margin-bottom:20px; }
  .star { animation:star-pop .4s ease-out both; }

  /* Arcade */
  .new-best {
    font-size: 17px; font-weight: bold; letter-spacing: 3px;
    color: #ffcc00; text-shadow: 0 0 12px #ffcc0088;
    margin-bottom: 6px;
    animation: glow-pulse 0.8s ease-in-out infinite alternate;
  }
  @keyframes glow-pulse {
    from { text-shadow: 0 0 12px #ffcc0088; }
    to   { text-shadow: 0 0 24px #ffcc00cc; }
  }
  .arcade-score {
    font-size: 52px; font-weight: bold; font-family: monospace;
    color: #00ffcc; text-shadow: 0 0 20px #00ffcc66;
    line-height: 1;
  }
  .score-label { font-size: 14px; color: var(--text-muted); letter-spacing: 3px; margin-bottom: 16px; }

  /* Leaderboard */
  .lb-title { font-size: 14px; color: var(--text-muted); letter-spacing: 3px; margin: 16px 0 8px; }
  .lb { border: 1px solid var(--border); border-radius: 6px; overflow: hidden; margin-bottom: 16px; }
  .lb-row {
    display: flex; align-items: center; gap: 10px;
    padding: 6px 12px; font-size: 16px; font-family: monospace;
    border-bottom: 1px solid var(--border);
    background: var(--bg-sunken);
  }
  .lb-row:last-child { border-bottom: none; }
  .lb-row--me { background: #1a0a3a; border-color: #ff8800; }
  .lb-rank  { width: 24px; color: var(--text-muted); font-size: 14px; }
  .lb-name  { flex: 1; color: var(--text); }
  .lb-score { color: #ffcc00; font-weight: bold; }
  .lb-row--me .lb-name { color: #ff8800; }
  .lb-row--me .lb-score { color: #ff8800; }

  /* Shared */
  .stat-cards { display:flex; gap:16px; justify-content:center; margin-bottom:16px; }
  .stat-card { background:var(--bg-raised); border:1px solid var(--border); border-radius:6px; padding:10px 20px; }
  .sv { font-size:22px; font-weight:bold; }
  .sl { font-size:15px; color:var(--text-muted); letter-spacing:1px; margin-top:2px; }
  .btn-row { display:flex; gap:10px; }
  .btn-retry   { flex:1; padding:11px; background:var(--bg-sunken); border:1px solid var(--border); border-radius:4px; font-size:19px; font-weight:bold; letter-spacing:2px; color:var(--text); font-family:inherit; cursor:pointer; }
  .btn-next    { flex:2; padding:11px; background:var(--accent-green); color:var(--bg); border-radius:4px; font-size:19px; font-weight:bold; letter-spacing:2px; box-shadow:0 0 18px color-mix(in srgb,var(--accent-green) 40%,transparent); font-family:inherit; cursor:pointer; border:none; }
  .btn-lessons { width:100%; margin-top:8px; padding:11px; background:transparent; border:1px solid var(--border); border-radius:4px; font-size:16px; font-weight:bold; letter-spacing:2px; color:var(--text-muted); font-family:inherit; cursor:pointer; }
  .btn-lessons:hover { border-color:var(--text-muted); color:var(--text); }
</style>
