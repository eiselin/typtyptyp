<script>
  import { FINGER_MAP } from '../lessons/index.js'

  export let activeKey = null     // next key to press (lowercase)
  export let lessonKeys = new Set() // keys in scope for this lesson; empty = show all

  const ROWS = [
    ['1','2','3','4','5','6','7','8','9','0'],
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l',';'],
    ['z','x','c','v','b','n','m'],
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

  function inLesson(key) {
    return lessonKeys.size === 0 || lessonKeys.has(key)
  }
</script>

<div class="keyboard">
  {#each ROWS as row}
    <div class="kbd-row">
      {#each row as key}
        <span
          class="key"
          class:key--active={isActive(key)}
          class:key--dim={!inLesson(key)}
          style="--kc:{colour(key)}"
        >{key.toUpperCase()}</span>
      {/each}
    </div>
  {/each}
</div>

<style>
  @keyframes key-glow { 0%,100%{box-shadow:0 0 8px var(--kc)} 50%{box-shadow:0 0 18px var(--kc)} }

  .keyboard { background:var(--bg-raised); border-radius:6px; padding:10px 8px 8px; border:1px solid var(--border); display:flex; flex-direction:column; gap:3px; }
  .kbd-row { display:flex; gap:3px; justify-content:center; }
  .key {
    font-family:'Courier New',monospace; font-size:11px; font-weight:bold;
    border-radius:3px; padding:5px 7px; min-width:26px; text-align:center;
    background:var(--bg-sunken); color:var(--kc);
    border-bottom:2px solid color-mix(in srgb, var(--kc) 35%, transparent);
    transition:background 0.05s, color 0.05s;
  }
  .key--active {
    background:var(--kc) !important; color:var(--bg) !important;
    font-size:13px; border-color:color-mix(in srgb, var(--kc) 70%, black) !important;
    animation:key-glow 0.9s ease-in-out infinite;
  }
  .key--dim { opacity:0.25; }
</style>
