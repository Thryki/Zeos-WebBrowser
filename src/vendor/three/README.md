# three.js (vendored)

three.js r184 — MIT License, © 2010-2026 three.js Authors — <https://threejs.org>

## Why it is here

Internal pages load over `file://`, and the packaged app must work offline, so
three.js ships inside `src/` instead of being fetched or bundled. ES modules do
load from `file://` in Electron's renderer, which is what makes this possible
without adding a bundler to the project.

Pages consume it through an import map:

```html
<script type="importmap">
{ "imports": { "three": "../vendor/three/three.module.min.js",
               "three/addons/": "../vendor/three/addons/" } }
</script>
```

## Contents

- `three.module.min.js` + `three.core.min.js` — the minified build pair. The
  first imports the second by name, so both must keep their filenames.
- `addons/` — only the example modules actually imported, plus their transitive
  imports, in the same tree shape as `three/examples/jsm` so their relative
  imports keep resolving: OrbitControls, EffectComposer (with Pass and
  MaskPass), RenderPass, ShaderPass, CopyShader, OBJLoader, GLTFLoader,
  BufferGeometryUtils, SkeletonUtils.

## Refreshing

`three` is a devDependency pinned to the vendored version. Bump it, then re-copy
`build/three.module.min.js`, `build/three.core.min.js` and the addon closure
from `node_modules/three`. Do not hand-edit anything in this directory.
