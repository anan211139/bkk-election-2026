import React, { FunctionComponent, lazy, useEffect, useMemo, useState } from 'react';
import { Config } from '../contexts/config';
import { Preset, presetContext } from '../contexts/preset';
import { Candidate } from '../models/candidate';
import { District, ElectionDataType, Result, Voting } from '../models/election';
import { fetchPreset } from '../utils/fetch';
import Footer from './Footer';
import LazyloadContainer from './LazyloadContainer';
import Progress, { ProgressItem } from './Progress';

const PAGE_INTERVAL_MS = 60000;
const TOP_CANDIDATE_COUNT = 3;

const GridWinner = lazy(() => import('./district-map/GridWinner'));

interface SlideshowProps {
	config: Config;
}

interface DistrictGroup {
	name: string;
	districts: string[];
}

const DISTRICT_GROUPS: DistrictGroup[] = [
	{
		name: 'กลุ่มกรุงเทพกลาง',
		districts: [
			'พระนคร',
			'ดุสิต',
			'ป้อมปราบศัตรูพ่าย',
			'สัมพันธวงศ์',
			'ดินแดง',
			'ห้วยขวาง',
			'วังทองหลาง',
			'ราชเทวี',
			'พญาไท'
		]
	},
	{
		name: 'กลุ่มกรุงเทพเหนือ',
		districts: ['จตุจักร', 'ลาดพร้าว', 'บางซื่อ', 'หลักสี่', 'ดอนเมือง', 'สายไหม', 'บางเขน']
	},
	{
		name: 'กลุ่มกรุงเทพใต้',
		districts: [
			'ปทุมวัน',
			'บางรัก',
			'สาทร',
			'บางคอแหลม',
			'ยานนาวา',
			'คลองเตย',
			'วัฒนา',
			'พระโขนง',
			'สวนหลวง',
			'บางนา'
		]
	},
	{
		name: 'กลุ่มกรุงเทพตะวันออก',
		districts: [
			'บางกะปิ',
			'สะพานสูง',
			'บึงกุ่ม',
			'คันนายาว',
			'ลาดกระบัง',
			'มีนบุรี',
			'หนองจอก',
			'คลองสามวา',
			'ประเวศ'
		]
	},
	{
		name: 'กลุ่มกรุงธนเหนือ',
		districts: [
			'ธนบุรี',
			'คลองสาน',
			'จอมทอง',
			'บางกอกใหญ่',
			'บางกอกน้อย',
			'บางพลัด',
			'ตลิ่งชัน',
			'ทวีวัฒนา'
		]
	},
	{
		name: 'กลุ่มกรุงธนใต้',
		districts: [
			'ภาษีเจริญ',
			'บางแค',
			'หนองแขม',
			'บางขุนเทียน',
			'บางบอน',
			'ราษฎร์บูรณะ',
			'ทุ่งครุ'
		]
	}
];

const formatNumber = (value: number) => Math.round(value).toLocaleString('th-TH');

const formatPercent = (value: number, fractionDigits = 1) =>
	`${Math.max(0, Math.min(100, value)).toLocaleString('th-TH', {
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits
	})}%`;

const getProgress = (voting: Voting) => voting.progress ?? 100;

const getSortedResults = (voting: Voting) => [...voting.result].sort((a, b) => b.count - a.count);

const getCandidatePercent = (count: number, voting: Voting) =>
	voting.totalVotes > 0 ? (count / voting.totalVotes) * 100 : 0;

const getTopResults = (voting: Voting) => getSortedResults(voting).slice(0, TOP_CANDIDATE_COUNT);

const getPresetByCandidateData = (config: Config, candidateDataFileName: string) =>
	config.presetIndexes.find((presetIndex) =>
		presetIndex.candidateDataUrl.includes(candidateDataFileName)
	);

