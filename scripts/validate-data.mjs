// Validates public/data/** against schema/*.json plus cross-field rules the
// JSON Schema cannot express. Run: npm run validate  (also runs before build)
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import { normalize } from '../src/lib/normalize.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = resolve(root, 'public/data')
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'))

const errors = []
const fail = (where, msg) => errors.push(`${where}: ${msg}`)

const ajv = new Ajv2020({ allErrors: true })
const validateQuestion = ajv.compile(readJson(resolve(root, 'schema/question.schema.json')))
const validateReference = ajv.compile(readJson(resolve(root, 'schema/reference.schema.json')))
const fmt = (errs) => errs.map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ')

// ---- manifest -------------------------------------------------------------
const manifestPath = resolve(dataDir, 'manifest.json')
if (!existsSync(manifestPath)) {
  console.error('public/data/manifest.json is missing')
  process.exit(1)
}
const manifest = readJson(manifestPath)
if (!Array.isArray(manifest.questionFiles) || typeof manifest.reference !== 'string') {
  console.error('manifest.json must be { "questionFiles": string[], "reference": string }')
  process.exit(1)
}

// ---- reference ------------------------------------------------------------
const refNames = new Set()
const refPath = resolve(dataDir, manifest.reference)
if (!existsSync(refPath)) {
  fail(manifest.reference, 'file listed in manifest does not exist')
} else {
  const ref = readJson(refPath)
  if (!validateReference(ref)) fail(manifest.reference, fmt(validateReference.errors))
  for (const e of ref.entries ?? []) {
    if (refNames.has(e.name)) fail(manifest.reference, `duplicate entry name "${e.name}"`)
    refNames.add(e.name)
  }
  for (const e of ref.entries ?? [])
    for (const s of e.see_also ?? [])
      if (!refNames.has(s) && !(ref.entries ?? []).some((x) => x.name === s))
        fail(manifest.reference, `"${e.name}".see_also: unknown entry "${s}"`)
}

// ---- questions ------------------------------------------------------------
const seenIds = new Map()
let total = 0
const BLANK_RE = /<<BLANK:([A-Za-z0-9_-]+)>>/g

for (const file of manifest.questionFiles) {
  const p = resolve(dataDir, file)
  if (!existsSync(p)) {
    fail(file, 'file listed in manifest does not exist')
    continue
  }
  const text = readFileSync(p, 'utf8')
  let items = []
  if (file.endsWith('.jsonl')) {
    text.split('\n').forEach((line, i) => {
      if (!line.trim()) return
      try {
        items.push({ q: JSON.parse(line), where: `${file}:${i + 1}` })
      } catch (e) {
        fail(`${file}:${i + 1}`, `invalid JSON (${e.message})`)
      }
    })
  } else {
    try {
      const arr = JSON.parse(text)
      if (!Array.isArray(arr)) throw new Error('top level must be an array')
      items = arr.map((q, i) => ({ q, where: `${file}[${i}]` }))
    } catch (e) {
      fail(file, e.message)
    }
  }

  for (const { q, where } of items) {
    total++
    const tag = `${where} (${q?.id ?? '?'})`
    if (!validateQuestion(q)) {
      fail(tag, fmt(validateQuestion.errors))
      continue
    }
    if (seenIds.has(q.id)) fail(tag, `duplicate id, also at ${seenIds.get(q.id)}`)
    seenIds.set(q.id, where)

    for (const r of q.related_reference ?? [])
      if (!refNames.has(r)) fail(tag, `related_reference "${r}" not found in reference file`)

    const lines = q.code.split('\n')

    if (q.type === 'fill_blank') {
      const inCode = [...q.code.matchAll(BLANK_RE)].map((m) => m[1])
      const declared = q.blanks.map((b) => b.id)
      for (const id of new Set(inCode))
        if (!declared.includes(id)) fail(tag, `marker <<BLANK:${id}>> has no entry in "blanks"`)
      for (const id of declared)
        if (!inCode.includes(id)) fail(tag, `blank "${id}" has no <<BLANK:${id}>> marker in code`)
      if (new Set(inCode).size !== inCode.length) fail(tag, 'a <<BLANK:id>> marker appears twice')
      if (new Set(declared).size !== declared.length) fail(tag, 'duplicate blank ids')
      for (const b of q.blanks) {
        if (b.answers.some((a) => normalize(a) === ''))
          fail(tag, `blank "${b.id}" has an answer that is empty after normalisation`)
        for (const pat of b.accepted_patterns ?? []) {
          try {
            new RegExp(pat)
          } catch (e) {
            fail(tag, `blank "${b.id}" accepted_patterns "${pat}" is not a valid regex`)
          }
        }
      }
    } else {
      const seenLines = new Set()
      for (const err of q.errors) {
        if (err.line > lines.length)
          fail(tag, `error line ${err.line} is beyond the end of code (${lines.length} lines)`)
        if (seenLines.has(err.line)) fail(tag, `two errors on line ${err.line}`)
        seenLines.add(err.line)
        const original = lines[err.line - 1] ?? ''
        if (err.fixes.some((f) => normalize(f) === normalize(original)))
          fail(tag, `a fix for line ${err.line} equals the buggy line (learner could pass without changing it)`)
      }
    }
  }
}

if (errors.length) {
  console.error(`\nData validation failed (${errors.length} problem${errors.length > 1 ? 's' : ''}):\n`)
  for (const e of errors) console.error('  ✗ ' + e)
  process.exit(1)
}
console.log(`✓ ${total} questions, ${refNames.size} reference entries — data OK`)
