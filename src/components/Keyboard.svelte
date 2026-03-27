<script>
  import { FINGER_MAP } from '../lessons/index.js'
  import { t } from '../i18n/index.js'

  export let activeKey = null

  // Row stagger offsets (px) — matches real ANSI keyboard proportions
  const ROW_STAGGER = [0, 22, 36, 54]

  const ROWS = [
    ['1','2','3','4','5','6','7','8','9','0'],
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l',';'],
    ['z','x','c','v','b','n','m',',','.','/'],
  ]

  const FINGER_VARS = {
    lp:'var(--f-lp)', lr:'var(--f-lr)', lm:'var(--f-lm)', li:'var(--f-li)',
    ri:'var(--f-ri)', rm:'var(--f-rm)', rr:'var(--f-rr)', rp:'var(--f-rp)',
  }

  function colour(key) {
    return FINGER_VARS[FINGER_MAP[key]] ?? 'var(--text-muted)'
  }

  function isActive(key) {
    return key === activeKey?.toLowerCase()
  }
</script>

<div class="keyboard">
  {#each ROWS as row, ri}
    <div class="kbd-row" style="padding-left:{ROW_STAGGER[ri]}px">
      {#each row as key}
        <span
          class="key"
          class:key--active={isActive(key)}
          style="--kc:{colour(key)}"
        >{key.toUpperCase()}</span>
      {/each}
    </div>
  {/each}
  <div class="kbd-row kbd-row--space">
    <span class="key key--space"
      class:key--active={activeKey === ' '}
      style="--kc:var(--accent-yellow)"
    >{$t('keyboard.space')}</span>
  </div>
</div>

<style>
  @keyframes key-active {
    0%,100% { box-shadow:0 0 6px var(--kc), 0 0 16px var(--kc), 0 0 32px var(--kc); }
    50%     { box-shadow:0 0 10px var(--kc), 0 0 28px var(--kc), 0 0 55px var(--kc); }
  }
  @keyframes space-active {
    0%,100% { box-shadow:0 0 6px var(--kc), 0 0 14px var(--kc); }
    50%     { box-shadow:0 0 10px var(--kc), 0 0 24px var(--kc); }
  }

  .keyboard {
    background:var(--bg-raised); border-radius:6px; padding:14px 16px 14px; border:1px solid var(--border);
    display:flex; flex-direction:column; gap:6px;
    width:fit-content; margin:0 auto;
  }
  .kbd-row { display:flex; gap:6px; }
  .kbd-row--space { justify-content:center; padding-left:0; margin-top:2px; }

  .key {
    font-family:'Courier New',monospace; font-size:15px; font-weight:bold;
    border-radius:6px; padding:11px 0; width:48px; text-align:center; flex-shrink:0;
    background:color-mix(in srgb, var(--kc) 15%, var(--bg-sunken)); color:var(--kc);
    border:1px solid color-mix(in srgb, var(--kc) 30%, transparent);
    border-bottom:3px solid color-mix(in srgb, var(--kc) 70%, transparent);
    text-shadow:0 0 6px var(--kc);
    box-shadow:0 2px 4px rgba(0,0,0,0.4);
    transition:background 0.05s;
  }
  .key--active {
    position:relative; z-index:1;
    background:var(--kc) !important;
    color:var(--bg) !important;
    text-shadow:none !important;
    border:2px solid rgba(255,255,255,0.6) !important;
    border-bottom:4px solid rgba(255,255,255,0.35) !important;
    font-size:17px;
    transform:scale(1.1);
    animation:key-active 0.9s ease-in-out infinite;
  }
  .key--space.key--active {
    transform:none;
    animation:space-active 0.9s ease-in-out infinite;
  }
  .key--space {
    width:auto; min-width:280px; padding:11px 24px;
    color:var(--text-muted); border-color:color-mix(in srgb,var(--text-muted) 30%,transparent);
    border-bottom-color:color-mix(in srgb,var(--text-muted) 50%,transparent);
    text-shadow:none; letter-spacing:3px;
  }
</style>
