import { CandidateMap } from "../src/models/candidate";

export function fillGovernorColorAndImage(map: CandidateMap): void {
  for (let [id, candidate] of Object.entries(map)) {
    candidate.color = getColorForGovernor(id);
    candidate.image = `/map/images/69-governor-candidates/${candidate.number}.png`;
  }
}

function getColorForGovernor(no: string): string {
  const color = GovernorPredefinedColors[no];
  if (color) {
    return color;
  }
  return '#666666';
}

export function fillCouncilMemberColor(map: CandidateMap): void {
  for (let [id, candidate] of Object.entries(map)) {
    candidate.color = getColorForCouncilMember(candidate.party);
  }
}

function getColorForCouncilMember(partyName?: string): string {
  if (!partyName) {
    return '#666666';
  }

  const color = PartyColors[partyName];
  if (color) {
    return color;
  }
  return '#666666';
}

const PartyColors: {[number: string]: string} = {
  'พรรคเพื่อไทย': '#fd0001',
  'กลุ่มBetter Bangkok': '#2ab554',
  'กลุ่มคนทำงาน': '#02ea02',
  'พรรคประชาธิปัตย์': '#00c0ff',
  'พรรคเศรษฐกิจ': '#ffbb00',
  'พรรคประชาชน': '#ff7f00',
  'กลุ่มกรุงเทพบินได้': '#b400ff',
  'อิสระ': '#666666'
};

const GovernorPredefinedColors: {[number: string]: string} = {
  '1': "#b48c4f",
  // '3': '#008989',
  '5': PartyColors['พรรคประชาธิปัตย์'],
  // '6': PartyColors['พรรคเขียวเพื่อเมือง'],
  '7': PartyColors['กลุ่มกรุงเทพบินได้'],
  '9': '#5adc00',
  '10': PartyColors['พรรคประชาชน'],
  '12': PartyColors['พรรคเศรษฐกิจ'],
  '14': '#007dfe',
  // '16': PartyColors['พรรคพลังธรรมภิบาล'],
  // '18': PartyColors['พรรคพิทักษ์เมือง'],
}