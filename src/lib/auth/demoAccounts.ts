import type { Role } from './types';

export type DemoAccount = {
	username: string;
	password: string;
	role: Role;
};

const demoAccounts: DemoAccount[] = [
	{ username: 'admin', password: 'admin', role: 'admin' },
	{ username: 'archiver', password: 'archiver', role: 'archiver' },
	{ username: 'viewer', password: 'viewer', role: 'viewer' }
];

export const listDemoAccounts = () =>
	demoAccounts.map(({ username, password, role }) => ({ username, password, role }));

export const validateDemoCredentials = (username: string, password: string): DemoAccount | null => {
	const match = demoAccounts.find(
		(account) => account.username === username && account.password === password
	);
	return match ?? null;
};
