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
  'พรรคมหานครก้าวหน้า': '#1E90FF',
  'พรรครวมใจไทย': '#E31E2B',
  'พรรคเขียวเพื่อเมือง': '#009543',
  'พรรครุ่งเรืองอนาคต': '#FFD700',
  'พรรคทางเลือกใหม่': '#800080',
  'พรรคสีสันกรุงเทพ': '#FF69B4',
  'พรรคภูมิปัญญาไทย': '#000080',
  'พรรคพลังธรรมภิบาล': '#FF4500',
  'พรรคพิทักษ์เมือง': '#4B0082',
  'พรรคไทยสร้างสรรค์': '#2E8B57',
  'พรรคประชาธิปัตย์': '#1B80B6',
  'กลุ่มกรุงเทพก้าวหน้า': '#FF8C00',
  'กลุ่มรักกรุงเทพ': '#20B2AA',
  'พรรคประชารัฐเมือง': '#A52A2A',
  'กลุ่มคนรุ่นใหม่': '#00CECB',
  'อิสระ': '#666666'
};

const GovernorPredefinedColors: {[number: string]: string} = {
  '1': PartyColors['พรรคมหานครก้าวหน้า'],
  '3': '#008989',
  '4': PartyColors['พรรครวมใจไทย'],
  '6': PartyColors['พรรคเขียวเพื่อเมือง'],
  '8': PartyColors['พรรครุ่งเรืองอนาคต'],
  '10': PartyColors['พรรคทางเลือกใหม่'],
  '12': PartyColors['พรรคสีสันกรุงเทพ'],
  '13': '#543F2D',
  '14': PartyColors['พรรคภูมิปัญญาไทย'],
  '16': PartyColors['พรรคพลังธรรมภิบาล'],
  '18': PartyColors['พรรคพิทักษ์เมือง'],
  '20': PartyColors['พรรคไทยสร้างสรรค์'],
}