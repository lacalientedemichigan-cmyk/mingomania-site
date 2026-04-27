const COUNTER_NAMESPACE = "mingomania.net";
const COUNTER_KEY = "site-visits";
const COUNTER_BASE_URL = "https://api.countapi.xyz";
const STARTING_COUNT = 1000;

async function countRequest(path) {
  const response = await fetch(`${COUNTER_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
    },
  });

  const payload = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
}

async function getCounterValue(mode) {
  if (mode === "hit") {
    const hitResult = await countRequest(`/hit/${COUNTER_NAMESPACE}/${COUNTER_KEY}`);

    if (!hitResult.ok) {
      throw new Error(`CountAPI hit failed with status ${hitResult.status}`);
    }

    return hitResult.payload.value;
  }

  const getResult = await countRequest(`/get/${COUNTER_NAMESPACE}/${COUNTER_KEY}`);

  if (getResult.ok) {
    return getResult.payload.value;
  }

  if (getResult.status === 404) {
    const hitResult = await countRequest(`/hit/${COUNTER_NAMESPACE}/${COUNTER_KEY}`);

    if (!hitResult.ok) {
      throw new Error(`CountAPI create failed with status ${hitResult.status}`);
    }

    return hitResult.payload.value;
  }

  throw new Error(`CountAPI get failed with status ${getResult.status}`);
}

export default async function handler(req, res) {
  const mode = req.query?.mode === "hit" ? "hit" : "get";

  try {
    const value = await getCounterValue(mode);
    const normalizedValue = Math.max(STARTING_COUNT, Number(value) || 0);

    res.setHeader("Cache-Control", "no-store, max-age=0");

    return res.status(200).json({
      ok: true,
      value: normalizedValue,
    });
  } catch (error) {
    res.setHeader("Cache-Control", "no-store, max-age=0");

    return res.status(200).json({
      ok: false,
      fallback: true,
      value: STARTING_COUNT,
      error: "Failed to load visit counter",
      details: error.message,
    });
  }
}
