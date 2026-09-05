# Zeos WebBrowser — Auditoria completa (achados brutos)

> Gerado a partir da varredura multiagente de 2026-09-05 (12 auditores independentes sobre todo o código).
> **167 achados** brutos foram consolidados em **124 achados únicos**.
> A etapa de verificação adversarial cobriu 17 deles antes de ser interrompida — os verificados estão marcados.
> **Este documento é matéria-prima, não um plano.** Nada aqui foi implementado; itens sem marca de verificação
> não passaram por checagem cética e podem conter falsos positivos.

## Panorama

| Severidade | Qtd |
| :--- | ---: |
| CRÍTICO | 1 |
| ALTO | 37 |
| MÉDIO | 57 |
| BAIXO | 29 |

| Área | Qtd |
| :--- | ---: |
| Outros | 27 |
| UX & Recursos | 24 |
| Extensões | 13 |
| Release & CI | 13 |
| Privacidade | 11 |
| Testes & Qualidade | 9 |
| Arquitetura | 8 |
| Performance | 5 |
| Segurança | 4 |
| Correção | 4 |
| Multiplataforma | 4 |
| Dados & Sessão | 2 |


---

## CRÍTICO (1)

### F57 · Permission handler is global and denies fullscreen/pointerLock/clipboard for every site; 'media' grants camera/mic to all sites silently — ✅ verificado

**Área:** Outros · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:945`

**Evidência:** `setPermissionRequestHandler((_contents, permission, callback) => callback(Boolean((permission === 'notifications' && settings.permissions.notifications) || (permission === 'media' && settings.permissions.media))))` — origin is ignored; every other type ('fullscreen', 'pointerLock', 'clipboard-sanitized-write', 'clipboard-read', 'geolocation', 'openExternal') gets false, so YouTube fullscreen, games and copy buttons silently fail.

**Recomendação:** Allow 'fullscreen' and 'clipboard-sanitized-write' by default. Make the handler origin-aware: derive origin from `details.requestingUrl`, keep `settings.sitePermissions[origin][perm]` ('allow'|'deny'), prompt once via dialog.showMessageBox(owner.window) for media/geolocation/pointerLock/clipboard-read and store the answer (use `details.mediaTypes` to distinguish audio/video). Keep the existing toggles as global kill-switches; expose the map in Settings > Privacidade.

> Parecer (confirma): Confirmed in src/main.js:945-947: once setPermissionRequestHandler is installed, Electron routes EVERY permission type through it, and this handler returns false for anything other than 'notifications'/'media' (both default false at line 44). That means 'fullscreen' (YouTube/Twitch fullscreen button), 'clipboard-sanitized-write' (navigator.clipboard.writeText copy buttons), 'pointerLock' (web games) and 'geolocation' all fail silently on every site, and there is no setPermissionCheckHandler, no enter-html-full-screen/leave-html-full-screen handling (layout() at 1099-1120 always leaves the tab view below the chrome bar), and no per-origin state. For a personal daily driver this is a real, noticeable UX defect, squarely in the browser layer (site permissions), and touches no CLAUDE.md invariant. The 'media' global toggle granting cam/mic to all sites once enabled is a genuine privacy footgun too. Severity downgraded from critical to high: default-deny is safe, so this is breakage/usability, not an exploitable hole. Proportionate fix, not the full recommendation: (1) allow 'fullscreen', 'clipboard-sanitized-write' and 'pointerLock' unconditionally, and on enter/leave-html-full-screen resize the active tab view to cover the window (hide chrome) — ~15 lines; (2) for 'media' (split by details.mediaTypes), 'geolocation' and 'clipboard-read', prompt once per origin via dialog.showMessageBox on the owning window and persist the answer in settings.sitePermissions[origin], keeping the existing checkboxes as global kill-switches; also install a matching setPermissionCheckHandler. A full Settings > Privacidade editor for the per-site map can be deferred — a single 'limpar permissões de sites' button is enough for one user.

> Parecer (confirma): Confirmed. src/main.js:945-947 is exactly as quoted: `browserSession.setPermissionRequestHandler((_contents, permission, callback) => callback(Boolean((permission === 'notifications' && settings.permissions.notifications) || (permission === 'media' && settings.permissions.media))))`. It ignores `details.requestingUrl`/origin, there is no `setPermissionCheckHandler`, and a grep of src/ finds no other handling of fullscreen/pointerLock/clipboard/geolocation (only a context-menu `clipboard.writeText` in main and a UI-side `navigator.clipboard` call in the extensions page). The project pins Electron ^40 (installed 40.10.6), and node_modules/electron/electron.d.ts confirms `setPermissionRequestHandler` routes 'fullscreen', 'pointerLock', 'clipboard-read', 'clipboard-sanitized-write', 'geolocation', 'display-capture', 'mediaKeySystem' (DRM), 'openExternal', etc. through this handler, so all of them are unconditionally denied for every site — HTML fullscreen (YouTube), pointer lock (games), copy-to-clipboard buttons and DRM playback silently fail, a regression versus Electron's allow-all default when no handler is installed. The 'media' branch also grants camera/mic to any origin with no prompt once the global toggle (settings/index.html:171 "Permitir câmera e microfone quando solicitados", default false at main.js:44) is on. Settings store only `permissions: { notifications, media }` (main.js:44, 101, 209-211); no `sitePermissions` map exists. Severity lowered from critical to high: it is a serious user-facing functional defect in core browsing plus a privacy weakness, but the cam/mic exposure is opt-in and off by default, and no CLAUDE.md security invariant (contextIsolation/sandbox, navigation scheme, privileged pages) is violated.

---

## ALTO (37)

### F85 · main.js monolith: decompose into src/main/* modules with a leaf-first, always-green ordering

**Área:** Outros · **Esforço:** L · **Visível ao usuário:** não · **Local:** `src/main.js:998`

**Evidência:** 2285 lines in one file: settings 18-270, extension polyfill string 274-491, extension mgmt 493-911, downloads 913-996, class Browser 998-1925, popup 1927-1995, 60 ipcMain.handle 1997-2236, bootstrap 2238-2285. Globals `browsers`, `chromeOwners`, `pageOwners`, `settings` (49-55) are touched by every section.

**Recomendação:** Step 0: src/main/registry.js exporting browsers/chromeOwners/pageOwners (breaks cycles). Then move verbatim, one commit each, running `npm run check && npm test && npm start`: store.js → internal-pages.js → extensions.js → downloads.js → settings.js → workspaces.js → menus.js → browser.js → ipc.js. main.js ends as ~60-line bootstrap.

### F86 · Browser.command() if/else chain should become a command map = the stable internal control surface

**Área:** Outros · **Esforço:** M · **Visível ao usuário:** não · **Local:** `src/main.js:1883`

**Evidência:** `command(command, payload) { ... if (command === 'navigate') ... else if (command === 'new-tab') ... this.sendState(); }` — 35 string branches; menus (1686-1698), keyboard (1394-1459) and IPC (2000) each re-implement the same actions by calling methods directly.

**Recomendação:** Create src/main/browser-api.js: `const COMMANDS = { 'new-tab': (b) => b.createWebTab(), 'close-tab': (b, id) => b.closeTab(id), ... }` plus `listTabs(b)`. Have `browser:command` IPC, keyboard() and menu templates dispatch through it. Not exposed externally now; it is the surface ROADMAP's future tool layer will consume and becomes unit-testable with a fake Browser.

### F156 · All JSON writes are non-atomic and a corrupt file silently resets to defaults with no backup

**Área:** Outros · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:112`

**Evidência:** saveSettings: `fs.writeFileSync(userFile('settings.json'), JSON.stringify(settings))`; same in writeJson (90) and saveSession (1676). readJson (89): `catch { return fallback; }` — a truncated settings.json (crash/power loss mid-write) loses extensions+history, and the next saveSettingsSoon overwrites the damaged file for good.

**Recomendação:** Add one `writeJsonAtomic(name, data)`: write `<name>.tmp` then `fs.renameSync`; before overwriting, copy the current file to `<name>.bak`. In readJson, on parse failure try `.bak`, and if both fail move the bad file to `<name>.corrupt-<ts>` and log/notify instead of silently defaulting. Use for settings/session/workspaces.

### F142 · "100% tracker-free" claim but the browser blocks nothing (no blocklist, no 3p-cookie policy)

**Área:** Outros · **Esforço:** L · **Visível ao usuário:** sim · **Local:** `README.md:7`

**Evidência:** README:7 "100% Livre de Rastreadores", :13 badge "Trackers-0 (Zero)". setupSession (main.js:942-996) installs only a permission handler and will-download; no webRequest, no cookie policy, no host blocklist. Third-party cookies/pixels load exactly as in vanilla Chromium.

**Recomendação:** Reword README to "zero telemetria do navegador; sem serviços Google embutidos" and list what IS and IS NOT blocked. Then add opt-in infra: `webRequest.onBeforeRequest` with a small bundled host list (EasyPrivacy-style) cancelling third-party requests, plus an opt-in rule stripping Cookie/Set-Cookie on cross-site subresources.

### F17 · Downloads silently overwrite an existing file with the same name; list not persisted, no retry/clear — ✅ verificado

**Área:** UX & Recursos · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:951`

**Evidência:** will-download: `const savePath = path.join(app.getPath('downloads'), item.getFilename()); item.setSavePath(savePath);` — a preset setSavePath bypasses Chromium's ' (1)' uniquifier, so a second 'report.pdf' (or a malicious site serving 'installer.exe') replaces the earlier file. `sessionDownloads` (l.84) is in-memory only.

**Recomendação:** Before setSavePath loop `${base} (${n})${ext}` while fs.existsSync (check .crdownload too) and store the final name in downloadRecord.filename/savePath so open/show-in-folder keep working; extract as a pure unit-tested helper. Optionally persist completed records to downloads.json and add per-item 'Tentar novamente', 'Remover da lista', 'Limpar lista', Pause/Resume.

> Parecer (confirma): Confirmed in src/main.js:951-952: `item.setSavePath(path.join(app.getPath('downloads'), item.getFilename()))` is called unconditionally in will-download, which makes Chromium skip both the save dialog and its own " (1)" uniquifier, so a second download with the same name (very common for a daily driver: report.pdf, image.png, invoice.pdf from different sites) silently replaces the earlier file. That is real, user-visible data loss inside the browser's own downloads infrastructure, fully in scope for the WebBrowser layer and touching no CLAUDE.md invariant. The proportionate fix is small: a pure helper (uniqueDownloadPath(dir, filename) -> loop `${base} (${n})${ext}` while fs.existsSync, also checking `.crdownload`) unit-tested under node --test, with the resulting name stored in downloadRecord.filename/savePath so isTrackedDownloadPath, open-file and show-in-folder keep working. The rest of the recommendation (downloads.json persistence, retry, clear list, pause/resume) is a nice-to-have that should be split off and is not needed to close this finding; severity is medium rather than high because the security angle (site-driven overwrite) is limited to the Downloads folder and the main cost is UX data loss, not compromise.

> Parecer (confirma): Confirmed. src/main.js:951-952 reads exactly as quoted: `const savePath = path.join(app.getPath('downloads'), item.getFilename()); item.setSavePath(savePath);` with no existence check, no ' (n)' loop, and no .crdownload check anywhere in the file (the only fs.existsSync calls near downloads are in the open-file/show-in-folder IPC handlers at l.2017/2023, which run after the fact). Electron's will-download path with a preset setSavePath hands the exact target to the download manager (TARGET_DISPOSITION_PROMPT), bypassing the chrome-layer uniquifier, so a same-named download replaces the earlier file; since no save dialog is ever shown and Electron has no multiple-automatic-downloads limiter, a page can trigger this without a user click (drive-by clobber of prior downloads, e.g. an installer). The secondary claims also hold: `sessionDownloads` (l.84) is a plain in-memory array, never written to disk; the only downloads IPC handlers (l.2012-2042) are get-summary, open-file, show-in-folder, open-folder, cancel — no retry, remove, clear, pause or resume. Severity: the silent-overwrite part warrants high for a browser (remote-triggered data loss/replacement in the Downloads folder); the persistence/retry/clear items are low-priority feature gaps.

### F63 · Failed loads leave a blank view; only the tab title changes

**Área:** Outros · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:1340`

**Evidência:** `contents.on('did-fail-load', (_event, code, description, url, mainFrame) => { if (mainFrame && code !== -3) { tab.url = url || tab.url; tab.title = `erro: ${description}`; tab.loading = false; ... } });` — l.1508: loadURL(url).catch(() => { tab.title = 'falha ao abrir'; })

**Recomendação:** Ship src/error/index.html (themed, no preload) and on did-fail-load loadFile it with ?code=&url= (keep tab.url so the omnibox shows the address), with a human message per code (-105 DNS, -106 offline, -7 timeout, -2xx TLS) and a 'Tentar novamente' button that reloads the original URL via normal http(s) navigation. Reuse for 'render-process-gone'/'unresponsive' ('Aba travou — recarregar').

### F74 · Extension popup is a fixed 380x520 window with no content sizing, no Escape and no window-open/will-navigate handler (orphan bare windows) — ✅ verificado

**Área:** Extensões · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:1945`

**Evidência:** `const popupWidth = 380; const popupHeight = 520; ... new BrowserWindow({ ... frame: false, resizable: true, webPreferences: { session: session.defaultSession, ... } })` then `loadURL(popupUrl)` — no setWindowOpenHandler/will-navigate on the popup (the only one is l.1354 for tabs), so a popup link / chrome.tabs.create / window.open opens an unmanaged chromeless always-on-top BrowserWindow; same for `inspectWin` (861) and `helper` (825).

**Recomendação:** Add `wc.setWindowOpenHandler(({url}) => { if (/^https?:/i.test(url)) browser.createWebTab(url); return {action:'deny'}; })` and `will-navigate` denying anything outside `chrome-extension://<id>/` (http/https → createWebTab). Chrome sizes popups to the document (min 25x25, max 800x600): give the popup a Zeos preload with a ResizeObserver posting scrollWidth/Height via ipc, setBounds anchored to the button's right edge. Close on Escape and when the parent moves/resizes.

> Parecer (confirma): Confirmed in src/main.js: the popup BrowserWindow (l.1961-1986) and inspectWin (l.861) get no setWindowOpenHandler/will-navigate, and there is no app-level web-contents-created fallback (the only handler is the per-tab one at l.1354). Any link, target=_blank or window.open inside an extension popup (uBlock "open dashboard", Bitwarden, Dark Reader help/donate links — daily-use cases) spawns an unmanaged window outside the tab system with no address bar; that is a real daily-UX/robustness defect for one person, not cosmetic, and it lives squarely in the browser layer (Extensions), not the upper Zeos layer. It is NOT a security issue: the popup is sandbox+contextIsolation, zeos: is not a protocol handler, and Chromium blocks renderer-initiated file: navigations — so severity is medium, not high. The recommendation is disproportionate, though: a Zeos preload + ResizeObserver + IPC pipeline + anchoring + parent-move tracking is a medium-size feature for a modest gain (blur already closes the popup when the parent moves). Proportionate fix (~15 lines): on activeExtensionPopup.webContents add setWindowOpenHandler routing http/https to browser.createWebTab and denying everything else, plus will-navigate that preventDefaults anything not under chrome-extension://<ext.id>/ (http/https -> createWebTab); add before-input-event closing on Escape; optionally after did-finish-load run one executeJavaScript reading documentElement.scrollWidth/scrollHeight and setSize clamped to 25..800x600 instead of a preload. Apply the same window-open handler to inspectWin; the helper (l.825) is show:false and destroyed within 3s, so it can be left alone.

> Parecer (confirma): Confirmed in src/main.js:1945-1986: the extension popup is a hardcoded 380x520 BrowserWindow (frame:false, alwaysOnTop, parent: browser.window) with no content-sizing (no setBounds/setSize/preferred-size), closed only on 'blur' (no before-input-event/Escape). The only setWindowOpenHandler (l.1354) and will-navigate (l.1362) are inside tabEvents(), which is applied solely to tab WebContentsViews; there is no app.on('web-contents-created') global policy, so the popup webContents has none. The Zeos polyfill is injected only into background scripts (l.509-525) and Electron's built-in chrome.tabs has no create(), so a popup link via window.open/target=_blank yields a default unmanaged Electron BrowserWindow (not a Zeos tab) while an in-place link navigates the chromeless always-on-top popup itself to a web page. Corrections to the evidence: Electron's window.open child inherits only webPreferences (sandbox/contextIsolation remain on, defaultSession), not frame:false/alwaysOnTop, so the orphan is a normal framed window; 'chromeless always-on-top' applies only to in-place navigation. The 'helper' (l.825) is hidden, loads manifest.json and is destroyed within 3s, so it is not a practical orphan source; inspectWin (l.861) is a dev-mode framed DevTools window with low impact. No CLAUDE.md security invariant is breached (no Node, sandbox intact, no privileged scheme reachable), so this is an extension-compat/UX defect warranting medium rather than high severity.

### F72 · MV3 action dispatch spawns and destroys a hidden BrowserWindow (new renderer process) per toolbar click and always waits 500 ms

**Área:** Extensões · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:825`

**Evidência:** triggerExtensionAction(): `let helper = new BrowserWindow({ show: false, webPreferences: { session: session.defaultSession } }); helper.loadURL('chrome-extension://.../manifest.json')` then `chrome.runtime.sendMessage(${payload}, () => res(true)); setTimeout(() => res(true), 500);` and `helper.destroy()` after the message or a 3000ms timeout (831-839) — ~100-300ms and tens of MB per click.

**Recomendação:** Keep one lazily-created hidden 'bridge' webContents per loaded extension (Map<extId, BrowserWindow>, chrome-extension://<id>/manifest.json with a small Zeos preload), reuse it for action/command/contextMenu triggers and for receiving state from the SW (badge, menus, notifications). Resolve on sendResponse and drop the fixed timer; destroy on removeExtension/toggle-off.

### F71 · Action click passes fake tab id 1, breaking chrome.tabs.sendMessage/scripting on the active tab

**Área:** Extensões · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:1991`

**Evidência:** `triggerExtensionAction(ext.id, { id: 1, url: activeTab?.url || '', active: true })` — and polyfill l.463: `const tab = msg.tab || { id: 1, url: '', active: true }`. Electron tab ids are webContents ids, so a handler doing chrome.tabs.sendMessage(tab.id) or scripting.executeScript({target:{tabId}}) hits a nonexistent tab.

