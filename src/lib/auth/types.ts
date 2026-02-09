export type Role = 'admin' | 'archiver' | 'viewer' | string;

export type Session = {
	id: string;
	username: string;
	tenantId?: string | null;
	role: Role;
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
