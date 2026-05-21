import { writeFile, mkdir, rm, symlink, rename, readFile } from 'fs/promises';
import { scheduleJob } from "node-schedule";
import { ElectionData, ElectionDataType } from '../src/models/election';
import { fetchElectionData } from "./ers";
import { ElectionDataFetcherType } from "./fetcher";

const cron = '*/5 * * * *';
const outputPath = process.env.CACHE_OUTPUT_PATH || './output';
const useRemoteElectionData = process.env.FETCH_REMOTE_ELECTION_DATA === 'true';
const outputFilename = 'election-data';
const cachedGovernorOutputFilename = '65-governor-electiondata-cache';
const cachedCouncilOutputFilename = '65-bmc-electiondata-cache';
const ectOutputFilename = 'election-data-ect';
const councilOutputFilename = 'election-data-council';
const localGovernorSourcePath =
  process.env.GOVERNOR_ELECTION_DATA_SOURCE || './public/data/65-electiondata-live-mock.json';
const localCouncilSourcePath =
  process.env.COUNCIL_ELECTION_DATA_SOURCE || './public/data/65-bmc-electiondata-live.json';

type ElectionCacheTarget = {
  filename: string;
  fetcherType: ElectionDataFetcherType;
  localSourcePath: string;
};

export function live() {
  runCacheUpdate();
  scheduleJob(cron, runCacheUpdate);

  console.info('data-fetch has been scheduled with ', cron);
}

async function runCacheUpdate() {
  console.info('===================');
  console.info('=== Attempt to update election cache at ', new Date().toISOString());
  await Promise.all([
    writeCachedElectionData({
      filename: `${cachedGovernorOutputFilename}.json`,
      fetcherType: ElectionDataFetcherType.LiveECTGovernor,
      localSourcePath: localGovernorSourcePath,
    }),
    writeCachedElectionData({
      filename: `${cachedCouncilOutputFilename}.json`,
      fetcherType: ElectionDataFetcherType.LiveECTCouncilMember,
      localSourcePath: localCouncilSourcePath,
    }),
  ]);
  console.info('===================');
}

async function writeCachedElectionData({
  filename,
  fetcherType,
  localSourcePath,
}: ElectionCacheTarget) {
  try {
    const publicPath = `${outputPath}/${filename}`;
    const currentData = await readElectionDataIfExists(publicPath);

    if (currentData?.type === ElectionDataType.Completed) {
      console.info(`=== [SKIP] ${filename} is already completed.`);
      return publicPath;
    }

    const data = await getNextElectionData(fetcherType, localSourcePath);
    data.lastUpdatedAt = new Date().toISOString();

    await writeJsonAtomic(publicPath, data);
    console.info(`=== [SUCCEED] Cache has been written at ${publicPath}`);
    return publicPath;
  } catch (e) {
    console.error(`=== [ERROR] Fail to update ${filename}. Keeping previous cache.`, e);
    return null;
  }
}

async function getNextElectionData(
  fetcherType: ElectionDataFetcherType,
  localSourcePath: string
): Promise<ElectionData> {
  if (useRemoteElectionData) {
    return fetchElectionData(fetcherType);
  }
  return readElectionData(localSourcePath);
}

async function readElectionData(path: string): Promise<ElectionData> {
  return JSON.parse(await readFile(path, 'utf-8'));
}

async function readElectionDataIfExists(path: string): Promise<ElectionData | null> {
  try {
    return await readElectionData(path);
  } catch (e) {
    return null;
  }
}

async function writeCouncilMemberElectionData() {
  const data = await fetchElectionData(ElectionDataFetcherType.LiveCouncilMember);
  const now = new Date().toISOString();
  data.lastUpdatedAt = now;

  const publicPath = `${outputPath}/${councilOutputFilename}.json`;
  await writeJsonAtomic(publicPath, data);
  return publicPath;
}

async function writeECTElectionData() {
  const data = await fetchElectionData(ElectionDataFetcherType.LiveECTGovernor);
  const now = new Date().toISOString();
  data.lastUpdatedAt = now;

  const publicPath = `${outputPath}/${ectOutputFilename}.json`;
  await writeJsonAtomic(publicPath, data);
  return publicPath;
}

async function writeElectionData() {
  const data = await fetchElectionData(ElectionDataFetcherType.LiveGovernor);
  const now = new Date().toISOString();
  data.lastUpdatedAt = now;

  const newFilename = `${outputFilename}-${now}.json`;
  const newFilePath = `${outputPath}/all/${newFilename}`;
  const publicPath = `${outputPath}/${outputFilename}.json`;

  if (!isLiveInProgress(data)) {
    console.info(`[NOT LIVE] progress = ${data.total.progress}. Writing directly to ${publicPath}`);
    await rmIfExists(publicPath);
    await writeJsonAtomic(publicPath, data);
    return publicPath;
  }

  console.info(`[LIVE] progress = ${data.total.progress}`);
  await mkdirIfNotExists(`${outputPath}/all`);
  await writeFile(newFilePath, JSON.stringify(data));
  await rmIfExists(publicPath);

  try {
    await symlink(`./all/${newFilename}`, publicPath);
  } catch (e) {
    console.error(`[ERROR] Fail to create a symlink at ${publicPath}: ${e}`);
  }
  return newFilePath;
}

async function writeJsonAtomic(path: string, data: ElectionData): Promise<void> {
  await mkdirIfNotExists(outputPath);
  const tempPath = `${path}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, JSON.stringify(data));
  await rename(tempPath, path);
}

function isLiveInProgress(data: ElectionData): boolean {
  if (data.total.progress === undefined) {
    return false;
  }
  return data.total.progress >= 1 && data.total.progress < 95;
}

async function rmIfExists(path: string): Promise<void> {
  try {
    await rm(path);
  } catch (e) {
    console.info(`[INFO] ${path} does not exist`);
  }
}

async function mkdirIfNotExists(path: string): Promise<void> {
  try {
    await mkdir(path, { recursive: true });
    console.log(`[INFO] ${path} is created.`);
  } catch (e) { }
}
