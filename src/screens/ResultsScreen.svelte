<script>
  import { t } from '../i18n/index.js'
  import { results } from '../stores/results.js'
  import { LESSONS } from '../lessons/index.js'
  import { goTo, selectLesson } from '../stores/screen.js'
  import PixelChick from '../components/PixelChick.svelte'

  $: r = $results ?? { stars:0, accuracy:0, wpm:0, lessonId:1 }
  $: nextLesson = LESSONS.find(l => l.id === r.lessonId + 1)

  const CC = ['var(--accent-green)','var(--accent-cyan)','var(--accent-yellow)','var(--f-lp)','var(--f-rm)','var(--f-lr)','var(--f-rp)','var(--f-lm)']
  const confetti = Array.from({length:12}, (_,i) => ({
    left:`${6 + i*8}%`,
    colour: CC[i % CC.length],
    delay: `${(i*0.15).toFixed(2)}s`,
    anim: ['c1','c2','c3'][i%3],
  }))
</script>

<div class="screen results">
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
        <button class="btn-next" on:click={() => goTo('lessons')}>{$t('nav.back')}</button>
      {/if}
    </div>
  </div>
</div>

<style>
  @keyframes c1 { 0%{transform:translateY(-10px) rotate(0);opacity:1} 100%{transform:translateY(90px) rotate(360deg);opacity:0} }
  @keyframes c2 { 0%{transform:translateY(-10px) rotate(0);opacity:1} 100%{transform:translateY(70px) rotate(-240deg);opacity:0} }
  @keyframes c3 { 0%{transform:translateY(-10px) rotate(0);opacity:1} 100%{transform:translateY(80px) rotate(180deg);opacity:0} }
  @keyframes star-pop { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }

  .screen.results { max-width:480px; margin:0 auto; }
  .confetti-layer { position:absolute; top:0; left:0; right:0; height:110px; overflow:hidden; pointer-events:none; }
  .cp { position:absolute; top:0; width:6px; height:6px; border-radius:1px; }
  .inner { padding:28px 22px; text-align:center; }
  .chick-wrap { display:flex; justify-content:center; margin-bottom:12px; }
  .stars-lbl { font-size:12px; color:var(--text-muted); letter-spacing:2px; margin-bottom:8px; }
  .stars { display:flex; gap:8px; justify-content:center; margin-bottom:20px; }
  .star { animation:star-pop .4s ease-out both; }
  .stat-cards { display:flex; gap:16px; justify-content:center; margin-bottom:24px; }
  .stat-card { background:var(--bg-raised); border:1px solid var(--border); border-radius:6px; padding:10px 20px; }
  .sv { font-size:22px; font-weight:bold; }
  .sl { font-size:11px; color:var(--text-muted); letter-spacing:1px; margin-top:2px; }
  .btn-row { display:flex; gap:10px; }
  .btn-retry { flex:1; padding:11px; background:var(--bg-sunken); border:1px solid var(--border); border-radius:4px; font-size:13px; font-weight:bold; letter-spacing:2px; color:var(--text); }
  .btn-next  { flex:2; padding:11px; background:var(--accent-green); color:var(--bg); border-radius:4px; font-size:14px; font-weight:bold; letter-spacing:2px; box-shadow:0 0 18px color-mix(in srgb,var(--accent-green) 40%,transparent); }
</style>
