
export async function crawlUrl(url: string): Promise<string> {
    try {
        // Add protocol if missing
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            console.warn(`Failed to fetch ${url}: ${response.status}`);
            return "";
        }

        const html = await response.text();

        // Simple text extraction
        // 1. Remove scripts and styles
        let text = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")
            .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, "")
            // 2. Remove comments
            .replace(/<!--[\s\S]*?-->/g, "");

        // 3. Remove html tags
        text = text.replace(/<[^>]+>/g, " ");

        // 4. Clean up whitespace
        text = text.replace(/\s+/g, " ").trim();

        return text.substring(0, 20000); // Limit to 20k chars
    } catch (error) {
        console.error("Crawling failed:", error);
        return "";
    }
}
