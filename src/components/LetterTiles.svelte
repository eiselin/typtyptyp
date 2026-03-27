<script>
  import { FINGER_MAP } from '../lessons/index.js'

  export let sequence = ''
  export let cursor = 0

  const CHARS_PER_LINE = 14

  const FV = {
    lp:'var(--f-lp)', lr:'var(--f-lr)', lm:'var(--f-lm)', li:'var(--f-li)',
    ri:'var(--f-ri)', rm:'var(--f-rm)', rr:'var(--f-rr)', rp:'var(--f-rp)',
  }

  // Split sequence into word-wrapped lines: {start, end} char ranges
  $: lineRanges = (() => {
    if (!sequence) return []
    const words = sequence.split(' ')
    const wordStarts = []
    let pos = 0
    for (const word of words) {
      wordStarts.push(pos)
      pos += word.length + 1
    }
    const lines = []
    let lineFirstWord = 0
    let lineLen = 0
    for (let wi = 0; wi < words.length; wi++) {
      const word = words[wi]
      if (lineLen > 0 && lineLen + 1 + word.length > CHARS_PER_LINE) {
        lines.push({ start: wordStarts[lineFirstWord], end: wordStarts[wi] })
        lineFirstWord = wi
        lineLen = word.length
      } else {
        lineLen = lineLen === 0 ? word.length : lineLen + 1 + word.length
      }
    }
    lines.push({ start: wordStarts[lineFirstWord], end: sequence.length })
    return lines
  })()

  $: currentLineIdx = Math.max(0, lineRanges.findLastIndex(r => r.start <= cursor))

  let outerEl

  // Whenever the active line changes, scroll so it's flush at the top of the container
  $: if (currentLineIdx >= 0) scrollToLine(currentLineIdx)

  function scrollToLine(idx) {
    requestAnimationFrame(() => {
      if (!outerEl) return
      const rows = outerEl.querySelectorAll('.tile-row')
      const row = rows[Math.max(0, idx - 1)]
      if (row) outerEl.scrollTo({ top: Math.max(0, row.offsetTop - 12), behavior: 'smooth' })
    })
  }
</script>

<div class="tiles-outer" bind:this={outerEl}>
  {#each lineRanges as range, li}
    <div class="tile-row">
      {#each sequence.slice(range.start, range.end).split('') as char, ci}
        {@const idx = range.start + ci}
        {#if char === ' '}
          <span
            class="tile tile--space"
            class:tile--space-active={idx === cursor}
            class:tile--done={idx < cursor}
          >⎵</span>
        {:else}
          {@const finger = FINGER_MAP[char.toLowerCase()]}
          {@const colour = finger ? FV[finger] : 'var(--text)'}
          <span
            class="tile"
            class:tile--done={idx < cursor}
            class:tile--active={idx === cursor}
            class:tile--pending={idx > cursor}
            style="--tc:{colour}"
          >{char}</span>
        {/if}
      {/each}
    </div>
  {/each}
</div>

<style>
  @keyframes tglow { 0%,100%{box-shadow:0 0 8px var(--tc)} 50%{box-shadow:0 0 18px var(--tc)} }

  .tiles-outer {
    position: relative;
    overflow-y: scroll;
    scrollbar-width: none;      /* Firefox */
    height: 200px;              /* ~3 rows visible */
    padding: 8px 4px;
    box-sizing: border-box;
  }
  .tiles-outer::-webkit-scrollbar { display: none; }

  .tile-row { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:14px; }

  .tile {
    font-family:'Courier New',monospace; font-size:24px; font-weight:bold; line-height:1;
    padding:7px 12px; border-radius:4px; border-bottom:3px solid;
    display:inline-block; min-width:42px; text-align:center;
  }
  .tile--space        { min-width:36px; color:var(--text-muted); background:var(--bg-sunken); border-color:var(--border); font-size:16px; }
  .tile--space-active { color:var(--accent-cyan) !important; background:color-mix(in srgb,var(--accent-cyan) 15%,var(--bg-sunken)) !important; border-color:var(--accent-cyan) !important; animation:tglow 0.9s ease-in-out infinite; --tc:var(--accent-cyan); }
  .tile--done    { background:var(--bg-sunken); color:var(--accent-green); border-color:#005533; opacity:.5; }
  .tile--active  { background:var(--tc); color:var(--bg); border-color:color-mix(in srgb,var(--tc) 70%,black); animation:tglow .9s ease-in-out infinite; }
  .tile--pending { background:var(--bg-sunken); color:var(--text-muted); border-color:var(--border); }
</style>
