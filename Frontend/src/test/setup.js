import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

vi.stubGlobal(
	'fetch',
	vi.fn(async (url) => {
		const urlString = String(url);

		if (urlString.includes('/api/visits')) {
			return {
				ok: true,
				json: async () => ({ count: 1 }),
			};
		}

		if (urlString.includes('api.github.com/users/')) {
			return {
				ok: true,
				json: async () => ({
					login: 'Lekematti',
					name: 'Lekematti',
					bio: 'Mock bio',
					public_repos: 1,
					followers: 2,
					avatar_url: 'https://example.com/avatar.png',
				}),
			};
		}

		if (urlString.includes('youtube.com/oembed')) {
			return {
				ok: true,
				json: async () => ({
					title: 'Mock YouTube Title',
					html:
						'<iframe title="YouTube video player" src="https://www.youtube.com/embed/mock" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
					thumbnail_url: 'https://example.com/thumb.jpg',
				}),
			};
		}

		return { ok: false, json: async () => ({}) };
	}),
);
