<script>
  export let height = 96
  $: width = Math.round(height * 40 / 24)
</script>

<!--
  Scene layout (40×24 pixel grid):
  - Chalkboard (left): brown frame, dark green surface, chalk lines
  - Pointer stick: diagonal line from chick's left wing to board
  - Chick (right): standard idle sprite, faces left toward board
  - Mortarboard cap: pixel art cap above chick's head
-->
<svg
  {width} {height}
  viewBox="0 0 40 24"
  style="image-rendering:pixelated;image-rendering:crisp-edges;display:block;"
  class="professor"
>
  <!-- Board frame (wood brown) -->
  <rect x="1" y="4" width="16" height="15" fill="#6B3A1F"/>
  <!-- Board surface (dark chalkboard green) -->
  <rect x="2" y="5" width="14" height="13" fill="#0D2E0D"/>
  <!-- Surface top highlight -->
  <rect x="2" y="5" width="14" height="1" fill="#164916"/>
  <!-- Board legs -->
  <rect x="3" y="19" width="2" height="2" fill="#6B3A1F"/>
  <rect x="13" y="19" width="2" height="2" fill="#6B3A1F"/>

  <!-- Chalk lines (lesson notes) -->
  <rect x="4" y="7"  width="9" height="1" fill="#C8D8C0" opacity="0.85"/>
  <rect x="4" y="9"  width="7" height="1" fill="#C8D8C0" opacity="0.85"/>
  <rect x="4" y="11" width="9" height="1" fill="#C8D8C0" opacity="0.85"/>
  <rect x="4" y="13" width="5" height="1" fill="#C8D8C0" opacity="0.85"/>
  <!-- Chalk star / highlight on board -->
  <rect x="10" y="15" width="1" height="1" fill="#FFD700" opacity="0.7"/>
  <rect x="9"  y="16" width="3" height="1" fill="#FFD700" opacity="0.7"/>
  <rect x="10" y="17" width="1" height="1" fill="#FFD700" opacity="0.7"/>

  <!-- Pointer stick (from chick left-wing area to board right edge) -->
  <!-- Diagonal: (23,10)→(15,8) in 8 steps -->
  <rect x="23" y="10" width="1" height="1" fill="#D4C090"/>
  <rect x="22" y="10" width="1" height="1" fill="#D4C090"/>
  <rect x="21" y="10" width="1" height="1" fill="#D4C090"/>
  <rect x="20" y="9"  width="1" height="1" fill="#D4C090"/>
  <rect x="19" y="9"  width="1" height="1" fill="#D4C090"/>
  <rect x="18" y="9"  width="1" height="1" fill="#D4C090"/>
  <rect x="17" y="8"  width="1" height="1" fill="#D4C090"/>
  <rect x="16" y="8"  width="1" height="1" fill="#E8D8A8"/>
  <!-- Bright tip at board -->
  <rect x="15" y="8"  width="1" height="1" fill="#FFFFC0"/>

  <!-- Mortarboard cap (above chick head, chick top is at y=5) -->
  <!-- Cap top block -->
  <rect x="26" y="1" width="5" height="2" fill="#220044"/>
  <!-- Brim (wider than cap, sits at y=3 = one row above chick head) -->
  <rect x="24" y="3" width="9" height="1" fill="#220044"/>
  <!-- Gold tassel string hanging from right side of cap -->
  <rect x="31" y="1" width="1" height="4" fill="#FFD700"/>
  <!-- Tassel end ball -->
  <rect x="30" y="4" width="2" height="1" fill="#FFD700"/>

  <!-- CHICK — idle sprite, offset +24x +5y from original 12×13 viewbox -->
  <rect x="27" y="5"  width="4" height="1" fill="#FFD700"/>
  <rect x="26" y="6"  width="6" height="1" fill="#FFD700"/>
  <rect x="25" y="7"  width="8" height="1" fill="#FFD700"/>
  <rect x="25" y="8"  width="1" height="1" fill="#FFD700"/>
  <rect x="26" y="8"  width="1" height="1" fill="#FF8800"/>
  <rect x="27" y="8"  width="6" height="1" fill="#FFD700"/>
  <rect x="24" y="9"  width="2" height="1" fill="#FFD700"/>
  <rect x="26" y="9"  width="2" height="1" fill="#FF8800"/>
  <rect x="28" y="9"  width="1" height="1" fill="#FFD700"/>
  <rect x="29" y="9"  width="1" height="1" fill="#110033"/>
  <rect x="30" y="9"  width="4" height="1" fill="#FFD700"/>
  <rect x="24" y="10" width="10" height="1" fill="#FFD700"/>
  <rect x="24" y="11" width="1" height="1" fill="#CC8800"/>
  <rect x="25" y="11" width="8" height="1" fill="#FFD700"/>
  <rect x="33" y="11" width="1" height="1" fill="#CC8800"/>
  <rect x="25" y="12" width="8" height="1" fill="#FFD700"/>
  <rect x="26" y="13" width="6" height="1" fill="#FFD700"/>
  <rect x="27" y="14" width="4" height="1" fill="#FFD700"/>
  <rect x="27" y="15" width="1" height="1" fill="#FF8800"/>
  <rect x="30" y="15" width="1" height="1" fill="#FF8800"/>
  <rect x="26" y="16" width="2" height="1" fill="#FF8800"/>
  <rect x="30" y="16" width="2" height="1" fill="#FF8800"/>
</svg>

<style>
  @keyframes bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
  .professor { animation: bob 3s ease-in-out infinite; }
</style>
