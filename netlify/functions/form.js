// Netlify Function — reached via /api/form (see the redirect in netlify.toml)
// Only needed if you want submissions forwarded to FORM_WEBHOOK_URL.
// Netlify also captures these forms natively (Site > Forms) with no setup,
// since each <form> already has data-netlify="true".

const RATE_LIMIT = 20, WINDOW_MS = 10 * 60 * 1000;
const hits = new Map();
const json = (status, body) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  const url = process.env.FORM_WEBHOOK_URL;
  if (!url) return json(200, { ok: true }); // Netlify's native form capture already has it

  const ip = (event.headers["x-nf-client-connection-ip"] || event.headers["x-forwarded-for"] || "anon").split(",")[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return json(429, { error: "Too many requests" });
  recent.push(now); hits.set(ip, recent);

  const params = new URLSearchParams(event.body || "");
  if (params.get("bot-field")) return json(200, { ok: true });
  const out = {};
  for (const [k, v] of params.entries()) { if (k !== "bot-field") out[k] = String(v).slice(0, 5000); }
  out._form = out["form-name"] || "website"; delete out["form-name"];

  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(out) });
    return res.ok ? json(200, { ok: true }) : json(502, { error: "forward failed" });
  } catch (e) { return json(502, { error: "Network problem" }); }
};
