import { useState } from 'react';
import { FunctionComponent, useEffect } from 'react';
import { loadUIComponents } from 'ui';
import { dequal } from 'dequal';
import Dashboard from './components/dashboard';
import Footer from './components/Footer';
import { Config, configContext } from './contexts/config';
import { Preset, presetContext } from './contexts/preset';
import { ElectionDataType } from './models/election';
import { fetchConfig, fetchPreset } from './utils/fetch';

const DEFAULT_PRESET_INDEX = 0;
// const CONFIG_REFRESH_INTERVAL = 60000;
const MAX_REFRESH_JITTER_MS = 30000;

const App: FunctionComponent = () => {
	const [config, setConfig] = useState<Config | null>(null);
	const [activePresetIndex, setActivePresetIndex] = useState<number>(DEFAULT_PRESET_INDEX);
	const [configDefaultPresetIndex, setConfigDefaultPresetIndex] =
		useState<number>(DEFAULT_PRESET_INDEX);
	const [preset, setPreset] = useState<Preset | null>(null);
	const [isNewPresetLoading, setIsNewPresetLoading] = useState(true);

	useEffect(() => {
		loadUIComponents();

		if (import.meta.env.VITE_BUILD_ENV == 'PRODUCTION') {
			const script = document.createElement('script');
			script.async = true;
			script.defer = true;
			script.src = 'https://analytics.punchup.world/js/plausible.js';
			script.setAttribute('data-domain', 'bkkelection2022.wevis.info');
			document.head.appendChild(script);
		}
	}, []);

	useEffect(() => {
		const loadConfig = () =>
			fetchConfig().then((newConfig) => {
				if (!dequal(config, newConfig)) {
					setConfig(newConfig);

					if (newConfig.defaultPresetIndex !== configDefaultPresetIndex) {
						setConfigDefaultPresetIndex(newConfig.defaultPresetIndex);
						setActivePresetIndex(newConfig.defaultPresetIndex);
					}
				}
			});

		loadConfig();
		// const timer = setInterval(loadConfig, CONFIG_REFRESH_INTERVAL);
		// return () => clearInterval(timer);
	}, [config, configDefaultPresetIndex]);

	useEffect(() => {
		if (!config) return;

		const presetIndex = config.presetIndexes[activePresetIndex];
		const { refreshIntervalMs } = presetIndex;
		let isCancelled = false;
		let timer: ReturnType<typeof setTimeout> | null = null;

		const loadPreset = (showLoading: boolean) => {
			if (showLoading) setIsNewPresetLoading(true);
			return fetchPreset(presetIndex)
				.then((newPreset) => {
					if (!isCancelled) setPreset(newPreset);
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
					{preset && (
						<presetContext.Provider value={preset}>
							<Dashboard
								activePresetIndex={activePresetIndex}
								onPresetChange={setActivePresetIndex}
							/>
							<Footer />
						</presetContext.Provider>
					)}
					{isNewPresetLoading && (
						<div class="absolute inset-0 top-12 md:top-14 flex items-center justify-center bg-black bg-opacity-50 z-50">
							<div className="scale-50">
								<div className="loader-spinner" />
							</div>
						</div>
					)}
				</configContext.Provider>
			</div>
		</div>
	);
};

function getRefreshDelay(refreshIntervalMs: number): number {
	return refreshIntervalMs + Math.floor(Math.random() * MAX_REFRESH_JITTER_MS);
}

export default App;
