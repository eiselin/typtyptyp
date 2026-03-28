<script>
  import { t } from '../i18n/index.js'
  import { renameProfile, deleteProfile } from '../stores/profiles.js'
  import { LESSONS } from '../lessons/index.js'
  export let profile = null   // null → "new profile" card
  export let active = false
  export let onSelect = () => {}

  $: initials    = profile ? profile.name.slice(0, 2).toUpperCase() : '+'
  $: lessonCount = profile ? Object.keys(profile.lessonProgress ?? {}).length : 0
  $: topStars    = profile ? Math.max(0, ...Object.values(profile.lessonProgress ?? {}).map(p => p.stars ?? 0)) : 0

  let editing = false
  let confirming = false
  let editName = ''
  let editError = ''

  function startEdit() { editName = profile.name; editError = ''; editing = true }

  function saveRename() {
    try { renameProfile(profile.id, editName); editing = false }
    catch (e) { editError = e.message === 'duplicate' ? $t('home.nameTaken') : $t('home.nameEmpty') }
  }
</script>

<svelte:window on:keydown={e => { if (e.key === 'Escape' && confirming) confirming = false }} />

{#if profile === null}
  <button class="card card--new" on:click={onSelect}>{$t('profile.new')}</button>
{:else}
  <div class="card" class:card--active={active} style="--pc:{profile.colour}">
    {#if editing}
      <div class="action-row">
        <input class="rename-input" bind:value={editName}
          on:keydown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') editing = false }}
          autofocus />
        {#if editError}<span class="err">{editError}</span>{/if}
        <button class="act act--ok"  on:click={saveRename}>✓</button>
        <button class="act act--dim" on:click={() => editing = false}>✗</button>
      </div>
    {:else if confirming}
      <div class="action-row">
        <span class="confirm-lbl">{$t('profile.confirmDelete')}</span>
        <button class="act act--danger" on:click={() => deleteProfile(profile.id)}>{$t('profile.confirmYes')}</button>
        <button class="act act--dim"    on:click={() => confirming = false}>{$t('profile.confirmNo')}</button>
      </div>
    {:else}
      <button class="card-body" data-profile-card on:click={onSelect} on:focus={onSelect}>
        <div class="avatar">{initials}</div>
        <div class="info">
          <div class="name">{profile.name.toUpperCase()}</div>
          <div class="meta">
            <span class="lcount">{$t('profile.lesson')} {lessonCount}/{LESSONS.length}</span>
            <span class="stars">{'★'.repeat(topStars)}{'☆'.repeat(Math.max(0, 3 - topStars))}</span>
          </div>
          <div class="pbar"><div class="pfill" style="width:{(lessonCount/20)*100}%"></div></div>
        </div>
      </button>
      <div class="card-actions">
        <button class="act act--dim" tabindex="-1" on:click={startEdit}>✎</button>
        <button class="act act--dim" tabindex="-1" on:click={() => confirming = true}>✕</button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .card {
    width:100%; background:var(--bg-raised); border:2px solid var(--border);
    border-radius:6px; cursor:pointer;
    display:flex; align-items:stretch; text-align:left;
  }
  .card--active { border-color:var(--pc,var(--accent-cyan)); box-shadow:0 0 12px color-mix(in srgb,var(--pc,var(--accent-cyan)) 25%,transparent); }
  .card--new { border-style:dashed; border-color:var(--text-muted); justify-content:center; font-family:'Courier New',monospace; font-size:15px; color:var(--text-muted); letter-spacing:2px; padding:16px 12px; }

  /* Normal state */
  .card-body { flex:1; background:none; border:none; cursor:pointer; font-family:inherit;
    display:flex; align-items:center; gap:10px; padding:10px 12px; text-align:left; }
  .card-body:focus-visible { outline: none; box-shadow: none; }
  .card-actions { display:flex; flex-direction:column; justify-content:center; gap:2px; padding:6px 8px 6px 0; border-left: 1px solid var(--border); margin-left: 0; opacity:0; transition:opacity 0.15s; }
  .card:hover .card-actions { opacity:1; }

  .avatar { width:32px; height:32px; border-radius:4px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-family:'Courier New',monospace; font-size:13px; font-weight:bold; background:color-mix(in srgb,var(--pc) 20%,var(--bg)); color:var(--pc); border:1px solid color-mix(in srgb,var(--pc) 40%,transparent); }
  .info { flex:1; min-width:0; }
  .name { font-family:'Courier New',monospace; font-size:13px; font-weight:bold; color:var(--text); }
  .meta { display:flex; align-items:center; gap:6px; margin-top:2px; }
  .lcount { font-size:11px; color:var(--text-muted); font-family:monospace; }
  .stars { font-size:10px; color:#ffcc00; letter-spacing:1px; }
  .pbar { height:3px; background:var(--bg-sunken); border-radius:2px; margin-top:4px; overflow:hidden; }
  .pfill { height:100%; background:var(--pc,var(--accent-cyan)); border-radius:2px; }
  .badge { font-family:monospace; font-size:10px; color:var(--pc,var(--accent-cyan)); white-space:nowrap; }

  /* Action buttons */
  .act { background:none; border:none; cursor:pointer; font-family:inherit; font-size:13px; padding:3px 6px; border-radius:3px; line-height:1; }
  .act--ok     { color:var(--accent-green); }
  .act--danger { color:#ff4455; font-size:11px; letter-spacing:1px; font-weight:bold; }
  .act--dim    { color:var(--text-muted); opacity:0.6; }
  .act--dim:hover { opacity:1; }

  /* Inline action row (rename / confirm-delete) */
  .action-row { flex:1; display:flex; align-items:center; gap:8px; padding:10px 12px; }
  .rename-input { flex:1; background:var(--bg-sunken); border:1px solid var(--pc,var(--accent-cyan)); border-radius:4px; padding:6px 10px; color:var(--text); font-family:inherit; font-size:13px; }
  .confirm-lbl { flex:1; font-size:12px; color:#ff4455; letter-spacing:2px; }
  .err { font-size:11px; color:#ff4455; white-space:nowrap; }
</style>
