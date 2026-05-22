import React, { FunctionComponent, useContext, useState } from 'react';
import Modal from './Modal';
import { presetContext } from '../contexts/preset';
import CountingSummary from './CountingSummary';

const Footer: FunctionComponent = () => {
	const preset = useContext(presetContext);
	const [isShareModalOpen, setIsShareModalOpen] = useState(false);

	return (
		<div className="bg-black text-white px-4 lg:px-12 fixed bottom-0 left-0 right-0 z-10 lg:relative">
			<div class="flex flex-row justify-end border-t border-gray py-3 lg:py-6 gap-4">
				<div className="flex-1 min-w-0">
					{preset?.electionData.total.progress !== undefined && (
						<CountingSummary
							votingData={preset.electionData.total}
							electionType={preset.electionData.type}
							lastUpdatedAt={preset.electionData.lastUpdatedAt}
							compact
						/>
					)}
				</div>

				
			</div>
		</div>
	);
};

export default Footer;
