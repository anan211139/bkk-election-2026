import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(scriptDir, '../public/data');

const governorBaseline = readJson('65-governor-electiondata.json');
const stationBaseline = readJson('65-electiondata-live-mock.json');
const governorCandidates = readJson('69-governor-candidates.json');
const councilCandidates = readJson('69-bmc-candidates.json');

const phases = [
	{ slug: 'coldstart-zero', progress: 0, type: 'LIVE' },
	{ slug: 'coldstart-partial', progress: 3, type: 'LIVE' },
	{ slug: '48pct', progress: 48, type: 'LIVE' },
	{ slug: '73pct', progress: 73, type: 'LIVE' },
	{ slug: '95pct', progress: 95, type: 'COMPLETED' }
];
const featuredGovernorCandidateIds = ['1', '3', '4', '6', '8', '11'];

const governorByDistrict = indexByName(governorBaseline.districts);
const stationByDistrict = indexByName(stationBaseline.districts);
const districtNames = Object.keys(councilCandidates)
	.map((candidateId) => candidateId.slice(0, candidateId.lastIndexOf('-')))
	.filter((name, index, names) => names.indexOf(name) === index);

const districtDefinitions = districtNames.map((name) => {
	const baseline = governorByDistrict[name];
	const station = stationByDistrict[name];
	if (!baseline || !station?.voting.pollingUnits?.total) {
		throw new Error(`Missing vote or polling unit baseline for ${name}`);
	}

	return {
		name,
		eligiblePopulation: baseline.voting.eligiblePopulation,
		fullVotes: baseline.voting.totalVotes,
		fullBadVotes: baseline.voting.badVotes || 0,
		fullNoVotes: baseline.voting.noVotes || 0,
		totalUnits: station.voting.pollingUnits.total,
		governorScenario: makeGovernorScenario(name),
		councilWeights: makeCouncilWeights(name)
	};
});

const totalUnits = districtDefinitions.reduce((sum, district) => sum + district.totalUnits, 0);
const reportingOrder = buildReportingOrder(districtDefinitions);
const phaseDocuments = [];
let previousGovernor;
let previousCouncil;

for (const phase of phases) {
	const reportedUnitsByDistrict = getReportedUnits(phase.progress);
	const sharedDistricts = districtDefinitions.map((definition) =>
		makeSharedDistrictVoting(definition, reportedUnitsByDistrict[definition.name])
	);
	const governor = makeElectionDocument(
		phase,
		sharedDistricts,
		districtDefinitions.map((definition) =>
			makeGovernorWeights(definition.name, definition.governorScenario, phase.slug)
		),
		true,
		previousGovernor
	);
	const council = makeElectionDocument(
		phase,
		sharedDistricts,
		districtDefinitions.map((definition) => definition.councilWeights),
		false,
		previousCouncil
	);

	const governorFilename = `69-governor-electiondata-${phase.slug}.json`;
	const councilFilename = `69-bmc-electiondata-${phase.slug}.json`;
	writeJson(governorFilename, governor);
	writeJson(councilFilename, council);
	phaseDocuments.push({ phase, governorFilename, councilFilename, governor, council });
	previousGovernor = governor;
	previousCouncil = council;
}

validateDocuments(phaseDocuments);
console.log(`Generated ${phaseDocuments.length * 2} election mock snapshots in ${dataDir}`);

function readJson(filename) {
	return JSON.parse(readFileSync(join(dataDir, filename), 'utf8'));
}

function writeJson(filename, value) {
	writeFileSync(join(dataDir, filename), `${JSON.stringify(value, null, '\t')}\n`);
}

function indexByName(districts) {
	return Object.fromEntries(districts.map((district) => [district.name, district]));
}

function makeGovernorScenario(districtName) {
	const seed = stableNumber(districtName);
	const baseIndex = seed % featuredGovernorCandidateIds.length;
	const steadyLeader = featuredGovernorCandidateIds[baseIndex];
	const lateLeader =
		seed % 3 === 0
			? featuredGovernorCandidateIds[(baseIndex + 1) % featuredGovernorCandidateIds.length]
			: steadyLeader;
	const coldLeader =
		seed % 4 === 0
			? featuredGovernorCandidateIds[(baseIndex + 2) % featuredGovernorCandidateIds.length]
			: steadyLeader;

	return { coldLeader, steadyLeader, lateLeader };
}

