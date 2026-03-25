<script>
  export let state = 'idle'  // 'idle' | 'happy' | 'error'
  export let size = 60

  let timer = null

  export function trigger(newState) {
    state = newState
    clearTimeout(timer)
    timer = setTimeout(() => { state = 'idle' }, 600)
  }
</script>

{#if state === 'idle' || state === 'happy'}
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
</style>
