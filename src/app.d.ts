import type { Session } from '$lib/auth/types';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: Session | null;
		}

		interface PageData {
			session: Session | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
