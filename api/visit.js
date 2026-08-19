// Vercel serverless endpoint for website visit notifications.
// Set DISCORD_WEBHOOK_URL in Vercel Environment Variables.
// The webhook URL is intentionally NOT placed in frontend JavaScript.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  try {
    const webhook = process.env.DISCORD_WEBHOOK_URL;

    if (!webhook) {
      return res.status(500).json({ ok: false, error: "Webhook not configured" });
    }

    const body = typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : (req.body || {});

    const forwarded = req.headers["x-forwarded-for"];
    const ip = forwarded
      ? String(forwarded).split(",")[0].trim()
      : (req.headers["x-real-ip"] || "Unknown");

    // Vercel supplies these approximate geo headers at the edge.
    // We intentionally send country/region/city rather than exact coordinates.
    const country = req.headers["x-vercel-ip-country"] || "Unknown";
    const region = req.headers["x-vercel-ip-country-region"] || "Unknown";
    const city = req.headers["x-vercel-ip-city"] || "Unknown";

    const userAgent = req.headers["user-agent"] || "Unknown";
    const timestamp = new Date().toISOString();

    const payload = {
      embeds: [
        {
          title: "🌐 New Website Visit",
          description: "Someone opened the website.",
          color: 5793266,
          fields: [
            { name: "📍 Location", value: `${city}, ${region}, ${country}`, inline: true },
            { name: "🕐 Time (UTC)", value: timestamp, inline: true },
            { name: "🔗 Page", value: String(body.page || "/").slice(0, 1024), inline: true },
            { name: "↗️ Referrer", value: String(body.referrer || "Direct").slice(0, 1024), inline: false },
            { name: "🌐 IP", value: String(ip).slice(0, 256), inline: true },
            { name: "🖥️ User Agent", value: String(userAgent).slice(0, 1024), inline: false }
          ],
          footer: { text: "Website Visit Tracker" },
          timestamp
        }
      ]
    };

    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return res.status(502).json({ ok: false });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    // Never let analytics errors break the website.
    return res.status(500).json({ ok: false });
  }
}
