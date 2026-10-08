// Encrypts private/archive.json (plus any private/transcriptions/<number>.md files)
// into data/archive.enc.json, which is the only data file the public site serves.
//
// Usage:  node tools/build.mjs <password>
//
// private/ is git-ignored on purpose: the readable letters never go to GitHub.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';

const password = process.argv[2];
if (!password) { console.error('Usage: node tools/build.mjs <password>'); process.exit(1); }

const root = new URL('..', import.meta.url);
const archive = JSON.parse(readFileSync(new URL('private/archive.json', root), 'utf8'));

// Transcriptions dropped into private/transcriptions/ override the copy in archive.json.
const trDir = new URL('private/transcriptions/', root);
if (existsSync(trDir)) {
  for (const f of readdirSync(trDir).filter(f => f.endsWith('.md'))) {
    const s = f.replace(/\.md$/, '');
    const letter = archive.letters.find(l => l.s === s);
    if (letter) letter.transcript = readFileSync(new URL(f, trDir), 'utf8');
    else console.warn(`No letter "${s}" for transcription ${f}`);
  }
}

const ITER = 250000;
const enc = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' },
  base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(archive))));
const b64 = u => Buffer.from(u).toString('base64');

writeFileSync(new URL('data/archive.enc.json', root),
  JSON.stringify({ v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), data: b64(ct) }));
const n = archive.letters.length, t = archive.letters.filter(l => l.transcript).length;
console.log(`Encrypted ${n} items (${t} transcribed) -> data/archive.enc.json`);
