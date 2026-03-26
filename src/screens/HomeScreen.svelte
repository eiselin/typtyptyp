<script>
  import { get } from 'svelte/store'
  import { t, setLanguage } from '../i18n/index.js'
  import { profiles, activeProfile, createProfile, selectProfile } from '../stores/profiles.js'
  import { goTo } from '../stores/screen.js'
  import ProfileCard from '../components/ProfileCard.svelte'
  import PixelChick from '../components/PixelChick.svelte'

  let showInput = false
  let newName = ''
  let nameError = ''

  $: selectedId = $activeProfile?.id ?? null

  function handleNewProfile() { showInput = true; newName = ''; nameError = '' }

  function handleCreate() {
    try {
      createProfile(newName)
      selectProfile($profiles[$profiles.length - 1].id)
      showInput = false
    } catch (e) {
      nameError = e.message === 'duplicate' ? get(t)('home.nameTaken') : get(t)('home.nameEmpty')
    }
  }
</script>

<div class="screen home">
  <div class="inner">
    <div class="logo">
      <span class="c1">TYP</span><span class="c2">TYP</span><span class="c3">TYP</span>
    </div>
    <div class="tagline">{$t('home.tagline')}</div>

    <div class="chick-wrap"><PixelChick size={90} /></div>

    <div class="section-label">{$t('home.whosPlaying')}</div>
    <div class="profile-list">
      {#each $profiles as p (p.id)}
        <ProfileCard profile={p} active={p.id === selectedId} onSelect={() => selectProfile(p.id)} />
      {/each}
      {#if showInput}
        <div class="new-input-row">
          <input bind:value={newName} placeholder={$t('home.enterName')}
            on:keydown={e => e.key === 'Enter' && handleCreate()} autofocus />
          {#if nameError}<span class="err">{nameError}</span>{/if}
          <button class="btn-ok" on:click={handleCreate}>OK</button>
        </div>
      {:else}
        <ProfileCard profile={null} onSelect={handleNewProfile} />
      {/if}
    </div>

    <div class="lang-row">
      <span class="lang-lbl">{$t('home.language')}</span>
      <button class="lang-btn lang-btn--on"  on:click={() => setLanguage('nl')}>🇳🇱 Nederlands</button>
      <button class="lang-btn" disabled>🇬🇧 English</button>
    </div>

    <button class="btn-start" disabled={!$activeProfile} on:click={() => goTo('lessons')}>
      {$activeProfile ? $t('home.continueAs', { name: $activeProfile.name }) : $t('nav.start')}
    </button>
  </div>
</div>

<style>
  .home { max-width:480px; margin:0 auto; }
  .inner { padding:24px 22px 28px; }
  .logo { font-size:26px; font-weight:bold; letter-spacing:4px; text-align:center; margin-bottom:2px; }
  .c1 { color:var(--accent-cyan);   text-shadow:0 0 14px color-mix(in srgb,var(--accent-cyan)   60%,transparent); }
  .c2 { color:var(--accent-green);  text-shadow:0 0 14px color-mix(in srgb,var(--accent-green)  60%,transparent); }
  .c3 { color:var(--accent-yellow); text-shadow:0 0 14px color-mix(in srgb,var(--accent-yellow) 60%,transparent); }
  .tagline { font-size:10px; color:var(--text-muted); letter-spacing:3px; text-align:center; margin-bottom:18px; }
  .chick-wrap { display:flex; justify-content:center; margin-bottom:20px; }
  .section-label { font-size:10px; color:var(--text-muted); letter-spacing:2px; margin-bottom:10px; }
  .profile-list { display:flex; flex-direction:column; gap:7px; margin-bottom:16px; }
  .new-input-row { display:flex; gap:8px; align-items:center; }
  .new-input-row input { flex:1; background:var(--bg-raised); border:2px solid var(--accent-cyan); border-radius:4px; padding:8px 12px; color:var(--accent-cyan); font-family:inherit; font-size:13px; }
  .err { font-size:10px; color:#ff4455; }
  .btn-ok { background:var(--accent-cyan); color:var(--bg); border-radius:4px; padding:8px 12px; font-weight:bold; font-size:12px; letter-spacing:1px; }
  .lang-row { display:flex; gap:8px; align-items:center; margin-bottom:18px; }
  .lang-lbl { font-size:10px; color:var(--text-muted); letter-spacing:1px; }
  .lang-btn { background:var(--bg-raised); border:2px solid var(--border); border-radius:4px; padding:4px 10px; font-size:12px; color:var(--text-muted); }
  .lang-btn--on { border-color:var(--accent-cyan); color:var(--accent-cyan); }
  .lang-btn:disabled { opacity:.4; cursor:not-allowed; }
  .btn-start { width:100%; padding:13px; font-size:15px; font-weight:bold; letter-spacing:2px; background:var(--accent-green); color:var(--bg); border-radius:4px; box-shadow:0 0 20px color-mix(in srgb,var(--accent-green) 40%,transparent); }
  .btn-start:disabled { opacity:.4; cursor:not-allowed; box-shadow:none; }
</style>
