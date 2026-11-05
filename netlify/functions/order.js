// Netlify serverless endpoint. Secrets belong in Netlify environment variables.
const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  },
  body: JSON.stringify(body)
});
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));
exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(204, {});
  if (event.httpMethod !== "POST") return json(405, {message:"Method not allowed"});
  const origin = event.headers.origin || event.headers.Origin || "";
  const allowed = process.env.ALLOWED_ORIGIN;
  if (allowed && origin !== allowed) return json(403, {message:"Origin not allowed"});
  if (!process.env.RESEND_API_KEY || !process.env.ORDER_EMAIL || !process.env.FROM_EMAIL) {
    return json(503, {message:"Email service is not configured"});
  }
  let data;
  try { data = JSON.parse(event.body || "{}"); } catch { return json(400,{message:"Invalid JSON"}); }
  if (typeof data.website === "string" && data.website.trim()) return json(400,{message:"Spam detected"});
  const fields = ["firstName","lastName","phone","wilaya","commune"];
  for (const key of fields) {
    if (typeof data[key] !== "string" || !data[key].trim() || data[key].length > 120)
      return json(400,{message:`Invalid ${key}`});
  }
  const qty = Number(data.quantity);
  if (!Number.isInteger(qty) || qty < 1 || qty > 20) return json(400,{message:"Invalid quantity"});
  if (!["home","office"].includes(data.delivery)) return json(400,{message:"Invalid delivery"});
  if (data.consent !== true) return json(400,{message:"Consent required"});
  const phone = data.phone.trim();
  if (!/^[+0-9 ()-]{8,20}$/.test(phone)) return json(400,{message:"Invalid phone"});
  const deliveryFee = data.delivery === "home" ? 400 : 0;
  const total = qty * 1400 + deliveryFee;
  const html = `
    <h2>Nouvelle réservation — عاشق من وراء الزمن</h2>
    <p><b>Nom:</b> ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}</p>
    <p><b>Téléphone:</b> ${escapeHtml(phone)}</p>
    <p><b>Wilaya:</b> ${escapeHtml(data.wilaya)} (${escapeHtml(data.wilayaCode || "")})</p>
    <p><b>Commune:</b> ${escapeHtml(data.commune)}</p>
    <p><b>Quantité:</b> ${qty}</p>
    <p><b>Livraison:</b> ${data.delivery === "home" ? "À domicile (+400 DA)" : "Point relais (gratuit)"}</p>
    <hr><p><b>Prix unitaire:</b> 1 400 DA</p><p><b>Total estimé:</b> ${total.toLocaleString("fr-FR")} DA</p>
    <p><small>Langue du formulaire: ${escapeHtml(data.language || "ar")}</small></p>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type":"application/json" },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL,
        to: [process.env.ORDER_EMAIL],
        subject: `Réservation — ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)} (${qty} ex.)`,
        html
      })
    });
    if (!res.ok) return json(502,{message:"Email provider failed"});
    return json(200,{ok:true});
  } catch {
    return json(502,{message:"Email delivery failed"});
  }
};
