# Deployment Route Integrity

SvelteKit server node files are index-based. A manifest from one build must never be overlaid on node files from another build.

## Build

`npm run build` removes `.svelte-kit` and `build`, produces one clean output, and runs the route-boundary verifier. Set `APP_BUILD_ID` to an immutable release identifier such as a commit SHA or image digest.

The resulting `@sveltejs/adapter-node` server starts with `npm start`. Set `NODE_ENV=production`, the externally visible `ORIGIN`, and the private/public API bases before promotion.

## Release

Build into a new release directory or container image. Do not copy a new `.svelte-kit/output` over a running or previous release. Start all instances from the same artifact, verify the `x-osimi-build-id` response header, then switch traffic atomically. Rollback switches traffic to the previous complete artifact rather than restoring individual generated files.

After any route graph change during development, stop Vite, run `npm run clean:generated`, restart `npm run dev`, and hard-reload open browser tabs.

## Verification

Run `npm run verify:route-boundary` after a build. The verifier fails unless `build/index.js` and `.svelte-kit/output/server/manifest-full.js` are readable, nonempty regular files. It imports `manifest-full.js`, requires a nonempty route inventory with nonempty IDs, and rejects the exact `prototype`, `ingestion-proto`, and `components` route segments. Similar names such as `prototype-notes` are not forbidden.

Both `build/` and `.svelte-kit/output/` are scanned independently across emitted JavaScript, MJS, JSON, and HTML. A missing, unreadable, or zero-file tree fails verification; the success report gives route, deployed-file, and intermediate-file counts. Artifact scanning additionally rejects stale prototype source paths, removed module names, `Prototype object not found.`, and `mockObjectViews`.

The same run inventories the removed source roots and exact files listed in `scripts/route-boundary-policy.mjs`. Empty directory remnants are harmless, but any file under a forbidden root and any forbidden exact file path fail the build.
