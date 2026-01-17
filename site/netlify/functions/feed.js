exports.handler = async function () {
  const base = process.env.GAS_WEBAPP_URL;

  if (!base) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ ok:false, error: "Missing GAS_WEBAPP_URL" }),
    };
  }

  try {
    const url = `${base}?r=feed`;
    const resp = await fetch(url, { headers: { "accept": "application/json" } });
    const text = await resp.text();

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=60",
      },
      body: text,
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ ok:false, error: String(e?.message || e) }),
    };
  }
};
