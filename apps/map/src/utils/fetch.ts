import { Config } from '../contexts/config';
import { Preset } from '../contexts/preset';
import { CandidateMap } from '../models/candidate';
import { ElectionData, PresetIndex } from '../models/election';

const candidateJsonCache = new Map<string, Promise<CandidateMap>>();

interface FetchOptions {
	cache?: RequestCache;
	cacheBustIntervalMs?: number;
	cacheBustOffsetMs?: number;
}

export async function fetchConfig(options?: FetchOptions): Promise<Config> {
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
		})(),
		options
	);
}

export async function fetchPreset(
	{ electionDataUrl, candidateDataUrl, refreshIntervalMs, refreshOffsetMs, ...rest }: PresetIndex,
	options?: FetchOptions
): Promise<Preset> {
	const [electionData, candidateMap] = await Promise.all([
		getJson<ElectionData>(electionDataUrl, {
			...options,
			cacheBustIntervalMs: options?.cacheBustIntervalMs ?? refreshIntervalMs,
			cacheBustOffsetMs: options?.cacheBustOffsetMs ?? refreshOffsetMs
		}),
		getCandidateMap(candidateDataUrl)
	]);

	electionData.districts.forEach(({ voting }) => voting.result.sort((a, z) => z.count - a.count));

	return {
		...rest,
		electionDataUrl,
		candidateDataUrl,
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

export async function getJson<T>(url: string, options?: FetchOptions): Promise<T> {
	const response = await fetch(
		getCacheBustedUrl(url, options?.cacheBustIntervalMs, options?.cacheBustOffsetMs),
		{ cache: options?.cache }
	);
	if (!response.ok) {
		throw new Error(`Fail to fetch ${url}: ${response.status}`);
	}
	return response.json();
}

function getCacheBustedUrl(url: string, intervalMs?: number, offsetMs = 0): string {
	if (!intervalMs) return url;

	const refreshBucket = Math.floor((Date.now() - offsetMs) / intervalMs);
	const separator = url.includes('?') ? '&' : '?';
	return `${url}${separator}refresh=${refreshBucket}`;
}
