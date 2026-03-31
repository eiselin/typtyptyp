<script>
  import { get } from 'svelte/store'
  import { tick } from 'svelte'
  import { t } from '../i18n/index.js'
  import { selectedGroup, goTo } from '../stores/screen.js'
  import { activeProfile, updateArcadeProgress } from '../stores/profiles.js'
  import { gameResults } from '../stores/game.js'
  import { submitScore } from '../utils/leaderboard.js'
  import { getArcadeWordCycler, WORD_LISTS } from '../words/index.js'
  import { lang } from '../i18n/index.js'
  import PixelChick from '../components/PixelChick.svelte'
  import { arrowNav } from '../utils/keyboard.js'

  let pauseBoxEl = $state()
  let resumeBtn = $state()
  let introEl = $state()
  let introBtn = $state()
  let gameScreenEl = $state()
  $effect(() => { if (gamePhase === 'paused') tick().then(() => resumeBtn?.focus()) })
  $effect(() => { if (showIntro) tick().then(() => introBtn?.focus()) })

  // ── Constants ───────────────────────────────────────────────
  const NUM_LANES          = 5
  const BASE_SPEED         = 4         // % of container width per second at speed_factor 1.0
  const MAX_SPEED          = 3.0
  const EDGE_WARN          = 2         // pad-widths from edge triggers flash
  const NEAR_BANK          = -1        // chick lane index when on near (start) bank
  const FAR_BANK           = NUM_LANES // chick lane index when on far (goal) bank
  const NEST_BONUS         = 500       // base score added on each successful crossing
  const POST_CROSSING_MS   = 800       // delay (ms) before new round starts after nest hop
  const FREEZE_MS          = 1200      // river freeze duration (ms) after losing a life
  const GAME_OVER_MS       = 2000      // delay (ms) before navigating to results screen
  const HOP_ANIM_MS        = 450       // chick hop animation duration (ms)
  const WOBBLE_ANIM_MS     = 500       // chick wobble animation duration (ms)

  // ── Game state (Svelte 5 runes) ─────────────────────────────
  let showIntro    = $state(true)
  let losing       = $state(false)   // guard: prevents loseLife() firing twice in one frame
  let lives        = $state(3)
  let score        = $state(0)
  let combo        = $state(0)
  let speedFactor  = $state(1.0)
  let crossings    = $state(0)
  let gamePhase    = $state('playing')   // 'playing' | 'frozen' | 'done'
  let chickenLane  = $state(NEAR_BANK)   // -1=near bank, 0-4=riding lane, 5=far bank
  let chickenPadId = $state(null)        // id of pad chick is riding, or null if on bank
  let typedSoFar   = $state('')
  let chickState   = $state('idle')

  const groupId    = get(selectedGroup) ?? 'home'
  const profile    = get(activeProfile)
  const prevBest   = profile?.arcadeProgress?.[groupId]?.highScore ?? 0

  // ── Word cycler ──────────────────────────────────────────────
  const wordList = WORD_LISTS[get(lang)] ?? WORD_LISTS.nl
  const nextWord = getArcadeWordCycler(groupId, wordList)

  // ── Nest word (dedicated word to hop into the nest from final lane) ──
  let nestWord = $state(nextWord())

  // ── Pad data ─────────────────────────────────────────────────
  function makePadWidth(word) {
    return Math.min(Math.max(word.length * 3 + 8, 14), 42)
  }

  let padIdCounter = 0
  function makePad(x) {
    const word = nextWord()
    return { id: ++padIdCounter, word, x, width: makePadWidth(word) }
  }

  // Initialise lanes with 2–3 staggered pads each
  let lanes = $state(Array.from({ length: NUM_LANES }, (_, i) => {
    const dir = i % 2 === 0 ? 1 : -1
    const pads = [
      makePad(dir > 0 ? -50 : 110),
      makePad(dir > 0 ? 10  : 55),
      makePad(dir > 0 ? 60  : 5),
    ]
    return { index: i, direction: dir, pads }
  }))

  // ── Derived: glowing pad ─────────────────────────────────────
  const glowingPadId = $derived.by(() => {
    // On the last lane, target is nestWord — no pad glows
    if (chickenLane === NUM_LANES - 1 && chickenPadId !== null) return null
    const nextLane = chickenLane + 1
    if (nextLane >= NUM_LANES) return null
    const lane = lanes[nextLane]
    if (!lane) return null
    const onScreen = lane.pads.filter(p => p.x > -p.width && p.x < 100)
    if (onScreen.length === 0) return null
    // most centred = closest to 50%
    const centre = 50
    const best = onScreen.reduce((a, b) => {
      const ca = Math.abs((a.x + a.width / 2) - centre)
      const cb = Math.abs((b.x + b.width / 2) - centre)
      if (ca === cb) {
        // prefer moving toward centre
        const aToward = (lane.direction > 0 && a.x < centre) || (lane.direction < 0 && a.x > centre)
        return aToward ? a : b
      }
      return ca < cb ? a : b
    })
    return best.id
  })

  // ── Derived: speed bar colour ────────────────────────────────
  const speedColour = $derived(
    speedFactor < 1.5 ? '#00ffcc' : speedFactor <= 2.5 ? '#ff8800' : '#ff4466'
  )
  const speedPct = $derived(Math.round(((speedFactor - 1.0) / (MAX_SPEED - 1.0)) * 100))

  // ── Multiplier ───────────────────────────────────────────────
  const multiplier = $derived(Math.min(Math.floor(combo / 5) + 1, 10))

  // ── Final lane flag ──────────────────────────────────────────
  const onFinalLane = $derived(chickenLane === NUM_LANES - 1 && chickenPadId !== null)

  // ── Game loop ────────────────────────────────────────────────
  let animId
  let lastTime = 0
  let endGameTimer = null

  function updatePads(dt) {
    const GAP = 8  // minimum gap between pads, in % units
    lanes = lanes.map(lane => {
      const speed = BASE_SPEED * speedFactor * lane.direction
      // First pass: move all pads
      const pads = lane.pads.map(pad => {
        let nx = pad.x + speed * dt
        // Check if chick loses life: chick is on this pad and it exits
        if (pad.id === chickenPadId) {
          if (lane.direction > 0 && nx > 100) { loseLife(); nx = pad.x }
          if (lane.direction < 0 && nx + pad.width < 0) { loseLife(); nx = pad.x }
        }
        return { ...pad, x: nx }
      })
      // Second pass: wrap exited pads, placing each behind all existing pads
      for (let i = 0; i < pads.length; i++) {
        const pad = pads[i]
        const rightExit = lane.direction > 0 && pad.x > 100 + pad.width
        const leftExit  = lane.direction < 0 && pad.x + pad.width < -2
        if (!rightExit && !leftExit) continue
        const word = nextWord()
        const width = makePadWidth(word)
        const others = pads.filter((_, j) => j !== i)
        let x
        if (lane.direction > 0) {
          // Entry from left — place behind the leftmost other pad
          const leftmost = others.length > 0 ? Math.min(...others.map(p => p.x)) : 0
          x = Math.min(-width - GAP, leftmost - width - GAP)
        } else {
          // Entry from right — place behind the rightmost other pad
          const rightmost = others.length > 0 ? Math.max(...others.map(p => p.x + p.width)) : 100
          x = Math.max(100 + GAP, rightmost + GAP)
        }
        pads[i] = { id: ++padIdCounter, word, x, width }
      }
      return { ...lane, pads }
    })
  }

  function gameLoop(time) {
    if (gamePhase !== 'playing') return
    const dt = Math.min((time - lastTime) / 1000, 0.1)
    lastTime = time
    updatePads(dt)
    animId = requestAnimationFrame(gameLoop)
  }

  $effect(() => {
    if (gamePhase === 'playing' && !showIntro) {
      lastTime = performance.now()
      animId = requestAnimationFrame(gameLoop)
    }
    return () => cancelAnimationFrame(animId)
  })

  // ── Input handling ───────────────────────────────────────────
  function getGlowingPad() {
    if (!glowingPadId) return null
    // On the last lane, the glowing pad is in the current lane (final hop to far bank)
    const laneIndex = chickenLane === NUM_LANES - 1 ? chickenLane : chickenLane + 1
    if (laneIndex >= NUM_LANES) return null
    return lanes[laneIndex]?.pads.find(p => p.id === glowingPadId) ?? null
  }

  function togglePause() {
    if (gamePhase === 'playing') gamePhase = 'paused'
    else if (gamePhase === 'paused') gamePhase = 'playing'
  }

  function handleKey(e) {
    if (e.key === 'Escape') { togglePause(); return }
    if (showIntro) { if (introEl) arrowNav(e, introEl); return }
    if (gamePhase === 'paused') { if (pauseBoxEl) arrowNav(e, pauseBoxEl); return }
    if (e.key === 'Tab' && gameScreenEl) { arrowNav(e, gameScreenEl); return }
    if (gamePhase !== 'playing') return
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey) return

    if (onFinalLane) {
      handleTypedChar(e.key, nestWord, () => {
        score += Math.round(nestWord.length * multiplier * speedFactor)
        hopToNest()
      })
      return
    }

    const pad = getGlowingPad()
    if (!pad) return
    handleTypedChar(e.key, pad.word, () => {
      score += Math.round(pad.word.length * multiplier * speedFactor)
      hopToNextLane(pad)
    })
  }

  /** Handle one typed character against a target word, calling onComplete when the word is finished. */
  function handleTypedChar(key, targetWord, onComplete) {
    const expected = targetWord[typedSoFar.length]
    if (!expected) return
    if (key === expected) {
      combo += 1
      const newTyped = typedSoFar + key
      if (newTyped === targetWord) {
        typedSoFar = ''
        onComplete()
      } else {
        typedSoFar = newTyped
      }
    } else {
      combo = 0
      typedSoFar = ''
      triggerChickState('wobble', WOBBLE_ANIM_MS)
    }
  }

  function triggerChickState(state, durationMs) {
    chickState = state
    setTimeout(() => { if (chickState === state) chickState = 'idle' }, durationMs)
  }

  function hopToNextLane(targetPad) {
    triggerChickState('hop', HOP_ANIM_MS)
    chickenLane = chickenLane + 1
    chickenPadId = targetPad.id
  }

  function hopToNest() {
    triggerChickState('hop', HOP_ANIM_MS)
    chickenLane = FAR_BANK
    chickenPadId = null
    score += Math.round(NEST_BONUS * speedFactor)
    crossings += 1
    speedFactor = Math.min(+(speedFactor + 0.1).toFixed(1), MAX_SPEED)
    setTimeout(startNewRound, POST_CROSSING_MS)
  }

  function startNewRound() {
    chickenLane = NEAR_BANK
    chickenPadId = null
    typedSoFar = ''
    nestWord = nextWord()
  }

  function loseLife() {
    if (gamePhase !== 'playing' || losing) return
    losing = true
    lives -= 1
    chickState = 'splash'
    combo = 0
    typedSoFar = ''

    if (lives <= 0) {
      gamePhase = 'done'
      endGame()
      return
    }

    // Freeze river, reset chick to last safe bank
    gamePhase = 'frozen'
    setTimeout(() => {
      chickenLane = NEAR_BANK
      chickenPadId = null
      chickState = 'idle'
      losing = false
      gamePhase = 'playing'  // $effect handles RAF restart
    }, FREEZE_MS)
  }

  function endGame() {
    cancelAnimationFrame(animId)
    const p = get(activeProfile)
    if (p) {
      updateArcadeProgress(p.id, groupId, score)
      submitScore(p.name, score, groupId)
    }
    gameResults.set({ score, crossings, groupId, profileName: p?.name ?? '?', prevBest })
    endGameTimer = setTimeout(() => goTo('results'), GAME_OVER_MS)
  }

  $effect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  })

  // Reset typed input when glowing pad changes
  $effect(() => {
    glowingPadId  // track changes
    typedSoFar = ''
  })

