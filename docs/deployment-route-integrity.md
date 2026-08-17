# Deployment Route Integrity

SvelteKit server node files are index-based. A manifest from one build must never be overlaid on node files from another build.

## Build

`npm run build` removes `.svelte-kit` and `build`, produces one clean output, and scans generated JavaScript and manifests for prototype routes, loaders, and mock object data. Set `APP_BUILD_ID` to an immutable release identifier such as a commit SHA or image digest.

The resulting `@sveltejs/adapter-node` server starts with `npm start`. Set `NODE_ENV=production`, the externally visible `ORIGIN`, and the private/public API bases before promotion.

## Release

Build into a new release directory or container image. Do not copy a new `.svelte-kit/output` over a running or previous release. Start all instances from the same artifact, verify the `x-osimi-build-id` response header, then switch traffic atomically. Rollback switches traffic to the previous complete artifact rather than restoring individual generated files.

After any route graph change during development, stop Vite, run `npm run clean:generated`, restart `npm run dev`, and hard-reload open browser tabs.

## Verification

Run `npm run verify:route-boundary` after a build. A valid production output contains no `/prototype`, `/ingestion-proto`, `Prototype object not found.`, `mockObjectViews`, or prototype route source paths.
