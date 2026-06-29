import { District, ElectionData, Voting } from '../models/election';
import type { Preset } from '../contexts/preset';

export const COMPLETE_PROGRESS_THRESHOLD = 95;

export const getVotingProgress = (voting: Voting) => voting.progress ?? 100;

export const getPollingUnitCap = (voting: Voting) => {
	const pollingUnits = voting.pollingUnits;
	if (!pollingUnits) return undefined;

	return pollingUnits.cap;
};

export const isVotingComplete = (voting: Voting) => {
	const progress = getVotingProgress(voting);
	const pollingUnits = voting.pollingUnits;
	const pollingUnitCap = getPollingUnitCap(voting);

	if (
		pollingUnits &&
		pollingUnitCap !== undefined &&
		pollingUnitCap > 0 &&
		pollingUnits.reported >= pollingUnitCap
	) {
		return true;
	}

	return progress >= COMPLETE_PROGRESS_THRESHOLD;
};

export const isCouncilElectionData = (electionData: ElectionData) =>
	electionData.districts.some((district) =>
		district.voting.result.some((result) => result.candidateId.includes('-'))
	);

export const isCouncilPreset = (preset: Pick<Preset, 'candidateDataUrl' | 'fullname' | 'shortname' | 'electionData'>) =>
	preset.candidateDataUrl.includes('bmc') ||
	preset.fullname.includes('ส.ก.') ||
	preset.shortname.includes('ส.ก.') ||
	isCouncilElectionData(preset.electionData);

const hasCountingStatus = (voting: Voting) =>
	voting.progress !== undefined || voting.pollingUnits !== undefined;

export const getCountingStatusVoting = (
	district: District,
	electionData: ElectionData,
	countingReferenceElectionData?: ElectionData
) => {
	if (!isCouncilElectionData(electionData) || hasCountingStatus(district.voting)) {
		return district.voting;
	}

	return (
		countingReferenceElectionData?.districts.find(
			(referenceDistrict) => referenceDistrict.name === district.name
		)?.voting || district.voting
	);
};

export const isDistrictVotingComplete = (
	district: District,
	electionData: ElectionData,
	countingReferenceElectionData?: ElectionData
) => isVotingComplete(getCountingStatusVoting(district, electionData, countingReferenceElectionData));
