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
			containerClassName="lg:absolute lg:z-10 lg:top-0 lg:left-0 lg:right-0 lg:bottom-0"
			className="max-h-full max-w-[calc(100vw-2rem)] h-full w-full lg:absolute lg:z-10 lg:top-0 lg:left-0 lg:right-0 lg:bottom-0 !max-w-none"
			title={`เขต${activeDistrict.name}`}
			subtitle={`ผู้มีสิทธิ์เลือกตั้ง ${activeDistrict.voting.eligiblePopulation.toLocaleString()} คน`}
			imageUrl={`/map/images/districts-attraction/${activeDistrict.name}.webp`}
			onClose={onClose}
		>
			<CandidateOverviewList votingData={votingData} enableTopHighlight={false} />
			{votingData.progress !== undefined && (
				<div class="border-t border-gray py-3 pb-0 mt-4">
					<CountingSummary
						votingData={votingData}
						lastUpdatedAt={preset.electionData.lastUpdatedAt}
					/>
				</div>
			)}
		</Modal>
	);
};

export default DistrictModal;
