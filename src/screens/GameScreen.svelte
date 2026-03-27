<script>
  import { get } from 'svelte/store'
  import { t } from '../i18n/index.js'
  import { selectedGroup, goTo } from '../stores/screen.js'
  import { activeProfile, updateArcadeProgress } from '../stores/profiles.js'
  import { gameResults } from '../stores/game.js'
  import { submitScore } from '../stores/leaderboard.js'
  import { getArcadeWordCycler, WORD_LISTS } from '../words/index.js'
  import { lang } from '../i18n/index.js'
  import PixelChick from '../components/PixelChick.svelte'

  // ── Constants ───────────────────────────────────────────────
  const NUM_LANES   = 5
  const BASE_SPEED  = 8         // % of container width per second at speed_factor 1.0
  const MAX_SPEED   = 3.0
  const EDGE_WARN   = 2         // pad-widths from edge triggers flash
  const NEAR_BANK   = -1        // chick lane index when on near (start) bank
  const FAR_BANK    = NUM_LANES // chick lane index when on far (goal) bank

  // ── Game state (Svelte 5 runes) ─────────────────────────────
  let losing       = false    // guard: prevents loseLife() firing twice in one frame
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
  // NOTE: $derived takes an expression, not a thunk. Use an IIFE to keep
  // multi-statement logic readable while satisfying Svelte 5 syntax.
  const glowingPadId = $derived((() => {
    // On the last lane, the target is the pad we're riding (typing it completes the crossing)
    if (chickenLane === NUM_LANES - 1 && chickenPadId !== null) {
      return chickenPadId
    }
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
  })())

  // ── Derived: speed bar colour ────────────────────────────────
  const speedColour = $derived(
    speedFactor < 1.5 ? '#00ffcc' : speedFactor <= 2.5 ? '#ff8800' : '#ff4466'
  )
  const speedPct = $derived(Math.round(((speedFactor - 1.0) / (MAX_SPEED - 1.0)) * 100))

  // ── Multiplier ───────────────────────────────────────────────
  const multiplier = $derived(Math.min(Math.floor(combo / 5) + 1, 10))

  // ── Game loop ────────────────────────────────────────────────
  let animId
  let lastTime = 0

  function updatePads(dt) {
    lanes = lanes.map(lane => {
      const speed = BASE_SPEED * speedFactor * lane.direction
      const pads = lane.pads.map(pad => {
        let nx = pad.x + speed * dt
        // Check if chick loses life: chick is on this pad and it exits
        if (pad.id === chickenPadId) {
          if (lane.direction > 0 && nx > 100) { loseLife(); nx = pad.x }
          if (lane.direction < 0 && nx + pad.width < 0) { loseLife(); nx = pad.x }
        }
        // Pad exited screen — wrap and assign new word
        if (lane.direction > 0 && nx > 100 + pad.width) {
          return makePad(-pad.width - 2)
        }
        if (lane.direction < 0 && nx + pad.width < -2) {
          return makePad(100 + 2)
        }
        return { ...pad, x: nx }
      })
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
    if (gamePhase === 'playing') {
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

  function handleKey(e) {
    if (gamePhase !== 'playing') return
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey) return

    const pad = getGlowingPad()
    if (!pad) return

    const expected = pad.word[typedSoFar.length]
    if (!expected) return

    if (e.key === expected) {
      combo += 1
      const newTyped = typedSoFar + e.key
      if (newTyped === pad.word) {
        // Word complete — hop!
        const wordScore = Math.round(pad.word.length * multiplier * speedFactor)
        score += wordScore
        typedSoFar = ''
        hopToNextLane(pad)
      } else {
        typedSoFar = newTyped
      }
    } else {
      combo = 0
      typedSoFar = ''
      chickState = 'wobble'
      setTimeout(() => { if (chickState === 'wobble') chickState = 'idle' }, 500)
    }
  }

  function hopToNextLane(targetPad) {
    const nextLane = chickenLane + 1
    chickState = 'hop'
    setTimeout(() => { if (chickState === 'hop') chickState = 'idle' }, 450)

    if (nextLane >= NUM_LANES) {
      // Reached far bank!
      chickenLane = FAR_BANK
      chickenPadId = null
      const bonus = Math.round(500 * speedFactor)
      score += bonus
      crossings += 1
      speedFactor = Math.min(+(speedFactor + 0.1).toFixed(1), MAX_SPEED)
      // Reset for next round
      setTimeout(startNewRound, 800)
    } else {
      chickenLane = nextLane
      chickenPadId = targetPad.id
    }
  }

  function startNewRound() {
    chickenLane = NEAR_BANK
    chickenPadId = null
    typedSoFar = ''
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
    }, 1200)
  }

  function endGame() {
    cancelAnimationFrame(animId)
    const p = get(activeProfile)
    if (p) {
      updateArcadeProgress(p.id, groupId, score)
      submitScore(p.name, score, groupId)
    }
    gameResults.set({ score, crossings, groupId, profileName: p?.name ?? '?', prevBest })
    // Show SPLASH overlay for 2s, then go to results
    setTimeout(() => goTo('results'), 2000)
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

<div class="screen game">

  <!-- HUD -->
  <div class="hud">
    <div class="hud-block">
      <div class="hud-label">{$t('arcade.hud.score')}</div>
      <div class="hud-val">{String(score).padStart(5, '0')}</div>
    </div>
    <div class="hud-block">
      <div class="hud-label">{$t('arcade.hud.combo')}</div>
      <div class="hud-val combo" style="color: {combo > 0 ? '#ff8800' : 'var(--text-muted)'}">
        x{multiplier}{combo >= 5 ? ' 🔥' : ''}
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
      <div class="hud-val" style="color: var(--text-muted); font-size:13px">{String(prevBest).padStart(5, '0')}</div>
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
    <!-- Far bank -->
    <div class="bank bank--far">
      <span class="bank-label">{$t('arcade.bank.far')}</span>
      {#if chickenLane === FAR_BANK}
        <div class="bank-chick">
          <PixelChick size={36} state={chickState} />
        </div>
      {/if}
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
    {#if glowingPadId}
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
    max-width: 520px; margin: 0 auto;
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
  .hud-label { font-size: 8px; color: var(--text-muted); letter-spacing: 2px; }
  .hud-val { font-size: 16px; font-weight: bold; color: #ffcc00; text-shadow: 0 0 8px #ffcc0066; font-family: monospace; }
  .hud-val.combo { font-size: 14px; }
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
  .speed-label { font-size: 8px; color: var(--text-muted); letter-spacing: 2px; margin-bottom: 3px; }
  .speed-bar { height: 3px; background: var(--bg-raised); border-radius: 2px; }
  .speed-fill { height: 3px; border-radius: 2px; transition: width 0.5s, background 0.5s; }

  /* River */
  .river { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

  .bank {
    height: 36px; display: flex; align-items: center; padding: 0 14px; gap: 10px;
    position: relative;
  }
  .bank--far  { background: #0a1a0a; border-bottom: 1px solid #005533; justify-content: flex-end; }
  .bank--near { background: #0a1a0a; border-top: 1px solid #005533; }
  .bank-label { font-size: 9px; color: #00ff88; letter-spacing: 2px; font-family: monospace; }
  .bank-chick { position: absolute; left: 50%; transform: translateX(-50%); bottom: 4px; }

  .lane {
    flex: 1; position: relative; overflow: hidden;
    background: #04111e;
    border-top: 1px solid #0a2030;
    /* scanline shimmer — reuse project pattern */
    background-image: repeating-linear-gradient(
      0deg, transparent, transparent 3px,
      rgba(0, 180, 255, 0.03) 3px, rgba(0, 180, 255, 0.03) 4px
    );
  }

  .pad {
    position: absolute; top: 50%; transform: translateY(-50%);
    min-height: 32px; display: flex; align-items: center; justify-content: center;
    background: #0a2a14; border: 1px solid #00884433; border-radius: 4px;
    padding: 0 6px; transition: border-color 0.1s, box-shadow 0.1s;
  }
  .pad--glow {
    border-color: #00ffcc;
    box-shadow: 0 0 12px #00ffcc66;
    background: #0a3a1a;
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
    font-size: 12px; font-weight: bold; font-family: monospace;
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
  .input-label { font-size: 8px; color: var(--text-muted); letter-spacing: 2px; margin-bottom: 6px; }
  .word-tiles { display: flex; gap: 4px; flex-wrap: wrap; }
  .tile {
    width: 24px; height: 28px; display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: bold; font-family: monospace;
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
</style>
