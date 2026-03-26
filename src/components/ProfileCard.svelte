<script>
  export let profile = null   // null → "new profile" card
  export let active = false
  export let onSelect = () => {}

  $: initials    = profile ? profile.name.slice(0, 2).toUpperCase() : '+'
  $: lessonCount = profile ? Object.keys(profile.lessonProgress ?? {}).length : 0
  $: topStars    = profile ? Math.max(0, ...Object.values(profile.lessonProgress ?? {}).map(p => p.stars ?? 0)) : 0
</script>

{#if profile === null}
  <button class="card card--new" on:click={onSelect}>+ NIEUW PROFIEL</button>
{:else}
  <button class="card" class:card--active={active} on:click={onSelect} style="--pc:{profile.colour}">
    <div class="avatar">{initials}</div>
    <div class="info">
      <div class="name">{profile.name.toUpperCase()}</div>
      <div class="meta">
        <span class="lcount">Les {lessonCount}/20</span>
        <span class="stars">{'★'.repeat(topStars)}{'☆'.repeat(Math.max(0, 3 - topStars))}</span>
      </div>
      <div class="pbar"><div class="pfill" style="width:{(lessonCount/20)*100}%"></div></div>
    </div>
    {#if active}<span class="badge">▶ ACTIEF</span>{/if}
  </button>
{/if}

<style>
  .card {
    width:100%; background:var(--bg-raised); border:2px solid var(--border);
    border-radius:6px; padding:10px 12px; cursor:pointer;
    display:flex; align-items:center; gap:10px; text-align:left;
  }
  .card--active { border-color:var(--pc,var(--accent-cyan)); box-shadow:0 0 12px color-mix(in srgb,var(--pc,var(--accent-cyan)) 25%,transparent); }
  .card--new { border-style:dashed; border-color:var(--accent-cyan); justify-content:center; font-family:'Courier New',monospace; font-size:15px; color:var(--accent-cyan); letter-spacing:2px; padding:16px 12px; }
  .avatar { width:32px; height:32px; border-radius:4px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-family:'Courier New',monospace; font-size:13px; font-weight:bold; background:color-mix(in srgb,var(--pc) 20%,var(--bg)); color:var(--pc); border:1px solid color-mix(in srgb,var(--pc) 40%,transparent); }
  .info { flex:1; min-width:0; }
  .name { font-family:'Courier New',monospace; font-size:13px; font-weight:bold; color:var(--text); }
  .meta { display:flex; align-items:center; gap:6px; margin-top:2px; }
  .lcount { font-size:11px; color:var(--text-muted); font-family:monospace; }
  .stars { font-size:10px; color:#ffcc00; letter-spacing:1px; }
  .pbar { height:3px; background:var(--bg-sunken); border-radius:2px; margin-top:4px; overflow:hidden; }
  .pfill { height:100%; background:var(--pc,var(--accent-cyan)); border-radius:2px; }
  .badge { font-family:monospace; font-size:10px; color:var(--pc,var(--accent-cyan)); white-space:nowrap; }
</style>
