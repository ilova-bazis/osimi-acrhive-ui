# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv create --template minimal --types ts --add eslint tailwindcss="plugins:typography" vitest="usages:unit,component" --install npm ./
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## API and Direct Upload Environment

Use `PRIVATE_API_BASE` for SvelteKit server-to-server API calls and
`PUBLIC_API_BASE` for the browser-visible base used to resolve relative signed
upload URLs:

```dotenv
PRIVATE_API_BASE=http://backend.internal:3000
PUBLIC_API_BASE=https://api.archive.example
```

`PUBLIC_API_BASE` must be browser-reachable and HTTPS in production. When the
UI and API use separate origins, configure the backend's
`CORS_ALLOWED_ORIGINS` with the exact UI origin. A same-origin reverse proxy
does not require cross-origin upload CORS.
