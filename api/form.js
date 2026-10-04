// Vercel Edge Function — handles POST /api/form
// Forwards site form submissions as JSON to FORM_WEBHOOK_URL.
// Set FORM_WEBHOOK_URL in Vercel Project > Settings > Environment Variables.

export const config = { runtime: "edge" };

const RATE_LIMIT = 20, WINDOW_MS = 10 * 60 * 1000;
const hits = new Map();
const json = (status, body) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});

function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return true;
  recent.push(now); hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return false;
}

export default async function handler(request) {
  if (request.method !== "POST") return json(405, { error: "Method not allowed" });
  const url = process.env.FORM_WEBHOOK_URL;
  if (!url) return json(500, { error: "form not configured" });
  if (limited("form:" + (request.headers.get("x-forwarded-for") || "anon"))) return json(429, { error: "Too many requests" });

  let fd;
  try { fd = await request.formData(); } catch (e) { return json(400, { error: "Invalid form" }); }
  if (fd.get("bot-field")) return json(200, { ok: true });

  const out = {};
  for (const [k, v] of fd.entries()) { if (k !== "bot-field" && typeof v === "string") out[k] = v.slice(0, 5000); }
  out._form = out["form-name"] || "website"; delete out["form-name"];
  out._page = request.headers.get("Referer") || "";

  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(out) });
  return res.ok ? json(200, { ok: true }) : json(502, { error: "forward failed" });
}
