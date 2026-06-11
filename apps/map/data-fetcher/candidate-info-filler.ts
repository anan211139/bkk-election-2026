import { CandidateMap } from "../src/models/candidate";
import candidateStyle from './candidate-style.json';

const { defaultColor, partyColors, governorColors } = candidateStyle;

export function fillGovernorColorAndImage(map: CandidateMap): void {
  for (let [id, candidate] of Object.entries(map)) {
    candidate.color = getColorForGovernor(id);
    candidate.image = `/map/images/69-governor-candidates/${candidate.number}.png`;
  }
}

function getColorForGovernor(no: string): string {
  const color = governorColors[no as keyof typeof governorColors];
  if (color) {
    return color;
  }
  return defaultColor;
}

export function fillCouncilMemberColor(map: CandidateMap): void {
  for (let [id, candidate] of Object.entries(map)) {
    candidate.color = getColorForCouncilMember(candidate.party);
  }
}

function getColorForCouncilMember(partyName?: string): string {
  if (!partyName) {
    return defaultColor;
  }

  const color = partyColors[partyName as keyof typeof partyColors];
  if (color) {
    return color;
  }
  return defaultColor;
}
