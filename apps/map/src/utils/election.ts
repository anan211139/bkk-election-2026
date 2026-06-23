import { Voting } from '../models/election';

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
