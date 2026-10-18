# Handoff to Claude Code — Hissa native builds (Android + iOS)

You are continuing a finished, tested **serverless Arabic web app** ("Hissa", by dt/Ahmed hamed). Your job: produce **real Android (.apk/.aab) and iOS (.ipa) builds** with Capacitor, verify them on emulators/devices, and fix whatever breaks. Everything the web side can do without a device is already done and tested; the native toolchain steps are NOT done (the previous environment had no Android SDK, no Xcode and no network).

## Ground rules
- **Do not rewrite the engines** (portion planner, athlete planner, DOCX builder, crypto). Capacitor wraps the existing single-file HTML. React Native/Flutter are rejected: they'd force rewriting everything for no gain.
- **Do not weaken security** (see "Security model") and **do not add network calls**: the app is offline-first and must work with no server.
- Keep the web build working in plain browsers; native behavior is feature-detected (`window.HNative`).
- Language of UI: Arabic, RTL. Keep it.

## Repo map (`DietProWeb/`)
- `src/*.js, style.css, template.html, data.json, athlete.json, assets.js` → built by `python3 build_web.py` into **`admin.html`** (desktop admin console, also contains the full app) and **`index.html`** (user template, unusable until exported).
- The admin console's button "تصدير نسخة المستخدمين" produces **`hissa_users.html`** (user app bound to that admin's public key + base settings + logo). **That file is what goes into the native app**: `native/scripts/sync-web.js ../hissa_users.html` validates and copies it to `native/www/index.html` (it rejects admin.html and unlinked templates).
- `src/native.js` = the native bridge (`HNative`): `isNative()`, `saveFile()` (Filesystem CACHE + Share), `share()`, `openUrl()` (Browser), `deviceId()` (hashed `Device.getId()`), `appInfo()` (App.getInfo), `cmpVersion()`. Plugins are read from `window.Capacitor.Plugins.*` (no bundler).
- `native/` = Capacitor project scaffold: `package.json` (`npm run setup|web|add:android|add:ios|assets|sync|android:*|ios:*`), `capacitor.config.json`, `assets/` (icon/splash from the logo), `NATIVE_BUILD.md` (full commands + 20-point device checklist).

## Build & test commands (all must stay green)
```
python3 build_web.py
for f in test_sec test_engine test_plan test_edit test_settings test_xlsx test_athimport test_athlete test_athfoods test_native test_native_sync test_docx_zip; do node tests/$f.js; done
for f in e2e e2e_settings e2e_athlete e2e_athfoods e2e_native e2e_auth; do node tests/$f.js; done                                                   # Playwright (Chromium)
node tests/check_docx_pages.js; node tests/check_docx_athlete.js                                                                                # need LibreOffice
```
Last known results: Node suites 96 checks pass (12 files); browser suites 31+16+28+16+13+36 = 140 pass (6 files); Word page counts: 9 (portions, 24 matrix files) / 8 (athlete, 21 matrix files).

## What is already done (web side, tested with a mocked Capacitor)
1. All exports go through one function `dlFile()`: native → `HNative.saveFile` (writes base64 to Filesystem `CACHE/hissa/…` then opens the share sheet); browser → `<a download>`.
2. `window.print()` is unsupported in WebViews: in native, "تصدير PDF" shares the client HTML file with a toast explaining print→PDF from a browser. **Open item:** real in-app PDF (see tasks).
3. DOCX is deflate-compressed via `CompressionStream` (1 MB → ~30 KB) with a stored-zip fallback.
4. Activation device id: in native it is `N` + 15 chars of SHA-256(`hissa|platform|Device.getId().identifier`); in browsers a random id as before.
5. "تطبيق الجوال" card: admin enters APK/Play/iOS/PWA https links + latest version in Settings → shipped inside the exported users file (`BASE_SETTINGS.app`); users see it on the home screen and in Settings; update banner when `App.getInfo().version` < announced version. Links are validated as `https://` only.
6. Safe-area CSS (`viewport-fit=cover`, `env(safe-area-inset-*)`), touch targets ≥ 40 px, mobile card layouts.
7. Home/gate splash: embedded H.264 MP4 (muted, playsinline), respects reduced-motion.

## Tasks for you (in order) with acceptance criteria
1. **Initialize**: `cd native && npm run setup && npm run web -- <users file> && npm run add:android && npm run add:ios && npm run assets && npm run sync`. *Accept:* `npx cap doctor` clean; both platforms open.
2. **Run on Android emulator + iPhone simulator.** First checks: app boots to the activation screen; **WebCrypto works** (on iOS `capacitor://localhost` — if "تعذّر التشغيل" appears, fix by switching to a secure scheme/config); IndexedDB persists after app kill; the splash video plays.
3. **Verify the bridge on real plugins**: Word/HTML/JSON export → share sheet on both OSes; check Filesystem `directory: 'CACHE'` string works with the installed plugin version, FileProvider/URI is shareable (WhatsApp, Mail, Save to Files), and cancel is handled. Adjust `src/native.js` only if the real plugin API differs (then update `tests/test_native.js` + `e2e_native.js` mocks).
4. **Device id**: confirm `Device.getId()` returns `identifier`; confirm Android id survives "clear data"; document iOS reinstall behavior (new id → admin frees slot).
5. **Real PDF (optional but desirable)**: add a native print/PDF path (print plugin or an HTML→PDF approach that handles Arabic shaping) and replace the share-HTML workaround in `A.print`. *Accept:* a day page of both plans prints to a 1-page A4 PDF per day with correct Arabic.
6. **Build signed artifacts**: debug APK, signed release APK, AAB, and an iOS archive → TestFlight. Follow `native/NATIVE_BUILD.md`. *Accept:* install the signed APK on a device via `adb install`; install the TestFlight build.
7. **Run the 20-point checklist** in `NATIVE_BUILD.md §5` on both platforms; fix issues (keyboard overlap, safe areas, file picker, orientation).
8. **Automate** a smoke flow (Maestro or Appium) covering: launch → activation screen → (with a pre-activated test token) login → create athlete → generate → export Word → share sheet appears. Commit the flow files.
9. **Store readiness**: privacy policy text (data stays on device; health data), Play data-safety answers, App Store review notes (offline app with full logic, not a website wrapper; not a medical device), export-compliance answers.

## Security model (keep as is)
- Admin (desktop `admin.html`) signs activation codes (ECDSA P-256) bound to user + device id + expiry; max 2 devices/user is enforced by the admin tool, verified in the app. Passwords are PBKDF2-derived verifiers; user data is AES-GCM-encrypted in IndexedDB with a key derived from the password at login (never stored). Admin's private key is wrapped by the admin password.
- **Known limits (document, don't hide):** all checks run client-side → a repackaged APK or rooted/jailbroken device can bypass; no remote revocation (codes live until expiry), no cross-device sync, forgot password = data loss unless a backup exists. A future server could add revocation/sync + Play Integrity/App Attest.
- **Biometric unlock is deliberately NOT implemented**: it would need an extractable data key stored in Keychain/Keystore — a separate security decision.

## Gotchas already found
- Chromium in Playwright cannot play H.264, so the splash video is untested in automation (it was verified by decoding frames with ffmpeg); test on real devices.
- `button[data-v="ath"]` exists twice (sidebar "new athlete" and a Settings tab) — always use `[data-a="setTab"][data-v=…]` in tests.
- The page-count tests for Word assume LibreOffice rendering; real Word may differ slightly.
- USDA-derived Arabic names are approximate; ~half are missing and the English name is shown.