const Slideshow: FunctionComponent<SlideshowProps> = ({ config }) => {
	const [pageIndex, setPageIndex] = useState(0);
	const [governorPreset, setGovernorPreset] = useState<Preset | null>(null);
	const [bmcPreset, setBmcPreset] = useState<Preset | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const timer = setInterval(() => {
			setPageIndex((current) => (current + 1) % (DISTRICT_GROUPS.length + 1));
		}, PAGE_INTERVAL_MS);

		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		const governorPresetIndex = getPresetByCandidateData(config, '69-governor-candidates.json');
		const bmcPresetIndex = getPresetByCandidateData(config, '69-bmc-candidates.json');
		let isCancelled = false;
		let timer: ReturnType<typeof setTimeout> | null = null;

		const loadPresets = (showLoading: boolean) => {
			if (!governorPresetIndex || !bmcPresetIndex) return Promise.resolve();
			if (showLoading) setIsLoading(true);

			return Promise.all([fetchPreset(governorPresetIndex), fetchPreset(bmcPresetIndex)])
				.then(([newGovernorPreset, newBmcPreset]) => {
					if (isCancelled) return;
					setGovernorPreset(newGovernorPreset);
					setBmcPreset(newBmcPreset);
				})
				.catch((error) => {
					console.error('Failed to fetch slideshow presets', error);
				})
				.finally(() => {
					if (!isCancelled && showLoading) setIsLoading(false);
				});
		};

		const scheduleRefresh = () => {
			const refreshIntervalMs = Math.min(
				governorPresetIndex?.refreshIntervalMs || PAGE_INTERVAL_MS,
				bmcPresetIndex?.refreshIntervalMs || PAGE_INTERVAL_MS
			);

			timer = setTimeout(() => {
				loadPresets(false).then(() => {
					if (!isCancelled) scheduleRefresh();
				});
			}, refreshIntervalMs);
		};

		loadPresets(true).then(() => {
			if (!isCancelled) scheduleRefresh();
		});

		return () => {
			isCancelled = true;
			if (timer) clearTimeout(timer);
		};
	}, [config]);

	const currentGroup = pageIndex > 0 ? DISTRICT_GROUPS[pageIndex - 1] : null;
	const activePreset = pageIndex === 0 ? governorPreset : bmcPreset;

	if (isLoading || !governorPreset || !bmcPreset || !activePreset) {
		return (
			<div className="flex-1 flex items-center justify-center bg-black">
				<div className="scale-50">
					<div className="loader-spinner" />
				</div>
			</div>
		);
	}

	return (
		<presetContext.Provider value={activePreset}>
			<div className="flex-1 min-h-0 flex flex-col bg-black text-white overflow-hidden">
				{pageIndex === 0 ? (
					<GovernorSlide preset={governorPreset} pageIndex={pageIndex} />
				) : (
					currentGroup && (
						<CouncilGroupSlide preset={bmcPreset} group={currentGroup} pageIndex={pageIndex} />
					)
				)}
			</div>
			<Footer />
		</presetContext.Provider>
	);
};

interface SlideHeaderProps {
	title: string;
	subtitle?: string;
	pageIndex: number;
}

const SlideHeader: FunctionComponent<SlideHeaderProps> = ({ title, subtitle, pageIndex }) => (
	<div className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-white/20 pb-3">
		<div>
			<p className="typo-u4 text-white/60">slide show {pageIndex + 1} / 7</p>
			<h1 className="typo-h4 md:typo-h3">{title}</h1>
			{subtitle && <p className="typo-u4 text-white/70 mt-1">{subtitle}</p>}
		</div>
	</div>
);

interface GovernorSlideProps {
	preset: Preset;
	pageIndex: number;
}

const GovernorSlide: FunctionComponent<GovernorSlideProps> = ({ preset, pageIndex }) => (
	<div className="w-[90vw] mx-auto flex-1 min-h-0 py-5 lg:py-8 flex flex-col gap-4">
		<SlideHeader title={preset.fullname} pageIndex={pageIndex} />
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-0">
			<div className="lg:col-span-2 min-h-0 flex flex-col">
				<h2 className="typo-h5 mb-3">คะแนนรวมทั้ง กทม.</h2>
				<CompactCandidateGrid voting={preset.electionData.total} preset={preset} />
			</div>
			<div className="min-h-0 flex flex-col">
				<div className="flex-1 min-h-[260px]" />
				<div className="h-[38vh] min-h-[260px] max-h-[420px] border-t border-white/20 pt-3">
					<h2 className="typo-h5 mb-2">กริดผู้ชนะรายเขต</h2>
					<LazyloadContainer>
						<GridWinner />
					</LazyloadContainer>
				</div>
			</div>
		</div>
	</div>
);

interface CompactCandidateGridProps {
	voting: Voting;
	preset: Preset;
}

const CompactCandidateGrid: FunctionComponent<CompactCandidateGridProps> = ({ voting, preset }) => {
	const results = useMemo(() => getSortedResults(voting), [voting]);
	const topVoteCount = Math.max(...results.map((result) => result.count), 1);

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-5 gap-y-4 overflow-y-auto hide-scrollbar pr-1">
			{results.map((result, index) => (
				<CandidateScoreCard
					key={result.candidateId}
					candidate={preset.candidateMap[result.candidateId]}
					result={result}
					voting={voting}
					topVoteCount={topVoteCount}
					showImage={index < TOP_CANDIDATE_COUNT}
					strip={preset.electionData.type === ElectionDataType.Live}
				/>
			))}
		</div>
	);
};