</script>

<div class="screen game" bind:this={gameScreenEl}>

  <!-- HUD -->
  <div class="hud">
    <div class="hud-block">
      <div class="hud-label">{$t('arcade.hud.score')}</div>
      <div class="hud-val">{String(score).padStart(5, '0')}</div>
    </div>
    <div class="hud-block">
      <div class="hud-label">{$t('arcade.hud.combo')}</div>
      <div class="hud-val combo" style="color: {combo > 0 ? '#ff8800' : 'var(--text-muted)'}">
        x{multiplier}{combo >= 5 ? ' !!!' : ''}
      </div>
    </div>
    <div class="hud-block">
      <div class="hud-label">{$t('arcade.hud.lives')}</div>
      <div class="hearts">
        {#each [1,2,3] as n}
          <div class="heart" class:heart--lost={n > lives}></div>
        {/each}
      </div>
    </div>
    <div class="hud-block">
      <div class="hud-label">{$t('arcade.hud.best')}</div>
      <div class="hud-val" style="color: var(--text-muted); font-size:22px">{String(prevBest).padStart(5, '0')}</div>
    </div>
    <div class="hud-btns">
      <button class="pause-btn" on:click={togglePause}>{$t('arcade.pause')}</button>
      <button class="pause-btn pause-btn--exit" on:click={() => { clearTimeout(endGameTimer); goTo('lessons') }}>{$t('arcade.exit')}</button>
    </div>
  </div>

  <!-- Speed bar -->
  <div class="speed-bar-wrap">
    <div class="speed-label">{$t('arcade.hud.speed')}</div>
    <div class="speed-bar">
      <div class="speed-fill" style="width:{speedPct}%; background:{speedColour}; box-shadow: 0 0 6px {speedColour};"></div>
    </div>
  </div>

  <!-- River -->
  <div class="river">
    <!-- Far bank / nest -->
    <div class="bank bank--far">
      <span class="bank-label">{$t('arcade.bank.far')}</span>
      <div class="nest">
        <div class="nest-target" class:nest-target--active={onFinalLane}>{nestWord}</div>
        <div class="nest-chick">
          {#if chickenLane === FAR_BANK}
            <PixelChick size={36} state={chickState} />
          {/if}
        </div>
        <div class="nest-bowl"></div>
      </div>
    </div>

    <!-- Lanes (rendered top to bottom = lane 4 first) -->
    {#each [...lanes].reverse() as lane (lane.index)}
      <div class="lane" style="--dir:{lane.direction}">
        {#each lane.pads as pad (pad.id)}
          {@const isGlowing = pad.id === glowingPadId}
          {@const isChickOn = pad.id === chickenPadId}
          {@const nearEdge = lane.direction > 0 ? pad.x > (100 - pad.width * EDGE_WARN) : pad.x < (pad.width * (EDGE_WARN - 1))}
          <div
            class="pad"
            class:pad--glow={isGlowing}
            class:pad--chick={isChickOn}
            class:pad--danger={isChickOn && nearEdge}
            style="left:{pad.x}%; width:{pad.width}%"
          >
            {#if isChickOn}
              <div class="pad-chick">
                <PixelChick size={36} state={chickState} />
              </div>
            {/if}
            <span class="pad-word">{pad.word}</span>
          </div>
        {/each}
      </div>
    {/each}

    <!-- Near bank -->
    <div class="bank bank--near">
      <span class="bank-label">{$t('arcade.bank.near')}</span>
      {#if chickenLane === NEAR_BANK}
        <div class="bank-chick">
          <PixelChick size={36} state={chickState} />
        </div>
      {/if}
    </div>
  </div>

  <!-- Word input strip -->
  <div class="input-area">
    {#if onFinalLane}
      <div class="input-label input-label--final">{$t('arcade.reachNest')}</div>
      <div class="word-tiles">
        {#each [...nestWord] as char, i}
          <div class="tile"
            class:tile--typed={i < typedSoFar.length}
            class:tile--current={i === typedSoFar.length}
            class:tile--pending={i > typedSoFar.length}
          >{char}</div>
        {/each}
      </div>
    {:else if glowingPadId}
      {@const pad = getGlowingPad()}
      {#if pad}
        <div class="input-label">{$t('arcade.typePrompt')}</div>
        <div class="word-tiles">
          {#each [...pad.word] as char, i}
            <div class="tile"
              class:tile--typed={i < typedSoFar.length}
              class:tile--current={i === typedSoFar.length}
              class:tile--pending={i > typedSoFar.length}
            >{char}</div>
          {/each}
        </div>
      {/if}
    {:else}
      <div class="input-label" style="color: var(--text-muted)">{$t('arcade.waitingForPad')}</div>
    {/if}
  </div>

  <!-- Pause overlay -->
  {#if gamePhase === 'paused'}
    <div class="pause-overlay">
      <div class="pause-box" bind:this={pauseBoxEl}>
        <div class="pause-title">{$t('arcade.paused')}</div>
        <button class="pause-action-btn pause-action-btn--resume" bind:this={resumeBtn} on:click={togglePause}>
          {$t('arcade.resume')}
        </button>
        <div class="pause-divider"></div>
        <button class="pause-action-btn pause-action-btn--exit" on:click={() => { clearTimeout(endGameTimer); goTo('lessons') }}>
          {$t('arcade.exit')}
        </button>
      </div>
    </div>
  {/if}

  <!-- Intro modal -->
  {#if showIntro}
    <div class="intro-overlay" bind:this={introEl}>
      <div class="intro-box">
        <div class="intro-title">{$t('arcade.intro.title')}</div>
        <ul class="intro-steps">
          <li>{$t('arcade.intro.step1')}</li>
          <li>{$t('arcade.intro.step2')}</li>
          <li>{$t('arcade.intro.step3')}</li>
        </ul>
        <button class="intro-btn" bind:this={introBtn} on:click={() => showIntro = false}>
          {$t('arcade.intro.start')}
        </button>
      </div>
    </div>
  {/if}

  <!-- SPLASH overlay -->
  {#if gamePhase === 'done'}
    <div class="splash-overlay">
      <div class="splash-chick"><PixelChick size={100} state="splash" /></div>
      <div class="splash-text">{$t('arcade.splash')}</div>
      <div class="splash-score">{score}</div>
    </div>
  {/if}

</div>

<style>
  .screen.game {
    display: flex; flex-direction: column;
    min-height: calc(100dvh - 32px);
    position: relative;
  }

  /* HUD */
  .hud {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 16px; background: var(--bg-sunken);
    border-bottom: 1px solid var(--border);
  }
  .hud-block { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .hud-label { font-size: 18px; color: var(--text-muted); letter-spacing: 2px; }
  .hud-val { font-size: 32px; font-weight: bold; color: #ffcc00; text-shadow: 0 0 8px #ffcc0066; font-family: monospace; }
  .hud-val.combo { font-size: 30px; }
  .hearts { display: flex; gap: 4px; align-items: center; }
  .heart {
    width: 14px; height: 14px;
    background: #ff4466;
    clip-path: polygon(50% 15%, 65% 0%, 100% 20%, 100% 55%, 50% 100%, 0% 55%, 0% 20%, 35% 0%);
    box-shadow: 0 0 6px #ff446688;
  }
  .heart--lost { background: var(--bg-raised); box-shadow: none; }

  /* Speed bar */
  .speed-bar-wrap { padding: 4px 16px 6px; background: var(--bg-sunken); }
  .speed-label { font-size: 18px; color: var(--text-muted); letter-spacing: 2px; margin-bottom: 3px; }
  .speed-bar { height: 3px; background: var(--bg-raised); border-radius: 2px; }
  .speed-fill { height: 3px; border-radius: 2px; transition: width 0.5s, background 0.5s; }

  /* River */
  .river { flex: 1; display: flex; flex-direction: column; }

  .bank {
    display: flex; align-items: center; padding: 0 14px; gap: 10px;
    position: relative;
  }
  .bank--far {
    height: 72px;
    background: linear-gradient(to bottom, #071a07, #0e2509);
    border-bottom: 2px solid #00aa44;
    box-shadow: inset 0 -3px 14px rgba(0,180,80,.12);
    justify-content: flex-end;
  }
  .bank--near { height: 36px; background: #0a1a0a; border-top: 1px solid #005533; }
  .bank-label { font-size: 18px; color: #00ff88; letter-spacing: 2px; font-family: monospace; }

  /* Nest */
  .nest {
    position: absolute; left: 50%; transform: translateX(-50%);
    bottom: 4px; width: 54px;
  }
  .nest-bowl {
    width: 54px; height: 22px;
    background-color: #3d1800;
    background-image:
      repeating-linear-gradient(68deg, transparent, transparent 2px, rgba(160,90,10,.6) 2px, rgba(160,90,10,.6) 3px),
      repeating-linear-gradient(-68deg, transparent, transparent 3px, rgba(210,130,20,.4) 3px, rgba(210,130,20,.4) 4px);
    border: 2px solid #a05010;
    border-top: 3px solid #d07828;
    border-radius: 0 0 50% 50%;
    box-shadow: 0 3px 10px rgba(0,0,0,.7), 0 0 12px rgba(180,100,20,.25), inset 0 -4px 8px rgba(0,0,0,.5);
  }
  .nest-bowl::before, .nest-bowl::after {
    content: ''; position: absolute; top: -5px; height: 3px; width: 12px;
    background: #c87028; border-radius: 1px;
  }
  .nest-bowl::before { left: -2px; transform: rotate(-22deg); }
  .nest-bowl::after  { right: -2px; transform: rotate(22deg); }
  .nest-target {
    text-align: center; font-size: 17px; font-weight: bold; font-family: monospace;
    letter-spacing: 1px; color: #ffcc00aa; margin-bottom: 2px;
    transition: color 0.2s, text-shadow 0.2s;
  }
  .nest-target--active {
    color: #00ffcc; text-shadow: 0 0 10px #00ffcc, 0 0 20px #00ffcc88;
  }
  .nest-chick {
    display: flex; justify-content: center;
    margin-bottom: 2px;
  }

  .lane {
    flex: 1; position: relative; overflow-x: clip; overflow-y: visible;
    background-color: #021828;
    border-top: 1px solid #0a3050;
    background-image:
      repeating-linear-gradient(
        0deg,
        transparent, transparent 5px,
        rgba(0, 160, 255, 0.07) 5px, rgba(0, 160, 255, 0.07) 6px
      ),
      repeating-linear-gradient(
        0deg,
        transparent, transparent 11px,
        rgba(0, 100, 200, 0.05) 11px, rgba(0, 100, 200, 0.05) 12px
      );
    background-size: 100% 12px;
    animation: water-drift 2.4s linear infinite;
  }
  @keyframes water-drift {
    from { background-position: 0 0; }
    to   { background-position: 0 12px; }
  }

  .pad {
    position: absolute; top: 50%; transform: translateY(-50%);
    min-height: 32px; display: flex; align-items: center; justify-content: center;
    background: #0a2a14; border: 1px solid #00884433; border-radius: 4px;
    padding: 0 6px; transition: border-color 0.1s, box-shadow 0.1s;
  }
  .pad--glow {
    border-color: #00ffcc;
    border-width: 2px;
    box-shadow: 0 0 18px #00ffccaa, 0 0 36px #00ffcc44, inset 0 0 10px #00ffcc22;
    background: #0d4020;
  }
  .pad--chick {
    border-color: #ffcc00;
    box-shadow: 0 0 12px #ffcc0066;
    background: #1a2a00;
  }
  .pad--danger {
    border-color: #ff4466 !important;
    box-shadow: 0 0 12px #ff446688 !important;
    animation: danger-pulse 0.4s ease-in-out infinite alternate;
  }
  @keyframes danger-pulse {
    from { border-color: #ff4466; }
    to   { border-color: #ff000088; }
  }
  .pad-word {
    font-size: 17px; font-weight: bold; font-family: monospace;
    color: #00ff88; letter-spacing: 1px; white-space: nowrap;
  }
  .pad--glow .pad-word { color: #00ffcc; }
  .pad--chick .pad-word { color: #ffcc00; }
  .pad-chick { position: absolute; top: -38px; left: 50%; transform: translateX(-50%); }

  /* Input area */
  .input-area {
    padding: 10px 16px 14px; background: var(--bg-sunken);
    border-top: 2px solid var(--border); min-height: 72px;
  }
  .input-label { font-size: 17px; color: var(--text-muted); letter-spacing: 2px; margin-bottom: 6px; }
  .input-label--final { color: #00ffcc; font-size: 17px; text-shadow: 0 0 8px #00ffcc88; }
  .word-tiles { display: flex; gap: 6px; flex-wrap: wrap; }
  .tile {
    width: 36px; height: 44px; display: flex; align-items: center; justify-content: center;
    font-size: 26px; font-weight: bold; font-family: monospace;
    border-radius: 3px; border: 1px solid var(--border);
    background: var(--bg-raised); color: var(--text-muted);
  }
  .tile--typed   { background: #0a2a1a; color: #00ff88; border-color: #00ff88; }
  .tile--current { background: #00ffcc; color: #001a10; border-color: #00ffcc; box-shadow: 0 0 8px #00ffcc88; }
  .tile--pending { color: #444; }

  /* SPLASH overlay */
  .splash-overlay {
    position: absolute; inset: 0; z-index: 10;
    background: rgba(10, 6, 24, 0.92);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 16px; animation: fade-in 0.3s ease;
  }
  @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
  .splash-text {
    font-size: 48px; font-weight: bold; font-family: monospace;
    color: #00ffcc; text-shadow: 0 0 20px #00ffcc; letter-spacing: 4px;
    animation: glow-pulse 0.8s ease-in-out infinite alternate;
  }
  @keyframes glow-pulse {
    from { text-shadow: 0 0 20px #00ffcc; }
    to   { text-shadow: 0 0 40px #00ffcc, 0 0 80px #00ffcc44; }
  }
  .splash-score {
    font-size: 28px; font-family: monospace; color: #ffcc00;
    text-shadow: 0 0 10px #ffcc0088;
  }

  /* Pause button in HUD */
  .hud-btns { display: flex; flex-direction: column; gap: 5px; align-self: center; }
  .pause-btn {
    font-size: 15px; font-weight: bold; font-family: monospace; letter-spacing: 2px;
    color: color-mix(in srgb,var(--accent-cyan) 60%,transparent); background: transparent; border: none;
    padding: 4px 8px;
    text-shadow: 0 0 5px color-mix(in srgb,var(--accent-cyan) 55%,transparent),
                 0 0 14px color-mix(in srgb,var(--accent-cyan) 28%,transparent);
    transition: text-shadow 0.15s, color 0.15s;
  }
  .pause-btn--exit {
    color: color-mix(in srgb,#ff4466 60%,transparent);
    text-shadow: 0 0 5px color-mix(in srgb,#ff4466 55%,transparent),
                 0 0 14px color-mix(in srgb,#ff4466 28%,transparent);
  }
  .pause-btn:hover, .pause-btn:focus-visible {
    color: var(--accent-cyan);
    text-shadow: 0 0 6px var(--accent-cyan), 0 0 16px var(--accent-cyan),
                 0 0 32px var(--accent-cyan), 0 0 60px color-mix(in srgb,var(--accent-cyan) 70%,transparent);
  }
  .pause-btn--exit:hover, .pause-btn--exit:focus-visible {
    color: #ff4466;
    text-shadow: 0 0 6px #ff4466, 0 0 16px #ff4466,
                 0 0 32px #ff4466, 0 0 60px color-mix(in srgb,#ff4466 70%,transparent);
  }

  /* Pause overlay */
  .pause-overlay {
    position: absolute; inset: 0; z-index: 20;
    background: rgba(10, 6, 24, 0.88);
    display: flex; align-items: center; justify-content: center;
  }
  .pause-box {
    background: var(--bg-sunken);
    border: 2px solid var(--accent-cyan);
    border-radius: 6px;
    box-shadow: 0 0 32px color-mix(in srgb, var(--accent-cyan) 20%, transparent);
    padding: 32px 40px;
    display: flex; flex-direction: column; align-items: center; gap: 16px;
  }
  .pause-divider {
    width: 100%; height: 1px; background: var(--border); margin: 4px 0;
  }
  .pause-title {
    font-size: 26px; font-weight: bold; font-family: monospace; letter-spacing: 4px;
    color: var(--accent-cyan); text-shadow: 0 0 12px var(--accent-cyan);
    margin-bottom: 8px;
  }
  .pause-action-btn {
    width: 200px; padding: 12px;
    font-size: 18px; font-weight: bold; font-family: monospace; letter-spacing: 2px;
    border-radius: 4px; transition: box-shadow 0.15s, transform 0.1s;
  }
  .pause-action-btn:hover { transform: scale(1.04); }
  .pause-action-btn:active { transform: scale(0.97); }
  .pause-action-btn--resume {
    color: var(--bg); background: var(--accent-cyan);
    box-shadow: 0 0 16px color-mix(in srgb, var(--accent-cyan) 40%, transparent);
  }
  .pause-action-btn--resume:hover { box-shadow: 0 0 28px var(--accent-cyan); }
  .pause-action-btn--exit {
    color: var(--text-muted); background: var(--bg-raised);
    border: 1px solid var(--border);
  }
  .pause-action-btn--exit:hover { color: #ff4466; border-color: #ff4466; box-shadow: 0 0 12px #ff446644; }

  /* Intro modal */
  .intro-overlay {
    position: absolute; inset: 0; z-index: 20;
    background: rgba(10, 6, 24, 0.88);
    display: flex; align-items: center; justify-content: center;
    padding: 24px;
  }
  .intro-box {
    background: var(--bg-sunken);
    border: 2px solid var(--accent-cyan);
    border-radius: 6px;
    box-shadow: 0 0 32px color-mix(in srgb, var(--accent-cyan) 20%, transparent);
    padding: 28px 24px 24px;
    max-width: 420px; width: 100%;
    display: flex; flex-direction: column; align-items: center; gap: 20px;
  }
  .intro-title {
    font-size: 22px; font-weight: bold; font-family: monospace;
    color: var(--accent-cyan); letter-spacing: 3px;
    text-shadow: 0 0 12px var(--accent-cyan);
  }
  .intro-steps {
    list-style: none; display: flex; flex-direction: column; gap: 12px; width: 100%;
  }
  .intro-steps li {
    font-size: 17px; font-family: monospace; color: var(--text);
    line-height: 1.5; padding: 10px 12px;
    background: var(--bg-raised); border-radius: 4px;
    border-left: 3px solid var(--accent-cyan);
  }
  .intro-btn {
    margin-top: 4px; padding: 12px 32px;
    font-size: 19px; font-weight: bold; font-family: monospace; letter-spacing: 2px;
    color: var(--bg); background: var(--accent-cyan);
    border-radius: 4px;
    box-shadow: 0 0 16px color-mix(in srgb, var(--accent-cyan) 40%, transparent);
    transition: box-shadow 0.15s, transform 0.1s;
  }
  .intro-btn:hover { box-shadow: 0 0 28px var(--accent-cyan); transform: scale(1.04); }
  .intro-btn:active { transform: scale(0.97); }

  .pause-action-btn--resume:focus-visible { box-shadow: 0 0 6px var(--accent-cyan), 0 0 24px color-mix(in srgb,var(--accent-cyan) 60%,transparent); }
  .pause-action-btn--exit:focus-visible   { color: #ff4466; border-color: #ff4466; box-shadow: 0 0 6px #ff4466, 0 0 20px color-mix(in srgb,#ff4466 50%,transparent); }
  .intro-btn:focus-visible                { box-shadow: 0 0 6px var(--accent-cyan), 0 0 28px color-mix(in srgb,var(--accent-cyan) 60%,transparent); }
</style>
