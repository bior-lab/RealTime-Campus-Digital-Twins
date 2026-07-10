# PI Web API Point Discovery

This folder contains a sanitized PI Web API helper for NUS BAS point discovery.
It is based on the local `bior_data_query` workflow, but credentials and host
settings are read from environment variables instead of being committed to the
repository.

## Setup

Create a local env file outside Git tracking, or export these variables in your
shell:

```bash
export NUS_PI_WEB_API_BASE_URL="https://<pi-web-api-host>/piwebapi"
export NUS_PI_DATA_SERVER_WEBID="<data-server-webid>"
export NUS_PI_USERNAME="<username>"
export NUS_PI_PASSWORD="<password>"
export NUS_PI_VERIFY_SSL="false"
```

Install the small runtime dependency when needed:

```bash
python3 -m pip install -r tools/pi_web_api/requirements.txt
```

## Search points

Search likely SDE4 water points:

```bash
python3 tools/pi_web_api/pi_web_api_client.py search \
  --building SDE4 \
  --intent water \
  --output data/raw/pi_discovery/sde4-water-candidates.csv
```

Search a custom PI name filter:

```bash
python3 tools/pi_web_api/pi_web_api_client.py search \
  --name-filter "*SDE4*Water*" \
  --max-count 1000 \
  --output data/raw/pi_discovery/sde4-water-namefilter.csv
```

## Pull history

After validating candidate point names, pull a short history window:

```bash
python3 tools/pi_web_api/pi_web_api_client.py history \
  --points-file data/raw/pi_discovery/sde4-water-candidates.csv \
  --start "*-24h" \
  --end "*" \
  --interval-min 60 \
  --output data/raw/pi_discovery/sde4-water-history.csv
```

The frontend should not call PI Web API directly. Use this workflow to validate
points, then expose a small public JSON contract through the backend.