**Recomendação:** Build the tab object from the real view: { id: activeTab.view.webContents.id, windowId: browser.window.id, url, title, active: true, index }. Same for contextMenu/command dispatch; make the polyfill's chrome.windows.getCurrent/getAll return the real window id so tabs.query({currentWindow:true}) lines up.

### F75 · Polyfill is only prefixed into background SW/scripts; popup, options, background.page and devtools pages get none

**Área:** Extensões · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:509`

**Evidência:** `if (manifest.background) { if (manifest.background.service_worker) {...prefix...} if (Array.isArray(manifest.background.scripts)) {...prefix...} }` — `background.page` (uBlock Origin MV2), action.default_popup and options pages never see chrome.action/windows/commands/contextMenus.

**Recomendação:** In prepareExtensionRunnerDir write `zeos-polyfill.js` at the runner root and inject `<script src="/zeos-polyfill.js"></script>` as the first child of <head> in every HTML entry point (background.page, action/browser_action.default_popup, options_page, options_ui.page, devtools_page, side_panel.default_path). Extension-page CSP allows 'self'. Keep the SW prefix path.

### F76 · chrome.action badge/title/icon updates are silently dropped; toolbar never reflects extension state

**Área:** Extensões · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:300`

**Evidência:** `setTitle(d, cb) { if (cb) cb(); return Promise.resolve(); } ... setIcon ... setBadgeText ... setBadgeBackgroundColor` — all no-ops. app.js renderExtensions (277-321) renders only the manifest icon and name.

**Recomendação:** Forward action state (`{__zeos_action_state:{tabId?, badgeText, badgeColor, title, iconDataUrl}}`) to the per-extension bridge page, whose preload relays to ipcMain → per-extension state map → sendState → app.js draws a badge pill and tooltip. setIcon: `path` → data URL from runner dir; `imageData` → OffscreenCanvas.convertToBlob + FileReader in the SW. Implement enable/disable per tab.

### F79 · chrome.storage.sync/managed stay undefined (guard skips when Electron provides storage.local) and polyfilled areas are per-context in-memory

**Área:** Extensões · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:375`

**Evidência:** `if (!self.chrome.storage || !self.chrome.storage.local) { ... self.chrome.storage = { local, sync, session, managed, onChanged } }` — Electron ships chrome.storage.local natively so the branch never runs and `chrome.storage.sync.get` (Dark Reader, Bitwarden) throws; when it does run, data is a Map lost on restart and invisible to popup/options.

**Recomendação:** Fill missing areas individually: if `chrome.storage.sync`/`managed` are absent, define them as wrappers over `chrome.storage.local` with a key prefix (`__zeos_sync__:`), including get/set/remove/clear/getBytesInUse and onChanged with areaName 'sync'. Only fall back to the in-memory Map when local itself is missing.

### F80 · Common namespaces missing (notifications, alarms, permissions, tabs.create/onUpdated, runtime.openOptionsPage, declarativeNetRequest) → TypeError at SW start

**Área:** Extensões · **Esforço:** L · **Visível ao usuário:** sim · **Local:** `src/main.js:296`

**Evidência:** Polyfill defines only chrome.action (296), contextMenus (318), commands (346), offscreen (358), storage (375), windows (437). Electron implements no tabs.create/onActivated/onUpdated, notifications, alarms, permissions, sidePanel or declarativeNetRequest, so uBO Lite (DNR), Bitwarden (alarms/notifications/permissions) and Dark Reader (tabs.onUpdated) fail early.

**Recomendação:** Add alarms (timer-backed, persisted via storage.local), permissions.contains/getAll/request from the manifest, notifications → bridge → Electron `Notification`, runtime.openOptionsPage + tabs.create/update/remove/query/onActivated/onUpdated fed by the Browser tab list via the bridge; stub declarativeNetRequest and flag 'API não suportada' on the card. Alternatively evaluate samuelmaddock/electron-chrome-extensions (one runtime dep; it owns popup/toolbar rendering).

### F64 · HTML5 fullscreen and F11 not handled: chrome strip stays above fullscreen video

**Área:** UX & Recursos · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:1103`

**Evidência:** layout(): `const baseTop = TAB_HEIGHT + (this.expanded ? ADDRESS_HEIGHT : 0); ... tab.view.setBounds({ x: 0, y: top, width, height: Math.max(0, height - top) })` — always offset by chrome height; no 'enter-html-full-screen'/'leave-html-full-screen' listener in tabEvents (1298-1368) and no F11/Ctrl+Cmd+F in keyboard() (1394) or app.js keydown (773).

**Recomendação:** In tabEvents listen to enter-html-full-screen → set this.fullscreenTab, window.setFullScreen(true); leave → restore. In layout(), when fullscreen give the active view {0,0,width,height} and hide the chrome view. Add F11 (win/linux) and Ctrl+Cmd+F (mac) toggling window fullscreen via the same layout path, Esc to exit; also allow the 'fullscreen' permission (F57) or the request never arrives.

### F43 · History lives inside settings.json and every navigation (incl. SPA pushState) runs notifySettings(): sync settings.json rewrite, zoom re-applied to all tabs + relayout, double sendState, and a 2000-entry history push to every internal page

**Área:** Performance · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:263`

**Evidência:** addHistory(): `settings.history = [...].slice(0, 2000); saveSettingsSoon(); notifySettings();` from did-navigate (1325) and did-navigate-in-page (1334). saveSettings: `fs.writeFileSync(userFile('settings.json'), JSON.stringify(settings))` (112, 250ms debounce) with `searchableText` per entry roughly doubling the file. notifySettings (151-161): `for (const browser of browsers) { applyZoomToBrowser(browser); browser.sendState(); ... send('settings:changed', { ...copy(settings), themes }) }` — applyZoomToBrowser (136-149) calls setZoomFactor on every tab + layout() even when zoom is unchanged (also triggered by devMode/permission/extension toggles at 665,732,760); did-navigate then calls owner.sendState() again (1327).

**Recomendação:** Move history to src/main/history.js with its own `history.json` (HISTORY_LIMIT constant, `history:*` IPC), written via fs.promises to temp+rename, debounced ≥2s and flushed on before-quit; migrate `stored.history` once on load; drop `searchableText` (derive at filter time). Emit a lightweight `history:changed` only to settings tabs instead of the full settings:changed. In notifySettings track `lastAppliedZoom` and call applyZoomToBrowser only when appearance.zoomLevel changed; in applyZoomToBrowser skip setZoomFactor when already equal and layout() only when chrome height changes. Remove the duplicate sendState in did-navigate/did-navigate-in-page.

### F46 · sendState() calls app.getAppMetrics() (synchronous process enumeration) and re-serializes every extension's base64 icon on every tab event

**Área:** Performance · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:1210`

**Evidência:** sendState payload: `extensions: getInstalledExtensions(), ... systemStats: getSystemStats()` (l.1206,1210); getSystemStats (115-134) iterates `app.getAppMetrics()` over all child processes; getExtensionDetails builds `iconDataUrl = data:...base64` (615-616) that rides in every browser:state message (title, favicon, loading, hover...).

**Recomendação:** Drop `systemStats` from sendState — the `browser:system-stats` channel (l.2270) already feeds the pills. Send extensions on a separate `browser:extensions` message only from invalidateExtensionsCache()/notifySettings, keeping icons out of per-event state. Cache the workspaces tabCount map (1211-1219).

### F45 · Download progress fans out an unthrottled full sendState() to every window per DownloadItem 'updated' event, plus a second downloads-updated message

**Área:** Outros · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:982`

**Evidência:** item.on('updated', ...) → `broadcastDownloads()`; broadcastDownloads (l.932-940): `for (const browser of browsers) { browser.sendState(); ...send('browser:downloads-updated', summary) }`. Renderer applyState (app.js 529-558) rebuilds tabs, extensions, theme and calls handleDownloadsUpdate again → renderDownloadsList twice per tick.

**Recomendação:** In 'updated' only send `browser:downloads-updated` (no sendState), throttled to ~4 Hz per item. Remove `downloadsSummary` from the state payload. Reserve sendState for will-download/done.

### F48 · Background tabs are parked with 0x0 bounds instead of setVisible(false), so they stay 'visible' to Chromium and keep full-rate timers/rAF/video

**Área:** Performance · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:1117`

**Evidência:** layout(): `tab.view.setBounds(tab.id === this.activeId ? {...} : { x: 0, y: height + 1, width: 0, height: 0 })` — every WebContentsView stays attached and visible; no `setVisible(false)`/`setBackgroundThrottling`. document.visibilityState never becomes 'hidden'.

**Recomendação:** Call `tab.view.setVisible(tab.id === this.activeId)` in layout()/selectTab (View.setVisible exists in Electron 40) and keep normal bounds for all views. Verify a background tab reports `visibilityState === 'hidden'` and rAF pauses. Enables a later 'discard after N min hidden' policy.

### F59 · No find-in-page (Ctrl+F) at all

**Área:** UX & Recursos · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:1394`

**Evidência:** keyboard() handles shift/l/t/n/w/j/h/d/e/x/r/f12/=/-/0/tab/1-9/alt-arrows; no findInPage / found-in-page anywhere in src/.

**Recomendação:** Add a find bar in the chrome view (input + prev/next + 'n de m' + close): Ctrl+F / F3 / Shift+F3 / Esc; main uses tab.view.webContents.findInPage(text,{forward,findNext}) and listens to 'found-in-page'; stopFindInPage('clearSelection') on close/tab switch. Layout must keep the chrome expanded while the bar is open (like downloadsPanelOpen).

### F61 · Favorites is a placeholder and Ctrl+D opens it instead of bookmarking the current page

**Área:** UX & Recursos · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:1417`

**Evidência:** `if (ctrl && (key === 'd' || key === 'b')) { event.preventDefault(); this.createSpecialTab('favorites'); return; }` — favorites/index.html:64: 'Os favoritos aparecerão aqui. Esta primeira versão mantém o menu de acesso preparado'.

**Recomendação:** Minimal real implementation: favorites.json [{id,url,title,favicon,addedAt}] with IPC favorites:list/add/remove/update validated to http(s); Ctrl+D toggles the active tab (star button in omnibox row); favorites page lists/searches/opens/removes (in the calling window); 'Adicionar aos favoritos' in the page context menu; entries feed omnibox suggestions. Keep Ctrl+Shift+B for the page.

### F141 · Spellchecker downloads Hunspell dictionaries from Google CDN in background

**Área:** Privacidade · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:1226`

**Evidência:** createView webPreferences: `{ preload, partition, contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true }` — no `spellcheck: false`; no setSpellCheckerDictionaryDownloadURL / setSpellCheckerLanguages anywhere. Electron's builtin spellchecker defaults on and fetches .bdic from redirector.gvt1.com on Win/Linux.

**Recomendação:** Either set `spellcheck: false` in createView (and `session.setSpellCheckerEnabled(false)` in setupSession) or bundle dictionaries under src/assets/dict and call `session.setSpellCheckerDictionaryDownloadURL('file://...')`. Expose a settings toggle; document in README.

### F62 · Omnibox has no suggestions although history already stores searchableText

**Área:** UX & Recursos · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/ui/app.js:753`

**Evidência:** `omniboxRow.addEventListener('submit', (event) => { event.preventDefault(); command('navigate', omnibox.value); });` — main.js:258 builds entry.searchableText for every history item but nothing reads it.

**Recomendação:** Add an ipc 'omnibox:suggest' (query → top 6 from history + favorites, ranked by visitCount/recency) and a dropdown under the omnibox with arrow-key selection, Enter to open, Shift+Del to remove; show a 'Pesquisar ·' row using toNavigationTarget().type.

### F29 · Omnibox never blurs after Enter: stale typed text and auto-hide gets stuck

**Área:** UX & Recursos · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/ui/app.js:753`

**Evidência:** L753-756: submit → `command('navigate', omnibox.value)` with no blur. L536: `if (document.activeElement !== omnibox) omnibox.value = state.activeUrl`. L84: `if (document.activeElement === omnibox || isPanelOpen()) return;` in scheduleHide. main.js never focuses the page. After Enter the bar shows raw text (not the resolved URL) and hover-expand never collapses.

**Recomendação:** On submit call `omnibox.blur()` and have main focus the active tab's webContents after navigate. In scheduleHide/applyState test `document.hasFocus() && document.activeElement === omnibox` and always refresh omnibox.value when `state.activeId` changed.

### F118 · Cannot be set as default browser: no http/https handler registration in packaging and OS URL handoff (argv/open-url) is ignored

**Área:** Release & CI · **Esforço:** L · **Visível ao usuário:** sim · **Local:** `package.json:91`

**Evidência:** No `protocols`/`fileAssociations` in the build block (package.json:91-97 linux only has target/icon/category), so the AppImage .desktop has no `MimeType=x-scheme-handler/http`. main.js has no `setAsDefaultProtocolClient`/'open-url'/process.argv anywhere; `app.on('second-instance', () => { const browser = browsers.values().next().value; ... browser.window.focus(); })` (2245) ignores argv, so an OS-passed URL is dropped.

**Recomendação:** Packaging: add `linux.protocols`/`mac.protocols` with schemes http,https (+ `fileAssociations` for html); on Windows add `nsis.include: build/installer.nsh` writing HKCU `Software\Clients\StartMenuInternet\Zeos`, `RegisteredApplications` and a ProgID (do NOT use `protocols` on win: it registers `Classes\http`). App: parse http/https URLs from process.argv at startup and from second-instance (event, argv) → createWebTab; handle `app.on('open-url')` on macOS (register before whenReady); `app.setAsDefaultProtocolClient('http'/'https')` behind a settings toggle. Accept ONLY ^https?://; never register `zeos://` (CLAUDE.md invariant).

### F1 · No Electron fuses configured (cookie encryption off, runAsNode enabled, no asar integrity) — ✅ verificado

**Área:** Segurança · **Esforço:** S · **Visível ao usuário:** não · **Local:** `package.json:47`

**Evidência:** build block has `"asar": true` but no `electronFuses`; release.yml just runs `npx electron-builder --publish always`. Without EnableCookieEncryption the Chromium cookie DB is plaintext and ELECTRON_RUN_AS_NODE stays enabled.

**Recomendação:** Add `"electronFuses": { runAsNode:false, enableCookieEncryption:true, enableNodeOptionsEnvironmentVariable:false, enableNodeCliInspectArguments:false, enableEmbeddedAsarIntegrityValidation:true, onlyLoadAppFromAsar:true }` (electron-builder 26 supports it). Cookie encryption makes on-disk login sessions DPAPI/Keychain protected like Chrome.

> Parecer (confirma): Confirmed and in scope. package.json build block (line 47) has only "asar": true; no electronFuses; release.yml just runs `npx electron-builder --publish always` with signing disabled. electron-builder ^26.15.3 is installed with @electron/fuses 1.8.0 in the lockfile, and app-builder-lib/out/platformPackager.js (doAddElectronFuses/generateFuseConfig) flips fuses from the `electronFuses` config, so the fix really is a ~6-line config change with zero code impact. Value for one daily-driver user is real and proportionate: a browser marketed as privacy-focused currently leaves every login session cookie plaintext in %APPDATA%/Zeos/Cookies, readable from backups, disk images or any other account with file access; EnableCookieEncryption gives the same DPAPI/Keychain at-rest protection Chrome has for free. runAsNode/NodeOptions/inspect fuses close the "use Zeos.exe as a node runtime" LOLBin vector at no cost — the app never uses ELECTRON_RUN_AS_NODE, NODE_OPTIONS, child_process or --inspect (grep over src/ is empty), all require() calls are electron/node builtins or ./relative files inside the asar, and extensions load via session.loadExtension from tmpdir (Chromium path, not Node app loading), so onlyLoadAppFromAsar is safe. Dev `npm start` is unaffected (fuses apply only to packaged binaries). It does not touch any CLAUDE.md invariant and is packaging, not upper-Zeos-layer work. Two practical caveats the fix must include: (1) add `"resetAdHocDarwinSignature": true` because mac builds are unsigned (`identity: null`) and arm64 binaries crash on launch after a fuse flip without re-adhoc-signing; (2) asar integrity is a modest gain on an unsigned binary (attacker can replace the whole exe) and is a no-op on Linux, so treat it as nice-to-have rather than the headline. Severity medium rather than high: DPAPI is user-scoped, so same-user malware reads cookies either way; the win is at-rest/offline protection plus hardening, not a live-exploit fix.

> Parecer (confirma): Confirmed. package.json build block (line 35-104) has "asar": true at line 47 and no "electronFuses" key; no electron-builder.yml/afterPack hook exists that flips fuses; .github/workflows/release.yml:27 runs plain `npx electron-builder --publish always`. Installed toolchain supports the fix: app-builder-lib 26.15.3 scheme.json declares `electronFuses` (FuseOptionsV1) and @electron/fuses 1.8.0 is in package-lock.json; Electron is 40.10.6, whose defaults leave EnableCookieEncryption off and RunAsNode on. Nothing in src/ uses ELECTRON_RUN_AS_NODE, child_process/fork, NODE_OPTIONS or --inspect, and `onlyLoadAppFromAsar` does not affect `session.defaultSession.loadExtension` of the tmpdir runner, so enabling the fuses would not break the app. Severity downgraded from high to medium: builds are unsigned on every platform (mac `identity: null`, CSC_IDENTITY_AUTO_DISCOVERY=false, no Windows cert), so the asar-integrity/onlyLoadAppFromAsar fuses add near-zero protection (an attacker with write access can patch the exe anyway) and the runAsNode/NODE_OPTIONS/inspect fuses mainly matter for signed, hardened-runtime macOS apps with TCC grants. The one substantive gap is plaintext cookies on disk, which only DPAPI/Keychain-protects against offline/cross-user profile theft, not same-user malware; still worth doing for a privacy-marketed browser and is a small config change.

### F3 · No setPermissionCheckHandler: check-only permissions resolve as granted while requests are denied — ✅ verificado

