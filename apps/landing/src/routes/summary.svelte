<script lang="ts">
	import { onMount } from 'svelte';
	import Metadata from '../components/metadata.svelte';

	interface Candidate {
		id: string;
		number?: number;
		fullname: string;
		shortname: string;
		color: string;
		party?: string;
		image?: string;
	}

	type CandidateMap = Record<string, Candidate>;

	interface SummaryStat {
		label: string;
		value: number | string;
		unit?: string;
	}

	interface Winner {
		candidateId: string;
		count: number;
	}

	interface DistrictWinner extends Winner {
		districtName: string;
		announcementStats?: SummaryStat[];
	}

	interface FinalSummaryData {
		title: string;
		subtitle?: string;
		sourceLabel?: string;
		lastUpdatedAt?: string;
		announcementStats: SummaryStat[];
		governor: Winner;
		councilDistricts: DistrictWinner[];
	}

	const numberFormatter = new Intl.NumberFormat('th-TH');

	let summary: FinalSummaryData | null = null;
	let governorCandidates: CandidateMap = {};
	let councilCandidates: CandidateMap = {};
	let selectedDistrictName = '';
	let districtFilterText = 'ทุกเขต';
	let isDistrictDropdownOpen = false;
	let shouldShowAllDistrictOptions = true;
	let error = '';

	onMount(async () => {
		try {
			const [summaryResponse, governorResponse, councilResponse] = await Promise.all([
				fetch('/data/69-final-summary.json', { cache: 'no-store' }),
				fetch('/map/data/69-governor-candidates.json'),
				fetch('/map/data/69-bmc-candidates.json')
			]);

			if (!summaryResponse.ok || !governorResponse.ok || !councilResponse.ok) {
				throw new Error('Failed to fetch summary data');
			}

			summary = await summaryResponse.json();
			governorCandidates = await governorResponse.json();
			councilCandidates = await councilResponse.json();
		} catch (loadError) {
			console.error(loadError);
			error = 'ไม่สามารถโหลดข้อมูลประกาศผลได้';
		}
	});

	$: governorCandidate = summary ? governorCandidates[summary.governor.candidateId] : undefined;
	$: sortedCouncilDistricts = [...(summary?.councilDistricts || [])].sort((a, b) =>
		a.districtName.localeCompare(b.districtName, 'th')
	);
	$: filteredCouncilDistricts = selectedDistrictName
		? sortedCouncilDistricts.filter((winner) => winner.districtName === selectedDistrictName)
		: sortedCouncilDistricts;
	$: districtOptions = [
		{ display: 'ทุกเขต', value: '' },
		...sortedCouncilDistricts.map((winner) => ({
			display: winner.districtName,
			value: winner.districtName
		}))
	];
	$: displayDistrictOptions = shouldShowAllDistrictOptions
		? districtOptions
		: districtOptions.filter((option) =>
				option.display
					.toLocaleLowerCase('th-TH')
					.includes(districtFilterText.toLocaleLowerCase('th-TH'))
		  );

	const formatNumber = (value: number | string) =>
		typeof value === 'number' ? numberFormatter.format(value) : value;

	const formatDate = (value: string) =>
		new Date(value).toLocaleString('th-TH', {
			dateStyle: 'medium',
			timeStyle: 'short'
		});

	const getReadableTextColor = (color?: string) => {
		if (!color || !/^#[0-9a-f]{6}$/i.test(color)) return '#000000';

		const red = Number.parseInt(color.slice(1, 3), 16);
		const green = Number.parseInt(color.slice(3, 5), 16);
		const blue = Number.parseInt(color.slice(5, 7), 16);
		const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

		return luminance > 0.55 ? '#000000' : '#ffffff';
	};

	const selectDistrict = (districtName: string) => {
		selectedDistrictName = districtName;
		districtFilterText = districtName || 'ทุกเขต';
		isDistrictDropdownOpen = false;
		shouldShowAllDistrictOptions = true;
	};

	const onDistrictFilterInput = (value: string) => {
		districtFilterText = value;
		isDistrictDropdownOpen = true;
		shouldShowAllDistrictOptions = false;

		if (!value) {
			selectedDistrictName = '';
		}
	};

	const handleDistrictFilterInput = (event: Event) => {
		onDistrictFilterInput((event.currentTarget as HTMLInputElement).value);
	};

	const openDistrictDropdown = () => {
		isDistrictDropdownOpen = true;
		shouldShowAllDistrictOptions = true;
	};

	const toggleDistrictDropdown = () => {
		isDistrictDropdownOpen = !isDistrictDropdownOpen;
		shouldShowAllDistrictOptions = true;
	};
</script>

<Metadata title="ประกาศนับคะแนนครบทุกหน่วย - อย่างไม่เป็นทางการ" />

<svelte:head>
	<meta property="og:title" content="ประกาศนับคะแนนครบทุกหน่วย - อย่างไม่เป็นทางการ" />
</svelte:head>

<svelte:window on:click={() => (isDistrictDropdownOpen = false)} />

<div class="min-h-screen bg-black text-white font-body">
	{#if error}
		<div class="max-w-screen-md mx-auto px-5 py-24 text-center">
			<p class="typo-h4 font-semibold">{error}</p>
		</div>
	{:else if !summary}
		<div class="min-h-[70vh] flex items-center justify-center">
			<p class="typo-h5 font-semibold">กำลังโหลดข้อมูลประกาศผล...</p>
		</div>
	{:else}
		<section class="px-5 lg:px-12 py-5 lg:py-8 border-b border-white/20">
			<div class="max-w-[1440px] mx-auto">
				<div class="flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
					<div>
						<p class="typo-u4 opacity-70 mb-2">ประกาศนับคะแนนครบทุกหน่วย</p>
						<h1 class="font-heading text-[30px] md:text-[42px] lg:text-[56px] leading-[1.05]">
							{summary.title}
						</h1>
						{#if summary.subtitle}
							<p class="typo-u4 mt-3 max-w-3xl opacity-80">{summary.subtitle}</p>
						{/if}
					</div>
					
				</div>
			</div>
		</section>

		<section class="px-5 lg:px-12 py-6 lg:py-10">
			<div
				class="max-w-[1440px] mx-auto grid grid-cols-1 xl:grid-cols-[minmax(420px,0.9fr)_1.35fr] gap-6 lg:gap-10"
			>
				<div class="space-y-6">
					
<article class="border border-white/25 bg-white text-black overflow-hidden relative shadow-lg">
	<!-- แถบสีด้านล่างสุด -->
	<div
		class="h-3 absolute bottom-0 left-0 right-0 z-20"
		style={`background-color: ${governorCandidate?.color || '#ffffff'}`}
		aria-hidden="true"
	/>
	
	<div class="min-h-[420px] lg:min-h-[520px] flex flex-col relative z-10">
		<!-- 1. ส่วนหัวข้อและชื่อย่อด้านบน -->
		<div class="px-5 lg:px-7 pt-6 lg:pt-8 text-center bg-white relative z-10">
			<p class="typo-u4 opacity-70">คะแนนอันดับ 1 ของผู้ว่าฯ กทม.</p>
			<h2 class="font-heading text-[42px] lg:text-[64px] leading-none mt-2">
				{governorCandidate?.shortname ||
					governorCandidate?.fullname ||
					summary.governor.candidateId}
			</h2>
		</div>

		<!-- 2. ส่วนตรงกลาง: แบ่งเป็น 2 คอลัมน์ (ซ้าย: รูปผู้สมัครย่อขนาด, ขวา: เบอร์ขนาดใหญ่) -->
		<div class="grid grid-cols-2 flex-1 min-h-[180px] items-center px-6 lg:px-10 bg-white gap-4">
			<!-- ฝั่งซ้าย: รูปภาพผู้สมัคร (ย่อขนาดพอดี ไม่โดนขอบตัด) -->
			<div class="relative h-full w-full flex items-center justify-center max-h-[160px] lg:max-h-[220px]">
				{#if governorCandidate?.image}
					<img
						src={governorCandidate.image}
						alt={governorCandidate.fullname}
						class="max-h-full max-w-full object-contain object-bottom"
					/>
				{/if}
			</div>

			<!-- ฝั่งขวา: วงกลมตัวเลขเบอร์ขนาดใหญ่ (เด่นชัดเจนตาม layout ใหม่) -->
			<div class="flex items-center justify-center">
				<div
					class="w-24 h-24 lg:w-32 lg:h-32 rounded-full flex items-center justify-center font-bold text-[44px] lg:text-[60px] border-4 border-black shadow-md transition-transform"
					style={`background-color: ${governorCandidate?.color || '#ffffff'}; color: ${getReadableTextColor(governorCandidate?.color)}`}
				>
					{governorCandidate?.number || '-'}
				</div>
			</div>
		</div>

		<!-- 3. ส่วนข้อมูลคะแนนด้านล่าง (ฉากหลังดำ ตัวหนังสือขาว) -->
		<div class="relative bg-black text-white px-5 lg:px-7 pt-8 pb-8 lg:pb-10 text-center z-10">
			<p class="typo-u4 leading-tight">
				{governorCandidate?.fullname || summary.governor.candidateId}
			</p>
			<p class="typo-u4 opacity-80 mt-1">{governorCandidate?.party || 'ไม่ระบุพรรค'}</p>
			
			<p class="font-semibold text-[52px] lg:text-[72px] leading-none mt-4">
				{formatNumber(summary.governor.count)}
			</p>
			<p class="typo-u4 opacity-80 mt-1">คะแนน</p>
		</div>
	</div>
</article>


					<section class="border border-white/20 p-4 lg:p-5">
						<div class="flex items-baseline justify-between gap-4 mb-4">
							<h2 class="typo-h4 font-heading">ข้อมูลการเลือกตั้ง</h2>
							<p class="typo-footer opacity-70">ครบทุกหน่วย</p>
						</div>
						<div class="space-y-3">
							{#each summary.announcementStats as item, index}
								<div class="grid grid-cols-[auto_1fr_auto] gap-3 border-t border-white/15 pt-3">
									<span class="opacity-50">{index + 1}.</span>
									<p class="leading-tight">{item.label}</p>
									<p class="font-semibold whitespace-nowrap text-right">
										{formatNumber(item.value)} {item.unit || ''}
									</p>
								</div>
							{/each}
						</div>
					</section>
				</div>

				<div>
					<div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
						<div>
							<p class="typo-u4 opacity-70">คะแนนอันดับ 1 ของ ส.ก.</p>
							<h2 class="typo-h4 font-heading leading-tight">ผู้ได้คะแนนสูงสุดรายเขต</h2>
						</div>
						<div class="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-3">
							<label class="typo-footer opacity-70" for="district-filter">เลือกเขต</label>
							<div
								class="district-dropdown relative"
								id="district-filter"
								on:click|stopPropagation
							>
								<div
									class="district-dropdown-control"
									on:click={openDistrictDropdown}
								>
									<input
										placeholder="เขต"
										type="text"
										class="district-dropdown-input"
										value={districtFilterText}
										aria-label="เลือกเขตเพื่อกรองผล ส.ก."
										on:input={handleDistrictFilterInput}
									/>
									<button
										type="button"
										class:rotate-180={isDistrictDropdownOpen}
										class="district-dropdown-arrow"
										aria-label={isDistrictDropdownOpen ? 'ปิดรายการเขต' : 'เปิดรายการเขต'}
										on:click|stopPropagation={toggleDistrictDropdown}
									>
										<span aria-hidden="true" />
									</button>
								</div>

								{#if isDistrictDropdownOpen}
									<div class="district-dropdown-options">
										{#if displayDistrictOptions.length <= 0}
											<p class="district-dropdown-empty">ไม่พบข้อมูล</p>
										{/if}
										{#each displayDistrictOptions as option}
											<button
												type="button"
												class="district-dropdown-option"
												on:click={() => selectDistrict(option.value)}
											>
												{option.display}
											</button>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					</div>

					<div class="grid sm:grid-cols-2 2xl:grid-cols-3 gap-3">
						{#each filteredCouncilDistricts as winner}
							<details class="district-card border border-white/20">
								<summary class="district-summary p-3 min-h-[128px] flex gap-3 cursor-pointer">
									<div class="relative w-[72px] h-[72px] rounded-full shrink-0 bg-white/10 overflow-hidden border border-white/20">
										{#if councilCandidates[winner.candidateId]?.image}
											<img
												src={councilCandidates[winner.candidateId].image}
												alt={councilCandidates[winner.candidateId].fullname}
												class="absolute inset-0 w-full h-full object-cover object-top"
											/>
										{/if}
										<div
											class="absolute bottom-0 left-0 right-0 h-2"
											style={`background-color: ${
												councilCandidates[winner.candidateId]?.color || '#ffffff'
											}`}
										/>
									</div>
									<div class="min-w-0 flex-1 flex flex-col">
										<div class="flex items-start justify-between gap-2">
											<div class="min-w-0">
												<p class="typo-footer opacity-70 truncate">เขต{winner.districtName}</p>
												<h3 class="font-semibold leading-tight mt-1">
													{councilCandidates[winner.candidateId]?.fullname || winner.candidateId}
												</h3>
											</div>
											<div
												class="number-badge w-11 h-11 text-[20px]"
												style={`background-color: ${
													councilCandidates[winner.candidateId]?.color || '#ffffff'
												}; color: ${getReadableTextColor(councilCandidates[winner.candidateId]?.color)}`}
											>
												{councilCandidates[winner.candidateId]?.number || '-'}
											</div>
										</div>
										<div class="flex items-end justify-between gap-3 mt-auto">
											<div>
												<p class="font-semibold text-[26px] leading-none">{formatNumber(winner.count)}</p>
												<p class="typo-footer opacity-70">คะแนน</p>
											</div>
											<span class="district-expand-label typo-footer opacity-70 whitespace-nowrap">ดูข้อมูลเขต</span>
										</div>
									</div>
								</summary>
								

								<div class="border-t border-white/15 p-3 pt-2">
									{#if winner.announcementStats?.length}
										<div class="space-y-2">
											{#each winner.announcementStats as item, index}
												<div class="grid grid-cols-[auto_1fr_auto] gap-2">
													<span class="opacity-50">{index + 1}.</span>
													<p class="typo-footer leading-tight">{item.label}</p>
													<p class="typo-footer font-semibold whitespace-nowrap text-right">
														{formatNumber(item.value)} {item.unit || ''}
													</p>
												</div>
											{/each}
										</div>
									{:else}
										<p class="typo-footer opacity-70">
											รอข้อมูลสรุปประจำเขตจากไฟล์ JSON 100%
										</p>
									{/if}
								</div>
							</details>
						{/each}
					</div>
					
				</div>
				
			</div>
			<div class="typo-footer text-left lg:text-right opacity-80 mt-3">
				{#if summary.lastUpdatedAt}
					<p>อัปเดตล่าสุด {formatDate(summary.lastUpdatedAt)}</p>
				{/if}
			</div>
		</section>
	{/if}
</div>

<style>
	.number-badge {
		align-items: center;
		border: 2px solid #000000;
		border-radius: 9999px;
		display: flex;
		flex-shrink: 0;
		font-weight: 600;
		justify-content: center;
	}

	.district-summary {
		list-style: none;
	}

	.district-summary::-webkit-details-marker {
		display: none;
	}

	.district-card[open] .district-expand-label {
		opacity: 1;
	}

	.district-expand-label::after {
		content: ' +';
	}

	.district-card[open] .district-expand-label::after {
		content: ' -';
	}

	.district-dropdown {
		color: #000000;
		width: 200px;
	}

	.district-dropdown-control {
		align-items: center;
		background: #ffffff;
		border: 1px solid #9d9d9d;
		cursor: pointer;
		display: flex;
		padding: 10px;
		width: 200px;
	}

	.district-dropdown-input {
		border: 0;
		color: #000000;
		flex: 1;
		font-family: Anuphan, ui-serif;
		font-size: 15pt;
		font-weight: 600;
		min-width: 0;
		outline: 0;
		text-align: left;
		width: 100%;
	}

	.district-dropdown-arrow {
		align-items: center;
		display: flex;
		height: 20px;
		justify-content: center;
		transition: transform 150ms;
		width: 20px;
	}

	.district-dropdown-arrow span {
		border-left: 6.5px solid transparent;
		border-right: 6.5px solid transparent;
		border-top: 11.25px solid #9d9d9d;
		display: block;
		height: 0;
		width: 0;
	}

	.district-dropdown-options {
		background: #ffffff;
		border: 1px solid #dadada;
		border-radius: 2px;
		left: -25px;
		margin-top: 5px;
		max-height: 300px;
		overflow-y: auto;
		padding: 5px 15px;
		position: absolute;
		width: 250px;
		z-index: 20;
	}

	.district-dropdown-empty {
		font-family: Anuphan, ui-serif;
		font-size: 12pt;
		text-align: left;
	}

	.district-dropdown-option {
		border-bottom: 1px solid #dadada;
		color: #000000;
		display: block;
		font-family: Anuphan, ui-serif;
		font-size: 12pt;
		font-weight: 600;
		padding: 10px 0;
		text-align: left;
		width: 100%;
	}

	.district-dropdown-option:hover {
		cursor: pointer;
	}
</style>
