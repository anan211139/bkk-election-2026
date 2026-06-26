import React, { FunctionComponent, useContext, useState } from 'react';
import { configContext } from '../contexts/config';
import { presetContext } from '../contexts/preset';
import Modal from './Modal';

interface PresetToggleProps {
	activeIndex: number;
	onChange: (e: number) => void;
}

const HeaderPresetToggle: FunctionComponent<PresetToggleProps> = ({ activeIndex, onChange }) => {
	const preset = useContext(presetContext);
	const config = useContext(configContext);
	const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState<boolean>(false);

	if (!config || !preset) return <></>;

	return (
		<div className="w-full lg:w-full flex flex-col relative">
			<div className="flex-1 text-center">
				<h1 className="font-heading typo-title map-results-title leading-tight">
					{config.presetIndexes[activeIndex].isLive && <LiveBadge />} {preset.fullname}
				</h1>
				<p className="font-body text-[18px] mt-2 ">
					{preset.subtitle}{' '}
					{preset.descriptionModal && (
						<>
							<a
								href="#"
								className="opacity-70 hover:underline"
								onClick={() => setIsDescriptionModalOpen(true)}
							>
								(อ่านที่มาโครงการและวิธีนับคะแนน)
							</a>
							{isDescriptionModalOpen && (
								<Modal
									title="ที่มาโครงการและวิธีนับคะแนน"
									onClose={() => setIsDescriptionModalOpen(false)}
								>
									<p className="indent-6 typo-b6">{preset.descriptionModal}</p>
								</Modal>
							)}
						</>
					)}
					<span className="map-header-preset-toggle" aria-label="เลือกชุดข้อมูล">
						{config.presetIndexes.map(({ shortname, electionDataUrl }, index) => {
							const isOrkOr = shortname.includes('ส.ก');
							const label = isOrkOr ? 'ส.ก.' : 'ผู้ว่าฯ';
							const isActive = index === activeIndex;

							return (
								<button
									key={shortname}
									type="button"
									disabled={!electionDataUrl}
									aria-pressed={isActive}
									onClick={() => {
										if (electionDataUrl) onChange(index);
									}}
									className={`map-header-preset-toggle-button ${
										isActive ? 'map-header-preset-toggle-button-active' : ''
									} ${!electionDataUrl ? 'map-header-preset-toggle-button-disabled' : ''}`}
								>
									<span
										className="map-header-preset-toggle-color"
										style={{ backgroundColor: isOrkOr ? '#f490ce' : '#48c277' }}
									/>
									{label}
								</button>
							);
						})}
					</span>
				</p>
			</div>
		</div>
	);
};

const LiveBadge = () => (
	<div class="bg-[#D02525] typo-u4 text-white mr-1 px-1 font-semibold inline-block rounded-[2px] align-middle">
		LIVE
	</div>
);

export default HeaderPresetToggle;
