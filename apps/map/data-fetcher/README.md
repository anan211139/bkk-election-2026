# `Map` Data Fetcher
This app creates json files (possibly `CandidateMap` and `ElectionData`) for map project.

## Structure
As the day this app is developed, there is a possiblity to switch to more stable source of infomation.

Thus, the concept of designing this app is to make the app most flexible to plug with other sources. This can be simplified to:
- `fetcher.ts` is a definition of interfaces for any source.
- Directory seperates APIs, one per each source.
  - `ers` is an API for Election Result System provided by VIVE
- Other files in root are general business logics that apply to every sources.
- `index.ts` orchestrates which source shall be used for any command.

## Docker
The data-fetcher can be run via Docker. The provided `../Dockerfile.data-fetcher` with `../` context should be used.

### Build Image
```
docker build -t <IMAGE_NAME>:<IMAGE_TAG> -f Dockerfile.data-fetcher .
```

### Run Image
```
docker run -v $PWD/public/data:/app/public/data -e CACHE_OUTPUT_PATH=/app/public/data <IMAGE_NAME>:<IMAGE_TAG>
```

To fetch from ERS instead of local mock JSON, opt in explicitly:

```
docker run -v $PWD/public/data:/app/public/data -e CACHE_OUTPUT_PATH=/app/public/data -e FETCH_REMOTE_ELECTION_DATA=true -e ERS_API_KEY=<VALUE> -e ERS_API_URL=<VALUE> <IMAGE_NAME>:<IMAGE_TAG>
```
### Output
- WORKDIR is at `/app`.
- Output directory is designated by `CACHE_OUTPUT_PATH`; use `/app/public/data` when the map app should serve the generated JSON at `/map/data/*`.
- Live mode writes cache files every 5 minutes:
  - `65-governor-electiondata-cache.json`
  - `65-bmc-electiondata-cache.json`
- Cache writes are atomic. If the upstream API fails, the previous cache file remains available.
- By default, live mode reads mock JSON files from disk. Set `FETCH_REMOTE_ELECTION_DATA=true` only when the fetcher should request live data from ERS.
- When a cache file already has `"type": "COMPLETED"`, that file is skipped and will not be fetched or rewritten again.

### Serving cache files
For high traffic, serve `/map/data/*-electiondata-cache.json` from the static host or CDN. Recommended headers:

```
Cache-Control: public, max-age=60, stale-while-revalidate=300
```

Candidate data does not change during the event. It can be served with a long-lived immutable cache header:

```
Cache-Control: public, max-age=31536000, immutable
```

### Env
Environment key-values can be provided using:
- Docker env
- Mounting `.env` file at WORKDIR (`/app`)

|Key        |Description                                              |Example                       |
|-----------|---------------------------------------------------------|------------------------------|
|ERS_API_KEY|API key to fetch dat from ERS provided by VIVE           |DFJio48470934rjklDKFLM        |
|ERS_API_URL|API path without ending slash (/) of ERS provided by VIVE|https://api.ers.uat.vive.co.th|
|CACHE_OUTPUT_PATH|Directory where live cache JSON files are written|/app/public/data|
|FETCH_REMOTE_ELECTION_DATA|Set to `true` to fetch from ERS instead of local mock JSON|true|
|GOVERNOR_ELECTION_DATA_SOURCE|Local governor mock JSON source|./public/data/65-electiondata-live-mock.json|
|COUNCIL_ELECTION_DATA_SOURCE|Local council mock JSON source|./public/data/65-bmc-electiondata-live.json|
