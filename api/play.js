import fetch from "node-fetch";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const token = req.query.token;
  const id = req.query.id;

  if (!token) return res.status(403).send("❌ Missing token");
  if (!id) return res.status(400).send("❌ Missing id parameter");

  // 1️⃣ Token Validation (तुमचं existing API)
  const validate_url = `https://elitebeam.shop/system/api/vali.php?token=${encodeURIComponent(token)}`;
  const tokenResp = await fetch(validate_url);
  const tokenData = await tokenResp.json().catch(() => ({}));

  if (tokenData.status !== "valid") {
    return res.status(403).send("❌ Invalid or expired token");
  }

  // 2️⃣ Zee5 channel load
  const jsonPath = path.join(process.cwd(), "data.json");
  if (!fs.existsSync(jsonPath)) return res.status(500).send("❌ data.json not found");

  const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const channels = jsonData.data || [];
  const channel = channels.find((ch) => ch.id === id);

  if (!channel || !channel.url) return res.status(404).send("❌ Channel not found");

  // 3️⃣ Cache HDNTL (10 hours)
  const cachePath = path.join(process.cwd(), "hdntl_cache.json");
  const cacheTime = 36000 * 1000; // 10 hours
  let data = {};

  try {
    const stats = fs.existsSync(cachePath) ? fs.statSync(cachePath) : null;
    const expired = !stats || Date.now() - stats.mtimeMs > cacheTime;

    if (expired) {
      // ✅ आता Vercel च्या स्वतःच्या API कडून hdntl मिळवा
      const origin = "https://elitetv-zee5.vercel.app"; // तुमचा प्रोजेक्ट URL
      const resp = await fetch(`${origin}/api/maxmaha1`);
      data = await resp.json();
      if (data.hdntl) fs.writeFileSync(cachePath, JSON.stringify(data));
    } else {
      data = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    }
  } catch {
    return res.status(500).send("❌ Failed to get hdntl");
  }

  const hdntl = data.hdntl;
  if (!hdntl) return res.status(500).send("❌ Missing hdntl data");

  // 4️⃣ Final Zee5 URL redirect
  const final_url = `${channel.url}?hdntl=${hdntl}`;
  res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
  res.redirect(final_url);
        }
