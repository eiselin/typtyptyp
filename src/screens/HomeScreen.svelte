<script>
  import { get } from 'svelte/store'
  import { t, setLanguage, lang } from '../i18n/index.js'
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

    <div class="chick-wrap"><PixelChick size={135} /></div>

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
      <button class="lang-btn" class:lang-btn--on={$lang === 'nl'} on:click={() => setLanguage('nl')}>
        <svg width="18" height="12" viewBox="0 0 9 6" style="image-rendering:pixelated;vertical-align:middle;margin-right:5px">
          <rect width="9" height="2" fill="#AE1C28"/>
          <rect y="2" width="9" height="2" fill="#fff"/>
          <rect y="4" width="9" height="2" fill="#21468B"/>
        </svg>Nederlands
      </button>
      <button class="lang-btn" class:lang-btn--on={$lang === 'en'} on:click={() => setLanguage('en')}>
        <svg width="20" height="12" viewBox="0 0 20 12" style="vertical-align:middle;margin-right:5px">
          <rect width="20" height="12" fill="#012169"/>
          <polygon points="0,0 2.5,0 20,10.5 20,12 17.5,12 0,1.5" fill="#fff"/>
          <polygon points="20,0 17.5,0 0,10.5 0,12 2.5,12 20,1.5" fill="#fff"/>
          <line x1="0" y1="0" x2="20" y2="12" stroke="#C8102E" stroke-width="1.2"/>
          <line x1="20" y1="0" x2="0" y2="12" stroke="#C8102E" stroke-width="1.2"/>
          <rect x="8" width="4" height="12" fill="#fff"/>
          <rect y="4" width="20" height="4" fill="#fff"/>
          <rect x="9" width="2" height="12" fill="#C8102E"/>
          <rect y="5" width="20" height="2" fill="#C8102E"/>
        </svg>English
      </button>
    </div>

    <button class="btn-start" disabled={!$activeProfile} on:click={() => goTo('lessons')}>
      {$activeProfile ? $t('home.continueAs', { name: $activeProfile.name }) : $t('nav.start')}
    </button>
  </div>
</div>

<style>
  .home { max-width:680px; margin:0 auto; }
  .inner { padding:36px 32px 42px; }
  .logo { font-size:40px; font-weight:bold; letter-spacing:6px; text-align:center; margin-bottom:4px; }
  .c1 { color:var(--accent-cyan);   text-shadow:0 0 18px color-mix(in srgb,var(--accent-cyan)   60%,transparent); }
  .c2 { color:var(--accent-green);  text-shadow:0 0 18px color-mix(in srgb,var(--accent-green)  60%,transparent); }
  .c3 { color:var(--accent-yellow); text-shadow:0 0 18px color-mix(in srgb,var(--accent-yellow) 60%,transparent); }
  .tagline { font-size:13px; color:var(--text); letter-spacing:4px; text-align:center; margin-bottom:24px; }
  .chick-wrap { display:flex; justify-content:center; margin-bottom:28px; }
  .section-label { font-size:13px; color:var(--text); letter-spacing:2px; margin-bottom:12px; }
  .profile-list { display:flex; flex-direction:column; gap:10px; margin-bottom:22px; }
  .new-input-row { display:flex; gap:10px; align-items:center; }
  .new-input-row input { flex:1; background:var(--bg-raised); border:2px solid var(--accent-cyan); border-radius:4px; padding:12px 16px; color:var(--accent-cyan); font-family:inherit; font-size:16px; }
  .new-input-row input::placeholder { color:var(--text); opacity:.6; }
  .err { font-size:13px; color:#ff4455; }
  .btn-ok { background:var(--accent-cyan); color:var(--bg); border-radius:4px; padding:12px 18px; font-weight:bold; font-size:15px; letter-spacing:1px; }
  .lang-row { display:flex; gap:10px; align-items:center; margin-bottom:24px; }
  .lang-lbl { font-size:13px; color:var(--text); letter-spacing:1px; }
  .lang-btn { background:var(--bg-raised); border:2px solid var(--border); border-radius:4px; padding:7px 14px; font-size:14px; font-family:inherit; color:var(--text); cursor:pointer; display:flex; align-items:center; }
  .lang-btn--on { border-color:var(--accent-cyan); color:var(--accent-cyan); }
  .lang-btn:disabled { opacity:.4; cursor:not-allowed; }
  .btn-start { width:100%; padding:18px; font-size:20px; font-weight:bold; letter-spacing:3px; background:var(--accent-green); color:var(--bg); border-radius:4px; box-shadow:0 0 24px color-mix(in srgb,var(--accent-green) 40%,transparent); font-family:inherit; cursor:pointer; }
  .btn-start:disabled { opacity:.4; cursor:not-allowed; box-shadow:none; }
</style>
