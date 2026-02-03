export const load = async ({ locals }: { locals: App.Locals }) => ({
	session: locals.session ?? null
});
