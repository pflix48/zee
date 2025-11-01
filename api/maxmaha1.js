import fetch from "node-fetch";

export default async function handler(req, res) {
  const m3u_url = "https://raw.githubusercontent.com/alex8875/m3u/refs/heads/main/z5.m3u";

  try {
    const response = await fetch(m3u_url);
    if (!response.ok) throw new Error("Unable to fetch M3U file");

    const text = await response.text();
    const urls = text.match(/https?:\/\/[^\s]+/g) || [];

    for (const url of urls) {
      if (url.includes("hdntl=")) {
        const params = new URL(url).searchParams;
        const hdntl = params.get("hdntl");
        if (hdntl) {
          return res.status(200).json({ hdntl });
        }
      }
    }

    res.status(404).json({ error: "No hdntl found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