**Área:** Outros · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:945`

**Evidência:** setupSession only calls `browserSession.setPermissionRequestHandler(...)`; no setPermissionCheckHandler anywhere in src. Electron's default check handler returns GRANTED, so clipboard-read etc. are allowed by default and `Notification.permission`, `permissions.query()` and enumerateDevices() labels behave as if allowed.

**Recomendação:** Add `browserSession.setPermissionCheckHandler((wc, permission, origin, details) => ...)` returning true only for the same allow-list as the request handler (notifications/media per settings) and false for clipboard-read, geolocation, hid, usb, serial, idle-detection, openExternal. Keeps navigator.permissions.query consistent and hides camera/mic device labels.

> Parecer (confirma): Confirmed. `src/main.js:945-947` (setupSession) only installs `setPermissionRequestHandler` (allowing `notifications`/`media` per settings, denying everything else). A repo-wide grep (excluding node_modules) finds no `setPermissionCheckHandler`, `setDevicePermissionHandler`, or any other check-path handling. Electron 40's own typings state the two handlers must be paired ("Most web APIs do a permission check and then make a permission request if the check is denied"), and Electron's ElectronPermissionManager returns GRANTED for status checks when no check handler is set. Consequences in this code: `DEFAULT_SETTINGS.permissions` is `{ notifications: false, media: false }` (line 44), yet `Notification.permission` and `navigator.permissions.query()` report "granted", so a page can display notifications via `new Notification()` without ever hitting the denying request handler; `enumerateDevices()` exposes camera/mic labels; clipboard-read/geolocation/hid/serial/usb checks resolve as allowed. The evidence quote is accurate and nothing elsewhere in the file compensates. Severity high is warranted because the user-facing deny-by-default permission settings are effectively unenforced on the check path and device labels leak.

> Parecer (confirma): Confirmed in src/main.js:945-947: setupSession installs only setPermissionRequestHandler (allow-list = notifications/media per settings) and there is no setPermissionCheckHandler anywhere in src. Electron's bundled docs (node_modules/electron/electron.d.ts ~12885-12903) state explicitly that both handlers must be implemented for complete handling because "most web APIs do a permission check and then make a permission request if the check is denied" — and Electron's default check result when no handler is set is GRANTED. Practical impact for a daily-driver browser: (1) any focused site can navigator.clipboard.readText() without a prompt (clipboard often holds passwords/tokens copied from a manager) — a real privacy hole Chrome would prompt for; (2) the Settings toggles permissions.notifications=false / media=false are only half-effective: Notification.permission and permissions.query() report 'granted', the `new Notification()` path is check-only, and enumerateDevices() exposes camera/mic labels (fingerprinting) without the request handler ever being consulted. This is browser-infrastructure work (session/permissions), squarely in this repo's scope, does not touch the upper Zeos layer, and reinforces the CLAUDE.md invariant that remote content is untrusted. The fix is proportionate (~10 lines, effort S): add browserSession.setPermissionCheckHandler mirroring the same allow-list (true for notifications/media only when the corresponding setting is on; false for clipboard-read, geolocation, hid, usb, serial, idle-detection, openExternal, etc.). Implementation note so it doesn't regress UX: return true for 'clipboard-sanitized-write' so site "copy" buttons keep working, and while there, consider that the request handler as written also denies 'fullscreen' and 'pointerLock' (video fullscreen / games) — a separate but adjacent consistency issue worth handling in the same small change. Severity high because it silently defeats existing user-facing privacy settings and exposes clipboard contents to arbitrary sites, with trivial cost to fix.

### F2 · Private windows write every visited URL into persistent history (settings.json) — ✅ verificado

**Área:** Privacidade · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:1325`

**Evidência:** did-navigate: `addHistory(url, tab.title);` (also 1334 for in-page). addHistory (249-264) has no privateMode check and calls saveSettingsSoon(); only saveSessionSoon()/saveSession() are guarded (1671/1674). README:50 promises private windows have 'sem armazenamento de histórico'.

**Recomendação:** In tabEvents guard both calls: `if (!getOwner().privateMode) addHistory(url, tab.title)` (or early-return inside addHistory). Also skip favicon/title persistence paths that reach settings.json. Add a test that a private Browser's navigation never touches settings.history; note in README that private history lives only in RAM.

> Parecer (confirma): Confirmed. src/main.js:249-264 addHistory() has no privateMode check and calls saveSettingsSoon(), which persists settings.history to userData/settings.json (line 110-112). Both call sites in tabEvents (did-navigate at 1325, did-navigate-in-page at 1334) call addHistory(url, tab.title) unconditionally for every tab.kind === 'web', and private windows create ordinary web tabs (Browser constructor line 999-1005 only changes the session partition). privateMode only guards saveSessionSoon/saveSession (lines 1671/1674) and readSession (1018). README.md:50 promises private windows have 'sem armazenamento de histórico'. So every URL visited in a private window is written to persistent history on disk — a real privacy defect that contradicts the documented behavior. Fix is a one-line guard (e.g. `if (!getOwner().privateMode) addHistory(...)` at both sites, or a privateMode/opts flag on addHistory). Severity high is warranted: silent persistence of private browsing to disk breaks the core promise of the feature.

> Parecer (confirma): Confirmed in code: src/main.js:1325 and :1334 call addHistory(url, tab.title) unconditionally inside did-navigate / did-navigate-in-page, and addHistory (249-264) pushes into settings.history and calls saveSettingsSoon() with no privateMode check. Only saveSessionSoon()/saveSession() (1671/1674) are guarded by this.privateMode. So every URL visited in a private window (partition temp:, per constructor at 1005) lands in settings.json on disk, contradicting README:50 ("sem armazenamento de histórico") and the README's local-privacy positioning. For a personal daily driver this is a real, user-visible privacy defect: the whole point of Ctrl+Shift+N is that nothing persists, and the history page will show private visits. It is squarely in-scope (Tabs/Navigation/Pages infrastructure, not the Zeos LLM/agent layer) and touches no CLAUDE.md invariant. The fix is proportionate and tiny: guard the two call sites with `if (!getOwner().privateMode)` (or pass owner into addHistory and early-return), plus a small unit test. The extra recommendation about favicon/title persistence is unnecessary — tab.title/tab.favicon only reach disk via saveSession, which is already guarded — so the proportionate version is just the two-line guard + test + README note; no broader rewrite needed.

### F113 · Release goes public before all platforms upload; publish job is a no-op

**Área:** Release & CI · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `.github/workflows/release.yml:27`

**Evidência:** release.yml:27 `npx electron-builder --publish always` runs on 3 parallel runners; package.json:102 `"releaseType": "release"`. electron-publish creates with `draft: this.releaseType === "draft"` (false) so the first finisher makes it public; release.yml:39 `gh release edit --draft=false` then edits nothing.

**Recomendação:** Build each OS with `--publish never`, upload `dist/*.{exe,dmg,zip,AppImage,yml,blockmap}` via actions/upload-artifact, then ONE publish job: download-artifact + `gh release create "$GITHUB_REF_NAME" --verify-tag --generate-notes dist/**`. Atomic release, free changelog, artifacts inspectable when publish fails.

### F47 · Chrome renderer rebuilds the entire tab strip and extension toolbar on every browser:state push; a mid-drag state update destroys the dragged element

**Área:** Outros · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/ui/app.js:117`

**Evidência:** renderTabs(): `tabsElement.replaceChildren();` then creates a new <button> with 9 listeners and a fresh <img src=favicon> per tab (l.119-261); L268 same for extensions; both called from applyState (533-534). dragstart sets `button.classList.add('dragging')` (l.158) on a node discarded on any state arrival. main.js sends state on page-title-updated, did-start/stop-loading, page-favicon-updated, download updates — many times per second while any tab loads; checkTabsOverflow forces layout each time (l.112). Causes lost clicks (mousedown on old node, mouseup on new), tooltip flicker, mid-drag DOM swaps.

**Recomendação:** Keyed reconciliation: keep `Map<tabId, button>`; update className/title/favicon in place (only set img.src when changed), reorder with insertBefore, remove missing ids, append new ones; bind listeners once via delegation on #tabs using data-tab-id. Same for renderExtensions keyed by ext.id+version. Skip renderTabs while `draggedTabId` is set (queue one render for dragend); skip when the tab slice is deep-equal.

### F87 · settings.json is not validated on load and updateSettings/loadSettings validation has zero coverage: unknown keys persist and bad types reach Electron APIs

**Área:** Outros · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:96`

**Evidência:** loadSettings: `...copy(DEFAULT_SETTINGS), ...stored,` then per-section spreads — zoomLevel/font/colors/initialPage/searchProvider/downloadMode are not type-checked here; the rules exist only in updateSettings (165-213: zoom clamp 50-200 at 192, SEARCH_PROVIDERS 165, FONTS 190, downloadMode 204) which mutates module state and calls saveSettingsSoon()/notifySettings(). A string zoomLevel yields `('x'||100)/100` = NaN at 137/1102. Nothing in test/ covers either.

**Recomendação:** Extract src/main/settings-model.js with pure `normalizeStoredSettings(stored, defaults)` and `applySettingsPatch(current, patch, {getTheme, fonts, providers, toNavigationTarget})` sharing one validation path (whitelist keys, clamp zoom, FONTS, SEARCH_PROVIDERS, downloadMode enum, history slice); main.js keeps I/O + notify. Tests: zoom 500→200 / NaN ignored; unknown provider ignored; themeId keeps zoomLevel; history sliced to 2000; non-array disabledExtensions → []; initialPage > 2048 chars rejected. Move FONTS out of main.js.

### F115 · No Dependabot: Chromium security patches in Electron are not tracked

**Área:** Segurança · **Esforço:** S · **Visível ao usuário:** não · **Local:** `package.json:31`

**Evidência:** package.json:31 `"electron": "^40.0.0"`; package-lock pins `40.10.6`; `.github/` contains only `workflows/` (no dependabot.yml). Every Electron patch release carries Chromium CVE fixes and nothing alerts or bumps the lockfile.

**Recomendação:** Add `.github/dependabot.yml` with `package-ecosystem: npm` (weekly, group electron+electron-builder) and `package-ecosystem: github-actions`. CI runs `npm ci && npm test` on PRs so patch bumps become one-click merges; consider `versioning-strategy: increase`.

### F15 · Multi-window session.json is last-writer-wins: every Browser overwrites the file, so closing/quitting loses all but one window's tabs; activeIndex computed over the wrong list — ✅ verificado

**Área:** Dados & Sessão · **Esforço:** L · **Visível ao usuário:** sim · **Local:** `src/main.js:1675`

**Evidência:** saveSession(): `const data = { bounds: this.window.getBounds(), activeIndex: Math.max(0, this.tabs.findIndex(...)), tabs: this.tabs.filter(t => t.kind === 'web') }` → `fs.writeFileSync(userFile('session.json'), ...)` per Browser; `window.on('close', () => this.saveSession())` (1041); before-quit loops every browser (2284); restore creates one `new Browser(false, true)` (2266). activeIndex indexes this.tabs (incl. settings/extensions tabs) but is restored against web-only tabs, so the wrong tab is activated.

**Recomendação:** Move session ownership to a module-level store `{ version, windows: [{ id, bounds, maximized, workspaceId, activeIndex, tabs }] }`; each Browser gets a stable sessionId and updates only its entry (drop the entry on user close, keep on quit); restore every window on startup. Compute activeIndex inside the filtered web-tab array. Skip writing `tabs: []` when a window closes because its last tab was closed/moved. Add a round-trip test once extracted to a pure module.

> Parecer (confirma): Confirmed against current src/main.js. (1) saveSession() (lines 1672-1677) builds a single-window payload {bounds, activeIndex, tabs} from `this` and does `fs.writeFileSync(userFile('session.json'), ...)` — one flat file, no window array, no merge with other Browsers. (2) `browsers` is a module-level Set (line 52); `this.window.on('close', () => this.saveSession())` (1041) and `app.on('before-quit', () => { for (const browser of browsers) browser.saveSession(); ... })` (2284) both cause every Browser to overwrite the same file, so the last writer's tabs are the only ones persisted. (3) Startup restores exactly one window: `new Browser(false, true)` (2266), and `app.on('activate')` likewise creates one; readSession() (266-270) returns a single {bounds, tabs, activeIndex} — there is no multi-window shape to restore even if it were written. Multi-window is an actively supported workflow (Ctrl+N 'Nova janela' at 1688, tearOffTab at 1639, moveTab across windows at ~1580-1638), so quitting with two or more windows silently loses all but one window's tabs on every quit. (4) activeIndex mismatch is real: line 1675 computes `this.tabs.findIndex(tab => tab.id === this.activeId)` over the full tab list (which includes kind 'settings'/'extensions'/'favorites' tabs set at 1464/1476/1488), but `tabs` is filtered to kind === 'web', and restore (1073-1075) applies that index to the web-only `sessionData.tabs`; a special tab positioned before the active tab shifts the restored active tab by one (or, if the special tab itself is active, activates an arbitrary web tab). (5) Also verified the empty-write path: closeTab splices before `window.close()` (1655-1662) and cross-window move closes the source window after emptying `tabs` (1602-1608), so `close` → saveSession writes `tabs: []`; in the move case the target's 300 ms debounced saveSessionSoon (1634) usually overwrites it, but it is a race. No session round-trip test exists (only test/workspaces.test.js mentions session). Nothing elsewhere in the file mitigates any of this. Severity high is warranted: deterministic loss of user tab state for any multi-window user on ordinary quit, in a browser whose core value is tab/session persistence; not a security issue, so not critical.

> Parecer (confirma): Confirmed in src/main.js. saveSession() (1672-1677) writes a single-window shape {bounds, activeIndex, tabs} to session.json per Browser instance; window 'close' (1041), every saveSessionSoon() call and the before-quit loop (2284) each overwrite the whole file, and startup restores exactly one `new Browser(false, true)` (2266) from readSession() (266-270). So with two windows open, closing them one by one (the normal Windows path, which then triggers window-all-closed -> quit) leaves only the last-closed window's tabs; before-quit also ends with whichever Browser iterates last. Multi-window is not exotic here: tearOffTab (1639-1651) and Ctrl+N/'new-window' create windows in daily use, so this is real tab loss for a single person's daily driver and directly violates the spirit of the CLAUDE.md invariant "restauração não duplica nem perde tabs". The activeIndex bug is also real: it indexes this.tabs including settings/favorites/extensions tabs (kinds at 1224/1265), but restore (1073-1075) applies it to the web-only filtered list, so a special tab anywhere before the active one shifts which tab is activated. Scope: session persistence is core Tabs/Pages infrastructure, not the upper Zeos layer, and touches no security invariant. Proportionality: the recommended {version, windows:[{bounds, activeIndex, tabs}]} store is an M-sized change, not a rewrite; the proportionate version is (1) compute activeIndex over the filtered web-tab array (one line), (2) have saveSession serialize all live entries in the `browsers` Set into a windows array and restore every window at startup, (3) keep a closed window's entry only when the close is part of quit — noting that on Windows the last window's 'close' fires before before-quit, so 'drop on user close' must not wipe the final window. Stable session IDs and a pure-module extraction with a round-trip test are nice-to-have, not required for the fix.

### F126 · workspaces.test.js never imports src/ — invariants are unprotected by real code

**Área:** Testes & Qualidade · **Esforço:** M · **Visível ao usuário:** não · **Local:** `test/workspaces.test.js:240`

**Evidência:** Only `require('node:test')`/`assert` at lines 3-4; TEST 10 defines `function associateWorkspace(tabId, workspaceId)` inline (240) and TEST 1 just does `browser.workspaceId = 'ws-B'` in a loop. The real handlers (src/main.js:2153-2204) are never executed.

**Recomendação:** Extract src/workspaces.js with pure functions over (workspaces, browsers): switchWorkspace, deleteWorkspace, associateTabWorkspace, resolveRestoredWorkspaceId, serializeSessionTabs (from saveSession:1675), normalizeSession (from readSession:266-270). Make ipcMain handlers one-line delegates; rewrite the 10 tests to import it and add 'restore does not duplicate/lose tabs' against the startupTabs merge (1062-1081).

### F127 · No Electron-level smoke test — the v1.1.0 'zeos://extensions opens empty' class of bug is undetectable

**Área:** Testes & Qualidade · **Esforço:** L · **Visível ao usuário:** não · **Local:** `.github/workflows/ci.yml:19`

**Evidência:** CI runs only `npm run check` + `npm test`. Baseline doc: 'Smoke GUI de referência: página zeos://extensions via omnibox abre VAZIA (bug 3)'. No test touches BrowserWindow, preload or IPC; no playwright in devDependencies.

**Recomendação:** Add `@playwright/test` and test/e2e/smoke.spec.js using `_electron.launch({args:['.'], env:{ZEOS_USER_DATA:tmpdir}})`; in main.js honor `process.env.ZEOS_USER_DATA` via app.setPath('userData') before loadSettings. Smoke: window shows; typing zeos://extensions yields `typeof window.zeosExtensions === 'object'`; session.json round-trip; `window.open('file:///')` from a page creates no tab. Separate CI job under xvfb-run.

### F128 · Web-initiated navigation scheme policy is inline twice and has no regression test

**Área:** Testes & Qualidade · **Esforço:** S · **Visível ao usuário:** não · **Local:** `src/main.js:1357`

**Evidência:** setWindowOpenHandler: `if (url === 'about:blank' || /^https?:\/\//i.test(url)) getOwner().createWebTab(url)` (1357); will-navigate repeats `/^https?:\/\//i.test(url)` (1366) plus `!url.startsWith('file://')` (1364). Nothing in test/ exercises either.

**Recomendação:** Add to src/navigation.js: `isWebInitiatedUrlAllowed(url)` (about:blank or http/https only) and `isInternalViewNavigationAllowed(url)`, use them at 1357/1364-1366. Table test: 'file:///C:/', 'zeos://settings', 'chrome://gpu', 'data:text/html,x', 'blob:https://x', 'javascript:1', 'HTTPS://x' (allowed), ' http://x' (denied), non-string → denied.

### F101 · Window drag is emulated with setPosition instead of -webkit-app-region: breaks Wayland, Aero Snap and Snap Layouts

**Área:** Outros · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:1163`

**Evidência:** handleDrag: `this.window.setPosition(Math.round(this.dragStartBounds.x + dx), ...)` driven by IPC from app.js:567 windowDrag('start', { screenX, screenY }); app.css has zero '-webkit-app-region' rules; app.js:590 dblclick always command('toggle-maximize').

**Recomendação:** Put -webkit-app-region: drag on #tabs-bar and no-drag on .tab/button/input/.stat-pill; delete the IPC drag path (Wayland ignores setPosition; Windows loses edge-snap). On win32 use titleBarStyle:'hidden' + titleBarOverlay {color,symbolColor,height:38} (native buttons → Snap Layouts, theme via setTitleBarOverlay) and hide HTML controls like on darwin. macOS then honors the system double-click action natively.

### F58 · Ctrl+/- zooms the whole browser UI and all tabs, persisted globally

**Área:** UX & Recursos · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:1438`

