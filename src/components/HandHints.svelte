<script>
  import { t } from '../i18n/index.js'
  import { getFingerForKey, FINGER_VARS } from '../lessons/index.js'

  export let activeKey = null

  $: isSpace      = activeKey === ' '
  $: activeFinger = isSpace ? 'thumb' : (activeKey ? getFingerForKey(activeKey) : null)
  $: fingerLabel  = activeFinger ? $t(`finger.${activeFinger}`) : ''

  const C = FINGER_VARS

  // [finger-id, tip-height-px]
  const LEFT  = [['lp',55],['lr',70],['lm',80],['li',65]]
  const RIGHT = [['ri',65],['rm',80],['rr',70],['rp',55]]
</script>

<div class="hand-hints">
  <!-- Left hand -->
  <div class="hand">
    <div class="hlabel">{$t('hand.left')}</div>
    <div class="fingers">
      {#each LEFT as [f, h]}
        <div class="finger" class:active={f === activeFinger} style="--fc:{C[f]}">
          <div class="ftip" style="height:{h}px"></div>
          <div class="fbase"></div>
        </div>
      {/each}
      <div class="finger thumb" class:active={isSpace} style="--fc:var(--accent-yellow)">
        <div class="ftip" style="height:28px;transform:rotate(10deg);transform-origin:bottom center;border-radius:5px 5px 0 0;"></div>
        <div class="fbase"></div>
      </div>
    </div>
    <div class="palm" style="background:linear-gradient(90deg,{C.lp},{C.lr},{C.lm},{C.li},{C.li})"></div>
  </div>

  <!-- Centre label -->
  <div class="hint-centre">
    <div class="hint-title">{$t('exercise.nextFinger')}</div>
    {#if activeFinger}
      {@const hintColor = isSpace ? 'var(--accent-yellow)' : C[activeFinger]}
      <div class="hint-finger" style="color:{hintColor};text-shadow:0 0 8px {hintColor}">{fingerLabel}</div>
      <div class="hint-key"    style="color:{hintColor}">{isSpace ? '⎵' : activeKey?.toUpperCase()}</div>
    {/if}
  </div>

  <!-- Right hand -->
  <div class="hand">
    <div class="hlabel">{$t('hand.right')}</div>
    <div class="fingers">
      <div class="finger thumb" class:active={isSpace} style="--fc:var(--accent-yellow)">
        <div class="ftip" style="height:28px;transform:rotate(-10deg);transform-origin:bottom center;border-radius:5px 5px 0 0;"></div>
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

  .hand-hints { display:flex; justify-content:space-between; align-items:flex-end; padding:0 8px; margin-bottom:12px; }
  .hand { display:flex; flex-direction:column; align-items:center; gap:5px; flex-shrink:0; }
  .hlabel { font-size:12px; color:var(--text-muted); letter-spacing:1px; margin-bottom:2px; }
  .fingers { display:flex; gap:5px; align-items:flex-end; }
  .finger { display:flex; flex-direction:column; justify-content:flex-end; }
  .ftip { width:18px; border-radius:5px 5px 0 0; background:var(--fc); opacity:.3; }
  .fbase { width:18px; height:12px; background:var(--fc); opacity:.3; }
  .finger.active .ftip,
  .finger.active .fbase { opacity:1; box-shadow:0 0 12px var(--fc); animation:fglow .9s ease-in-out infinite; }
  .palm { width:96px; height:14px; border-radius:0 0 6px 6px; opacity:.2; }

  .hint-centre { flex:1; text-align:center; padding:0 24px; }
  .hint-title  { font-size:11px; color:var(--text-muted); letter-spacing:2px; margin-bottom:8px; }
  .hint-finger { font-size:20px; font-weight:bold; letter-spacing:2px; line-height:1.3; }
  .hint-key    { font-size:48px; font-weight:bold; margin-top:4px; line-height:1; }
</style>
