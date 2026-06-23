import React, { FunctionComponent, lazy, useEffect, useMemo, useState } from 'react';
import { Config } from '../contexts/config';
import { Preset, presetContext } from '../contexts/preset';
import { Candidate } from '../models/candidate';
import { District, ElectionDataType, Result, Voting } from '../models/election';
import { getVotingProgress, isVotingComplete } from '../utils/election';
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

const PAGE_COUNT = DISTRICT_GROUPS.length + 1;

const formatNumber = (value: number) => Math.round(value).toLocaleString('th-TH');

const formatPercent = (value: number, fractionDigits = 1) =>
	`${Math.max(0, Math.min(100, value)).toLocaleString('th-TH', {
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits
	})}%`;

const formatLastUpdatedAt = (lastUpdatedAt?: string) =>
	lastUpdatedAt
		? new Date(lastUpdatedAt).toLocaleString('th-TH', {
			dateStyle: 'short',
			timeStyle: 'short'
		})
		: '-';

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
		const timer = setTimeout(() => {
			setPageIndex((current) => (current + 1) % PAGE_COUNT);
		}, PAGE_INTERVAL_MS);

		return () => clearTimeout(timer);
	}, [pageIndex]);

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
			<div className="flex-1 min-h-0 flex flex-col bg-black text-white overflow-hidden" style={{ fontFamily: 'Anuphan' }}>
				{pageIndex === 0 ? (
					<GovernorSlide
						preset={governorPreset}
						pageIndex={pageIndex}
						onPageChange={setPageIndex}
					/>
				) : (
					currentGroup && (
						<CouncilGroupSlide
							preset={bmcPreset}
							group={currentGroup}
							pageIndex={pageIndex}
							onPageChange={setPageIndex}
						/>
					)
				)}
			</div>
			{pageIndex === 0 && <Footer />}
		</presetContext.Provider>
	);
};

interface SlideHeaderProps {
	title: string;
	subtitle?: string;
	pageIndex: number;
	onPageChange: (pageIndex: number) => void;
}

const SlideHeader: FunctionComponent<SlideHeaderProps> = ({
	title,
	subtitle,
	pageIndex,
	onPageChange
}) => (
	<div className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-white/20 pb-3">
		<div>
			<p className="typo-u4 text-white/60">slide show {pageIndex + 1} / 7</p>
			<h1 className="typo-h4 md:typo-h3">{title}</h1>
			{subtitle && <p className="typo-u4 text-white/70 mt-1">{subtitle}</p>}
		</div>
		<SlideControls pageIndex={pageIndex} onPageChange={onPageChange} />
	</div>
);

interface SlideControlsProps {
	pageIndex: number;
	onPageChange: (pageIndex: number) => void;
}

const SlideControls: FunctionComponent<SlideControlsProps> = ({ pageIndex, onPageChange }) => {
	const goToPrevious = () => onPageChange((pageIndex + PAGE_COUNT - 1) % PAGE_COUNT);
	const goToNext = () => onPageChange((pageIndex + 1) % PAGE_COUNT);

	return (
		<div className="flex items-center gap-3 shrink-0">
			<button
				type="button"
				aria-label="ไปหน้าก่อนหน้า"
				className="h-7 w-7 flex items-center justify-center border border-white/30 text-white/80 hover:bg-white hover:text-black"
				onClick={goToPrevious}
			>
				‹
			</button>
			<div className="flex items-center gap-2">
				{Array.from({ length: PAGE_COUNT }, (_, index) => (
					<button
						key={index}
						type="button"
						aria-label={`ไป slide ${index + 1}`}
						className={`h-3 w-3 rounded-full border border-white/70 ${index === pageIndex ? 'bg-white' : 'bg-transparent hover:bg-white/40'
							}`}
						onClick={() => onPageChange(index)}
					/>
				))}
			</div>
			<button
				type="button"
				aria-label="ไปหน้าถัดไป"
				className="h-7 w-7 flex items-center justify-center border border-white/30 text-white/80 hover:bg-white hover:text-black"
				onClick={goToNext}
			>
				›
			</button>
		</div>
	);
};

interface GovernorSlideProps {
	preset: Preset;
	pageIndex: number;
	onPageChange: (pageIndex: number) => void;
}

