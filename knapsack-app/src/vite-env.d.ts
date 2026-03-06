/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_SUPABASE_URL?: string;
	readonly VITE_SUPABASE_ANON_KEY?: string;
	readonly VITE_SUPABASE_SYNC_TABLE?: string;
	readonly VITE_SUPABASE_AUTH_REDIRECT_TO?: string;
	readonly VITE_DISABLE_CLOUD_SYNC?: string;
	readonly VITE_DISABLE_SIGNUP?: string;
	readonly VITE_DISABLE_AUTH_RATE_LIMIT?: string;
	readonly VITE_AUTH_MAX_ATTEMPTS?: string;
	readonly VITE_AUTH_RATE_LIMIT_WINDOW_SECONDS?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

interface GoogleCredentialResponse {
	credential: string;
}

interface Window {
	google?: {
		accounts?: {
			id?: {
				initialize: (options: {
					client_id: string;
					callback: (response: GoogleCredentialResponse) => void;
				}) => void;
				prompt: (callback?: (notification: {
					isNotDisplayed: () => boolean;
					isSkippedMoment: () => boolean;
				}) => void) => void;
			};
		};
	};
}
