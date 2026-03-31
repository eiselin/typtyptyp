<script>
  import { t } from '../i18n/index.js'
  import { goTo } from '../stores/screen.js'
  import { arrowNav } from '../utils/keyboard.js'

  let screenEl
</script>

<svelte:window on:keydown={e => { if (e.key === 'Escape') goTo('home'); else if (screenEl) arrowNav(e, screenEl) }} />

<div class="screen about" bind:this={screenEl}>
  <div class="topbar">
    <button class="back-btn" on:click={() => goTo('home')}>{$t('nav.back')}</button>
    <span class="title">{$t('about.title')}</span>
    <span class="spacer"></span>
  </div>

  <div class="inner">
    <p class="body-text">{$t('about.body1')}</p>
    <p class="body-text">{$t('about.body2')}</p>
    <p class="body-text">{$t('about.body3')}</p>
    <p class="author">Nick Eiselin</p>
  </div>
</div>

<style>
  /* topbar override: centered title needs position:relative, no space-between */
  .topbar { position: relative; justify-content: flex-start; }
  .title { position: absolute; left: 50%; transform: translateX(-50%); font-size: 22px; color: var(--text); letter-spacing: 3px; font-weight: bold; pointer-events: none; }
  .spacer { flex: 1; }

  .inner { padding: 32px 22px 48px; }
  .body-text { font-size: 17px; color: var(--text-muted); letter-spacing: 0.3px; line-height: 1.9; margin: 0 0 24px; }
  .author {
    margin-top: 36px; font-size: 18px; font-weight: bold; letter-spacing: 3px;
    color: var(--accent-cyan);
    text-shadow: 0 0 10px color-mix(in srgb, var(--accent-cyan) 50%, transparent);
  }
</style>
