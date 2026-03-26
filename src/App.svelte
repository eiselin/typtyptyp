<script>
  import { fly } from 'svelte/transition'
  import { t } from './i18n/index.js'
  import { screen } from './stores/screen.js'
  import HomeScreen         from './screens/HomeScreen.svelte'
  import LessonSelectScreen from './screens/LessonSelectScreen.svelte'
  import ExerciseScreen     from './screens/ExerciseScreen.svelte'
  import ResultsScreen      from './screens/ResultsScreen.svelte'

  let storageOk = true
  try { localStorage.setItem('_t','1'); localStorage.removeItem('_t') } catch { storageOk = false }
</script>

<main>
  {#if !storageOk}
    <div class="no-save">{$t('noSave.banner')}</div>
  {/if}

  {#if $screen === 'home'}
    <div in:fly={{x:-30,duration:200}} out:fly={{x:30,duration:150}}>
      <HomeScreen />
    </div>
  {:else if $screen === 'lessons'}
    <div in:fly={{x:30,duration:200}} out:fly={{x:-30,duration:150}}>
      <LessonSelectScreen />
    </div>
  {:else if $screen === 'exercise'}
    <div in:fly={{y:20,duration:200}} out:fly={{y:-20,duration:150}}>
      <ExerciseScreen />
    </div>
  {:else if $screen === 'results'}
    <div in:fly={{y:20,duration:200}} out:fly={{y:-20,duration:150}}>
      <ResultsScreen />
    </div>
  {/if}
</main>

<style>
  main { width:100%; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:16px; }
  .no-save { position:fixed; top:0; left:0; right:0; background:#ff4455; color:#fff; text-align:center; padding:6px; font-size:12px; font-family:monospace; letter-spacing:1px; z-index:100; }
</style>
