import puppeteer from "puppeteer";

async function extractSonyURL(workerUrl) {
    // Chrome-like browser start
    const browser = await puppeteer.launch({
        headless: true,   // true = no UI
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    // Browser headers (real Chrome fingerprint)
    await page.setExtraHTTPHeaders({
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
    });

    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120 Safari/537.36"
    );

    console.log("Fetching:", workerUrl);

    // Load worker URL
    await page.goto(workerUrl, { waitUntil: "networkidle2" });

    // Extract final Sony URL from page body
    const finalUrl = await page.evaluate(() => {
        const txt = document.body.innerText;
        const match = txt.match(/https:\/\/[^\s"]+\.m3u8\?hdnea=[^"\s]+/);
        return match ? match[0] : null;
    });

    await browser.close();

    if (!finalUrl) {
        return { error: "Sony URL not found (maybe expired)" };
    }

    return {
        final_url: finalUrl
    };
}

// ---- RUN SCRIPT ----
const workerUrl = process.argv[2]; // Pass URL from terminal

extractSonyURL(workerUrl).then(res => {
    console.log(JSON.stringify(res, null, 2));
});
