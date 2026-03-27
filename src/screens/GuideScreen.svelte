<script>
  import { t } from '../i18n/index.js'
  import { goTo } from '../stores/screen.js'
  import { FINGER_MAP } from '../lessons/index.js'

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

<div class="screen guide">
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
  .screen.guide { max-width: 900px; margin: 0 auto; }

  .topbar { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px 0; }
  .back-btn { font-family: inherit; font-size: 13px; color: var(--text); background: none; border: none; cursor: pointer; letter-spacing: 1px; }
  .title { font-size: 14px; color: var(--text); letter-spacing: 2px; }

  .inner { padding: 16px 24px 40px; }
  .section-title { font-size: 13px; color: var(--accent-cyan); letter-spacing: 3px; font-weight: bold; margin-bottom: 14px; margin-top: 4px; text-shadow: 0 0 10px color-mix(in srgb, var(--accent-cyan) 40%, transparent); }
  .body-text { font-size: 14px; color: var(--text-muted); letter-spacing: 0.5px; line-height: 1.8; margin-top: 10px; }
  .divider { height: 1px; background: var(--border); margin: 24px 0; }

  /* ── Home row ── */
  .home-row-block { background: var(--bg-sunken); border-radius: 8px; padding: 18px 14px 12px; }
  .home-row-keys { display: flex; gap: 4px; justify-content: center; margin-bottom: 10px; }
  .gap { color: var(--border); align-self: flex-start; padding: 12px 4px 0; font-size: 16px; }
  .key { display: flex; flex-direction: column; align-items: center; gap: 6px; width: 76px; overflow: hidden; }
  .key-char {
    padding: 12px 0; border-radius: 6px; font-size: 26px; font-weight: bold;
    color: var(--kc); border: 1px solid var(--kc);
    width: 60px; text-align: center; font-family: 'Courier New', monospace; flex-shrink: 0;
  }
  .key.bump .key-char { border-bottom-width: 3px; }
  .key.dim { opacity: 0.3; }
  .key-finger { font-size: 10px; color: var(--kc); letter-spacing: 0px; opacity: 0.8; text-align: center; width: 76px; line-height: 1.3; word-break: break-word; }
  .hand-labels { display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); letter-spacing: 1px; padding: 0 2px; }

  /* ── Keyboard zones ── */
  .kbd-block { background: var(--bg-sunken); border-radius: 6px; padding: 10px 12px 8px; }
  .kbd-row { display: flex; gap: 4px; justify-content: center; margin-bottom: 4px; }
  .kbd-key {
    padding: 5px 4px; border-radius: 3px; font-size: 12px; font-weight: bold;
    color: var(--kc); border: 1px solid var(--kc);
    min-width: 26px; text-align: center; font-family: 'Courier New', monospace;
  }
  .kbd-space { text-align: center; font-size: 11px; color: var(--text-muted); letter-spacing: 2px; margin-top: 6px; }
</style>
