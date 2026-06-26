import { FunctionComponent, useEffect, useMemo, useState } from 'react';
import Modal from './Modal';

interface ElectionCloseCountdownModalProps {
	onClose: () => void;
}

interface CountdownTime {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
	isComplete: boolean;
}

const ELECTION_CLOSE_TIME = new Date('2026-06-28T17:00:00+07:00').getTime();
const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const ElectionCloseCountdownModal: FunctionComponent<ElectionCloseCountdownModalProps> = ({
	onClose
}) => {
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now()), SECOND_MS);
		return () => clearInterval(timer);
	}, []);

	const countdown = useMemo(() => getCountdownTime(ELECTION_CLOSE_TIME - now), [now]);

	useEffect(() => {
		if (countdown.isComplete) onClose();
	}, [countdown.isComplete, onClose]);

	if (countdown.isComplete) return null;

	return (
		<Modal
			title="นับถอยหลังปิดหีบเลือกตั้ง"
			subtitle="28 มิถุนายน 2569 เวลา 17.00 น."
			onClose={onClose}
			containerClassName="z-[60]"
			className="max-w-5xl md:w-auto md:min-w-[56rem] border-white/80 bg-black/95 text-white font-body shadow-2xl shadow-black/70 [&_h5]:font-heading [&_h5]:text-white [&_h5]:font-semibold [&_h5]:pr-14 [&_p]:text-white"
		>
			<div className="flex flex-col gap-8 text-center">
				<div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
					<CountdownUnit value={countdown.days} label="วัน" />
					<CountdownUnit value={countdown.hours} label="ชั่วโมง" />
					<CountdownUnit value={countdown.minutes} label="นาที" />
					<CountdownUnit value={countdown.seconds} label="วินาที" />
				</div>
				<p className="border-t border-white/20 pt-6 font-semibold leading-tight md:whitespace-nowrap">
					คะแนนจะเริ่มแสดงผลเมื่อปิดหีบเลือกตั้ง
				</p>
			</div>
		</Modal>
	);
};

const CountdownUnit: FunctionComponent<{ value: number; label: string }> = ({ value, label }) => (
	<div className="min-w-[8rem] rounded-md border border-white/30 bg-white/10 text-white px-3 py-5 md:min-w-[10rem] md:px-4 md:py-6">
		<div className="font-heading font-semibold tabular-nums text-5xl leading-none md:text-7xl">
			{value.toString().padStart(2, '0')}
		</div>
		<div className="mt-3 font-body text-sm font-semibold md:text-base">{label}</div>
	</div>
);

function getCountdownTime(remainingMs: number): CountdownTime {
	if (remainingMs <= 0) {
		return {
			days: 0,
			hours: 0,
			minutes: 0,
			seconds: 0,
			isComplete: true
		};
	}

	const days = Math.floor(remainingMs / DAY_MS);
	const hours = Math.floor((remainingMs % DAY_MS) / HOUR_MS);
	const minutes = Math.floor((remainingMs % HOUR_MS) / MINUTE_MS);
	const seconds = Math.floor((remainingMs % MINUTE_MS) / SECOND_MS);

	return {
		days,
		hours,
		minutes,
		seconds,
		isComplete: false
	};
}

export default ElectionCloseCountdownModal;
