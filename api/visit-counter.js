const COUNTER_KEY = "mingomania:visits";
const COUNTER_START = 1000;

function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function getRedisConfig() {
  return {
    url: readEnv("UPSTASH_REDIS_REST_URL"),
    token: readEnv("UPSTASH_REDIS_REST_TOKEN"),
  };
}

async function redisCommand(command, ...args) {
  const { url, token } = getRedisConfig();

  if (!url || !token) {
    throw new Error("Missing Upstash Redis environment variables");
  }

  const encodedSegments = [command, ...args].map((segment) =>
    encodeURIComponent(String(segment)),
  );

  const response = await fetch(`${url}/${encodedSegments.join("/")}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Upstash error ${response.status}: ${body}`);
  }

  return response.json();
}

async function readCounter() {
  const payload = await redisCommand("GET", COUNTER_KEY);
  const numericValue = Number(payload?.result);
  return Number.isFinite(numericValue) ? numericValue : null;
}

async function writeCounter(value) {
  await redisCommand("SET", COUNTER_KEY, Math.max(COUNTER_START, Number(value)));
}

async function ensureBaseCounter() {
  const currentValue = await readCounter();

  if (currentValue === null || currentValue < COUNTER_START) {
    await writeCounter(COUNTER_START);
    return COUNTER_START;
  }

  return currentValue;
}

async function getCounterValue() {
  return ensureBaseCounter();
}

async function hitCounterValue() {
  const currentValue = await readCounter();

  if (currentValue === null || currentValue < COUNTER_START) {
    await writeCounter(COUNTER_START);
    return COUNTER_START;
  }

  const payload = await redisCommand("INCR", COUNTER_KEY);
  const incrementedValue = Number(payload?.result);

  if (!Number.isFinite(incrementedValue)) {
    throw new Error("Invalid counter value returned by Upstash");
  }

  return Math.max(COUNTER_START, incrementedValue);
}

export default async function handler(req, res) {
  const mode = req.query?.mode === "hit" ? "hit" : "get";

  try {
    const value = mode === "hit" ? await hitCounterValue() : await getCounterValue();

    res.setHeader("Cache-Control", "no-store, max-age=0");

    return res.status(200).json({
      mode,
      key: COUNTER_KEY,
      value,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to load visit counter",
      details: error.message,
    });
  }
}
