import { Config } from '../contexts/config';
import { Preset } from '../contexts/preset';
import { CandidateMap } from '../models/candidate';
import { ElectionData, PresetIndex } from '../models/election';

const candidateJsonCache = new Map<string, Promise<CandidateMap>>();

export async function fetchConfig(): Promise<Config> {
	return getJson<Config>(
		(() => {
			switch (import.meta.env.VITE_BUILD_ENV) {
				// case 'PRODUCTION':
				// 	return 'https://bkkelection2022live.wevis.info/configs/production.json';
				// case 'STAGING':
				// 	return 'https://bkkelection2022live.wevis.info/configs/staging.json';
				default:
					return '/map/data/dev.config.json';
			}
		})()
	);
}

export async function fetchPreset({
	electionDataUrl,
	candidateDataUrl,
	refreshIntervalMs,
	...rest
}: PresetIndex): Promise<Preset> {
	const [electionData, candidateMap] = await Promise.all([
		getJson<ElectionData>(electionDataUrl, 'no-cache'),
		getCandidateMap(candidateDataUrl)
	]);

	electionData.districts.forEach(({ voting }) => voting.result.sort((a, z) => z.count - a.count));

	return {
		...rest,
		electionData,
		candidateMap
	};
}

async function getCandidateMap(url: string): Promise<CandidateMap> {
	if (!candidateJsonCache.has(url)) {
		candidateJsonCache.set(url, getJson<CandidateMap>(url));
	}
	return candidateJsonCache.get(url) as Promise<CandidateMap>;
}

export async function getJson<T>(url: string, cache?: RequestCache): Promise<T> {
	const response = await fetch(url, cache ? { cache } : undefined);
	if (!response.ok) {
		throw new Error(`Fail to fetch ${url}: ${response.status}`);
	}
	return response.json();
}
