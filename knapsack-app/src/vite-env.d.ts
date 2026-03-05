/// <reference types="vite/client" />

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
				prompt: () => void;
			};
		};
	};
}
