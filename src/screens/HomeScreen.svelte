<script>
  import { get } from 'svelte/store'
  import { t, setLanguage, lang } from '../i18n/index.js'
  import { profiles, activeProfile, createProfile, selectProfile } from '../stores/profiles.js'
  import { goTo } from '../stores/screen.js'
  import ProfileCard from '../components/ProfileCard.svelte'
  import PixelChick from '../components/PixelChick.svelte'
  import { arrowNav } from '../utils/keyboard.js'
  import { onMount } from 'svelte'

  let screenEl
  let startBtn

  onMount(() => { startBtn?.focus() })

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

<svelte:window on:keydown={e => {
  if ((e.key === ' ' || e.key === 'Enter') && document.activeElement?.dataset.profileCard !== undefined && $activeProfile) {
    e.preventDefault()
    goTo('lessons')
  } else if (screenEl) {
    arrowNav(e, screenEl)
  }
}} />

<div class="screen home" bind:this={screenEl}>
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

    <button class="btn-start" bind:this={startBtn} disabled={!$activeProfile} on:click={() => goTo('lessons')}>
      {$t('nav.start')}
    </button>

    <div class="bottom-row">
      <div class="lang-row">
      <button class="lang-btn" class:lang-btn--on={$lang === 'nl'} on:click={() => setLanguage('nl')}>
        <svg width="24" height="16" viewBox="0 0 9 6" style="image-rendering:pixelated;display:block">
          <rect width="9" height="2" fill="#AE1C28"/>
          <rect y="2" width="9" height="2" fill="#fff"/>
          <rect y="4" width="9" height="2" fill="#21468B"/>
        </svg>
      </button>
      <button class="lang-btn" class:lang-btn--on={$lang === 'en'} on:click={() => setLanguage('en')}>
        <svg width="28" height="16" viewBox="0 0 20 12" style="display:block">
          <rect width="20" height="12" fill="#012169"/>
          <polygon points="0,0 2.5,0 20,10.5 20,12 17.5,12 0,1.5" fill="#fff"/>
          <polygon points="20,0 17.5,0 0,10.5 0,12 2.5,12 20,1.5" fill="#fff"/>
          <line x1="0" y1="0" x2="20" y2="12" stroke="#C8102E" stroke-width="1.2"/>
          <line x1="20" y1="0" x2="0" y2="12" stroke="#C8102E" stroke-width="1.2"/>
          <rect x="8" width="4" height="12" fill="#fff"/>
          <rect y="4" width="20" height="4" fill="#fff"/>
          <rect x="9" width="2" height="12" fill="#C8102E"/>
          <rect y="5" width="20" height="2" fill="#C8102E"/>
        </svg>
      </button>
    </div>
      <button class="about-btn" tabindex="-1" on:click={() => goTo('about')}>{$t('about.title')}</button>
    </div>
  </div>
</div>

<style>
  .home { max-width:820px; margin:0 auto; }
  .inner { padding:48px 48px 56px; }
  .logo { font-size:40px; font-weight:bold; letter-spacing:6px; text-align:center; margin-bottom:4px; }
  .c1 { color:var(--accent-cyan);   text-shadow:0 0 18px color-mix(in srgb,var(--accent-cyan)   60%,transparent); }
  .c2 { color:var(--accent-green);  text-shadow:0 0 18px color-mix(in srgb,var(--accent-green)  60%,transparent); }
  .c3 { color:var(--accent-yellow); text-shadow:0 0 18px color-mix(in srgb,var(--accent-yellow) 60%,transparent); }
  .tagline { font-size:16px; color:var(--text); letter-spacing:4px; text-align:center; margin-bottom:32px; }
  .chick-wrap { display:flex; justify-content:center; margin-bottom:40px; }
  .section-label { font-size:16px; color:var(--text); letter-spacing:2px; margin-bottom:16px; }
  .profile-list { display:flex; flex-direction:column; gap:12px; margin-bottom:24px; }
  .new-input-row { display:flex; gap:10px; align-items:center; }
  .new-input-row input { flex:1; background:var(--bg-raised); border:2px solid var(--accent-cyan); border-radius:4px; padding:12px 16px; color:var(--accent-cyan); font-family:inherit; font-size:18px; }
  .new-input-row input::placeholder { color:var(--text); opacity:.6; }
  .err { font-size:16px; color:#ff4455; }
  .btn-ok { background:var(--accent-cyan); color:var(--bg); border-radius:4px; padding:12px 18px; font-weight:bold; font-size:18px; letter-spacing:1px; }
  .bottom-row { display:flex; align-items:center; justify-content:space-between; margin-top:28px; }
  .lang-row { display:flex; gap:8px; opacity:0.55; }
  .lang-row:hover { opacity:0.75; }
  .about-btn { background:none; border:none; cursor:pointer; font-family:inherit; font-size:11px; color:var(--text-muted); opacity:0.4; letter-spacing:1px; padding:0; }
  .about-btn:hover { opacity:0.8; }
  .lang-btn { background:none; border:2px solid transparent; border-radius:4px; padding:4px; cursor:pointer; display:flex; align-items:center; transition:opacity 0.15s; }
  .lang-btn--on { border-color:var(--text-muted); opacity:1; }
  .lang-btn:not(.lang-btn--on) { opacity:0.5; }
  .btn-start { width:100%; padding:18px; font-size:22px; font-weight:bold; letter-spacing:3px; background:var(--accent-green); color:var(--bg); border-radius:4px; box-shadow:0 0 24px color-mix(in srgb,var(--accent-green) 40%,transparent); font-family:inherit; cursor:pointer; }
  .btn-start:disabled { opacity:.4; cursor:not-allowed; box-shadow:none; }
</style>