interface CandidateScoreCardProps {
	candidate: Candidate;
	result: Result;
	voting: Voting;
	topVoteCount: number;
	showImage: boolean;
	strip: boolean;
}

const CandidateScoreCard: FunctionComponent<CandidateScoreCardProps> = ({
	candidate,
	result,
	voting,
	topVoteCount,
	showImage,
	strip
}) => (
	<div className="border-b border-white/15 pb-3 min-w-0">
		<div className="flex items-start gap-3 min-h-[64px]">
			<div
				className="w-9 h-9 shrink-0 flex items-center justify-center typo-u4 font-semibold text-black"
				style={{ backgroundColor: candidate.color || '#ffffff' }}
			>
				{candidate.number || '-'}
			</div>
			<div className="min-w-0 flex-1">
				<p className="typo-u4 font-semibold leading-tight break-words">{candidate.fullname}</p>
				<p className="typo-footer text-white/60 leading-tight mt-1 break-words">{candidate.party || '-'}</p>
				<div className="flex items-end justify-between gap-2 mt-2">
					<p className="typo-h5">{formatNumber(result.count)}</p>
					<p className="typo-u4 text-white/70">{formatPercent(getCandidatePercent(result.count, voting))}</p>
				</div>
			</div>
			{showImage && candidate.image && (
				<img
					src={candidate.image}
					alt={candidate.fullname}
					className="h-16 w-16 shrink-0 object-cover object-top rounded-full bg-white/10"
				/>
			)}
		</div>
		<div className="h-2 mt-3 bg-white/10">
			<Progress
				progressItems={
					[
						{
							color: candidate.color || '#ffffff',
							percent: topVoteCount > 0 ? result.count / topVoteCount : 0,
							strip
						}
					] as ProgressItem[]
				}
				className="relative p-0"
			/>
		</div>
	</div>
);

interface CouncilGroupSlideProps {
	preset: Preset;
	group: DistrictGroup;
	pageIndex: number;
}

const CouncilGroupSlide: FunctionComponent<CouncilGroupSlideProps> = ({ preset, group, pageIndex }) => {
	const districtMap = useMemo(
		() => new Map(preset.electionData.districts.map((district) => [district.name, district])),
		[preset]
	);
	const districts = group.districts
		.map((districtName) => districtMap.get(districtName))
		.filter((district): district is District => Boolean(district));

	return (
		<div className="w-[90vw] mx-auto flex-1 min-h-0 py-5 lg:py-8 flex flex-col gap-4">
			<SlideHeader title={preset.fullname} subtitle={group.name} pageIndex={pageIndex} />
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 auto-rows-fr gap-3 flex-1 min-h-0 overflow-hidden">
				{districts.map((district) => (
					<DistrictResultCard key={district.name} district={district} preset={preset} />
				))}
			</div>
		</div>
	);
};

interface DistrictResultCardProps {
	district: District;
	preset: Preset;
}

const DistrictResultCard: FunctionComponent<DistrictResultCardProps> = ({ district, preset }) => {
	const topResults = getTopResults(district.voting);
	const winner = topResults[0] ? preset.candidateMap[topResults[0].candidateId] : null;

	return (
		<div className="border border-white/20 p-2.5 flex flex-col min-h-0 bg-white/[0.03] overflow-hidden">
			<div className="flex items-start gap-2">
				<div className="min-w-0 flex-1">
					<h2 className="text-[18px] font-semibold leading-tight break-words">เขต{district.name}</h2>
					<p className="typo-footer text-white/60 mt-1">
						ผู้มีสิทธิ์ {formatNumber(district.voting.eligiblePopulation)} คน
					</p>
					<p className="typo-footer text-white/60">
						นับแล้ว {formatPercent(getProgress(district.voting))}
					</p>
				</div>
				{winner?.image && (
					<img
						src={winner.image}
						alt={winner.fullname}
						className="h-12 w-12 shrink-0 rounded-full object-cover object-top bg-white/10"
					/>
				)}
			</div>
			<div className="mt-2 space-y-1.5">
				{topResults.map((result, index) => {
					const candidate = preset.candidateMap[result.candidateId];
					return (
						<div
							key={result.candidateId}
							className="grid grid-cols-[18px,1fr,auto] gap-1.5 items-center text-[13px] leading-tight"
						>
							<span
								className="h-3 w-3"
								style={{ backgroundColor: candidate.color || '#ffffff' }}
							/>
							<span className="font-semibold truncate">
								{index + 1}. {candidate.fullname}
							</span>
							<span className="font-semibold">{formatNumber(result.count)}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default Slideshow;
