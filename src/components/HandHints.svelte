<script>
  import { get } from 'svelte/store'
  import { t } from '../i18n/index.js'
  import { getFingerForKey } from '../lessons/index.js'

  export let activeKey = null

  $: activeFinger = activeKey ? getFingerForKey(activeKey) : null
  $: fingerLabel  = activeFinger ? get(t)(`finger.${activeFinger}`) : ''

  const C = {
    lp:'var(--f-lp)', lr:'var(--f-lr)', lm:'var(--f-lm)', li:'var(--f-li)',
    ri:'var(--f-ri)', rm:'var(--f-rm)', rr:'var(--f-rr)', rp:'var(--f-rp)',
  }

  // [finger-id, tip-height-px]
  const LEFT  = [['lp',30],['lr',38],['lm',44],['li',36]]
  const RIGHT = [['ri',36],['rm',44],['rr',38],['rp',30]]
</script>

<div class="hand-hints">
  <!-- Left hand -->
  <div class="hand">
    <div class="hlabel">{get(t)('hand.left')}</div>
    <div class="fingers">
      {#each LEFT as [f, h]}
        <div class="finger" class:active={f === activeFinger} style="--fc:{C[f]}">
          <div class="ftip" style="height:{h}px"></div>
          <div class="fbase"></div>
        </div>
      {/each}
      <div class="finger thumb" style="--fc:{C.li};opacity:.3">
        <div class="ftip" style="height:20px;transform:rotate(10deg);transform-origin:bottom center;border-radius:5px 5px 0 0;"></div>
        <div class="fbase"></div>
      </div>
    </div>
    <div class="palm" style="background:linear-gradient(90deg,{C.lp},{C.lr},{C.lm},{C.li},{C.li})"></div>
  </div>

  <!-- Centre label -->
  <div class="hint-centre">
    <div class="hint-title">{get(t)('exercise.nextFinger')}</div>
    {#if activeFinger}
      <div class="hint-finger" style="color:{C[activeFinger]};text-shadow:0 0 8px {C[activeFinger]}">{fingerLabel}</div>
      <div class="hint-key"    style="color:{C[activeFinger]}">{activeKey?.toUpperCase()}</div>
    {/if}
  </div>

  <!-- Right hand -->
  <div class="hand">
    <div class="hlabel">{get(t)('hand.right')}</div>
    <div class="fingers">
      <div class="finger thumb" style="--fc:{C.ri};opacity:.3">
        <div class="ftip" style="height:20px;transform:rotate(-10deg);transform-origin:bottom center;border-radius:5px 5px 0 0;"></div>
        <div class="fbase"></div>
      </div>
      {#each RIGHT as [f, h]}
        <div class="finger" class:active={f === activeFinger} style="--fc:{C[f]}">
          <div class="ftip" style="height:{h}px"></div>
          <div class="fbase"></div>
        </div>
      {/each}
    </div>
    <div class="palm" style="background:linear-gradient(90deg,{C.ri},{C.ri},{C.rm},{C.rr},{C.rp})"></div>
  </div>
</div>

<style>
  @keyframes fglow { 0%,100%{opacity:.7} 50%{opacity:1} }

  .hand-hints { display:flex; justify-content:space-between; align-items:flex-end; padding:0 4px; margin-bottom:8px; }
  .hand { display:flex; flex-direction:column; align-items:center; gap:3px; }
  .hlabel { font-size:8px; color:var(--text-muted); letter-spacing:1px; margin-bottom:2px; }
  .fingers { display:flex; gap:2px; align-items:flex-end; }
  .finger { display:flex; flex-direction:column; justify-content:flex-end; }
  .ftip { width:9px; border-radius:3px 3px 0 0; background:var(--fc); opacity:.3; }
  .fbase { width:9px; height:6px; background:var(--fc); opacity:.3; }
  .finger.active .ftip,
  .finger.active .fbase { opacity:1; box-shadow:0 0 8px var(--fc); animation:fglow .9s ease-in-out infinite; }
  .palm { width:50px; height:8px; border-radius:0 0 4px 4px; opacity:.2; }

  .hint-centre { text-align:center; padding:0 6px; }
  .hint-title  { font-size:8px; color:var(--text-muted); letter-spacing:1px; margin-bottom:3px; }
  .hint-finger { font-size:10px; font-weight:bold; letter-spacing:1px; line-height:1.4; }
  .hint-key    { font-size:18px; font-weight:bold; margin-top:2px; }
</style>
