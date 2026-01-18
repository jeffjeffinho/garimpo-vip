exports.handler = async function (event, context) {
  // --- 1. DEBUG E SEGURANÇA ---
  
  // Normaliza os headers para garantir que pegamos mesmo se vier maiúsculo/minúsculo
  const headers = event.headers || {};
  const incomingPin = headers["x-admin-pin"] || headers["X-Admin-Pin"] || "";
  
  // Pega o PIN configurado no ambiente
  const correctPin = process.env.ADMIN_PIN || "";

  // Logs para ajudar a debugar (aparecem na aba "Functions" > "Logs" do Netlify)
  console.log("--- TENTATIVA DE LOGIN ---");
  console.log("PIN Recebido (Header):", incomingPin ? incomingPin : "(Vazio)");
  // Não mostramos o PIN correto no log por segurança, apenas o tamanho dele ou se existe
  console.log("PIN Configurado (Env):", correctPin ? `Definido (tamanho: ${correctPin.length})` : "NÃO DEFINIDO");

  // Comparação blindada (remove espaços extras e garante que são strings)
  if (
    !correctPin || 
    String(incomingPin).trim() !== String(correctPin).trim()
  ) {
    console.log("ERRO: PIN incorreto ou variável de ambiente ausente.");
    return {
      statusCode: 401,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ 
        ok: false, 
        error: "Acesso negado. Verifique os logs da função no Netlify." 
      }),
    };
  }
  
  console.log("SUCESSO: PIN aceito.");

  // --- 2. LÓGICA DO PROXY (Google Apps Script) ---

  const base = process.env.GAS_WEBAPP_URL;
  const token = process.env.GAS_ADMIN_TOKEN;

  if (!base || !token) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ ok:false, error: "Erro interno: Variáveis GAS não configuradas" }),
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
    console.log("ERRO FETCH:", e);
    return {
      statusCode: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ ok:false, error: String(e?.message || e) }),
    };
  }
};
