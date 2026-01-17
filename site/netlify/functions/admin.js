exports.handler = async function (event, context) {
  // Identity -> Functions: user chega em context.clientContext.user quando Authorization: Bearer <jwt> é válido
  // (ver Netlify blog sobre Identity + Functions)
  const user = context?.clientContext?.user;

  if (!user) {
    return {
      statusCode: 401,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ ok:false, error: "Unauthorized" }),
    };
  }

  // opcional: restringir por e-mail
  const allowList = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  if (allowList.length && !allowList.includes(String(user.email || "").toLowerCase())) {
    return {
      statusCode: 403,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ ok:false, error: "Forbidden" }),
    };
  }

  const base = process.env.GAS_WEBAPP_URL;
  const token = process.env.GAS_ADMIN_TOKEN;

  if (!base || !token) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ ok:false, error: "Missing GAS_WEBAPP_URL or GAS_ADMIN_TOKEN" }),
    };
  }

  const path = event?.queryStringParameters?.path ? String(event.queryStringParameters.path) : "";
  const qs = { ...(event.queryStringParameters || {}) };
  delete qs.path;

  let body = null;
  if (event.body) {
    try { body = JSON.parse(event.body); } catch { body = event.body; }
  }

  const payload = {
    token,
    method: event.httpMethod,
    path,
    query: qs,
    body
  };

  try {
    const resp = await fetch(`${base}?r=admin`, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    return {
      statusCode: 200,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
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
