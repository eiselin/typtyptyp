#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const input    = resolve(__dir, 'opentaal-input.txt')
const profPath = resolve(__dir, 'blocklists/profanity-nl.txt')
const semPath  = resolve(__dir, 'blocklists/semantic-nl.txt')
const output   = resolve(__dir, '../src/words/nl.json')

const raw      = readFileSync(input,    'utf8').split('\n').map(w => w.trim().toLowerCase())
const profanity = new Set(readFileSync(profPath, 'utf8').split('\n').map(w => w.trim().toLowerCase()))
const semantic  = new Set(readFileSync(semPath,  'utf8').split('\n').map(w => w.trim().toLowerCase()))

const filtered = raw.filter(word => {
  if (!word) return false
  if (/[^a-z]/.test(word)) return false        // only a–z, no accents or punctuation
  if (word.length < 2 || word.length > 10) return false
  if (profanity.has(word)) return false
  if (semantic.has(word)) return false
  return true
})

// Sort by length (shorter = more common), then alphabetically within same length.
// Cap at 15k words — sufficient for the lesson word pools.
const unique = [...new Set(filtered)]
  .sort((a, b) => a.length - b.length || a.localeCompare(b))
  .slice(0, 15000)
writeFileSync(output, JSON.stringify(unique))
console.log(`Wrote ${unique.length} words to ${output}`)
