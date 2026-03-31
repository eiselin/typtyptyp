<script>
  import { t } from './i18n/index.js'
  import { screen } from './stores/screen.js'
  import { wipe, WIPE_MS } from './transitions.js'
  import HomeScreen         from './screens/HomeScreen.svelte'
  import LessonSelectScreen from './screens/LessonSelectScreen.svelte'
  import ExerciseScreen     from './screens/ExerciseScreen.svelte'
  import ResultsScreen      from './screens/ResultsScreen.svelte'
  import GuideScreen        from './screens/GuideScreen.svelte'
  import GameScreen         from './screens/GameScreen.svelte'
  import ProgressScreen     from './screens/ProgressScreen.svelte'
  import AboutScreen        from './screens/AboutScreen.svelte'

  const SCREENS = {
    home:     HomeScreen,
    lessons:  LessonSelectScreen,
    exercise: ExerciseScreen,
    results:  ResultsScreen,
    guide:    GuideScreen,
    game:     GameScreen,
    progress: ProgressScreen,
    about:    AboutScreen,
  }

  let storageOk = true
  try { localStorage.setItem('_t','1'); localStorage.removeItem('_t') } catch { storageOk = false }
</script>

<main>
  {#if !storageOk}
    <div class="no-save">{$t('noSave.banner')}</div>
  {/if}

  <div class="screens">
    {#key $screen}
      <div class="sw" in:wipe={{delay:WIPE_MS}} out:wipe>
        <svelte:component this={SCREENS[$screen]} />
      </div>
    {/key}
  </div>
</main>


<style>
  main { width:100%; }
  .screens { display:grid; grid-template-columns:1fr; width:100%; align-items:start; min-height:calc(100dvh - 32px); }
  .sw { grid-area:1/1; width:100%; }
  .no-save { position:fixed; top:0; left:0; right:0; background:#ff4455; color:#fff; text-align:center; padding:6px; font-size:12px; font-family:monospace; letter-spacing:1px; z-index:100; }
</style>
