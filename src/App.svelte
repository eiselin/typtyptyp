<script>
  import { t } from './i18n/index.js'
  import { screen } from './stores/screen.js'
  import { wipe, WIPE_MS } from './transitions.js'
  import HomeScreen         from './screens/HomeScreen.svelte'
  import LessonSelectScreen from './screens/LessonSelectScreen.svelte'
  import ExerciseScreen     from './screens/ExerciseScreen.svelte'
  import ResultsScreen      from './screens/ResultsScreen.svelte'
  import GuideScreen        from './screens/GuideScreen.svelte'

  let storageOk = true
  try { localStorage.setItem('_t','1'); localStorage.removeItem('_t') } catch { storageOk = false }
</script>

<main>
  {#if !storageOk}
    <div class="no-save">{$t('noSave.banner')}</div>
  {/if}

  <div class="screens">
    {#if $screen === 'home'}
      <div class="sw" in:wipe={{delay:WIPE_MS}} out:wipe>
        <HomeScreen />
      </div>
    {:else if $screen === 'lessons'}
      <div class="sw" in:wipe={{delay:WIPE_MS}} out:wipe>
        <LessonSelectScreen />
      </div>
    {:else if $screen === 'exercise'}
      <div class="sw" in:wipe={{delay:WIPE_MS}} out:wipe>
        <ExerciseScreen />
      </div>
    {:else if $screen === 'results'}
      <div class="sw" in:wipe={{delay:WIPE_MS}} out:wipe>
        <ResultsScreen />
      </div>
    {:else if $screen === 'guide'}
      <div class="sw" in:wipe={{delay:WIPE_MS}} out:wipe>
        <GuideScreen />
      </div>
    {/if}
  </div>
</main>

<style>
  main { width:100%; }
  .screens { display:grid; width:100%; align-items:start; min-height:calc(100dvh - 32px); }
  .sw { grid-area:1/1; }
  .no-save { position:fixed; top:0; left:0; right:0; background:#ff4455; color:#fff; text-align:center; padding:6px; font-size:12px; font-family:monospace; letter-spacing:1px; z-index:100; }
</style>
