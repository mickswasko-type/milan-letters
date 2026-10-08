# Letters to Jane

A private family archive of the letters the Rev. Milan E. Swasko wrote to Jane Fijal, 1941–1945.

The site is password protected. The letter summaries and transcriptions are stored encrypted
in `data/archive.enc.json` (AES-256-GCM, key derived from the password with PBKDF2), so this
public repository never contains the readable text. The scans themselves live in Google Drive.

## Updating the archive

The readable source lives in a `private/` folder that is deliberately **not** committed:

```
private/
  archive.json             # every letter: date, place, summary, excerpt, Drive ID
  transcriptions/291.md    # optional: one Markdown file per transcribed letter
```

After editing, re-encrypt and push:

```
node tools/build.mjs <password>
git add data/archive.enc.json && git commit -m "Update letters" && git push
```

To mark a letter as typed, set `"typed": true` on it in `archive.json`.
Changing the password is the same command with a new password.
