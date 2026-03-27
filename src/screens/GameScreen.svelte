<script>
  import { goTo } from '../stores/screen.js'
</script>

<div class="screen" style="padding:40px; text-align:center; font-family:monospace; color:#00ffcc;">
  <p>GAME SCREEN — COMING SOON</p>
  <button on:click={() => goTo('lessons')} style="margin-top:20px; font-family:inherit; padding:10px 20px; background:#1a0a3a; border:1px solid #00ffcc; color:#00ffcc; cursor:pointer; letter-spacing:2px;">← BACK</button>
</div>
