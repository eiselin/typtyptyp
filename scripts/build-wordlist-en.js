#!/usr/bin/env node
/**
 * One-off script: flattens scripts/wordlist-topics-en.json into src/words/en.json.
 * All words in the topics file are hand-curated and child-appropriate.
 * Run: node scripts/build-wordlist-en.js
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir  = dirname(fileURLToPath(import.meta.url))
const INPUT  = resolve(__dir, 'wordlist-topics-en.json')
const OUTPUT = resolve(__dir, '../src/words/en.json')

const topics = JSON.parse(readFileSync(INPUT, 'utf8'))

const seen  = new Set()
const words = []
const errors = []

for (const [topic, list] of Object.entries(topics)) {
  if (!Array.isArray(list)) {
    errors.push(`[${topic}] expected an array, got ${typeof list}`)
    continue
  }
  for (const word of list) {
    if (!/^[a-z]{2,10}$/.test(word)) {
      errors.push(`[${topic}] "${word}" fails validation (must be a–z, length 2–10)`)
      continue
    }
    if (seen.has(word)) continue
    seen.add(word)
    words.push(word)
  }
}

if (errors.length > 0) {
  console.error('Validation errors:')
  errors.forEach(e => console.error(' ', e))
  process.exit(1)
}

writeFileSync(OUTPUT, JSON.stringify(words) + '\n')
console.log(`Wrote ${words.length} words to ${OUTPUT}`)
