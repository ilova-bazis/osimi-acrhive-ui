export type Role = 'admin' | 'archiver' | 'viewer';

export type Session = {
	userId: string;
	username: string;
	role: Role;
	issuedAt: string;
	expiresAt: string;
};

export type Credentials = {
	username: string;
	password: string;
};

export type AuthError = {
	code: 'invalid_credentials' | 'session_expired' | 'unknown';
	message: string;
};

export type AuthResult = {
	session: Session | null;
	error?: AuthError;
};
