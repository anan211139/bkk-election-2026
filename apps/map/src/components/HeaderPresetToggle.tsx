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
				<p className="font-body text-[12px] xs:text-[14px] lg:text-[16px] mt-2 lg:mt-1">
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
					<span className="map-preset-toggle" aria-label="เลือกชุดข้อมูล">
						{config.presetIndexes.map(({ shortname, electionDataUrl }, index) => {
							const label = shortname.includes('ส.ก') ? 'สก.' : 'ผู้ว่า';
							const isActive = index === activeIndex;

							return (
								<React.Fragment key={shortname}>
									{index > 0 && <span className="px-1 text-black">|</span>}
									<button
										type="button"
										disabled={!electionDataUrl}
										aria-pressed={isActive}
										onClick={() => {
											if (electionDataUrl) onChange(index);
										}}
										className={`map-preset-toggle-button ${
											isActive ? 'map-preset-toggle-button-active' : ''
										} ${!electionDataUrl ? 'map-preset-toggle-button-disabled' : ''}`}
									>
										{label}
									</button>
								</React.Fragment>
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