const GovernorSlide: FunctionComponent<GovernorSlideProps> = ({
	preset,
	pageIndex,
	onPageChange
}) => (
	<div className="w-[90vw] mx-auto flex-1 min-h-0 py-5 lg:py-8 flex flex-col gap-4">
		<SlideHeader title={preset.fullname} pageIndex={pageIndex} onPageChange={onPageChange} />
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-0">
			<div className="lg:col-span-2 min-h-0 flex flex-col">
				<GovernorCandidateColumns voting={preset.electionData.total} preset={preset} />
			</div>
			<div className="min-h-0 flex flex-col">
				<div className="h-[38vh] min-h-[260px] max-h-[420px] pt-3">
					<h2 className="typo-h5 mb-2">ผู้ชนะรายเขต</h2>
					<LazyloadContainer>
						<GridWinner />
					</LazyloadContainer>
				</div>
			</div>
		</div>
	</div>
);

interface GovernorCandidateColumnsProps {
	voting: Voting;
	preset: Preset;
}

const GovernorCandidateColumns: FunctionComponent<GovernorCandidateColumnsProps> = ({
	voting,
	preset
}) => {
	const results = useMemo(() => getSortedResults(voting), [voting]);
	const topVoteCount = Math.max(...results.map((result) => result.count), 1);
	const columnSize = Math.ceil(results.length / 3);
	const columns = [0, 1, 2].map((columnIndex) =>
		results.slice(columnIndex * columnSize, (columnIndex + 1) * columnSize)
	);

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5 overflow-hidden">
			{columns.map((columnResults, columnIndex) => (
				<div key={columnIndex} className="min-w-0 overflow-hidden">
					<div className="grid grid-cols-[24px,1fr,72px,44px] gap-1.5 typo-footer text-white/60 border-b border-white/30 pb-1 mb-2">
						<span>เบอร์</span>
						<span>ชื่อผู้สมัคร</span>
						<span className="text-right">คะแนนเสียง</span>
						<span className="text-right">%</span>
					</div>
					<div className="space-y-2.5">
						{columnResults.map((result, rowIndex) => {
							const globalIndex = columnIndex * columnSize + rowIndex;

							return (
								<GovernorCandidateRow
									key={result.candidateId}
									candidate={preset.candidateMap[result.candidateId]}
									result={result}
									voting={voting}
									topVoteCount={topVoteCount}
									showImage={globalIndex < TOP_CANDIDATE_COUNT}
									strip={preset.electionData.type === ElectionDataType.Live}
								/>
							);
						})}
					</div>
				</div>
			))}
		</div>
	);
};

interface GovernorCandidateRowProps {
	candidate: Candidate;
	result: Result;
	voting: Voting;
	topVoteCount: number;
	showImage: boolean;
	strip: boolean;
}

const GovernorCandidateRow: FunctionComponent<GovernorCandidateRowProps> = ({
	candidate,
	result,
	voting,
	topVoteCount,
	showImage,
	strip
}) => (
	<div className="min-w-0">
		<div className="grid grid-cols-[24px,1fr,72px,44px] gap-1.5 items-start text-[12px] leading-tight">
			<span>{candidate.number || '-'}</span>
			<span className="font-semibold break-words">{candidate.fullname}</span>
			<span className="text-right font-semibold whitespace-nowrap">{formatNumber(result.count)}</span>
			<span className="text-right text-white/80 whitespace-nowrap">
				{formatPercent(getCandidatePercent(result.count, voting))}
			</span>
		</div>
		<div
			className={`mt-2 bg-white/10 overflow-hidden ${showImage ? 'h-9' : 'h-1.5'
				}`}
		>
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
			>
				{showImage && candidate.image && (
					<img
						src={candidate.image}
						alt={candidate.fullname}
						className="h-10 absolute right-2 bottom-0 object-cover"
					/>
				)}
			</Progress>
		</div>
	</div>
);

interface CouncilGroupSlideProps {
	preset: Preset;
	group: DistrictGroup;
	pageIndex: number;
	onPageChange: (pageIndex: number) => void;
}

