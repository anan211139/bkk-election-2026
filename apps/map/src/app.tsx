import { FunctionComponent, useEffect, useState } from 'react';
import { loadAnalyticsWithConsent, loadUIComponents } from 'ui';
import { dequal } from 'dequal';
import Dashboard from './components/dashboard';
import ElectionCloseCountdownModal from './components/ElectionCloseCountdownModal';
import Footer from './components/Footer';
import Slideshow from './components/Slideshow';
import { Config, configContext } from './contexts/config';
import { Preset, presetContext } from './contexts/preset';
import { ElectionData, ElectionDataType, PresetIndex } from './models/election';
import { fetchConfig, fetchPreset, getJson } from './utils/fetch';
import { isCouncilElectionData } from './utils/election';

const DEFAULT_PRESET_INDEX = 0;
const CONFIG_REFRESH_INTERVAL = 60000;
const MAX_REFRESH_JITTER_MS = 30000;

const App: FunctionComponent = () => {
	const isSlideshow = location.pathname.replace(/\/$/, '') === '/map/slideshow';
	const [config, setConfig] = useState<Config | null>(null);
	const [activePresetIndex, setActivePresetIndex] = useState<number>(DEFAULT_PRESET_INDEX);
	const [configDefaultPresetIndex, setConfigDefaultPresetIndex] =
		useState<number>(DEFAULT_PRESET_INDEX);
	const [preset, setPreset] = useState<Preset | null>(null);
	const [isNewPresetLoading, setIsNewPresetLoading] = useState(true);
	const [isCountdownModalOpen, setIsCountdownModalOpen] = useState(true);

	useEffect(() => {
		loadUIComponents();
		return loadAnalyticsWithConsent(import.meta.env.VITE_BUILD_ENV);
	}, []);

	useEffect(() => {
		const loadConfig = () =>
			fetchConfig({ cacheBustIntervalMs: CONFIG_REFRESH_INTERVAL }).then((newConfig) => {
				if (!dequal(config, newConfig)) {
					setConfig(newConfig);

					if (newConfig.defaultPresetIndex !== configDefaultPresetIndex) {
						setConfigDefaultPresetIndex(newConfig.defaultPresetIndex);
						setActivePresetIndex(newConfig.defaultPresetIndex);
					}
				}
			});

		loadConfig();
		const timer = setInterval(loadConfig, CONFIG_REFRESH_INTERVAL);
		return () => clearInterval(timer);
	}, [config, configDefaultPresetIndex]);

	useEffect(() => {
		if (!config || isSlideshow) return;

		const presetIndex = config.presetIndexes[activePresetIndex];
		const { refreshIntervalMs } = presetIndex;
		let isCancelled = false;
		let timer: ReturnType<typeof setTimeout> | null = null;

		const loadPreset = (showLoading: boolean) => {
			if (showLoading) setIsNewPresetLoading(true);
			return fetchPreset(presetIndex, { cacheBustIntervalMs: refreshIntervalMs })
				.then(async (newPreset) => {
					const countingReferenceElectionData = await getCountingReferenceElectionData(
						newPreset.electionData,
						config.presetIndexes,
						presetIndex,
						refreshIntervalMs
					);
					const nextPreset = countingReferenceElectionData
						? { ...newPreset, countingReferenceElectionData }
						: newPreset;

					if (!isCancelled) setPreset(nextPreset);
					return newPreset;
				})
				.catch((error) => {
					console.error('Failed to fetch preset', error);
					return null;
				})
				.finally(() => {
					if (!isCancelled && showLoading) setIsNewPresetLoading(false);
				});
		};

		const scheduleRefresh = () => {
			if (isCancelled || !refreshIntervalMs) return;
			timer = setTimeout(() => {
				if (isCancelled) return;
				loadPreset(false).then((newPreset) => {
					if (newPreset?.electionData.type !== ElectionDataType.Completed) {
						scheduleRefresh();
					}
				});
			}, getRefreshDelay(refreshIntervalMs));
		};

		loadPreset(true).then((newPreset) => {
			if (newPreset?.electionData.type !== ElectionDataType.Completed) {
				scheduleRefresh();
			}
		});

		return () => {
			isCancelled = true;
			if (timer) clearTimeout(timer);
		};
	}, [config, activePresetIndex]);

	return (
		<div class="absolute inset-0 bg-black">
			<div class="flex flex-col h-full">
				<ui-navbar></ui-navbar>
				<configContext.Provider value={config}>
					{config && isSlideshow && <Slideshow config={config} />}
					{!isSlideshow && preset && (
						<presetContext.Provider value={preset}>
							<Dashboard
								activePresetIndex={activePresetIndex}
								onPresetChange={setActivePresetIndex}
							/>
							<Footer />
							<ui-footer></ui-footer>
						</presetContext.Provider>
					)}
					{!isSlideshow && isNewPresetLoading && (
						<div class="absolute inset-0 top-12 md:top-14 flex items-center justify-center bg-black bg-opacity-50 z-50">
							<div className="scale-50">
								<div className="loader-spinner" />
							</div>
						</div>
					)}
					{isCountdownModalOpen && (
						<ElectionCloseCountdownModal onClose={() => setIsCountdownModalOpen(false)} />
					)}
				</configContext.Provider>
			</div>
		</div>
	);
};

async function getCountingReferenceElectionData(
	electionData: ElectionData,
	presetIndexes: PresetIndex[],
	activePresetIndex: PresetIndex,
	refreshIntervalMs?: number
) {
	if (!isCouncilElectionData(electionData)) return undefined;

	const governorPresetIndex = presetIndexes.find(
		(presetIndex) =>
			presetIndex.electionDataUrl !== activePresetIndex.electionDataUrl &&
			presetIndex.candidateDataUrl !== activePresetIndex.candidateDataUrl &&
			!presetIndex.candidateDataUrl.includes('bmc')
	);

	if (!governorPresetIndex) return undefined;

	return getJson<ElectionData>(governorPresetIndex.electionDataUrl, {
		cacheBustIntervalMs: refreshIntervalMs
	}).catch((error) => {
		console.error('Failed to fetch counting reference election data', error);
		return undefined;
	});
}

function getRefreshDelay(refreshIntervalMs: number): number {
	return refreshIntervalMs + Math.floor(Math.random() * MAX_REFRESH_JITTER_MS);
}

export default App;
