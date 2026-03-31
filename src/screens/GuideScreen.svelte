<script>
  import { t } from '../i18n/index.js'
  import { goTo } from '../stores/screen.js'
  import { FINGER_MAP } from '../lessons/index.js'
  import { arrowNav } from '../utils/keyboard.js'

  let screenEl

  // Home row keys with metadata. null = visual gap between hands.
  const HOME_ROW = [
    { key: 'a', finger: 'lp' },
    { key: 's', finger: 'lr' },
    { key: 'd', finger: 'lm' },
    { key: 'f', finger: 'li', bump: true },
    { key: 'g', finger: 'li', dim: true },
    null,
    { key: 'h', finger: 'ri', dim: true },
    { key: 'j', finger: 'ri', bump: true },
    { key: 'k', finger: 'rm' },
    { key: 'l', finger: 'rr' },
    { key: ';', finger: 'rp' },
  ]

  const ROWS = [
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l',';'],
    ['z','x','c','v','b','n','m',',','.','/'],
  ]
</script>

<svelte:window on:keydown={e => { if (e.key === 'Escape') goTo('lessons'); else if (screenEl) arrowNav(e, screenEl) }} />

<div class="screen guide" bind:this={screenEl}>
  <div class="topbar">
    <button class="back-btn" on:click={() => goTo('lessons')}>{$t('nav.back')}</button>
    <span class="title">{$t('guide.title')}</span>
  </div>

  <div class="inner">

    <!-- Section 1: Home Row -->
    <div class="section-title">{$t('guide.homeRow.title')}</div>
    <div class="home-row-block">
      <div class="home-row-keys">
        {#each HOME_ROW as item}
          {#if item === null}
            <span class="gap">·</span>
          {:else}
            <div class="key" class:bump={item.bump} class:dim={item.dim}
              style="--kc: var(--f-{item.finger})">
              <div class="key-char">{item.key.toUpperCase()}</div>
              <div class="key-finger">{$t(`finger.${item.finger}`)}</div>
            </div>
          {/if}
        {/each}
      </div>
      <div class="hand-labels">
        <span>{$t('hand.left')}</span>
        <span>{$t('hand.right')}</span>
      </div>
    </div>
    <p class="body-text">{$t('guide.homeRow.body')}</p>

    <div class="divider"></div>

    <!-- Section 2: Finger Zones -->
    <div class="section-title">{$t('guide.zones.title')}</div>
    <div class="kbd-block">
      {#each ROWS as row}
        <div class="kbd-row">
          {#each row as key}
            {@const finger = FINGER_MAP[key]}
            <div class="kbd-key" style="--kc: var(--f-{finger})">{key.toUpperCase()}</div>
          {/each}
        </div>
      {/each}
      <div class="kbd-space">{$t('keyboard.space')}</div>
    </div>
    <p class="body-text">{$t('guide.zones.body')}</p>

    <div class="divider"></div>

    <!-- Section 3: Eyes on Screen -->
    <div class="section-title">{$t('guide.eyes.title')}</div>
    <p class="body-text">{$t('guide.eyes.body')}</p>

    <div class="divider"></div>

    <!-- Section 4: Start Slow -->
    <div class="section-title">{$t('guide.slow.title')}</div>
    <p class="body-text">{$t('guide.slow.body')}</p>

  </div>
</div>

<style>
  .screen.guide {
    /* Min width = keyboard row (can't shrink); expands up to viewport if needed */
    width: min-content;
    max-width: calc(100vw - 16px); /* 8px body padding each side */
    /* Fill viewport height; inner area scrolls only if truly too tall */
    height: calc(100dvh - 32px);   /* 16px body padding each side */
    display: flex;
    flex-direction: column;
  }

  .topbar { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px 0; flex-shrink: 0; }
  .back-btn {
    font-size: 15px; font-weight: bold; font-family: monospace; letter-spacing: 2px;
    color: color-mix(in srgb,var(--accent-cyan) 60%,transparent); background: transparent; border: none;
    padding: 4px 8px; white-space: nowrap; cursor: pointer;
    text-shadow: 0 0 5px color-mix(in srgb,var(--accent-cyan) 55%,transparent),
                 0 0 14px color-mix(in srgb,var(--accent-cyan) 28%,transparent);
    transition: text-shadow 0.15s, color 0.15s;
  }
  .back-btn:hover, .back-btn:focus-visible {
    color: var(--accent-cyan);
    text-shadow: 0 0 6px var(--accent-cyan), 0 0 16px var(--accent-cyan),
                 0 0 32px var(--accent-cyan), 0 0 60px color-mix(in srgb,var(--accent-cyan) 70%,transparent);
  }
  .title { font-size: 22px; color: var(--text); letter-spacing: 2px; }

  .inner { padding: 16px 20px 32px; flex: 1; overflow-y: auto; }
  .section-title { font-size: 18px; color: var(--accent-cyan); letter-spacing: 3px; font-weight: bold; margin-bottom: 14px; margin-top: 4px; text-shadow: 0 0 10px color-mix(in srgb, var(--accent-cyan) 40%, transparent); }
  .body-text { font-size: 18px; color: var(--text-muted); letter-spacing: 0.5px; line-height: 1.9; margin-top: 10px; }
  .divider { height: 1px; background: var(--border); margin: 20px 0; }

  /* ── Home row ── */
  .home-row-block { background: var(--bg-sunken); border-radius: 8px; padding: 16px 12px 10px; }
  .home-row-keys { display: flex; gap: 8px; justify-content: center; margin-bottom: 10px; }
  .gap { color: var(--border); align-self: flex-start; padding: 10px 2px 0; font-size: 17px; }
  .key { display: flex; flex-direction: column; align-items: center; gap: 6px; width: 96px; }
  .key-char {
    padding: 12px 0; border-radius: 6px; font-size: 26px; font-weight: bold;
    color: var(--kc); border: 1px solid var(--kc);
    width: 96px; text-align: center; font-family: 'Courier New', monospace; flex-shrink: 0;
    position: relative;
  }
  .key.bump .key-char::after {
    content: '';
    position: absolute;
    bottom: 6px;
    left: 50%;
    transform: translateX(-50%);
    width: 22px;
    height: 4px;
    background: var(--kc);
    border-radius: 2px;
    box-shadow: 0 0 8px var(--kc);
  }
  .key.dim { opacity: 0.3; }
  .key-finger { font-size: 14px; color: var(--kc); text-align: center; width: 96px; white-space: normal; line-height: 1.3; text-shadow: 0 0 8px var(--kc); font-weight: bold; }
  .hand-labels { display: flex; justify-content: space-between; font-size: 15px; color: var(--text-muted); letter-spacing: 1px; padding: 0 2px; }

  /* ── Keyboard zones ── */
  .kbd-block { background: var(--bg-sunken); border-radius: 6px; padding: 14px 16px 12px; }
  .kbd-row { display: flex; gap: 6px; justify-content: center; margin-bottom: 6px; }
  .kbd-key {
    padding: 8px 6px; border-radius: 4px; font-size: 17px; font-weight: bold;
    color: var(--kc); border: 1px solid var(--kc);
    min-width: 36px; text-align: center; font-family: 'Courier New', monospace;
    text-shadow: 0 0 8px var(--kc);
    box-shadow: 0 0 6px color-mix(in srgb, var(--kc) 30%, transparent);
    background: color-mix(in srgb, var(--kc) 8%, var(--bg-raised));
  }
  .kbd-space { text-align: center; font-size: 15px; color: var(--text-muted); letter-spacing: 2px; margin-top: 8px; }
</style>