const CouncilGroupSlide: FunctionComponent<CouncilGroupSlideProps> = ({
	preset,
	group,
	pageIndex,
	onPageChange
}) => {
	const districtMap = useMemo(
		() => new Map(preset.electionData.districts.map((district) => [district.name, district])),
		[preset]
	);
	const districts = group.districts
		.map((districtName) => districtMap.get(districtName))
		.filter((district): district is District => Boolean(district));

	return (
		<div className="w-[90vw] mx-auto flex-1 min-h-0 py-5 lg:py-8 flex flex-col gap-4">
			<SlideHeader
				title={preset.fullname}
				subtitle={group.name}
				pageIndex={pageIndex}
				onPageChange={onPageChange}
			/>
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 auto-rows-fr gap-3 flex-1 min-h-0 overflow-hidden">
				{districts.map((district) => (
					<DistrictResultCard key={district.name} district={district} preset={preset} />
				))}
			</div>
			<CouncilPartyLegend districts={districts} preset={preset} />
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
	const winnerResult = topResults[0];
	const topVoteCount = Math.max(...topResults.map((result) => result.count), 1);
	const complete = isVotingComplete(district.voting);

	return (
		<div className="border border-white/20 p-3 flex flex-col min-h-0 bg-white/[0.03] overflow-hidden">
			<div className="flex items-start gap-2">
				<div className="min-w-0 flex-1">
					<h2 className="text-[18px] font-semibold leading-tight break-words">เขต{district.name}</h2>
					<p className="typo-footer text-white/60 mt-1">
						ผู้มีสิทธิ์ {formatNumber(district.voting.eligiblePopulation)} คน
					</p>
				</div>
				{winner?.image && winnerResult && winnerResult.count > 0 && (
					<img
						src={winner.image}
						alt={winner.fullname}
						className="h-12 w-12 shrink-0 rounded-full object-cover object-top bg-white/10"
					/>
				)}
			</div>
			<div className="mt-2">
				<div className="h-2 bg-white/15">
					<Progress
						progressItems={
							[
								{
									color: '#ffffff',
									percent: Math.max(0.01, getVotingProgress(district.voting) / 100),
									strip: !complete
								}
							] as ProgressItem[]
						}
						className="relative p-0"
					/>
				</div>
				<div className="flex items-center justify-between gap-2 typo-footer text-white/70 mb-1 mt-3">
					<span>นับแล้ว {formatPercent(getVotingProgress(district.voting))}</span>
				</div>


			</div>
			<div className="mt-3 space-y-3">
				{topResults.map((result, index) => {
					const candidate = preset.candidateMap[result.candidateId];
					return (
						<div key={result.candidateId}>
							<div className="grid grid-cols-[1fr,auto,auto] gap-2 items-baseline text-[13px] leading-tight">
								<span className="font-semibold truncate">
									{parseInt(result.candidateId.split('-').pop() || '0', 10)} - {candidate.fullname}
								</span>
								<span className="font-semibold">{formatNumber(result.count)}</span>
								<span className="text-white/70">
									{formatPercent(getCandidatePercent(result.count, district.voting))}
								</span>
							</div>
							<div
								className={`h-2 mt-1 ${result.count > 0 ? '' : 'bg-white/10'
									}`}
							>
								<Progress
									progressItems={
										[
											{
												color: candidate.color || '#ffffff',
												percent: result.count > 0 ? result.count / topVoteCount : 0,
												strip: !complete
											}
										] as ProgressItem[]
									}
									className="relative p-0"
								/>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

interface CouncilPartyLegendProps {
	districts: District[];
	preset: Preset;
}

const CouncilPartyLegend: FunctionComponent<CouncilPartyLegendProps> = ({ districts, preset }) => {
	const labels = useMemo(() => {
		const labelMap = new Map<string, string>();

		districts.forEach((district) => {
			getTopResults(district.voting).forEach((result) => {
				const candidate = preset.candidateMap[result.candidateId];
				if (!candidate || result.count <= 0) return;
				if (!labelMap.has(candidate.color)) {
					labelMap.set(candidate.color, candidate.party || 'อิสระ');
				}
			});
		});

		return Array.from(labelMap.entries()).map(([color, label]) => ({ color, label }));
	}, [districts, preset]);

	return (
		<div className="border-t border-white/20 pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 typo-footer text-white/80">
			<span className="font-semibold text-white">สีสังกัด</span>
			{labels.length === 0 ? (
				<span className="text-white/60">ยังไม่มีคะแนนสำหรับแสดงสีสังกัด</span>
			) : (
				labels.map(({ color, label }) => (
					<div key={`${color}-${label}`} className="flex items-center gap-1.5">
						<span className="h-3 w-3 shrink-0" style={{ backgroundColor: color }} />
						<span>{label}</span>
					</div>
				))
			)}
			<span className="ml-auto text-white/70">
				อัปเดตล่าสุด {formatLastUpdatedAt(preset.electionData.lastUpdatedAt)}
			</span>
		</div>
	);
};

export default Slideshow;
