import governorCandidates from '../../map/public/data/69-governor-candidates.json';
import councilCandidates from '../../map/public/data/69-bmc-candidates.json';
import { ICouncil, IGovernor } from '../types/business';

interface MapCandidate {
  id: string;
  number: number;
  fullname: string;
  party: string;
  image: string;
  color?: string;
  age?: number | string;
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
  color: candidate.color,
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

const normalizeOriginalGovernor = (
  page: OriginalCandidatePage,
  summaryCandidate?: MapCandidate
): IGovernor => {
  const candidate = page.pageProps.candidate;
  return {
    ...candidate,
    party: summaryCandidate?.party || candidate.party,
    color: summaryCandidate?.color,
    profile_pic:
      getLocalCandidateImage(candidate.number, 2) || candidate.profile_pic,
    cover_pic: getLocalCandidateImage(candidate.number, 3) || candidate.cover_pic,
    disqualified: candidate.disqualified || '',
  };
};

const mapGovernorList = Object.values(
  governorCandidates as unknown as Record<string, MapCandidate>
)
  .map(createGovernorFromMapCandidate)
  .sort((a, b) => (a.number || 0) - (b.number || 0));

export const governorList = mapGovernorList;

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
      image: candidate.image,
      age: Number(candidate.age) || 0,
      sex: candidate.sex || '',
      education: candidate.education || '',
      career: candidate.career || '',
      disqualified: '',
    } as ICouncil;
  })
  .sort((a, b) => a.district.localeCompare(b.district) || a.number - b.number);

const getOriginalGovernor = (candidateNumber: number) => {
  try {
    const page = require(`../data/original-candidates/${candidateNumber}.json`);
    return page as OriginalCandidatePage;
  } catch {
    return null;
  }
};

export const getGovernor = (id: string | string[] | undefined) => {
	const candidateId = Array.isArray(id) ? id[0] : id;
	const summaryCandidate = governorList.find(
		(candidate) => candidate.id?.toString() === candidateId
	);
  if (!summaryCandidate?.number) {
    return summaryCandidate;
  }

  const originalGovernor = getOriginalGovernor(summaryCandidate.number);
  if (!originalGovernor) {
    return summaryCandidate;
  }

  return normalizeOriginalGovernor(
    originalGovernor,
    (governorCandidates as unknown as Record<string, MapCandidate>)[
      summaryCandidate.number.toString()
    ]
  );
};
