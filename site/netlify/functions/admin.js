exports.handler = async function (event, context) {
  // 1. Pega o PIN enviado pelo frontend (headers vêm em minúsculo)
  const incomingPin = event.headers["x-admin-pin"];
  
  // 2. Pega o PIN correto configurado no Netlify
  const correctPin = process.env.ADMIN_PIN;

  // 3. Validação simples
  if (!correctPin || incomingPin !== correctPin) {
    return {
      statusCode: 401,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ ok: false, error: "PIN incorreto ou não configurado" }),
    };
  }

  // --- O RESTO CONTINUA IGUAL (Conecta com o Google Apps Script) ---

  const base = process.env.GAS_WEBAPP_URL;
  const token = process.env.GAS_ADMIN_TOKEN;

  if (!base || !token) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ ok:false, error: "Faltam variáveis de ambiente (GAS_WEBAPP_URL/TOKEN)" }),
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
    token, // Token mestre do GAS
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