**Evidência:** `if (ctrl && (key === '=' || key === '+')) { ... updateSettings({ appearance: { zoomLevel: Math.min(200, cur + 10) } }); }` — applyZoomToBrowser (136) then does chrome.webContents.setZoomFactor(factor) and tab.view.webContents.setZoomFactor(factor) for every tab.

**Recomendação:** Separate page zoom from UI scale. Ctrl+=/-/0 should call the active tab's webContents.setZoomLevel only and remember it per host (settings.siteZoom[hostname]); reapply on did-navigate when hostname changes; show a transient zoom badge with reset. Keep appearance.zoomLevel as a UI-scale setting adjusted only from Settings.

---

## MÉDIO (57)

### F122 · Auto-update: specifics needed beyond the roadmap line

**Área:** Release & CI · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `package.json:98`

**Evidência:** package.json:98-103 publish provider github + `releaseType: release` and mac `zip` target (80) are the correct prerequisites; `electron-updater` is not a dependency (devDeps only) and README:108 documents SmartScreen prompts on unsigned builds.

**Recomendação:** Ship auto-update for Windows (NSIS) and Linux (AppImage) first: add `electron-updater` as the single runtime dep, `autoUpdater.checkForUpdatesAndNotify()` behind a settings toggle, keep `releaseType: release`. macOS Squirrel refuses unsigned apps (stays manual until F119); on Windows unsigned updates re-trigger SmartScreen/SAC, so plan a signing cert before enabling.

### F117 · Packaging is never exercised before tag time

**Área:** Release & CI · **Esforço:** S · **Visível ao usuário:** não · **Local:** `.github/workflows/ci.yml:19`

**Evidência:** ci.yml:17-19 only runs `npm ci`, `npm run check`, `npm test` on ubuntu. electron-builder (files glob, icons, asar, nsis/dmg config) is first executed in release.yml at tag push.

**Recomendação:** Add a `pack` job to ci.yml (matrix or at least windows-latest) running `npx electron-builder --dir --publish never` after tests, uploading `dist/*-unpacked` with `retention-days: 3`. Optionally launch the unpacked exe with `--version` as a boot check.

### F67 · Page context menu lacks image, selection-search, open-in-window and spellcheck items

**Área:** UX & Recursos · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:1371`

**Evidência:** `if (params.linkURL) { 'Abrir link em nova aba', 'Copiar endereço do link' } ... canCopy/canCut/canPaste/canSelectAll ... Voltar/Avançar/Recarregar/Inspecionar` — params.mediaType, srcURL, selectionText, misspelledWord and dictionarySuggestions are never used.

**Recomendação:** Add: mediaType==='image' → 'Abrir imagem em nova aba', 'Copiar imagem' (copyImageAt), 'Salvar imagem como...' (downloadURL); selectionText → 'Pesquisar "…"' via toNavigationTarget; links → 'Abrir em nova janela'/'em janela privada', 'Salvar link'; misspelledWord → dictionarySuggestions + 'Adicionar ao dicionário'; 'Salvar página'/'Imprimir'. Set session.setSpellCheckerLanguages(['pt-BR','en-US']) once.

### F19 · navigate() marks the tab 'falha ao abrir' on ERR_ABORTED (link clicked while loading, download links) — ✅ verificado

**Área:** Correção · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:1508`

**Evidência:** `tab.view.webContents.loadURL(url).catch(() => { tab.loading = false; tab.title = 'falha ao abrir'; this.sendState(); });` — no errno check, while did-fail-load (1341) correctly ignores `code !== -3`. Electron rejects the pending loadURL promise whenever a newer navigation starts or a download aborts it.

**Recomendação:** In the catch, ignore aborted navigations: `.catch((err) => { if (err?.errno === -3 || err?.code === 'ERR_ABORTED') return; ... })`.

> Parecer (confirma): Confirmed in src/main.js:1508: the loadURL catch is unconditional, while the did-fail-load handler at 1340-1347 already filters `code !== -3`, so the two paths are inconsistent. Electron rejects the pending loadURL promise with ERR_ABORTED (errno -3) whenever the navigation is superseded or turns into a download. Daily-driver impact is real and visible: pasting a direct download URL (installer, PDF, zip) into the omnibox starts the download but leaves the tab titled 'falha ao abrir' with loading=false and nothing ever corrects it, which reads as 'the download failed'. The type-then-retype and click-link-while-loading cases also flip the title/loading state briefly until did-start-loading/page-title-updated of the new navigation overwrite it (self-healing flicker). It is core navigation infrastructure (in scope, no invariant touched) and the proportionate fix is exactly the one-line errno/code check proposed, matching the existing did-fail-load logic. Not refuted.

### F130 · packZip writes UTF-8 names without the UTF-8 flag; edge cases (unicode, hidden, empty, missing dir) untested

**Área:** Correção · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/extension-utils.js:64`

**Evidência:** `localHeader.writeUInt16LE(0, 6)` (64) and `centralHeader.writeUInt16LE(0, 8)` (81) leave general-purpose flag 0 while names are `Buffer.from(entry.path, 'utf8')` (60). Packing src/ção/ícone.js yields flag=0 → Explorer/7-zip decode as CP437. Empty dir → 22-byte EOCD-only zip; missing dir throws ENOENT.

**Recomendação:** Set bit 11 (0x0800) at offsets 6 (local) and 8 (central). Extend test/extensions.test.js: unicode name round-trips; `.hidden`, `.git`, `node_modules` skipped (line 33); empty source → valid zip with 0 entries; nested paths use '/' on Windows; decide contract for nonexistent source (false vs throw) and assert it.

### F92 · Dead code and unreachable paths around workspaces/tab state and preload

**Área:** Arquitetura · **Esforço:** S · **Visível ao usuário:** não · **Local:** `src/main.js:75`

**Evidência:** getCurrentWorkspace (75-81) has no callers. tab.state/lastActiveAt (1277-1278, 2197, 2211-2212) are never read. preload `reorderTabs`, `workspaces.*`, `tab.*` (preload.js:11, 51-63) are called by no renderer; `browser:reorder-tabs` (2007) duplicates `attach-tab`. (ws.tabs dead branch and spurious saveWorkspaces covered in F28.)

**Recomendação:** Remove getCurrentWorkspace, tab.state/lastActiveAt and the reorder-tabs alias. Keep the workspaces:* backend (documented foundation) but move it to src/main/workspaces.js as pure functions over the registry so test/workspaces.test.js imports the real code (see F126).

### F9 · Internal pages (chrome UI, settings, extensions, favorites) ship without a Content-Security-Policy — ✅ verificado

**Área:** Outros · **Esforço:** S · **Visível ao usuário:** não · **Local:** `src/settings/index.html:3`

**Evidência:** grep for 'Content-Security-Policy'/'http-equiv' in src/ returns nothing; heads contain only charset/viewport meta (ui, settings, extensions, favorites index.html) and main.js sets no onHeadersReceived CSP. favorites/index.html:66 uses an inline `<script>`; ui/app.js:224 sets `img.src = tab.favicon` from remote pages.

**Recomendação:** Add `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http:; connect-src 'none'; object-src 'none'; base-uri 'none'">` to the four pages (img-src http(s) only needed for ui/index.html favicons). Move favorites' inline script/style into files so script-src 'self' holds. Also silences Electron's dev-time CSP warning.

> Parecer (confirma): Confirmed. Grep of src/ for 'Content-Security-Policy', 'http-equiv', 'onHeadersReceived' and 'csp' returns zero matches; the heads of src/ui/index.html, src/settings/index.html, src/extensions/index.html and src/favorites/index.html contain only charset/viewport/title/stylesheet. src/favorites/index.html:66-81 has an inline <script> (and :6-51 an inline <style>). src/ui/app.js:224 sets img.src = tab.favicon, and src/main.js:1350 assigns tab.favicon = favicons[0] straight from the page's page-favicon-updated event with no scheme check, so the privileged chrome view loads a remotely chosen URL into an <img>. Nothing elsewhere compensates (no header injection in setupSession, no meta tag). Mitigations that keep this at defense-in-depth rather than an exploitable bug: all internal views run contextIsolation:true/nodeIntegration:false (tab views also sandbox:true, main.js:1226-1233), and every innerHTML use in ui/app.js, extensions.js and settings.js is a static string with no interpolated untrusted data, so no live XSS vector exists today. Medium is appropriate because these pages expose privileged preload bridges (window.zeos, window.zeosSettings, window.zeosExtensions) and a CSP is the standard Electron hardening; effort S is accurate.

> Parecer (confirma): Confirmed and worth doing, but as low-priority hardening rather than medium. Facts: all four internal pages are loaded via loadFile (main.js:1055, 1290-1292) with contextIsolation/no Node, and grep shows no CSP anywhere. They are privileged (expose window.zeos / window.zeosExtensions) and render data influenced by untrusted sources: tab titles/favicon URLs from remote pages (ui/app.js:224) and names/descriptions/commands from third-party extension manifests. Today every innerHTML use is a static string, so there is no live XSS, which is why severity is low, not medium. But the fix is genuinely S-sized and risk-free for this codebase: no renderer uses fetch/XHR/WebSocket (connect-src 'none' is safe), extension icons are data: URLs (main.js:616), favicons are http(s)/data:, styles are local files plus inline style= attributes (covered by style-src 'unsafe-inline'), fonts are system/local. The only code change beyond a meta tag is moving favorites' 15-line inline script into favorites.js. It reinforces the CLAUDE.md invariant on privileged internal pages, adds a second wall behind IPC validation if a future innerHTML slip lands, and silences Electron's dev console CSP warning. Not upper-layer scope, no invariant conflict, no rewrite. Proportionate version: just the meta tags as recommended (img-src must keep data: for extension icons and http:/https: for ui/index.html favicons); skip onHeadersReceived, which is unnecessary for loadFile pages.

### F93 · Deprecated session.getAllExtensions/loadExtension/removeExtension used at 11 call sites; centralize before migrating

**Área:** Outros · **Esforço:** S · **Visível ao usuário:** não · **Local:** `src/main.js:681`

**Evidência:** session.defaultSession.getAllExtensions() at 681, 789, 857, 1851, 1936, 2070; .loadExtension at 537; .removeExtension at 719, 748, 773, 793. Five repeat `getAllExtensions().find(e => e.id === extensionId)`.

**Recomendação:** In src/main/extensions.js add `const extApi = () => session.defaultSession.extensions || session.defaultSession;` and helpers `findLoadedExtension(id)`, `loadExt(path)`, `unloadExt(id)`; route all 11 sites through them so the Electron 40 `session.extensions.*` migration is one line and the pair is testable with a stub.

### F6 · Drive-by downloads are auto-saved with no confirmation for executable types — ✅ verificado

