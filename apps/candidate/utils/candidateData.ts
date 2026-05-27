import governorCandidates from '../data/69-governor-candidates.json';
import councilCandidates from '../data/69-bmc-candidates.json';
import candidate1 from '../data/original-candidates/1.json';
import candidate2 from '../data/original-candidates/2.json';
import candidate3 from '../data/original-candidates/3.json';
import candidate4 from '../data/original-candidates/4.json';
import candidate5 from '../data/original-candidates/5.json';
import candidate6 from '../data/original-candidates/6.json';
import candidate7 from '../data/original-candidates/7.json';
import candidate8 from '../data/original-candidates/8.json';
import candidate9 from '../data/original-candidates/9.json';
import candidate10 from '../data/original-candidates/10.json';
import candidate11 from '../data/original-candidates/11.json';
import candidate12 from '../data/original-candidates/12.json';
import candidate13 from '../data/original-candidates/13.json';
import candidate14 from '../data/original-candidates/14.json';
import candidate15 from '../data/original-candidates/15.json';
import candidate16 from '../data/original-candidates/16.json';
import candidate17 from '../data/original-candidates/17.json';
import candidate18 from '../data/original-candidates/18.json';
import candidate19 from '../data/original-candidates/19.json';
import candidate20 from '../data/original-candidates/20.json';
import candidate21 from '../data/original-candidates/21.json';
import candidate22 from '../data/original-candidates/22.json';
// import candidate23 from '../data/original-candidates/23.json';
// import candidate24 from '../data/original-candidates/24.json';
// import candidate25 from '../data/original-candidates/25.json';
// import candidate26 from '../data/original-candidates/26.json';
// import candidate27 from '../data/original-candidates/27.json';
// import candidate29 from '../data/original-candidates/29.json';
// import candidate30 from '../data/original-candidates/30.json';
// import candidate31 from '../data/original-candidates/31.json';
import { ICouncil, IGovernor } from '../types/business';

interface MapCandidate {
  id: string;
  number: number;
  fullname: string;
  party: string;
  image: string;
  age?: number;
  education?: string;
  sex?: string;
  career?: string;
}

interface OriginalCandidatePage {
  pageProps: {
    candidate: IGovernor & {
      disqualified: null | string;
    };
  };
}

const NAME_TITLE_REGEX = /^(นาย|นางสาว|นาง)\s*/;
const CANDIDATE_BASE_PATH = '/candidate';
const DISQUALIFIED_GOVERNOR: Record<number, string> = {
  28: 'ถูก กกต. สั่งถอนชื่อออกจากบัญชีรายชื่อผู้สมัครผู้ว่าฯ กทม. แต่ยังมีสิทธิ์อุทธรณ์คำวินิจฉัยของ กกต. ได้ (ข้อมูล ณ วันที่ 12 พ.ค. 2565)',
};

const cleanName = (name: string) => name.replace(NAME_TITLE_REGEX, '').trim();
const getLocalCandidateImage = (
  candidateNumber: number | null,
  imageType: 1 | 2 | 3
) => {
  if (!candidateNumber) {
    return null;
  }
  const paddedNumber = candidateNumber.toString().padStart(2, '0');
  return `${CANDIDATE_BASE_PATH}/static/images/og/${paddedNumber}-${imageType}.jpg`;
};

const createGovernorFromMapCandidate = (candidate: MapCandidate): IGovernor => ({
  id: Number(candidate.id),
  name: cleanName(candidate.fullname),
  number: candidate.number,
  sex: null,
  birthdate: null,
  property: null,
  higher_education: null,
  career: null,
  political_career: null,
  party: candidate.party,
  policy: null,
  contact_web: null,
  contact_facebook: null,
  contact_twitter: null,
  profile_pic: getLocalCandidateImage(candidate.number, 2),
  cover_pic: getLocalCandidateImage(candidate.number, 3),
  nickname: null,
  policy_url: null,
  age: null,
  basic_education: null,
  slogan: null,
  contact_youtube: null,
  contact_tiktok: null,
  other_data: null,
  contact_email: null,
  contact_instagram: null,
  contact_line: null,
  disqualified: DISQUALIFIED_GOVERNOR[candidate.number] || '',
});

const normalizeOriginalGovernor = (page: OriginalCandidatePage): IGovernor => {
  const candidate = page.pageProps.candidate;
  return {
    ...candidate,
    profile_pic:
      getLocalCandidateImage(candidate.number, 2) || candidate.profile_pic,
    cover_pic: getLocalCandidateImage(candidate.number, 3) || candidate.cover_pic,
    disqualified: candidate.disqualified || '',
  };
};

const originalGovernorList = [
  candidate1,
  candidate2,
  candidate3,
  candidate4,
  candidate5,
  candidate6,
  candidate7,
  candidate8,
  candidate9,
  candidate10,
  candidate11,
  candidate12,
  candidate13,
  candidate14,
  candidate15,
  candidate16,
  candidate17,
  candidate18,
  candidate19,
  candidate20,
  candidate21,
  candidate22,
  // candidate23,
  // candidate24,
  // candidate25,
  // candidate26,
  // candidate27,
  // candidate29,
  // candidate30,
  // candidate31,
].map((page) =>
  normalizeOriginalGovernor(page as unknown as OriginalCandidatePage)
);

const mapGovernorList = Object.values(
  governorCandidates as unknown as Record<string, MapCandidate>
)
  .map(createGovernorFromMapCandidate)
  .sort((a, b) => (a.number || 0) - (b.number || 0));

export const governorList = mapGovernorList
  .map((mapCandidate) => {
    return (
      originalGovernorList.find(
        (candidate) => candidate.number === mapCandidate.number
      ) || mapCandidate
    );
  })
  .sort((a, b) => (a.number || 0) - (b.number || 0));

export const councilList = Object.entries(
  councilCandidates as unknown as Record<string, MapCandidate>
)
  .map(([key, candidate]) => {
    const [district] = key.split('-');
    return {
      name: cleanName(candidate.fullname),
      number: candidate.number,
      district,
      party: candidate.party,
      age: candidate.age || 0,
      sex: candidate.sex || '',
      education: candidate.education || '',
      career: candidate.career || '',
    } as ICouncil;
  })
  .sort((a, b) => a.district.localeCompare(b.district) || a.number - b.number);

export const getGovernor = (id: string | string[] | undefined) => {
	const candidateId = Array.isArray(id) ? id[0] : id;
	return governorList.find(
		(candidate) => candidate.id?.toString() === candidateId
	);
};
