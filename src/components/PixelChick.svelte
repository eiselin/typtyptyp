<script>
  export let state = 'idle'  // 'idle' | 'happy' | 'error' | 'hop' | 'splash' | 'wobble'
  export let size = 60

  let timer = null

  export function trigger(newState) {
    state = newState
    clearTimeout(timer)
    const duration = newState === 'splash' ? 1200 : 600
    timer = setTimeout(() => { state = 'idle' }, duration)
  }
</script>

{#if state === 'idle' || state === 'happy' || state === 'hop' || state === 'splash' || state === 'wobble'}
  <svg width={size} height={Math.round(size * 1.08)} viewBox="0 0 12 13"
    style="image-rendering:pixelated;image-rendering:crisp-edges;display:block;"
    class="chick chick--{state}">
    {#if state === 'happy'}
      <rect x="0" y="4" width="1" height="2" fill="#CC8800"/>
      <rect x="11" y="4" width="1" height="2" fill="#CC8800"/>
    {/if}
    <rect x="3" y="0" width="4" height="1" fill="#FFD700"/>
    <rect x="2" y="1" width="6" height="1" fill="#FFD700"/>
    <rect x="1" y="2" width="8" height="1" fill="#FFD700"/>
    <rect x="1" y="3" width="1" height="1" fill="#FFD700"/>
    <rect x="2" y="3" width="1" height="1" fill="#FF8800"/>
    <rect x="3" y="3" width="6" height="1" fill="#FFD700"/>
    <rect x="0" y="4" width="2" height="1" fill="#FFD700"/>
    <rect x="2" y="4" width="2" height="1" fill="#FF8800"/>
    <rect x="4" y="4" width="1" height="1" fill="#FFD700"/>
    <rect x="5" y="4" width="1" height="1" fill={state === 'happy' ? '#FFF700' : '#110033'}/>
    <rect x="6" y="4" width="4" height="1" fill="#FFD700"/>
    <rect x="0" y="5" width="10" height="1" fill="#FFD700"/>
    {#if state === 'idle'}
      <rect x="0" y="6" width="1" height="1" fill="#CC8800"/>
      <rect x="9" y="6" width="1" height="1" fill="#CC8800"/>
    {/if}
    <rect x="1" y="6" width="8" height="1" fill="#FFD700"/>
    <rect x="1" y="7" width="8" height="1" fill="#FFD700"/>
    <rect x="2" y="8" width="6" height="1" fill="#FFD700"/>
    <rect x="3" y="9" width="4" height="1" fill="#FFD700"/>
    <rect x="3" y="10" width="1" height="1" fill="#FF8800"/>
    <rect x="6" y="10" width="1" height="1" fill="#FF8800"/>
    <rect x="2" y="11" width="2" height="1" fill="#FF8800"/>
    <rect x="6" y="11" width="2" height="1" fill="#FF8800"/>
  </svg>
{:else}
  <!-- Error state -->
  <svg width={size} height={Math.round(size * 1.08)} viewBox="0 0 12 13"
    style="image-rendering:pixelated;image-rendering:crisp-edges;display:block;"
    class="chick chick--error">
    <rect x="3" y="0" width="4" height="1" fill="#FFD700"/>
    <rect x="2" y="1" width="6" height="1" fill="#FFD700"/>
    <rect x="1" y="2" width="8" height="1" fill="#FFD700"/>
    <rect x="1" y="3" width="8" height="1" fill="#FFD700"/>
    <rect x="4" y="3" width="1" height="1" fill="#ff4455"/>
    <rect x="6" y="3" width="1" height="1" fill="#ff4455"/>
    <rect x="0" y="4" width="2" height="1" fill="#FFD700"/>
    <rect x="2" y="4" width="2" height="1" fill="#FF8800"/>
    <rect x="4" y="4" width="1" height="1" fill="#FFD700"/>
    <rect x="5" y="4" width="1" height="1" fill="#ff4455"/>
    <rect x="6" y="4" width="4" height="1" fill="#FFD700"/>
    <rect x="0" y="5" width="2" height="1" fill="#FFD700"/>
    <rect x="2" y="5" width="1" height="1" fill="#FF8800"/>
    <rect x="3" y="5" width="7" height="1" fill="#FFD700"/>
    <rect x="0" y="6" width="2" height="1" fill="#CC8800"/>
    <rect x="2" y="6" width="6" height="1" fill="#FFD700"/>
    <rect x="8" y="6" width="2" height="1" fill="#CC8800"/>
    <rect x="1" y="7" width="8" height="1" fill="#FFD700"/>
    <rect x="2" y="8" width="6" height="1" fill="#FFD700"/>
    <rect x="3" y="9" width="4" height="1" fill="#FFD700"/>
    <rect x="4" y="10" width="2" height="1" fill="#FF8800"/>
    <rect x="3" y="11" width="3" height="1" fill="#FF8800"/>
  </svg>
{/if}

<style>
  @keyframes bob      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
  @keyframes bob-fast { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes shake    { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-3px)} 75%{transform:translateX(3px)} }

  .chick--idle  { animation: bob      2s    ease-in-out infinite; }
  .chick--happy { animation: bob-fast 0.4s  ease-in-out infinite; }
  .chick--error { animation: shake    0.15s ease-in-out 4; }

  @keyframes hop    { 0%{transform:translateY(0)} 30%{transform:translateY(-14px)} 60%{transform:translateY(-8px)} 100%{transform:translateY(0)} }
  @keyframes splash { 0%{transform:translateY(0) rotate(0)} 20%{transform:translateY(6px) rotate(-20deg)} 50%{transform:translateY(12px) rotate(15deg)} 80%{transform:translateX(30px) translateY(8px)} 100%{transform:translateX(60px) translateY(4px) rotate(0)} }
  @keyframes wobble { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-15deg)} 40%{transform:rotate(15deg)} 60%{transform:rotate(-12deg)} 80%{transform:rotate(10deg)} }

  .chick--hop    { animation: hop    0.4s ease-out both; }
  .chick--splash { animation: splash 1.0s ease-in  both; }
  .chick--wobble { animation: wobble 0.4s ease-in-out 1; }
</style>