function makeGovernorWeights(districtName, scenario, phaseSlug) {
	const weightedLeaders = {
		'coldstart-zero': [],
		'coldstart-partial': [[scenario.coldLeader, 130], [scenario.steadyLeader, 32]],
		'48pct': [[scenario.steadyLeader, 85], [scenario.lateLeader, 34]],
		'73pct': [[scenario.lateLeader, 700], [scenario.steadyLeader, 28]],
		'95pct': [[scenario.lateLeader, 160], [scenario.steadyLeader, 42]]
	}[phaseSlug];
	const leaderWeights = Object.fromEntries(
		Object.keys(governorCandidates).map((candidateId) => [
			candidateId,
			Math.max(
				0,
				...weightedLeaders
					.filter(([leaderId]) => leaderId === candidateId)
					.map(([, weight]) => weight)
			)
		])
	);

	return Object.keys(governorCandidates).map((candidateId) => ({
		candidateId,
		weight: leaderWeights[candidateId] || 6 + (stableNumber(`${districtName}-${candidateId}`) % 11)
	}));
}

function makeCouncilWeights(districtName) {
	return Object.keys(councilCandidates)
		.filter((candidateId) => candidateId.startsWith(`${districtName}-`))
		.map((candidateId) => {
			const number = Number(candidateId.slice(candidateId.lastIndexOf('-') + 1));
			return {
				candidateId,
				weight: Math.max(1, 30 - number * 3 + stableNumber(candidateId) % 11)
			};
		});
}

function stableNumber(value) {
	let total = 0;
	for (const char of value) total = (total * 31 + char.codePointAt(0)) % 100000;
	return total;
}

function buildReportingOrder(definitions) {
	const stations = [];
	for (const definition of definitions) {
		for (let index = 0; index < definition.totalUnits; index += 1) {
			stations.push({
				name: definition.name,
				key:
					(index + (stableNumber(`${definition.name}-${index}`) % 1000) / 1000) /
					definition.totalUnits
			});
		}
	}
	return stations.sort((left, right) => left.key - right.key || left.name.localeCompare(right.name));
}

function getReportedUnits(progress) {
	const reportedUnits = Math.round((totalUnits * progress) / 100);
	const values = Object.fromEntries(districtNames.map((name) => [name, 0]));
	for (const station of reportingOrder.slice(0, reportedUnits)) values[station.name] += 1;
	return values;
}

function makeSharedDistrictVoting(definition, reportedUnits) {
	const ratio = definition.totalUnits ? reportedUnits / definition.totalUnits : 0;
	const totalVotes = Math.round(definition.fullVotes * ratio);
	const badVotes = Math.round(definition.fullBadVotes * ratio);
	const noVotes = Math.round(definition.fullNoVotes * ratio);

	return {
		name: definition.name,
		voting: {
			eligiblePopulation: definition.eligiblePopulation,
			totalVotes,
			badVotes,
			noVotes,
			progress: Number((ratio * 100).toFixed(2)),
			pollingUnits: {
				total: definition.totalUnits,
				reported: reportedUnits
			},
			goodVotes: Math.max(0, totalVotes - badVotes - noVotes)
		}
	};
}

function makeElectionDocument(phase, sharedDistricts, weightsByDistrict, aggregateResults, previous) {
	const districts = sharedDistricts.map((district, index) => {
		const { goodVotes, ...voting } = district.voting;
		return {
			name: district.name,
			voting: {
				...voting,
				result: accumulateVotes(
					goodVotes,
					previous?.districts[index]?.voting.result || [],
					weightsByDistrict[index]
				)
			}
		};
	});
	const total = districts.reduce(
		(summary, district) => {
			summary.eligiblePopulation += district.voting.eligiblePopulation;
			summary.totalVotes += district.voting.totalVotes;
			summary.badVotes += district.voting.badVotes;
			summary.noVotes += district.voting.noVotes;
			summary.pollingUnits.total += district.voting.pollingUnits.total;
			summary.pollingUnits.reported += district.voting.pollingUnits.reported;
			return summary;
		},
		{
			eligiblePopulation: 0,
			totalVotes: 0,
			badVotes: 0,
			noVotes: 0,
			progress: phase.progress,
			pollingUnits: { total: 0, reported: 0 },
			result: []
		}
	);

	if (aggregateResults) {
		total.result = Object.keys(governorCandidates).map((candidateId) => ({
			candidateId,
			count: districts.reduce(
				(sum, district) =>
					sum + (district.voting.result.find((result) => result.candidateId === candidateId)?.count || 0),
				0
			)
		}));
	}

	return { type: phase.type, total, districts };
}

