import React, { FunctionComponent, useContext } from 'react';
import { presetContext } from '../contexts/preset';
import { District, Voting } from '../models/election';
import CandidateOverviewList from './candidateOverviewList/CandidateOverviewList';
import CountingSummary from './CountingSummary';
import Modal from './Modal';

interface DistrictModalProps {
	activeDistrict: District;
	votingData: Voting;
	onClose: () => void;
}

const DistrictModal: FunctionComponent<DistrictModalProps> = ({
	activeDistrict,
	onClose,
	votingData
}) => {
	const preset = useContext(presetContext);

	if (!preset) return <></>;

	return (
		<Modal
			className="max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] w-full lg:max-w-[calc(100vw-6rem)] lg:h-[calc(100vh-8rem)]"
			title={`เขต${activeDistrict.name}`}
			subtitle={`ผู้มีสิทธิ์เลือกตั้ง ${activeDistrict.voting.eligiblePopulation.toLocaleString()} คน`}
			imageUrl={`/map/images/districts-attraction/${activeDistrict.name}.webp`}
			onClose={onClose}
		>
			<div className="min-h-[260px] flex-1 overflow-hidden">
				<CandidateOverviewList
					votingData={votingData}
					enableTopHighlight={true}
					topHighlightCount={1}
				/>
			</div>
			{votingData.progress !== undefined && (
				<div class="border-t border-gray py-3 pb-0 mt-4 shrink-0">
					<CountingSummary
						votingData={votingData}
						lastUpdatedAt={preset.electionData.lastUpdatedAt}
						compact
					/>
				</div>
			)}
		</Modal>
	);
};

export default DistrictModal;