**Área:** UX & Recursos · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:949`

**Evidência:** `browserSession.on('will-download', (_event, item, source) => { ... item.setSavePath(savePath);` — any page can trigger `<a download>`/redirect to an .exe/.bat/.lnk/.hta which lands in Downloads immediately; the panel then offers `shell.openPath` (2016-2018) to run it.

**Recomendação:** Before setSavePath, check extension/MIME against a dangerous-type list (.exe .msi .bat .cmd .ps1 .js .vbs .hta .scr .lnk .dmg .app .sh); prompt via dialog.showMessageBox(owner.window) with Keep/Cancel (item.cancel()). Require an explicit confirm in the panel before opening such files.

> Parecer (confirma): Confirmed and in scope. src/main.js:949-952 unconditionally calls item.setSavePath(join(downloads, item.getFilename())) for every will-download, and src/ui/app.js:693-695 auto-opens the downloads panel on 'browser:download-started', so a malicious page can drop `update.exe`/`invoice.lnk`/`.hta`/`.bat` into ~/Downloads and immediately surface an "open" affordance that resolves to shell.openPath (main.js:2016-2018, which only validates the path is a tracked download, not its type). Downloads are core WebBrowser infrastructure, not the Zeos upper layer, and the fix reinforces the CLAUDE.md invariant that remote content is untrusted rather than contradicting it. Value for a single daily-driver user is real: it removes a social-engineering/clutter vector that Chrome and Firefox both gate by default; Windows MotW/SmartScreen only partially mitigates (.exe yes, .lnk/.hta/.bat/.vbs/.js much less so, and the user's Smart App Control does not cover all script types). The recommendation is proportionate (~30 lines: a dangerous-extension/MIME set, dialog.showMessageBox(owner.window) Keep/Cancel before setSavePath with item.cancel() on decline, plus a confirm in 'downloads:open-file' for the same set); effort is closer to S than M. Not critical because the file still requires a user click to execute, hence medium.

> Parecer (confirma): Confirmed in current code. src/main.js:949-952 (`browserSession.on('will-download', ...)` → `item.setSavePath(path.join(app.getPath('downloads'), item.getFilename()))`) unconditionally accepts every download from any web content with no extension/MIME check, no dialog, and no user gate; there is no `dialog.showMessageBox` or any confirm anywhere in the download path (grep across src/ finds none for downloads). Electron has no Safe Browsing, so a page-triggered `<a download>`/redirect to .exe/.bat/.hta/.lnk lands silently in the user's Downloads folder. The panel (src/ui/app.js:487-490) then calls `window.zeos.downloads.openFile(savePath)` on a single click of a completed item, which reaches `ipcMain.handle('downloads:open-file')` at main.js:2016-2018 and runs `shell.openPath(filePath)`; the IPC validation there (`isTrackedDownloadPath` + `fs.existsSync`) only checks that the path belongs to a tracked download, not the file type, so it does not mitigate the finding. Severity stays medium rather than high: nothing is auto-executed, the user must click the item, and on Windows Chromium's download stack still applies Mark-of-the-Web so SmartScreen/Smart App Control may intervene at execution time — but the browser itself provides zero warning, which is weaker than mainstream browsers.

### F32 · Tab drag-and-drop lands one slot too far right when moving a tab rightwards

**Área:** UX & Recursos · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/ui/app.js:209`

**Evidência:** L209 `const insertIdx = event.clientX > (rect.left + rect.width / 2) ? idx + 1 : idx;` (also getDropIndex L646-656). main.js 1572-1573 reorderTab: `splice(currentIndex,1)` then `splice(targetIndex,0,tab)` — index not adjusted after removal. [A,B,C,D] drag A onto right half of C yields [B,C,D,A] instead of [B,C,A,D].

**Recomendação:** For same-window drops subtract 1 from insertIdx when the dragged tab's current index is lower than insertIdx; keep the raw index for cross-window attach (list doesn't contain the tab yet).

### F33 · Tear-off fires on drops inside the window (page area) and leaks tab id as text/plain

**Área:** UX & Recursos · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/ui/app.js:172`

**Evidência:** L172-178: `if (event.dataTransfer.dropEffect === 'none') { if (event.screenY > window.screenY + 120 || ...) tearOffTab(...)`. L160 `setData('text/plain', tab.id)`. 120px below the top is the page, not outside the window.

**Recomendação:** Treat as tear-off only when the pointer is outside the window rect (include `windowBounds` in state from main). Remove the text/plain payload (keep only application/x-zeos-tab) so dropping over a page textarea does not insert the id. Pair with F21 (move the view instead of reloading).

### F88 · Keyboard shortcut table is duplicated in main (before-input-event) and chrome renderer (keydown) and already drifts

**Área:** Arquitetura · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:1394`

**Evidência:** main.js keyboard() 1394-1459 and ui/app.js 773-878 define the same ~18 chords twice. Drift: Ctrl+J in main sends 'browser:toggle-downloads' (1409) while app.js toggles locally (845); Escape only exists in app.js (777).

**Recomendação:** Attach the same `before-input-event` handler to `this.chrome.webContents` in Browser.open() (guarded so omnibox typing keeps Shift), delete the app.js keydown block, and move the chord→command mapping into a pure src/main/shortcuts.js table consumed by keyboard() and menu accelerators. Unit-test the table.

### F89 · Internal page kind→title/url/file/privilege mapping is repeated in 6 places and the privilege boundary is an untested inline arrow

**Área:** Arquitetura · **Esforço:** S · **Visível ao usuário:** não · **Local:** `src/main.js:1265`

**Evidência:** createTab 1265-1266 (ternary chains for title/url), 1290-1292 (loadFile per kind), navigate 1463-1498 (three near-identical 12-line blocks incl. aliases), and the privilege predicate `kind === 'settings' || 'favorites' || 'extensions'` at 156, 1224, 1244; ensureViewKind: `const isPrivileged = (k) => ...; if (isPrivileged(kind) === isPrivileged(tab.viewKind)) return;` — not testable without Electron.

**Recomendação:** Add src/main/internal-pages.js: `{ settings: { title, url:'zeos://settings', file:'settings/index.html', aliases:[...] }, ... }` with `resolveInternalPage(target)`, `isPrivilegedKind(kind)` and `viewMustBeReplaced(fromKind, toKind)`; use them at 156, 1244-1245, createView, navigate(). Test the full 4x4 kind matrix (web→settings replace, settings→extensions reuse, favorites→web replace, unknown kind unprivileged).

### F90 · Default appearance palette copied in 4 renderers and duplicated between DEFAULT_SETTINGS and THEMES[0]

**Área:** Arquitetura · **Esforço:** S · **Visível ao usuário:** não · **Local:** `src/ui/app.js:92`

**Evidência:** setTheme (app.js:92-101), applyThemeColors (settings.js:47-56, extensions.js:70-79), applyTheme (favorites/index.html:68-77) each hard-code '#0b0b0b','#f5f5f5','#22c55e','#181818','#242424','#2a2a2a','IBM Plex Mono'; main.js:23-33 repeats THEMES[0].appearance (themes.js:9-18).

**Recomendação:** In main: `appearance: { ...getTheme('orca').appearance, zoomLevel: 100 }` so themes.js is the single palette source. Replace renderer fallbacks with a shared `applyAppearance(a)` shipped as src/ui/shared/appearance.js loaded via <script> by all pages.

### F94 · 15 empty catch blocks silently swallow failures, inconsistent with console.error elsewhere

**Área:** Arquitetura · **Esforço:** S · **Visível ao usuário:** não · **Local:** `src/main.js:502`

**Evidência:** `catch {}` / `catch (e) {}` at 126, 502, 574, 618, 705, 719, 725, 748, 773, 793, 827, 1255, 2280 (+ extension-utils.js:130,133). 502/725 hide rmSync failures on the runner copy so stale zeos-ext-* dirs accumulate; 719/748/773/793 hide removeExtension errors while the caller reports success.

**Recomendação:** Introduce `ignore(label)` / `warn(label, err)` helpers in src/main/log.js and use `catch (e) { warn('ext:rm-runner', e) }` where failure matters. Keep truly-benign ones explicit with a comment. Enforce via eslint `no-empty: ['error', { allowEmptyCatch: false }]`.

### F77 · Manifest commands are listed but never bound; nothing ever sends __zeos_trigger_command

**Área:** Extensões · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/extensions/extensions.js:281`

**Evidência:** `keyBadge.textContent = cmdVal.suggested_key?.default || 'Não definido';` — main.js polyfill l.473 handles `msg.__zeos_trigger_command`, but no sender exists in src/; Browser.keyboard() (1394) handles only built-in shortcuts.

**Recomendação:** Parse suggested_key.default/windows/mac into a normalized chord; in before-input-event (page and chrome contents) match chords per loaded extension and dispatch via the bridge; `_execute_action` runs openExtensionAction. Prefer before-input-event over globalShortcut. Show conflicts with Zeos shortcuts on the Atalhos page and let the user rebind.

### F78 · chrome.contextMenus items live only in a Map inside the service worker; page context menu never shows them

**Área:** Extensões · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:318`

**Evidência:** `const menus = new Map(); self.chrome.contextMenus = { onClicked: createEvent(), create(props, cb) { if (props && props.id) menus.set(props.id, props); ... } }` — main's context-menu handler (1371-1392) builds only link/edit/back/forward/reload/inspect items; `__zeos_trigger_context_menu` (480) has no sender.

**Recomendação:** Forward create/update/remove/removeAll registry (id, title, contexts, parentId, type, checked, enabled, documentUrlPatterns) to main through the bridge. In the context-menu handler append a Chrome-style entry per extension filtered by contexts vs params. On click dispatch `__zeos_trigger_context_menu` with info {menuItemId, parentMenuItemId, selectionText, linkUrl, srcUrl, pageUrl, frameUrl, editable, mediaType} and the real tab.

### F81 · Private windows show the extension toolbar but extensions cannot run there (temp: partition), popup uses defaultSession

**Área:** Extensões · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:1005`

**Evidência:** `this.partition = privateMode ? `temp:zeos-${++privateNumber}` : undefined;` — sendState always sends `extensions: getInstalledExtensions()` (1206) regardless of privateMode, and the popup is created with `session: session.defaultSession` (1973). Electron refuses loadExtension on in-memory sessions.

**Recomendação:** Short term: when `privateMode`, send `extensions: []` (or render disabled with tooltip). Follow-up: per-extension 'Permitir em janelas privadas' using a `persist:zeos-private` session cleared when the last private window closes, loadExtension into it and open popups with that session.

### F157 · Extensions on a missing path are permanently unregistered at startup

**Área:** Extensões · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:565`

**Evidência:** loadSavedExtensions: `if (fs.existsSync(extPath)) { loaded.push(extPath) ... }` then `settings.extensions = loaded;` — an extension on an unplugged drive, network share, or temporarily renamed folder is dropped and the next save persists the loss. `disabledExtensions` is never pruned so stale paths accumulate.

**Recomendação:** Never prune on load. Keep the entry and surface it in the extensions page as `missing: true` (getInstalledExtensions already builds a details object for non-loaded entries at 692-708; add a branch for non-existent paths). Offer explicit 'Remover' there. Prune disabledExtensions only when the user removes the entry.

### F143 · User-Agent exposes app name and Electron/40 token (fingerprint + site blocking)

**Área:** Privacidade · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:2254`

**Evidência:** whenReady never touches UA: no setUserAgent/userAgentFallback in src. Default UA contains "Zeos/1.1.0 Chrome/… Electron/40.x", a unique identifier some sites (Google login, Cloudflare) treat as bot.

**Recomendação:** Before creating any Browser: `app.userAgentFallback = app.userAgentFallback.replace(/ (Zeos|zeos-webbrowser|Electron)\/\S+/g, '')` and `session.setUserAgent(app.userAgentFallback)` inside setupSession so temp: partitions match. Keep the Chrome token so client hints stay coherent. Document the UA in README.

### F20 · Selecting/creating/attaching a tab never focuses its webContents — keyboard input keeps going to the hidden tab

**Área:** UX & Recursos · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:1511`

**Evidência:** selectTab(): `this.activeId = id; this.layout(); this.sendState(); this.saveSessionSoon();` — no `tab.view.webContents.focus()`; same in createTab (1288) and attachTab (1631). Only `this.chrome.webContents.focus()` (1128) and `this.window.focus()` (1636) exist.

**Recomendação:** Add a `focusActive()` helper (`const t = this.active(); if (t && !t.view.webContents.isDestroyed()) t.view.webContents.focus();`) and call it from selectTab, cycle, attachTab, closeTab and after omnibox navigate; for a fresh Ctrl+T tab focus the omnibox instead.

### F158 · History entries record the previous page's title; visitCount/lastVisitedAt/tags/workspaceId are dead fields — ✅ verificado

**Área:** Outros · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:1325`

**Evidência:** `addHistory(url, tab.title)` fires on did-navigate, before page-title-updated (1302) sets the new title, so `title` is stale and never updated. addHistory (261) replaces any existing entry with `visitCount: 1` so counts never increase; call sites pass no opts so tags/workspaceId are always empty; `searchableText` duplicates title+url.

**Recomendação:** Upsert: find existing by url, increment visitCount, set lastVisitedAt, keep original visitedAt. In page-title-updated update the entry matching `tab.url` with the real title. Pass `{ workspaceId: tab.workspaceId }` from call sites. Drop `searchableText` (compute in settings.js) to halve file size. Debounce resulting saves.

> Parecer (confirma): Confirmed in code: addHistory(url, tab.title) at src/main.js:1325/1334 fires on did-navigate before page-title-updated (:1302) sets the new title, and nothing later patches the entry, so every row in the Settings > History page shows the PREVIOUS page's title (or the raw URL on first load). settings.js:198-205 searches item.title, so title search returns the wrong page. For a personal daily-driver, history is a core feature and wrong titles on every entry is a noticeable daily-UX defect. visitCount is always 1, tags always [], workspaceId always null, and searchableText is unused by the only consumer (settings.js computes its own) — dead weight in a 2000-entry settings.json. In scope (navigation infra, not upper Zeos layer), no invariant conflict, and the fix is genuinely S. Proportionate version: (1) in page-title-updated, update the title of the newest history entry whose url === tab.url (non-private windows only); (2) on revisit, carry over visitCount+1 instead of resetting; (3) drop searchableText and pass { workspaceId: tab.workspaceId }. Skip 'keep original visitedAt' unless the time filters/ordering (clearHistoryRange :224-233, filterHistoryItems :183-195) are switched to lastVisitedAt — today visitedAt effectively means 'last visit', which is what those filters want. Skip 'debounce saves' — saveSettingsSoon (:109) is already a 250ms debounce.

### F83 · Only unpacked folders can be installed; the Chrome Web Store link and promo copy promise an install path that cannot work

**Área:** Outros · **Esforço:** L · **Visível ao usuário:** sim · **Local:** `src/main.js:2086`

**Evidência:** `owner.createWebTab('https://chromewebstore.google.com/', true);` — 'Adicionar ao Chrome' fails outside Chrome (and hands Google cookies/analytics); no CRX path in src; loadUnpackedExtension (649-671) accepts only a directory; extensions/index.html l.103 claims support for 'Manifest V2 e V3 com Service Workers nativos, popups, páginas de opções'.

**Recomendação:** Add `.zip` and `.crx3` import to extension-utils (zip reader via central directory + zlib.inflateRawSync; CRX3 = 'Cr24' magic, version 3, uint32LE header length at offset 8, zip at 12+len), extract to `userData/extensions/<id>` and load. Intercept chromewebstore.google.com/detail/*/<id> with 'Instalar no Zeos' fetching clients2.google.com/service/update2/crx (acceptformat=crx3); store update_url+version. Until then, relabel the link and reword README:56-58 / promo to the real support list.

### F10 · settings:open-url accepts any URL and IPC from internal pages resolves the wrong window (chromeOwners vs pageOwners) — links land in the first window — ✅ verificado

**Área:** Segurança · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:2100`

**Evidência:** `ipcMain.handle('settings:open-url', (_event, url) => { const firstBrowser = browsers.values().next().value; firstBrowser.createWebTab(url, true);` — no scheme check (toNavigationTarget allows file:, data:, chrome-extension:) and always the first window. extensions:load-unpacked/pack/open-options/open-web-store (2046-2084) use `chromeOwners.get(event.sender.id)` although the sender is a page view registered in pageOwners. With two windows, clicking a history item in window 2's settings opens the tab in window 1.

**Recomendação:** Add `const ownerOf = (event) => pageOwners.get(event.sender.id) || chromeOwners.get(event.sender.id) || BrowserWindow.fromWebContents(event.sender) lookup || browsers.values().next().value;` and use it in settings:open-url and the extensions:* handlers. In settings:open-url accept only `^https?://` or known `zeos://` targets; reject everything else.

> Parecer (confirma): The window-routing half is confirmed and worth fixing. Internal pages (settings/extensions/favorites) are created via createTab(), which registers the view only in pageOwners (main.js:1285), never in chromeOwners. So extensions:open-options (2074), extensions:open-web-store (2084) and settings:open-url (2100-2103) all fall through to browsers.values().next().value — the first window. With two windows open, clicking a history entry or "open options" from window 2's settings page spawns the tab in window 1. That is a visible daily-UX defect in a core flow (history → reopen), it lives squarely in the Tabs/Navigation layer (not the upper Zeos layer), it does not touch any invariant, and the fix is a one-line helper (pageOwners.get(sender.id) || chromeOwners.get(sender.id) || first) applied to ~4 handlers. load-unpacked/pack (2047-2058) fall back to getFocusedWindow(), which usually lands right, but should use the same helper for consistency.

The scheme-restriction half is over-scoped and should be dropped: settings:open-url is only reachable from a privileged internal page loaded via loadFile with settings-preload (contextIsolation on, no preload on remote views), so remote content cannot invoke it — the invariant "web-initiated navigation only http/https" is not at stake. The URLs it receives are history entries the user already visited (or the literal 'zeos://extensions'); forcing ^https?:// would break reopening a file:// or chrome-extension:// page the user legitimately visited, and the existing navigate()/toNavigationTarget path already applies the same isNavigableProtocol filter as the address bar. Proportionate version: fix owner resolution only; at most guard typeof url === 'string' and let navigate() handle the rest.

> Parecer (confirma): Confirmed in current HEAD (8dd098d) of C:\Users\Davi\Documents\Zeos WebBrowser\src\main.js. Evidence quote is accurate. (1) Wrong-window routing is real and deterministic: `settings:open-url` (lines 2100-2107) ignores `event` entirely and always calls `browsers.values().next().value.createWebTab(url, true)` (`browsers` is a Set, so this is the first-created window). `extensions:open-options` (2074) and `extensions:open-web-store` (2084) do `chromeOwners.get(event.sender.id) || browsers.values().next().value`, but `chromeOwners` only ever holds the chrome view's webContents (line 1054), while settings/extensions pages are separate WebContentsViews created via `createView(kind)` with `settings-preload.js` and registered only in `pageOwners` (lines 1251, 1285, 1618). `src/preload.js` (the chrome preload) exposes no `extensions:*` or `settings:open-url` channel, so the `chromeOwners` branch in all four handlers is dead code and the first-window fallback is always taken. With two windows, clicking a history item or an extension's options in window 2 opens the tab in window 1. Note: for `extensions:load-unpacked` (2047) and `extensions:pack` (2057) the fallback is `BrowserWindow.getFocusedWindow()`, which is correct in practice at click time, so those two are only cosmetically wrong. No `ownerOf` helper exists elsewhere; line 969 is unrelated download code. (2) Scheme check: `settings:open-url` performs no validation; `createWebTab -> navigate -> toNavigationTarget` (navigation.js line 12-13) accepts `file:`, `data:`, `blob:`, `chrome:`, `chrome-extension:`, `about:`, so the handler will happily load `file:///...` into a web view. However, this is defense-in-depth rather than an invariant violation: the sender is always a privileged internal page (user-triggered), and the same schemes are already reachable by typing them into the omnibox, so it does not break the "web-initiated navigation only http/https" rule. Severity kept at medium because the multi-window mis-targeting is a deterministic functional bug in a browser that explicitly supports multiple windows (tear-off/attach-tab), plus a missing allowlist on a privileged IPC that CLAUDE.md says must validate input; the security portion alone would be low.

### F65 · Keyboard gaps: Esc advertised but not implemented, no Ctrl+Shift+T, Ctrl+PgUp/PgDn, Ctrl+9=last, Ctrl+P

**Área:** UX & Recursos · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:1456`

**Evidência:** `if (ctrl && /^[1-9]$/u.test(key)) { ... const next = this.tabs[Number(key) - 1] || this.tabs.at(-1); ...}` — app.js:543 `reloadButton.title = state.activeLoading ? 'Parar carregamento (Esc)' : ...` but app.js keydown (777-782) handles Escape only to close the downloads panel and keyboard() has no Escape branch; closeTab (1652) keeps no closed-tab stack.

**Recomendação:** In keyboard(): Escape → webContents.stop() when loading (and exit fullscreen/find); in app.js Escape with omnibox focused → restore `omnibox.value = state.activeUrl` and blur; Ctrl+9 → always last tab; Ctrl+PageUp/PageDown → cycle(-1/+1); Ctrl+Shift+T → pop a per-window closedTabs stack ({url,pinned,index,workspaceId}, max 25) pushed in closeTab; Ctrl+P → webContents.print(); Ctrl+Shift+Delete → clear-data modal. Mirror in app.js so they work while the omnibox is focused.

### F104 · macOS: Option+Arrow is hijacked for back/forward, breaking word-jump in text fields; no Cmd+[ / Cmd+]

**Área:** UX & Recursos · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:1457`

**Evidência:** `if (input.alt && input.key === 'ArrowLeft' && ...canGoBack()) { event.preventDefault(); ...goBack(); }` — fires for any focused element; app.js:869 does the same in the omnibox with no isTyping check.

**Recomendação:** On darwin skip the Alt+Arrow bindings and add Cmd+[ / Cmd+] in both keyboard() and app.js. On win/linux keep Alt+Arrow but honor editable focus in the omnibox handler like the Shift toggle already does (app.js:785).

### F105 · macOS: Cmd+H opens Settings instead of hiding the app (appMenu 'hide' role is suppressed)

**Área:** UX & Recursos · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:1412`

**Evidência:** `if (ctrl && (key === 'h' || (ctrl && key === ','))) { event.preventDefault(); this.createSpecialTab('settings'); }` with ctrl = input.control || input.meta; app.js:808 same. preventDefault in before-input-event also blocks menu accelerators, so appMenu Hide never runs.

**Recomendação:** On darwin bind Settings only to Cmd+, and let Cmd+H fall through to the application menu; keep Ctrl+H on win/linux. Apply the same platform gate in app.js (navigator.platform check exists at app.js:65).

### F103 · macOS: traffic-light spacing is fixed 76 CSS px while the chrome is zoomed; fullscreen keeps the gap

**Área:** Multiplataforma · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/ui/app.css:76`

**Evidência:** `body.platform-darwin #tabs-bar { padding-left: 76px; }` vs main.js:1027 trafficLightPosition: { x: 12, y: 10 } (DIP, fixed) and main.js:1104 top = Math.round(baseTop * zoomFactor). At 50% zoom the padding is 38 DIP (lights overlap tabs); at 200% the bar is 76 DIP tall with lights at y=10. No enter-full-screen handler.

**Recomendação:** Expose the zoom factor to the chrome (CSS var --ui-zoom set in applyZoomToBrowser) and use padding-left: calc(76px / var(--ui-zoom)); on zoom change call window.setWindowButtonPosition({x:12, y: round((TAB_HEIGHT*zoom-12)/2)}). Forward enter-full-screen/leave-full-screen to the chrome to drop the padding.

### F68 · No link-hover URL preview (status bar)

**Área:** UX & Recursos · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:1298`

**Evidência:** tabEvents() subscribes to before-input-event, page-title-updated, did-start/stop-loading, did-navigate(-in-page), did-fail-load, page-favicon-updated, context-menu — no 'update-target-url' listener; the chrome view has no status element.

**Recomendação:** Listen to `update-target-url` and send 'browser:target-url' to the chrome; render a small bottom-left pill. Since the chrome view only covers the top strip, either extend it full-height with a transparent body and pointer-events only on the pill, or add a second 24px WebContentsView anchored bottom-left shown while url is non-empty.

### F8 · Privileged internal views may navigate to any file:// URL while keeping the settings preload — ⚠️ verificação dividida

**Área:** Outros · **Esforço:** S · **Visível ao usuário:** não · **Local:** `src/main.js:1364`

**Evidência:** `if (tab.viewKind !== 'web' && !url.startsWith('file://')) { event.preventDefault(); ...}` — any file:// target (e.g. a downloaded HTML in Downloads) is allowed inside a view carrying settings-preload.js (window.zeosSettings/zeosExtensions with load-unpacked, clear-cookies, open-url).

**Recomendação:** Allow only the app's own pages: `const internalRoot = pathToFileURL(__dirname).href;` and preventDefault unless url starts with internalRoot + 'settings/'|'extensions/'|'favorites/'. Register `will-redirect` with the same rule. loadFile does not emit will-navigate so normal reloads are unaffected.

> Parecer (refuta): The guard at src/main.js:1364 is indeed looser than the comment implies (any file:// passes), but there is no reachable path to exercise it today. `will-navigate` only fires for content-initiated navigation, and the only content in privileged views is the app's own settings/extensions/favorites pages: every piece of untrusted data (extension name/description/id, history entries) is rendered via textContent; innerHTML is used only with static literals; the only anchors are href="#" with preventDefault. History entries and the "open web store" link go through zeosSettings.openUrl -> settings:open-url -> createWebTab -> navigate() -> ensureViewKind(tab,'web'), which swaps to a view WITHOUT settings-preload, so even a file:// history entry lands in an unprivileged view. Typing file:// in the address bar on an internal tab follows the same swap. The "downloaded HTML in Downloads" scenario has no link into it from any privileged page. So fixing it does not noticeably improve security for a single-user daily driver; the invariant "privileged pages only by user action" already holds via ensureViewKind + textContent rendering. Proportionate version (optional hygiene, ~3 lines, zero regression risk since loadFile does not emit will-navigate): replace `!url.startsWith('file://')` with a prefix check against `pathToFileURL(path.join(__dirname)).href + '/'`; the will-redirect handler is unnecessary because file:// loads do not redirect. Worth doing opportunistically if touching that block, not as a standalone item.

> Parecer (confirma): Confirmed. src/main.js:1362-1368 is the only navigation guard for privileged views (created at line 1227 with settings-preload.js) and it allows any file:// URL: `if (tab.viewKind !== 'web' && !url.startsWith('file://')) { event.preventDefault(); ... }`. No web-contents-created/will-redirect/will-frame-navigate/webRequest guard exists elsewhere in main.js. The internal pages themselves do not navigate via data (history rows use the openUrl IPC, anchors are href="#" + preventDefault, untrusted strings use textContent), but src/settings, src/extensions and src/favorites register no dragover/drop handlers (only src/ui/app.js does), so Chromium's default drop-to-navigate lets a user-dropped local .html (e.g. from Downloads) load into the privileged view; that navigation fires will-navigate with a file:// URL and passes the check. The foreign page then gets window.zeosSettings/window.zeosExtensions, whose IPC handlers (settings:update, settings:clear-cookies, extensions:remove/toggle-enable/reload, settings:open-url -> createWebTab where toNavigationTarget in src/navigation.js:13 accepts file:/chrome:/chrome-extension:) do no sender validation; did-navigate (line 1318) ignores non-web tabs so the address bar keeps showing zeos://settings. Recommended fix (allowlist pathToFileURL(__dirname) + settings/|extensions/|favorites/ prefixes; loadFile does not emit will-navigate) is sound. Severity medium: genuine invariant breach with a trivial fix, but the trigger requires a deliberate user drag-drop of an attacker-supplied local file and the impact is settings/extension/cookie tampering and tab spoofing, not Node access or RCE.

### F145 · Hyperlink auditing (<a ping>) and beacons are not blocked

**Área:** Privacidade · **Esforço:** S · **Visível ao usuário:** não · **Local:** `src/main.js:942`

**Evidência:** setupSession has no `webRequest.onBeforeRequest`; Chromium sends `<a ping=...>` POSTs and `navigator.sendBeacon` payloads (resourceType 'ping') to trackers on every click, in normal and private sessions alike.

**Recomendação:** In setupSession: `browserSession.webRequest.onBeforeRequest({ urls: ['<all_urls>'], types: ['ping'] }, (_d, cb) => cb({ cancel: true }))`. Default-on; optionally expose an advanced setting since it also drops sendBeacon.

### F148 · Every new tab performs a network request to start.duckduckgo.com

**Área:** Privacidade · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:1258`

**Evidência:** `createWebTab(url = settings.initialPage, activate = true)`; DEFAULT_SETTINGS.initialPage = HOME_URL (19) = 'https://start.duckduckgo.com/' (navigation.js:3). Ctrl+T, duplicate-empty, tear-off fallback and first launch all hit DDG (and receive its cookies) before the user types anything.

**Recomendação:** Add a local new-tab page (src/newtab/index.html, no preload, treated as viewKind 'web' so it can navigate to http/https) that only focuses the omnibox; keep initialPage as the *home* button target. Document that no request leaves the machine until the user navigates.

### F149 · Session restore eagerly loads every saved tab at startup (contacts all sites at once) and stores no title/favicon

**Área:** Privacidade · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:1074`

**Evidência:** `startupTabs.forEach((tab, index) => { const created = this.createWebTab(tab.url, index === restoredActiveIndex); …` — createTab → navigate → `loadURL(url)` (1293) for every restored tab, so 20 saved tabs mean 20 sites (and their trackers) hit at launch plus a CPU/RAM spike; saveSession (1675) persists only url/pinned/workspaceId so tabs show 'nova aba' until loaded.

**Recomendação:** Lazy restore: persist `title` and `favicon` per tab; for non-active restored tabs create the record with those values and `pendingUrl`/`lazy: true`, navigating only the active (and pinned) tabs; navigate others in selectTab()/cycle(). Keeps 'nem duplica nem perde abas' while making a 30-tab restore instant.

### F35 · Extension popup detaches from its anchor: chrome auto-hides while the popup (or a native context menu) is open

**Área:** UX & Recursos · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/ui/app.js:765`

**Evidência:** L765 `chrome.addEventListener('mouseleave', scheduleHide)`; scheduleHide L84-89 only checks omnibox focus and isPanelOpen(). Extensions toolbar lives in #omnibox-row (index.html L114), clipped when collapsed. main.js 1961-1986 popup is a separate alwaysOnTop BrowserWindow positioned from anchorBounds once.

**Recomendação:** Include `extensionPopupOpen` in browser:state and make scheduleHide/mouseleave respect it; on popup close, main sends state and the renderer runs scheduleHide. Alternatively have main's setExpanded(false) no-op while activeExtensionPopup exists. Same pin needed while native menus from showMenu are open.

### F106 · Linux AppImage lacks browser desktop integration (category, MimeType, StartupWMClass, icon sizes, maintainer)

**Área:** Release & CI · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `package.json:91`

**Evidência:** `"linux": { "target": ["AppImage"], "icon": "build/icons", "category": "Network" }` — build/icons contains only 512x512.png; no `desktop` block, so no MimeType=x-scheme-handler/http and Categories is just Network (not WebBrowser); package.json:6 `"author": "Thryki"` has no email (required by electron-builder for a future deb/rpm maintainer field).

**Recomendação:** Add linux.desktop.entry: { Categories: 'Network;WebBrowser;', MimeType: 'text/html;text/xml;application/xhtml+xml;x-scheme-handler/http;x-scheme-handler/https;', StartupWMClass: 'zeos-webbrowser', Actions for new/private window }. Generate 16/32/48/64/128/256/512 PNGs via the existing icons script; add `linux.synopsis`, `homepage`, and `author: {name, email}` (or `linux.maintainer`) so deb/rpm targets later are a one-line change.

### F116 · Artifact names inconsistent across OS and contain spaces

**Área:** Release & CI · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `package.json:48`

**Evidência:** No `artifactName` in the build block (35-104). README:101-105 documents the defaults: `Zeos Setup x.y.z.exe`, `Zeos x.y.z.exe` (portable, indistinguishable from installer), `Zeos-x.y.z-arm64.dmg`, `Zeos-x.y.z.dmg` (x64 unlabeled).

**Recomendação:** Set `build.artifactName: "${productName}-${version}-${os}-${arch}.${ext}"` plus `portable.artifactName` with `-portable` and `nsis.artifactName` with `-setup`. Stable, space-free, arch-explicit names (also what latest*.yml references for auto-update). Update the README table.

### F119 · macOS build has no hardened runtime/entitlements groundwork; unsigned arm64 shows as damaged

**Área:** Release & CI · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `package.json:89`

**Evidência:** package.json:89 `"identity": null` and release.yml:30 `CSC_IDENTITY_AUTO_DISCOVERY: "false"` skip signing entirely; no `hardenedRuntime`, `entitlements`, `gatekeeperAssess` or `notarize` keys. README:109-111 tells users to run `xattr -cr /Applications/Zeos.app`.

**Recomendação:** Prepare so signing is a secret-drop later: add `build/entitlements.mac.plist` (allow-jit, allow-unsigned-executable-memory, disable-library-validation), set `mac.hardenedRuntime: true`, `mac.entitlements`/`entitlementsInherit`, `mac.gatekeeperAssess: false`, `mac.notarize: true` gated on APPLE_* secrets, and replace `identity: null` with the env-driven default once a Developer ID exists.

### F69 · Tab views are created without plugins:true — verify built-in PDF viewer works

**Área:** Outros · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:1225`

**Evidência:** `const view = new WebContentsView({ webPreferences: { preload, partition: this.partition, contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true } });` — Electron's PDFium viewer is a plugin and historically requires `plugins: true`, otherwise a PDF link triggers will-download instead of rendering inline.

**Recomendação:** Add `plugins: true` to createView for kind==='web' and test with a direct .pdf URL; keep the download path as fallback via a 'Baixar' item.

### F102 · Window title stays 'zeos' — taskbar, Alt-Tab, Mission Control and Linux task lists never show the page

**Área:** Multiplataforma · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:1032`

**Evidência:** `new BrowserWindow({ ... title: this.privateMode ? 'zeos privado' : 'zeos', ... })`; page-title-updated (1302) only sets tab.title and sendState(); the only setTitle( in the file is the chrome.action polyfill stub (300).

**Recomendação:** Add syncWindowTitle() called from selectTab, closeTab, page-title-updated and did-navigate: `this.window.setTitle(`${active.title || active.url} — Zeos${privateMode ? ' (privado)' : ''}`)`. Keep 'zeos' as fallback for internal pages.

### F22 · attachTab lets tabs be dragged between private and normal windows: partition mismatch and private URL saved to session.json — ✅ verificado

**Área:** Privacidade · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:1595`

**Evidência:** attachTab iterates `for (const b of browsers)` with no `sourceBrowser.privateMode === this.privateMode` check, then `pageOwners.set(...); this.window.contentView.addChildView(tab.view)`; the target's `saveSessionSoon()` (1634) persists the private tab's URL. UI drops accept any window's tabId (app.js 665-668).

**Recomendação:** At the top of the cross-window branch: `if (sourceBrowser.privateMode !== this.privateMode) return;` (optionally open the URL as a new tab instead). Equivalent guard in the ui/app.js drop handler so the drag target shows 'not allowed'. Add a unit test for the invariant.

> Parecer (confirma): Confirmed in code: attachTab (src/main.js:1578-1638) locates the source tab across all `browsers` with no privateMode comparison, re-parents the view, and the target calls saveSessionSoon() (1634) whose saveSession() (1675) writes every 'web' tab URL to session.json. The drop handlers in src/ui/app.js (663-683) forward any tabId from dataTransfer, and the IPC handler (main.js:2008) does no check either. Consequences for a single daily user are real, not cosmetic: dragging a private tab onto a normal window persists its URL to disk (breaks the one guarantee private mode makes) and leaves a `temp:`-partition view living in a normal window; the reverse drag puts a persistent-partition tab inside a window titled 'zeos privado', so the user believes browsing is private when cookies/history are being written. This is core navigation infrastructure (Tabs/Windows), squarely in WebBrowser scope, and touches no CLAUDE.md invariant. The fix is proportionate: a two-line guard `if (sourceBrowser.privateMode !== this.privateMode) return;` before the cross-window branch (~line 1601). The optional UI 'not allowed' cursor and a unit test are nice-to-have but not required, since attachTab depends on Electron and would need extraction to test; the main-process guard alone closes the leak. Severity medium: low-frequency user action, but it silently defeats a stated privacy feature with a trivial fix.

> Parecer (confirma): Confirmed in current code. src/main.js attachTab (1578-1638) scans the global `browsers` Set (which contains both normal and private Browser instances, lines 52/1039) with no `sourceBrowser.privateMode === this.privateMode` check; only the same-window case (1595) is special-cased. Tab ids are globally unique (1268), so a normal window's attachTab resolves a private window's tab. The WebContentsView is reused as-is and its partition is fixed at createView (1228), so a `temp:` private view ends up hosted in a normal window (and a persistent-session view can end up in a 'zeos privado' window). The target then calls saveSessionSoon() (1634) and saveSession (1675) serializes every web tab URL to session.json, persisting the private URL to disk. UI (app.js 156-161 dragstart sets tabId in dataTransfer; drop handlers at 202-213, 663-670, 677-683) intentionally supports cross-window drops and forwards any tabId; preload.js:12 and the IPC handler at main.js:2008 add no validation. No tests reference attachTab or privateMode, and nothing else in the file mitigates it. Medium is the right severity: real private-mode privacy leak to disk, but requires deliberate local user drag action and is not remotely triggerable.

### F144 · No Global Privacy Control / DNT signal sent

**Área:** Privacidade · **Esforço:** S · **Visível ao usuário:** não · **Local:** `src/main.js:942`

**Evidência:** setupSession(browserSession) body: `setPermissionRequestHandler(...)` then `browserSession.on('will-download', ...)` — no `webRequest.onBeforeSendHeaders`, so requests carry neither `Sec-GPC: 1` nor `DNT: 1`.

**Recomendação:** In setupSession add `browserSession.webRequest.onBeforeSendHeaders({ urls: ['http://*/*','https://*/*'] }, (d, cb) => { d.requestHeaders['Sec-GPC'] = '1'; d.requestHeaders['DNT'] = '1'; cb({ requestHeaders: d.requestHeaders }); })`. Covers private windows since setupSession runs per partition. Settings toggle (default on); mention GPC in README.

### F150 · "Limpar dados de navegação" never clears cache/storage; only cookies (all) or history (by range)

**Área:** Privacidade · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:2108`

**Evidência:** `ipcMain.handle('settings:clear-cookies', async () => { await session.defaultSession.clearStorageData({ storages: ['cookies'] }); return true; });` — no clearCache(), no localStorage/indexedDB/serviceWorkers/cachestorage. README:51 claims "Limpeza fácil de cookies, cache e histórico por período".

**Recomendação:** Extend the modal with checkboxes (cookies, cache, site storage, history). Implement `clearCache()` + `clearStorageData({ storages: ['cookies','localstorage','indexdb','serviceworkers','cachestorage','websql','shadercache'] })` and `clearCodeCaches()`. Note in README that only history is range-based.

### F147 · Download records are process-global and unbounded: private-window downloads appear in normal windows and nothing is trimmed

**Área:** Privacidade · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:966`

**Evidência:** will-download (installed on every session incl. `temp:` partitions via setupSession(view.webContents.session) at 1237): `sessionDownloads.unshift(downloadRecord); broadcastDownloads();` — `const sessionDownloads = []` (84) is process-global, never trimmed (only the send slices to 30 at 928), and `activeDownloadItems` keeps growing; broadcastDownloads (934) sends the same summary to every browser, so private filenames appear in every window's Ctrl+J panel until quit.

**Recomendação:** Tag records with `private: true` (from pageOwners.get(source.id).privateMode or `!source.session.isPersistent()`) and filter them out of non-private windows' summaries; drop private records when the last private window closes. Cap the in-memory list (~200), dropping completed records beyond it. Optionally persist completed non-private records to downloads.json and ask for a save location in private mode.

### F114 · Tag and package.json version can diverge; no bump automation

**Área:** Release & CI · **Esforço:** S · **Visível ao usuário:** não · **Local:** `.github/workflows/release.yml:5`

**Evidência:** release.yml:5 `tags: ['v*']` is the only trigger; nothing compares `$GITHUB_REF_NAME` with package.json `"version": "1.1.0"`. electron-builder names assets and latest*.yml from package.json, so a `v1.2.0` tag on a 1.1.0 tree publishes 1.1.0 files under the v1.2.0 release.

**Recomendação:** Add a first step: `test "v$(node -p "require('./package.json').version")" = "$GITHUB_REF_NAME"` or fail. Optionally a `workflow_dispatch` input `bump: patch|minor|major` running `npm version $bump` and `git push --follow-tags`.

### F82 · Extension runner dirs live at a predictable path in os.tmpdir(): exposed to temp cleanup/shared-tmp races, tie extension ID to the temp path, re-copied serially on every startup, no orphan sweep — ✅ verificado

**Área:** Outros · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:499`

**Evidência:** `const hash = crypto.createHash('md5').update(sourceDir)...; const runnerDir = path.join(os.tmpdir(), 'zeos-ext-' + hash); if (fs.existsSync(runnerDir)) { fs.rmSync(...) } fs.cpSync(sourceDir, runnerDir, { recursive: true }); ... catch { return sourceDir; }` — hash is of the raw string (case/symlink-sensitive); files are read lazily from tmp all session (Storage Sense/Disk Cleanup can purge %TEMP%); Electron derives the unpacked extension ID from the loaded path so a tmpdir change or the sourceDir fallback yields a new ID and orphans chrome.storage.local; dirs are removed only in removeExtension (725), never swept.

**Recomendação:** Move runners to `app.getPath('userData')/extension-runners/<hash of fs.realpathSync(sourceDir)>` (update isRemovableRunnerDir + tests to accept that root; keep the 'never equals sourcePath' invariant). Skip rm+copy when a fingerprint (manifest version + file count/mtime) matches; use fs.promises.cp. Never silently fall back to loading sourceDir — fail and surface it on the card. Sweep stale runner dirs not in extensionRunnerMap at startup. Persist the Electron ID per sourcePath instead of showing a basename slug for disabled extensions (l.698).

> Parecer (confirma): Confirmed on value grounds, but only for a scoped-down version. Two parts pay off daily for one person: (1) startup cost — main.js:2265 awaits loadSavedExtensions() before the first window is created, and prepareExtensionRunnerDir (main.js:501-504) does a synchronous rmSync+cpSync of every enabled extension on every launch; with an adblocker-sized unpacked extension on NTFS under Defender this is a perceptible delay before the window appears, every single start. (2) tmp placement — runner files are read lazily by Chromium all session, and Windows Storage Sense/Disk Cleanup targets %TEMP%, so a purge mid-session breaks loaded extensions until restart. Neither contradicts CLAUDE.md: the sourcePath invariant is enforced by isRemovableRunnerDir's runner===sourcePath check independent of the root, and nothing here touches the upper Zeos layer. Proportionate fix: move the runner root to app.getPath('userData')/extension-runners (update isRemovableRunnerDir + the two tests to accept that root, keep the never-equals-sourcePath rule), and skip the rm+copy when a cheap fingerprint (manifest version + source mtime marker written into the runner) matches; make the sourceDir fallback log loudly or fail rather than silently load an un-polyfilled copy. Accept the one-time Electron ID change (path-derived) as a noted migration cost. Drop the orphan sweep, fs.promises.cp, and persisted-ID-for-disabled-cards items — cosmetic for a single user and not worth the extra surface.

### F30 · Settings page duplicates extension cards: overlapping loadExtensionsList() calls both append

**Área:** Correção · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/settings/settings.js:100`

**Evidência:** L100 `extensionsList.replaceChildren()` then L103 `await getAll()` then append. L162-166 remove: `await remove(); loadExtensionsList()`; L287-288 & L479-480 `renderSettings(updated)` (which calls loadExtensionsList at L344). main.js 242-246 removeHistoryItem also calls notifySettings() → onChanged → renderSettings. Both replaceChildren run before either getAll resolves, so cards render 2x.

**Recomendação:** Drop the explicit loadExtensionsList()/renderSettings(updated) calls (settings:changed already re-renders) or guard with a request token/`isLoading` flag and only apply the latest result.

### F162 · No schema version or migration; unknown keys are carried forever via spread

**Área:** Outros · **Esforço:** S · **Visível ao usuário:** não · **Local:** `src/main.js:96`

**Evidência:** loadSettings: `...copy(DEFAULT_SETTINGS), ...stored,` — any key ever written stays in settings.json indefinitely; no `version` field in settings.json, session.json (269) or workspaces.json (70), so renaming a key or changing history shape cannot be migrated safely.

**Recomendação:** Add `schemaVersion: 1` to each file and a small `migrate(stored)` chain per file. Build the loaded object from an allowlist of known keys rather than `...stored` (pairs with F87). Write the version on every save so a downgrade can detect a newer file and refuse to overwrite it.

### F163 · Restored window bounds are not validated against displays or shape, and maximized state is not persisted

**Área:** Dados & Sessão · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:269`

**Evidência:** readSession: `bounds: stored.bounds || DEFAULT_BOUNDS` with no type check; open() spreads it into `new BrowserWindow({ ...bounds, ... })` (1020-1021); saveSession stores `bounds: this.window.getBounds()` only (1675) — no `isMaximized`, no `screen.getDisplayMatching` (grep: `screen.` unused). A removed monitor leaves the window off-screen; a non-numeric width/height from a damaged file throws in the constructor and the whenReady catch quits the app.

**Recomendação:** Validate: all four fields finite integers, width/height ≥ minWidth/minHeight, else DEFAULT_BOUNDS; clamp/center via `screen.getDisplayMatching(bounds).workArea` when the intersection is too small. Save `{ bounds: getNormalBounds(), maximized: isMaximized() }` and call `window.maximize()` before show when true.

### F31 · Settings and extensions pages fully re-render (up to 2000 history <li> + extensions fetch) on every settings:changed, which fires on every navigation in any tab, clobbering unsaved input

**Área:** Correção · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/settings/settings.js:350`

**Evidência:** main.js 249-263 addHistory() ends with `notifySettings()` on every did-navigate. settings.js L350 `onChanged(renderSettings)`; L337 `initialPageInput.value = settings.initialPage || ''`; L343 renderHistory does `historyList.replaceChildren()` and builds ~8 nodes per item for up to 2000; L344 loadExtensionsList(). extensions.js 577-584 onChanged → loadExtensions() full grid rebuild.

**Recomendação:** Once main stops broadcasting history per visit (F43), make renderSettings incremental: only write control values when the field is not focused and the value changed; re-render history only when `history.length` or `history[0].visitedAt` changed, render the first ~150 items with a 'mostrar mais' button; have extensions.js reload only on an explicit extensions-changed signal.

### F49 · Boot waits for every extension to be rm+copied synchronously to tmpdir before the first window is created

**Área:** Performance · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:2265`

**Evidência:** whenReady: `await loadSavedExtensions(); new Browser(false, true);`; loadSavedExtensions awaits `loadPreparedExtension` sequentially (553-558); prepareExtensionRunnerDir does `fs.rmSync` + `fs.cpSync(sourceDir, runnerDir, {recursive:true})` on every launch (501-504) — main thread blocked, window not shown.

**Recomendação:** Create the Browser first (window shows with saved tabs), then load extensions with Promise.allSettled and let notifySettings refresh the toolbar. Skip the copy when the runner fingerprint is current; use `fs.promises.cp` (see F82).

### F21 · tearOffTab destroys the view and reloads by URL: loses history, form/scroll state, pinned flag, workspaceId, and private-session cookies

**Área:** UX & Recursos · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:1643`

**Evidência:** `const url = tab.url || settings.initialPage; this.closeTab(tabId); new Browser(this.privateMode, false, url, {...})` — closeTab calls `tab.view.webContents.close()` (1658); a private tear-off gets a fresh `temp:zeos-N` partition (1005) so logged-in state is gone.

**Recomendação:** Create the new Browser with no initial tab (or a placeholder), then move the live view with `newBrowser.attachTab(tabId)` — the path already used for cross-window drops — and close the placeholder. Propagate workspaceId; private tear-off must reuse the source partition.

### F66 · Middle-click/Ctrl+click links steal focus: window-open disposition ignored

**Área:** UX & Recursos · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:1354`

**Evidência:** `contents.setWindowOpenHandler(({ url }) => { if (url === 'about:blank' || /^https?:\/\//i.test(url)) { getOwner().createWebTab(url); } return { action: 'deny' }; });` — createWebTab(url) defaults activate=true.

**Recomendação:** Destructure `{ url, disposition }` and call createWebTab(url, disposition !== 'background-tab') so middle/Ctrl+click open behind the current tab; insert the new tab right after the opener (like 'Nova aba à direita', l.1716); 'new-window' → new Browser(this.privateMode, false, url). Keep the http(s)-only guard.

### F132 · getInstalledExtensions cache/invalidation has no regression test (fix shipped in v1.1.0)

**Área:** Testes & Qualidade · **Esforço:** M · **Visível ao usuário:** não · **Local:** `src/main.js:679`

**Evidência:** `if (installedExtensionsCache) return installedExtensionsCache;` (680) then `session.defaultSession.getAllExtensions()` (681) and sync `fs.readFileSync(...manifest.json)` for disabled entries (696). invalidateExtensionsCache() is called at 540, 731, 759, 777, 797 — every call site hand-maintained.

**Recomendação:** Move the registry into src/extension-utils.js as `createExtensionRegistry({listLoaded, readManifest, settings, sourceMap})` returning {get, invalidate}. Tests: second get() returns the same array without calling listLoaded; invalidate() forces refresh; disabled path appears once with enabled=false; missing manifest skipped; loaded ext in sourceMap reports the source path, not the runner.

### F133 · Downloads IPC path validation and summary math untested

**Área:** Testes & Qualidade · **Esforço:** S · **Visível ao usuário:** não · **Local:** `src/main.js:2015`

**Evidência:** `const isTrackedDownloadPath = (p) => typeof p === 'string' && sessionDownloads.some(d => d.savePath === p);` (2015) closes over module state. getDownloadsSummary (913-930) has the `activeCount > 0 ? 50 : 100` fallback and `slice(0, 30)`; neither has a test.

**Recomendação:** Extract `isTrackedDownloadPath(downloads, p)` and `summarizeDownloads(downloads)` into src/downloads-utils.js. Tests: non-string/object/array rejected; `..` segments or trailing slash rejected (strict equality); percent = round(received/total) across only 'progressing' items with total>0; 50 when active but unknown total; 100 idle; items capped at 30; cancelled/done excluded from activeCount.

### F134 · clearHistoryRange untested and its threshold table is duplicated (inverted) in settings.js

**Área:** Testes & Qualidade · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:220`

**Evidência:** main.js keeps `item.visitedAt < threshold` per range, unknown range → `settings.history = []` (234-235), '30d'||'4w' alias (231). settings.js filterHistoryItems (183-195) re-declares the same 4 thresholds with `>= threshold` and no '4w'. Two copies, zero tests.

**Recomendação:** Create src/history.js exporting `HISTORY_RANGES` and `pruneHistory(history, range, now)` / `filterHistory(history, range, query, now)`; guard with `if (typeof module !== 'undefined') module.exports = ...` so settings/index.html can load it via <script>. Tests with injected `now`: each boundary, '4w' alias, missing visitedAt treated as 0, unknown range wipes all, removeHistoryItem exact-url match.

### F95 · No lint/format tooling; `check` script is a hand-maintained file list — the shipped 'crypto/os used without import' bug is exactly what no-undef catches

**Área:** Outros · **Esforço:** S · **Visível ao usuário:** não · **Local:** `package.json:22`

**Evidência:** `"check": "node --check src/main.js && node --check src/navigation.js && ..."` (9 files by hand; a new module is silently unchecked; syntax-only). No eslint.config.js/.prettierrc/.editorconfig; ci.yml runs only check + test. Baseline: 'crypto/os usados sem import em main.js:609-610 — polyfill nunca injetado'.

**Recomendação:** Add eslint (devDependency only) flat config with @eslint/js recommended + `globals`: node for src/main.js, preloads, navigation/themes/extension-utils, test/; browser for src/ui|settings|extensions|favorites. Enable no-undef, no-unused-vars, no-empty, eqeqeq; add prettier --check and .editorconfig. Replace `check` with `eslint . && node --test`, gate lint in ci.yml. Decomposition (F85) then gets a safety net per commit.

### F73 · Extension popup toggle is broken: blur closes it, then the same click reopens it; clicking another icon never opens the other popup

**Área:** UX & Recursos · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:1930`

**Evidência:** `if (activeExtensionPopup && !activeExtensionPopup.isDestroyed()) { activeExtensionPopup.close(); activeExtensionPopup = null; return; }` but the popup's `on('blur')` (1981-1986) already closed it and set `activeExtensionPopup = null` when the user mousedowned on the chrome, so the guard never fires and the popup reopens.

**Recomendação:** Record `lastPopupClosedAt`/`lastPopupExtId` in the blur handler (same pattern as `lastMenuClosedAt`, l.1683) and in openExtensionAction ignore a click for the same extension within ~250 ms of close; for a different extension open its popup immediately.

---

## BAIXO (29)

### F70 · Tab strip: tabs shrink to 36px with no scroll/search; focus rings removed globally; tabs lack aria-selected

**Área:** UX & Recursos · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/ui/app.css:30`

**Evidência:** `button, input { font: inherit; border: 0; outline: 0; ...}` (no :focus-visible rule) — `.tabs-list { overflow: hidden; } .tab { flex: 1 1 180px; min-width: 36px }` — app.js:113 overflow button only when scrollWidth > clientWidth or tabs > 8; app.js:126 role='tab' without aria-selected.

**Recomendação:** Add `:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px }`; set aria-selected/aria-controls and ArrowLeft/Right + Home/End navigation in the tablist. Enforce a min tab width (~100px), let .tabs-list scroll horizontally (wheel → scrollLeft) with the overflow button always shown; make the overflow menu a searchable tab list (Ctrl+Shift+A).

### F166 · No export/import or automatic backup of user data

**Área:** Outros · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/settings/settings.js:390`

**Evidência:** The settings page exposes only zoom reset, history clear/remove, and cookie clear; grep for export/import/backup in src/settings returns nothing. All state (theme, extensions list, history, workspaces) sits in three files with no user-facing way to save or move it.

**Recomendação:** Add 'Exportar dados' / 'Importar dados' in Configurações using dialog.showSaveDialog/showOpenDialog in main (user action only, validate schemaVersion on import). Pair with the `.bak` rotation from F156 and a 'Abrir pasta de dados' button (`shell.openPath(app.getPath('userData'))`).

### F120 · CI workflow lacks minimal permissions, concurrency group and Electron cache

**Área:** Release & CI · **Esforço:** S · **Visível ao usuário:** não · **Local:** `.github/workflows/ci.yml:8`

**Evidência:** ci.yml:1-19 has no `permissions:` block and no `concurrency:`; both workflows cache only npm (`cache: npm`) so every release runner re-downloads Electron zips for x64+arm64.

**Recomendação:** Add `permissions: contents: read` and `concurrency: {group: ci-${{ github.ref }}, cancel-in-progress: true}`. In release.yml add actions/cache for `~/.cache/electron` and `~/.cache/electron-builder` (Windows: `~\AppData\Local\electron\Cache`) keyed on package-lock hash. Consider pinning actions to SHAs.

### F53 · Toolbar/menu paths call getExtensionDetails() directly, bypassing the cache and re-reading/base64-encoding the icon from disk on every click

**Área:** Performance · **Esforço:** S · **Visível ao usuário:** não · **Local:** `src/main.js:1939`

**Evidência:** openExtensionAction: `const details = getExtensionDetails(ext);` (1939); showExtensionMenu 1853, extensions:open-options 2072, inspectBackground 859 do the same. getExtensionDetails does fs.existsSync per icon candidate and `fs.readFileSync(fullPath).toString('base64')` (607-616).

**Recomendação:** Look the extension up in `getInstalledExtensions()` (cached) by id; or add an `includeIcon` flag so menu/action paths skip icon encoding. Cache manifests per sourcePath and invalidate in invalidateExtensionsCache().

### F42 · Downloads button disappears the instant a download finishes in 'active-only' mode; panel can't be closed by clicking the page

**Área:** UX & Recursos · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/ui/app.js:385`

**Evidência:** L385 `downloadButton.style.display = (hasActive || isPanelOpen()) ? 'flex' : 'none'`; handleDownloadsUpdate (L499-505) runs on every update, and main 985-994 marks 'completed' then broadcasts. L719-723 outside-click close only sees clicks inside the chrome view.

**Recomendação:** Keep the button visible while the session has recent completed items (until the user opens the panel or dismisses), matching Chrome's tray. Close the panel from main on page focus (`focus` on the active tab's webContents → send close).

### F97 · Boilerplate repeated: settings snapshot x6, zeosExtensions duplicates zeosSettings.extensions verbatim, 3 ad-hoc id generators, inline requires

**Área:** Arquitetura · **Esforço:** S · **Visível ao usuário:** não · **Local:** `src/settings-preload.js:36`

**Evidência:** `{ ...copy(settings), themes: THEMES }` at main.js 164, 217, 239, 246, 2094, 2097. settings-preload.js 14-28 and 36-50 expose the same 13 functions twice. Ids via `${Date.now()}-${Math.random().toString(36)...}` at 950, 1268, 2121. `require('electron')` inside functions at 812, 843, 1376.

**Recomendação:** Add `settingsSnapshot()`. In settings-preload.js define `const extensionsApi = {...}` once and reuse (or drop `zeosExtensions`). Use `crypto.randomUUID()` for ids. Hoist `webContents`/`clipboard` into the top-level electron destructure.

### F36 · Extensions page toasts announce success even when the IPC returned false

**Área:** Arquitetura · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/extensions/extensions.js:193`

**Evidência:** L193-194 `await remove(ext.id); showToast('Extensão "..." removida.')`; L206-207 reload → 'recarregada'; L225-226 toggleEnable → 'ativada/desativada'. main.js returns false at 738, 745, 762, 784; inspectBackground/openOptions/showInFolder also return false with no feedback (L160, 511, 519).

**Recomendação:** Check the boolean: `const ok = await ...; showToast(ok ? 'Extensão removida.' : 'Não foi possível remover a extensão.')`. For the toggle, revert `toggleInput.checked` on failure and disable the switch while awaiting. Surface false from inspectBackground/openOptions/showInFolder with a toast.

### F12 · All extensions are loaded with allowFileAccess: true (content scripts read file:// pages) — ⚠️ verificação dividida

**Área:** Extensões · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:537`

**Evidência:** `const ext = await session.defaultSession.loadExtension(runnerPath, { allowFileAccess: true });` — applied unconditionally to every unpacked extension, whereas Chrome defaults 'Allow access to file URLs' to off per extension.

**Recomendação:** Default to `allowFileAccess: false` and expose a per-extension toggle in the extensions page (persist in settings, reload the extension on change). sourcePath invariant untouched — only loadExtension options change.

> Parecer (refuta): Confirmed the code: src/main.js:537 passes `allowFileAccess: true` unconditionally, and file:// is typable in the omnibox (src/navigation.js:13), so content scripts with `<all_urls>` could run on local pages. But the value for a single-user daily driver is negligible. Extensions here are only ever sideloaded by the user from folders they chose (settings.extensions are local paths — no store, no auto-install); they are already trusted code with full host access to every http/https page, including banking sessions. Adding file:// pages to that surface is a marginal increment, and only when the user deliberately opens a local file. Chrome's per-extension default-off makes sense against a large ecosystem of third-party store extensions; that threat model does not exist in this browser. Meanwhile, flipping the default to false silently breaks a real dev use case: devtools-style extensions (React/Vue DevTools) on file:// HTML — Electron's docs call out `allowFileAccess` as required precisely for that. The recommended fix (per-extension persisted toggle, extensions-page UI, reload-on-change plumbing) is effort M for a cosmetic parity gain — disproportionate. Not an invariant conflict (sourcePath untouched, no sandbox change) and not upper-layer, so it fails on value/proportionality grounds, not scope. Proportionate version if ever wanted: keep current behavior and, at most, expose a single global `extensions.allowFileAccess` setting (default true) read at line 537 — one line plus one checkbox, no per-extension state.

> Parecer (confirma): Confirmed. src/main.js:537 reads exactly `const ext = await session.defaultSession.loadExtension(runnerPath, { allowFileAccess: true });` inside `loadPreparedExtension()`, which is the single path used by both `loadSavedExtensions()` (line 558) and the reload flow, so every unpacked extension gets file:// access unconditionally. No per-extension toggle or setting exists anywhere (grep for allowFileAccess/fileAccess/file-access across src/ hits only this line; settings.js and extensions.js have nothing). Electron's and Chrome's default for this option is false. Impact is somewhat larger than "Chrome parity": the browser lets users open file:// URLs (navigation.js:13 accepts `file:` as a valid protocol), and more importantly the privileged internal pages (settings/favorites/extensions via `loadFile` at lines 1290-1292, 1470-1494) and the chrome UI (line 1055) are file:// documents on the default session (createView uses `partition: this.partition`, undefined for non-private windows), the same session extensions are loaded into. So any installed extension declaring `<all_urls>` or `file:///*` content_scripts gets injected into the browser's own privileged UI pages, where it can drive the DOM that calls `window.zeosSettings`/`window.zeosExtensions` IPC. Mitigated by the fact that extensions are user-installed unpacked folders and content scripts run in an isolated world, hence medium rather than high. Fix per recommendation is valid and does not touch the sourcePath invariant.

### F110 · Extension source paths compared as raw strings (case/realpath) — duplicates on case-insensitive filesystems

**Área:** Extensões · **Esforço:** S · **Visível ao usuário:** não · **Local:** `src/main.js:660`

**Evidência:** `if (!settings.extensions.includes(extPath)) settings.extensions.push(extPath); ... filter(p => p !== extPath)` (663, 721, 753). 'C:\Ext' and 'c:\ext' (or a symlinked folder) count as two extensions with two runner dirs.

**Recomendação:** Normalize once at entry points (loadUnpackedExtension, loadSavedExtensions): `const key = fs.realpathSync.native(extPath)`; on win32/darwin compare with a case-folded `samePath(a,b)`. Store the normalized path in settings; never touch sourcePath on disk (only comparisons change).

### F84 · Localized manifests render raw __MSG_*__ placeholders in toolbar and cards

**Área:** UX & Recursos · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:632`

**Evidência:** `name: manifest.name || ext.name || 'Extensão', ... description: manifest.description || ext.description` — raw manifest wins over Electron's localized ext.name, and the disabled-extension path (696-704) reads manifest.json straight from disk, so uBO/Bitwarden/Dark Reader show '__MSG_extName__'.

**Recomendação:** In getExtensionDetails resolve `__MSG_key__` in name/description/short_name/action.default_title by loading `_locales/<app.getLocale() → language → default_locale>/messages.json` (with `$placeholders$`), preferring `ext.name`/`ext.description` when Electron already localized. Cache per extension path.

### F112 · UI, menu and dialog strings hard-coded in Portuguese across main process and pages; no strings module, app.getLocale() unused

**Área:** UX & Recursos · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:652`

**Evidência:** `title: 'Selecionar pasta da extensão descompactada do Chrome (contendo manifest.json)'`; 668 showErrorBox('Erro ao carregar extensão'…); menu labels 'Nova aba', 'Nova janela privada' (1687-1698, 1716-1737, 1751-1846); 'Extensão' default name (632); 'Arquivo não encontrado' returned from IPC (2020); 1265 'configurações'/'favoritos'/'nova aba'; ui/index.html:65 aria-label="Minimizar"; one Portuguese comment (2177) amid English; tests titled in Portuguese (workspaces.test.js:56).

**Recomendação:** Create src/strings.js (pure, testable) with a pt-BR table (`STR.menu.newTab`, `STR.errors.fileNotFound`) and an en fallback keyed by id, selected via app.getLocale() and exposed read-only to chrome/internal pages via the preloads. Return error codes from IPC (`{ ok:false, code:'not-found' }`) and let renderers map codes to text. Migrate main.js dialogs/menus first. Standardize comments/tests in English via a CLAUDE.md note.

### F55 · System stats interval runs getAppMetrics every 2.5s even when both pills are hidden or the window is minimized

**Área:** Outros · **Esforço:** S · **Visível ao usuário:** não · **Local:** `src/main.js:2270`

**Evidência:** `setInterval(() => { const stats = getSystemStats(); for (const browser of browsers) ... send('browser:system-stats', stats) }, 2500)` — no check of settings.navbarButtons.showCpu/showRam or window visibility.

**Recomendação:** Skip the tick when `!showCpu && !showRam` or no browser window is visible/focused (`isMinimized() || !isVisible()`); resume on 'focus'/'show'. Consider 5s — the pills are informational.

### F14 · Several privileged IPC handlers accept unvalidated types (workspaces, tab state/metrics, inspect-background substring match) — ❌ refutado na verificação

**Área:** Segurança · **Esforço:** S · **Visível ao usuário:** não · **Local:** `src/main.js:2137`

**Evidência:** `ipcMain.handle('workspaces:rename', (_event, { workspaceId, newName }) => { ... ws.name = newName;` (any type/length, persisted); same for create name/icon (2120), tab:set-state (2207), tab:set-metrics cpu/memory (2221). inspectBackground: `return u && u.includes(extensionId)` (848) — an empty/short id matches the first web tab and opens DevTools on it.

**Recomendação:** Add a tiny validator layer: names/icons strings ≤ 64 chars (trim), state ∈ enum, cpu/memory finite numbers ≥ 0, extensionId /^[a-p]{32}$/ and webContents URL must start with `chrome-extension://${id}/`. Destructure with defaults (`= {}`) so malformed payloads cannot throw inside handle.

> Parecer (refuta): The handlers are only reachable from app-owned code. Web tabs are created with no preload plus sandbox:true/contextIsolation:true (src/main.js:1223-1233), and extension popups likewise have no preload (1972-1977), so remote content and extensions have no ipcRenderer at all. The only senders are src/preload.js (the chrome UI) and src/settings-preload.js (internal pages reachable only by user action). In practice: workspace name/icon come from the user's own typed input in the chrome; `extensions:inspect-background` is invoked exclusively with `ext.id` from `getAllExtensions()` (src/extensions/extensions.js:160), which is always a valid 32-char Chromium id, so the "empty id opens DevTools on a web tab" scenario requires the app's own UI to misbehave; `tab:set-metrics` has no producer yet (src/ui/app.js:332). A malformed payload throwing inside `ipcMain.handle` just rejects the invoke promise, it does not crash main. A validator layer here defends the app against itself and yields no noticeable gain in security, privacy, robustness, or daily UX for a single user. Proportionate version, if touched as a drive-by while editing these lines: add `= {}` defaults to the destructured params and change `u.includes(extensionId)` to `u.startsWith(`chrome-extension://${extensionId}/`)`; not worth tracking as its own item.

### F96 · Magic numbers scattered: zoom bounds in 7 places, `|| 100` fallback 13 times, fabricated RAM floor

**Área:** Arquitetura · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:127`

**Evidência:** Zoom clamp 50/200/step 10 at 192, 1441, 1447, 1914, 1918 and settings.js:382, 387; `zoomLevel || 100` at 13 lines. getSystemStats: `|| 280` (128) and `Math.max(120, ramMB)` (131) invent a memory figure shown in the RAM pill. Also 2000 (103, 261), 250/300 ms debounces, 520 panel height, 380/520 popup, 3000/500 timeouts.

**Recomendação:** Add src/constants.js (ZOOM {MIN,MAX,STEP,DEFAULT}, HISTORY_LIMIT, debounce ms, POPUP_SIZE, DOWNLOADS_PANEL_HEIGHT) and a `zoomFactor()` helper. Replace the fabricated RAM floor with an honest value (or '—' when metrics are unavailable).

### F56 · 9 MB source logo tracked in git under src/assets; excluded from the asar but inflates every clone/CI checkout

**Área:** Release & CI · **Esforço:** S · **Visível ao usuário:** não · **Local:** `package.json:40`

**Evidência:** build.files: `["src/**/*", "package.json", "!src/assets/zeos-logo.png"]` — exclusion is correct, but `git ls-files` tracks src/assets/zeos-logo.png (9,023,831 bytes) next to the 89 KB zeos-logo-512.png actually used (main.js 1031).

**Recomendação:** Move the master artwork out of src (e.g. `design/zeos-logo.png` or build/, already buildResources) so the `src/**/*` glob never risks including it; drop the negative pattern; update the `icons` script path. Optional: git LFS.

### F111 · Windows Smart App Control guidance is wrong: 'Run anyway' does not exist under SAC; unsigned portable exe is blocked outright

**Área:** Release & CI · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `README.md:108`

**Evidência:** README: '**Windows:** o SmartScreen pode alertar ... clique em **Mais informações → Executar assim mesmo**'; release.yml:30 CSC_IDENTITY_AUTO_DISCOVERY: "false"; package.json:57 ships an unsigned 'portable' target which SAC blocks with no override.

**Recomendação:** Plan Azure Trusted Signing (or SignPath OSS) in release.yml via electron-builder's win.azureSignOptions; until then document that SAC (Win11 clean installs) has no bypass except turning SAC off permanently, and point users to the NSIS installer + published sha512 from latest.yml. On macOS at least ad-hoc sign (identity '-') so arm64 doesn't 'Killed: 9'.

### F124 · NSIS installer uses bare defaults (no language, shortcut name, publisher)

**Área:** Release & CI · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `package.json:65`

**Evidência:** package.json:65-69 `nsis: {oneClick: true, perMachine: false, deleteAppDataOnUninstall: false}` only; no `installerLanguages`, `shortcutName`, `nsis.include`, and no `win.publisherName`/`verifyUpdateCodeSignature`.

**Recomendação:** Add `nsis.installerLanguages: ["pt_BR","en_US"]`, `nsis.shortcutName: "Zeos"`, `nsis.runAfterFinish: true`, `win.publisherName` (needed for updater signature checks), and `nsis.include` for the default-browser registry keys (F118). Keep per-user + oneClick.

### F108 · No taskbar/dock download progress (setProgressBar never called)

**Área:** Multiplataforma · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:932`

**Evidência:** `function broadcastDownloads() { const summary = getDownloadsSummary(); for (const browser of browsers) { browser.sendState(); ...send('browser:downloads-updated', summary); } }` — summary already carries overallPercent/activeCount, but no setProgressBar in the file.

**Recomendação:** In broadcastDownloads call `window.setProgressBar(summary.activeCount ? summary.overallPercent/100 : -1)` per browser; clear (-1) on 'done'/'cancelled'. Lights Windows taskbar, macOS dock and Unity/KDE launchers.

### F109 · No launcher quick actions: dock menu (mac), jump list (win), desktop actions (linux); no File menu on macOS

**Área:** Multiplataforma · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/main.js:2256`

**Evidência:** `if (process.platform === 'darwin') { Menu.setApplicationMenu(Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'windowMenu' }])); }` — no app.dock.setMenu, no app.setUserTasks; only a File-less menu.

**Recomendação:** Add 'Nova janela' / 'Nova janela privada' as app.dock.setMenu on darwin, app.setUserTasks (args '--new-window' / '--private') on win32 once argv parsing exists (F118), and desktop Actions in the Linux entry. Add a 'File' menu on macOS so Cmd+T/W/N appear in the menubar and work with no window focused.

### F39 · Preload passes the raw IpcRendererEvent into page handlers for two channels

**Área:** Outros · **Esforço:** S · **Visível ao usuário:** não · **Local:** `src/preload.js:28`

**Evidência:** L28-31 `onFocusOmnibox: (handler) => { ipcRenderer.on('browser:focus-omnibox', handler); ...}` and L42-45 onToggleDownloads register the page's handler directly, unlike onState/onDownloadsUpdated which wrap `(_event, x) => handler(x)`.

**Recomendação:** Wrap these two like the others: `const listener = () => handler(); ipcRenderer.on(ch, listener); return () => ipcRenderer.removeListener(ch, listener);`. Never hand the event object (sender/ports) to the isolated world; keeps unsubscribe semantics identical.

### F151 · WebRTC IP handling policy left at Chromium default (VPN/private-window leak)

**Área:** Privacidade · **Esforço:** S · **Visível ao usuário:** não · **Local:** `src/main.js:1236`

**Evidência:** createView: `view.webContents.setZoomFactor(zoomFactor); setupSession(view.webContents.session); return view;` — no `setWebRTCIPHandlingPolicy`; grep for WebRTC/ipHandling returns nothing. Default enumerates all interfaces (non-VPN public interface can be exposed via STUN).

**Recomendação:** In createView call `view.webContents.setWebRTCIPHandlingPolicy('default_public_interface_only')` (or 'disable_non_proxied_udp' for private windows). Expose as a privacy setting; document the trade-off.

### F125 · Local `npm run release` can publish unsigned dev builds to the public GitHub release

**Área:** Release & CI · **Esforço:** S · **Visível ao usuário:** não · **Local:** `package.json:28`

**Evidência:** package.json:28 `"release": "electron-builder --publish always"` — with `releaseType: release` and a GH_TOKEN in the environment this uploads from any developer machine into the same release CI targets, racing/overwriting CI assets.

**Recomendação:** Remove the script or change it to `--publish never` and document that releases are produced only by tagging (`git push --follow-tags`). `pack`/`dist:*` already cover local dry-runs.

### F121 · Node requirement (>=22) for the test glob is implicit: no engines field or .nvmrc

**Área:** Outros · **Esforço:** S · **Visível ao usuário:** não · **Local:** `package.json:22`

**Evidência:** package.json:22 `"test": "node --test test/**/*.test.js"` relies on Node 22's built-in glob (CLAUDE.md: 'exige Node ≥ 22'); no `engines` field, no `.nvmrc`; CI pins node-version: 22 while the baseline was measured on Node 24.19.0. A contributor on Node 20 gets a confusing 'no tests found'.

**Recomendação:** Add `"engines": {"node": ">=22"}`, a `.nvmrc`/`.node-version` containing `22`, `engine-strict=true` in `.npmrc`; switch `setup-node` to `node-version-file` in both workflows. Optionally simplify to `node --test` (auto-discovers on 22+) and add `test:watch`; consider a small CI matrix (22, 24).

### F27 · No render-process-gone / unresponsive handling: a crashed tab stays blank and a crashed chrome renderer leaves the window dead

**Área:** Outros · **Esforço:** M · **Visível ao usuário:** sim · **Local:** `src/main.js:1056`

**Evidência:** `this.chrome.webContents.once('did-finish-load', () => { ... this.sendState(); })` — one-shot; grep for `render-process-gone|unresponsive|crashed` in src/main.js returns nothing. sendState (1192) reads `active?.view.webContents.navigationHistory` without the isDestroyed guard stateFor uses (1174).

**Recomendação:** On tab views handle `render-process-gone` → `tab.title = 'aba travou'`, `tab.loading = false`, sendState and offer reload; handle `unresponsive`/`responsive` with a hint. For the chrome view, on render-process-gone call `reload()` and switch `once('did-finish-load')` to `on`. Guard sendState's navigationHistory access with isDestroyed.

### F41 · Developer-mode toggle/toolbar hardcoded on: visible flash when developerMode is false

**Área:** Outros · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/extensions/index.html:38`

**Evidência:** L38 `<input id="dev-mode-toggle" type="checkbox" checked />`; L45 `<div id="dev-toolbar" class="dev-toolbar">` has no initial display:none. extensions.js 569-574 only corrects them after the async `zeosSettings.get()` resolves.

**Recomendação:** Remove `checked` and start the toolbar hidden (`hidden` attribute), then apply `developerMode` from settings.get(). Optionally disable the toggle until the first settings response.

### F136 · Omnibox parser edge cases are unlocked by tests; 'about:blank' becomes a search

**Área:** Testes & Qualidade · **Esforço:** S · **Visível ao usuário:** sim · **Local:** `src/navigation.js:21`

**Evidência:** Verified live: 'about:blank' → search (protocol regex at 21 needs '//', so about: in isNavigableProtocol at 13 is unreachable); 'file.txt' → https://file.txt/; 'http://' → search; 'javascript:x', 'ftp://x.com/', '256.1.1.1', 'example.com:99999' → search; 'chrome://gpu' → url.

**Recomendação:** Add a table-driven test in test/navigation.test.js locking each outcome. Fix the about: gap by matching `/^about:/i` before the '//' check (setWindowOpenHandler already allows about:blank). Add a test that toNavigationTarget('zeos://nope') returns type 'url' so main.js's `/^zeos:/i` fallback (1504) is reachable.

### F137 · isRemovableRunnerDir lacks tests for the symlink case it was just fixed for, and one test hardcodes a Windows path

**Área:** Testes & Qualidade · **Esforço:** S · **Visível ao usuário:** não · **Local:** `test/extensions.test.js:93`

**Evidência:** `const source = 'C:\\Users\\someone\\extensions\\my-ext';` (93) — on ubuntu CI this only passes because path.resolve makes it relative. The parent-realpath branch (extension-utils.js:133, commit 08b979a) and the 'runner is a symlink to sourcePath' case have no test.

**Recomendação:** Use `path.join(os.homedir(), 'my-ext')`. Add: (a) symlinked tmpdir — tmp/real/zeos-ext-x and tmp/link → real, removable via the link and non-removable when sourcePath is the link target; (b) tmp/zeos-ext-x that is itself a symlink to the source dir → false; (c) nested `tmp/zeos-ext-x/sub` → false; (d) empty/undefined runnerPath → false.

### F138 · settings.test.js tests themes, not settings; theme catalog invariants missing

**Área:** Testes & Qualidade · **Esforço:** S · **Visível ao usuário:** não · **Local:** `test/settings.test.js:16`

**Evidência:** File only asserts SEARCH_PROVIDERS keys (8-14) and per-theme appearance keys (16-26), overlapping themes.test.js. Neither asserts `theme.appearance.themeId === theme.id`, unique ids, valid `#rrggbb`, or that `font` is in FONTS (which lives in main.js:16, unreachable from tests).

**Recomendação:** Fold into themes.test.js and reserve settings.test.js for the settings-model extraction (F87). Add: ids unique; appearance.themeId matches id; every color matches /^#[0-9a-f]{6}$/i; THEMES.length === 16; getTheme(undefined)/'' return orca; export FONTS from themes.js and assert each theme.font is included.

### F28 · Workspace persistence gaps: ws.tabs never populated, window workspaceId never saved, associate-workspace doesn't save session, tab:set-state/set-metrics/switch rewrite workspaces.json for nothing

**Área:** Outros · **Esforço:** M · **Visível ao usuário:** não · **Local:** `src/main.js:1064`

**Evidência:** open(): `if (this.workspaceId) { const ws = getWorkspace(...); if (ws && ws.tabs && ws.tabs.length > 0) startupTabs = ws.tabs...` but nothing ever writes `ws.tabs` (create sets `tabs: []`, 2128) so the branch is dead while `history`, `activeTabId`, `metadata` (2128-2131) are written unused; workspaces:switch only sets `browser.workspaceId` in memory (2180) and startup uses `new Browser(false, true)` with workspaceId null; tab:associate-workspace calls `saveWorkspaces()` but not `browser.saveSessionSoon()` (2196-2199); tab:set-state (2213), tab:set-metrics (2231) and workspaces:switch (2183) call saveWorkspaces() → sync writeFileSync though nothing they touch is serialized — a trap once 2.5s per-tab metrics polling lands.

**Recomendação:** Keep Tab.workspaceId in session.json as the single source of truth (per invariant) and remove the dead `ws.tabs` restore branch; persist the window's `workspaceId` in the per-window session entry and pass it to `new Browser` on restore (validate it still exists); call `browser.saveSessionSoon()` in tab:associate-workspace and workspaces:delete; drop saveWorkspaces() from set-state/set-metrics/switch and add a debounced `saveWorkspacesSoon()` for create/rename/icon/delete. Trim unused workspace fields.

---

_Restrições respeitadas na auditoria: nada de LLM/agentes/MCP (camada superior do Zeos, ver ROADMAP.md);
invariantes do CLAUDE.md preservados; correções já entregues na v1.1.0 não foram re-reportadas._