function accumulateVotes(votes, previousResults, weights) {
	const previousCounts = Object.fromEntries(
		previousResults.map((result) => [result.candidateId, result.count])
	);
	const previousVotes = previousResults.reduce((sum, result) => sum + result.count, 0);
	const newVotes = votes - previousVotes;
	if (newVotes < 0) throw new Error('Cumulative result cannot reduce counted votes');

	return distributeVotes(newVotes, weights)
		.map((result) => ({
			candidateId: result.candidateId,
			count: result.count + (previousCounts[result.candidateId] || 0)
		}))
		.sort((left, right) => right.count - left.count || left.candidateId.localeCompare(right.candidateId));
}

function distributeVotes(votes, weights) {
	const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
	const allocations = weights.map((item) => {
		const exact = totalWeight ? (votes * item.weight) / totalWeight : 0;
		return {
			candidateId: item.candidateId,
			count: Math.floor(exact),
			remainder: exact - Math.floor(exact)
		};
	});
	let remaining = votes - allocations.reduce((sum, item) => sum + item.count, 0);
	for (const result of allocations.sort((left, right) => right.remainder - left.remainder)) {
		if (remaining === 0) break;
		result.count += 1;
		remaining -= 1;
	}
	return allocations
		.sort((left, right) => right.count - left.count || left.candidateId.localeCompare(right.candidateId))
		.map(({ candidateId, count }) => ({ candidateId, count }));
}

function validateDocuments(documents) {
	for (const { phase, governor, council } of documents) {
		const sharedKeys = ['eligiblePopulation', 'totalVotes', 'badVotes', 'noVotes', 'progress'];
		for (const key of sharedKeys) {
			if (governor.total[key] !== council.total[key]) {
				throw new Error(`${phase.slug}: mismatched total ${key}`);
			}
		}
		if (JSON.stringify(governor.total.pollingUnits) !== JSON.stringify(council.total.pollingUnits)) {
			throw new Error(`${phase.slug}: mismatched total polling units`);
		}
		for (let index = 0; index < governor.districts.length; index += 1) {
			const governorVoting = governor.districts[index].voting;
			const councilVoting = council.districts[index].voting;
			if (
				governor.districts[index].name !== council.districts[index].name ||
				governorVoting.totalVotes !== councilVoting.totalVotes ||
				JSON.stringify(governorVoting.pollingUnits) !== JSON.stringify(councilVoting.pollingUnits)
			) {
				throw new Error(`${phase.slug}: mismatched district totals at index ${index}`);
			}
			const expectedGoodVotes =
				governorVoting.totalVotes - governorVoting.badVotes - governorVoting.noVotes;
			for (const voting of [governorVoting, councilVoting]) {
				if (voting.result.reduce((sum, result) => sum + result.count, 0) !== expectedGoodVotes) {
					throw new Error(`${phase.slug}: candidate result total does not match cards`);
				}
			}
		}
	}
	for (const electionType of ['governor', 'council']) {
		let previous;
		for (const document of documents) {
			const current = electionType === 'governor' ? document.governor : document.council;
			if (previous) {
				for (let districtIndex = 0; districtIndex < current.districts.length; districtIndex += 1) {
					const before = Object.fromEntries(
						previous.districts[districtIndex].voting.result.map((result) => [
							result.candidateId,
							result.count
						])
					);
					for (const result of current.districts[districtIndex].voting.result) {
						if (result.count < before[result.candidateId]) {
							throw new Error(`${electionType}: non-cumulative result for ${result.candidateId}`);
						}
					}
				}
			}
			previous = current;
		}
	}
	const governorLiveDocuments = documents.filter(({ phase }) => phase.progress > 0);
	const distinctWinnerIds = new Set(
		governorLiveDocuments.flatMap(({ governor }) =>
			governor.districts.map((district) => district.voting.result[0]?.candidateId)
		)
	);
	let winnerChanges = 0;
	for (let index = 1; index < governorLiveDocuments.length; index += 1) {
		const before = governorLiveDocuments[index - 1].governor.districts;
		const current = governorLiveDocuments[index].governor.districts;
		winnerChanges += current.filter(
			(district, districtIndex) =>
				district.voting.result[0]?.candidateId !== before[districtIndex].voting.result[0]?.candidateId
		).length;
	}
	if (distinctWinnerIds.size < 2 || winnerChanges === 0) {
		throw new Error('Governor mock data must include multiple winners and at least one leader change');
	}
}
