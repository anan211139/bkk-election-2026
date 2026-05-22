import React, { FunctionComponent } from 'react';
import { ElectionDataType, Voting } from '../models/election';

interface CountingSummaryProps {
	votingData: Voting;
	electionType?: ElectionDataType;
	lastUpdatedAt?: string;
	compact?: boolean;
}

interface SummaryItem {
	label: string;
	value: string;
}

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const formatNumber = (value: number) => Math.round(value).toLocaleString('th-TH');

const formatPercent = (value: number, fractionDigits = 1) =>
	`${clampPercent(value).toLocaleString('th-TH', {
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits
	})}%`;

const percentOf = (value: number, total: number) => (total > 0 ? (value / total) * 100 : 0);

const getGoodVotes = (votingData: Voting) =>
	Math.max(0, votingData.totalVotes - (votingData.badVotes || 0) - (votingData.noVotes || 0));

const getProgress = (votingData: Voting) => votingData.progress ?? 100;

const getReportedUnits = (votingData: Voting) => {
	const total = votingData.pollingUnits?.total || 0;
	const reported =
		votingData.pollingUnits?.reported ?? (total > 0 ? Math.round((total * getProgress(votingData)) / 100) : 0);

	return {
		total,
		reported: Math.max(0, Math.min(total, reported)),
		unreported: Math.max(0, total - reported)
	};
};

const CountingSummary: FunctionComponent<CountingSummaryProps> = ({
	votingData,
	electionType,
	lastUpdatedAt,
	compact
}) => {
	const progress = getProgress(votingData);
	const shouldShowProgressStrip = electionType !== ElectionDataType.Completed;
	const countedVotes = Math.round((votingData.totalVotes * progress) / 100);
	const goodVotes = getGoodVotes(votingData);
	const badVotes = votingData.badVotes || 0;
	const noVotes = votingData.noVotes || 0;
	const turnoutPercent = percentOf(votingData.totalVotes, votingData.eligiblePopulation);
	const units = getReportedUnits(votingData);

	const items: SummaryItem[] = [
		{ label: 'จำนวนที่นับไปแล้ว', value: formatNumber(countedVotes) },
		{ label: '% ที่นับไปแล้ว', value: formatPercent(progress) },
		{ label: 'บัตรดี', value: `${formatNumber(goodVotes)} (${formatPercent(percentOf(goodVotes, votingData.totalVotes))})` },
		{ label: 'บัตรเสีย', value: `${formatNumber(badVotes)} (${formatPercent(percentOf(badVotes, votingData.totalVotes))})` },
		{ label: 'ไม่ประสงค์ลงคะแนน', value: formatNumber(noVotes) },
		{ label: 'ผู้มีสิทธิ์เลือกตั้งทั้งหมด', value: formatNumber(votingData.eligiblePopulation) },
		{
			label: 'ผู้มาใช้สิทธิ์เลือกตั้ง',
			value: `${formatNumber(votingData.totalVotes)} (${formatPercent(turnoutPercent)})`
		},
		{ label: 'จำนวนหน่วยทั้งหมด', value: units.total ? formatNumber(units.total) : '-' },
		{ label: 'หน่วยที่รายงานแล้ว', value: units.total ? formatNumber(units.reported) : '-' },
		{ label: 'หน่วยที่ยังไม่รายงาน', value: units.total ? formatNumber(units.unreported) : '-' }
	];

	return (
		<div className={`font-body ${compact ? 'typo-footer' : 'typo-u4'}`}>
			<div className="flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-6 justify-between mb-6">
				<div className="min-w-[240px] lg:min-w-[320px]">
					<div className="font-semibold mb-2">
						นับคะแนนแล้ว {formatNumber(countedVotes)} ใบ ({formatPercent(progress)})
					</div>
					<div className="h-2 w-full bg-white bg-opacity-30 relative overflow-hidden">
						<div
							className="absolute h-full left-0 bg-white"
							style={{ width: `${clampPercent(progress)}%` }}
						>
							{shouldShowProgressStrip && (
								<div
									className="absolute inset-0 opacity-20"
									style={{ backgroundImage: `url(/map/images/strip-black.gif)` }}
								/>
							)}
						</div>
					</div>
				</div>

				{lastUpdatedAt && (
					<div className="shrink-0">
						<p className="opacity-70">อัปเดตล่าสุด</p>
						<p>
							{new Date(lastUpdatedAt).toLocaleString('th-TH', {
								dateStyle: 'short',
								timeStyle: 'short'
							})}
						</p>
					</div>
				)}
			</div>

			<div
				className={`grid mt-3 gap-x-5 gap-y-2 ${
					compact
						? 'grid-flow-col auto-cols-[minmax(120px,auto)] overflow-x-auto hide-scrollbar pb-1 lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-5 lg:overflow-visible'
						: 'grid-cols-2 xl:grid-cols-3'
				}`}
			>
				{items.map(({ label, value }) => (
					<div key={label} className="border-l border-white/30 pl-2">
						<p className={`opacity-70 ${compact ? 'whitespace-nowrap' : 'leading-tight'}`}>
							{label}
						</p>
						<p className={`font-semibold ${compact ? 'whitespace-nowrap' : 'break-words'}`}>
							{value}
						</p>
					</div>
				))}
			</div>
		</div>
	);
};

export default CountingSummary;
