<script>
  import { FINGER_MAP } from '../lessons/index.js'

  export let sequence = ''
  export let cursor = 0

  const FV = {
    lp:'var(--f-lp)', lr:'var(--f-lr)', lm:'var(--f-lm)', li:'var(--f-li)',
    ri:'var(--f-ri)', rm:'var(--f-rm)', rr:'var(--f-rr)', rp:'var(--f-rp)',
  }

  $: chars = sequence.split('')
</script>

<div class="tiles">
  {#each chars as char, i}
    {#if char === ' '}
      <span class="tile tile--space"></span>
    {:else}
      {@const finger = FINGER_MAP[char.toLowerCase()]}
      {@const colour = finger ? FV[finger] : 'var(--text)'}
      <span
        class="tile"
        class:tile--done={i < cursor}
        class:tile--active={i === cursor}
        class:tile--pending={i > cursor}
        style="--tc:{colour}"
      >{char}</span>
    {/if}
  {/each}
</div>

<style>
  @keyframes tglow { 0%,100%{box-shadow:0 0 8px var(--tc)} 50%{box-shadow:0 0 18px var(--tc)} }

  .tiles { display:flex; flex-wrap:wrap; gap:4px; }
  .tile {
    font-family:'Courier New',monospace; font-size:18px; font-weight:bold;
    padding:5px 9px; border-radius:4px; border-bottom:3px solid;
    display:inline-block; min-width:32px; text-align:center;
  }
  .tile--space   { min-width:16px; border:none; background:transparent; }
  .tile--done    { background:var(--bg-sunken); color:var(--accent-green); border-color:#005533; opacity:.5; }
  .tile--active  { background:var(--tc); color:var(--bg); border-color:color-mix(in srgb,var(--tc) 70%,black); animation:tglow .9s ease-in-out infinite; }
  .tile--pending { background:#140a28; color:#140a28; border-color:#140a28; }
</style>
