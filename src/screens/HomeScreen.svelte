<script>
  import { get } from 'svelte/store'
  import { t, setLanguage, lang } from '../i18n/index.js'
  import { profiles, activeProfile, createProfile, selectProfile, mergeProfiles } from '../stores/profiles.js'
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

  let showBackup = false
  let backupModalEl
  let fileInput                // bound to hidden <input type="file">
  let pendingImport = null     // Profile[] | null — parsed profiles awaiting confirm
  let backupMsg = ''           // success or error message
  let backupMsgIsError = false

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

  function handleExport() {
    const data = {
      version: 1,
      exportedAt: Date.now(),
      lang: get(lang),
      profiles: get(profiles),
    }
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `typtyptyp-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!Array.isArray(data?.profiles)) throw new Error('invalid')
        const valid = data.profiles.filter(p => p?.id && p?.name && p?.lessonProgress)
        if (valid.length === 0) throw new Error('noProfiles')
        pendingImport = valid
        backupMsg = ''
        backupMsgIsError = false
      } catch (err) {
        backupMsg = get(t)(err?.message === 'noProfiles' ? 'backup.noProfiles' : 'backup.error')
        backupMsgIsError = true
        pendingImport = null
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleConfirmImport() {
    const { added, updated } = mergeProfiles(pendingImport)
    pendingImport = null
    backupMsg = get(t)('backup.success', { added, updated })
    backupMsgIsError = false
  }

  function handleCancelImport() {
    pendingImport = null
    backupMsg = ''
    backupMsgIsError = false
  }

  function closeBackup() {
    showBackup = false
    pendingImport = null
    backupMsg = ''
    backupMsgIsError = false
  }
</script>

<svelte:window on:keydown={e => {
  if (e.key === 'Escape' && showBackup) { closeBackup(); return }
  if (showBackup) { if (backupModalEl) arrowNav(e, backupModalEl); return }
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
      <button class="backup-btn" tabindex="-1" on:click={() => showBackup = true}>{$t('home.backup')}</button>
      <button class="about-btn" tabindex="-1" on:click={() => goTo('about')}>{$t('about.title')}</button>
    </div>

    {#if showBackup}
      <div class="modal-overlay" on:click|self={closeBackup}>
        <div class="modal" bind:this={backupModalEl}>
          <button class="modal-close" on:click={closeBackup}>X</button>
          <div class="modal-title">{$t('backup.title')}</div>

          {#if pendingImport}
            <p class="modal-desc">{$t('backup.confirmDesc')}</p>
            <div class="modal-actions">
              <button class="btn-confirm" on:click={handleConfirmImport}>{$t('backup.confirmYes')}</button>
              <button class="btn-cancel" on:click={handleCancelImport}>{$t('backup.confirmNo')}</button>
            </div>
          {:else}
            <p class="modal-desc">{$t('backup.saveDesc')}</p>
            <button class="btn-save" on:click={handleExport}>{$t('backup.save')}</button>

            <p class="modal-desc">{$t('backup.loadDesc')}</p>
            <button class="btn-load" on:click={() => fileInput?.click()}>{$t('backup.load')}</button>
            <input bind:this={fileInput} type="file" accept=".json" style="display:none"
              on:change={handleImportFile} />
          {/if}

          {#if backupMsg}
            <p class="modal-msg" class:modal-msg--error={backupMsgIsError}>{backupMsg}</p>
          {/if}
        </div>
      </div>
    {/if}
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
  .btn-ok:hover { box-shadow:0 0 14px color-mix(in srgb,var(--accent-cyan) 50%,transparent); }
  .bottom-row { display:flex; align-items:center; justify-content:space-between; margin-top:28px; }
  .lang-row { display:flex; gap:8px; opacity:0.55; }
  .lang-row:hover { opacity:0.75; }
  .about-btn { background:none; border:1px solid var(--accent-yellow); border-radius:4px; cursor:pointer; font-family:inherit; font-size:13px; color:var(--accent-yellow); letter-spacing:1px; padding:5px 10px; text-shadow:0 0 8px color-mix(in srgb,var(--accent-yellow) 70%,transparent); box-shadow:0 0 8px color-mix(in srgb,var(--accent-yellow) 30%,transparent); }
  .about-btn:hover { text-shadow:0 0 12px var(--accent-yellow); box-shadow:0 0 16px color-mix(in srgb,var(--accent-yellow) 60%,transparent); }
  .lang-btn { background:none; border:2px solid transparent; border-radius:4px; padding:4px; cursor:pointer; display:flex; align-items:center; transition:opacity 0.15s; }
  .lang-btn--on { border-color:var(--text-muted); opacity:1; }
  .lang-btn:not(.lang-btn--on) { opacity:0.5; }
  .btn-start { width:100%; padding:18px; font-size:22px; font-weight:bold; letter-spacing:3px; background:var(--accent-green); color:var(--bg); border-radius:4px; box-shadow:0 0 24px color-mix(in srgb,var(--accent-green) 40%,transparent); font-family:inherit; cursor:pointer; }
  .btn-start:hover:not(:disabled) { box-shadow:0 0 40px color-mix(in srgb,var(--accent-green) 65%,transparent); }
  .btn-start:disabled { opacity:.4; cursor:not-allowed; box-shadow:none; }
  .backup-btn { background:none; border:1px solid var(--accent-cyan); border-radius:4px; cursor:pointer; font-family:inherit; font-size:13px; color:var(--accent-cyan); letter-spacing:1px; padding:5px 10px; text-shadow:0 0 8px color-mix(in srgb,var(--accent-cyan) 60%,transparent); box-shadow:0 0 6px color-mix(in srgb,var(--accent-cyan) 25%,transparent); }
  .backup-btn:hover { box-shadow:0 0 14px color-mix(in srgb,var(--accent-cyan) 55%,transparent); }
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:50; }
  .modal { position:relative; background:var(--bg-raised); border:2px solid var(--accent-cyan); border-radius:8px; padding:32px 28px 28px; max-width:480px; width:calc(100% - 48px); box-shadow:0 0 32px color-mix(in srgb,var(--accent-cyan) 25%,transparent); }
  .modal-close { position:absolute; top:12px; right:14px; background:none; border:none; cursor:pointer; font-size:18px; color:var(--text-muted); font-family:inherit; }
  .modal-close:hover { color:var(--text); }
  .modal-title { font-size:20px; font-weight:bold; letter-spacing:3px; color:var(--accent-cyan); text-shadow:0 0 10px color-mix(in srgb,var(--accent-cyan) 50%,transparent); margin-bottom:20px; }
  .modal-desc { font-size:15px; color:var(--text-muted); line-height:1.6; margin:0 0 12px; }
  .modal-actions { display:flex; gap:10px; margin-bottom:8px; }
  .btn-save, .btn-load { background:var(--accent-cyan); color:var(--bg); border:none; border-radius:4px; padding:11px 18px; font-family:inherit; font-size:15px; font-weight:bold; letter-spacing:1px; cursor:pointer; margin-bottom:20px; display:block; }
  .btn-save:hover, .btn-load:hover { box-shadow:0 0 16px color-mix(in srgb,var(--accent-cyan) 50%,transparent); }
  .btn-confirm { background:var(--accent-cyan); color:var(--bg); border:none; border-radius:4px; padding:11px 18px; font-family:inherit; font-size:15px; font-weight:bold; letter-spacing:1px; cursor:pointer; }
  .btn-confirm:hover { box-shadow:0 0 16px color-mix(in srgb,var(--accent-cyan) 50%,transparent); }
  .btn-cancel { background:none; border:2px solid var(--text-muted); color:var(--text-muted); border-radius:4px; padding:11px 18px; font-family:inherit; font-size:15px; font-weight:bold; letter-spacing:1px; cursor:pointer; }
  .btn-cancel:hover { border-color:var(--text); color:var(--text); }
  .modal-msg { font-size:14px; margin:12px 0 0; letter-spacing:0.5px; }
  .modal-msg--error { color:#ff4455; }
  .modal-msg:not(.modal-msg--error) { color:var(--accent-green); }
</style>
