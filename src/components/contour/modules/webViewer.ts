/**
 * TimeMachine Contour - Web Viewer Module
 * Parses `/web`, `/search`, `/google` commands and raw URLs to display an iframe.
 */

export interface WebViewerResult {
    url: string;
    query?: string;
}

export function detectWebViewer(input: string): WebViewerResult | null {
    const trimmed = input.trim();

    // 1. Explicit Search Commands
    // DuckDuckGo (default for /web or /search)
    const ddgMatch = trimmed.match(/^\/(?:web|search)\s+(.+)$/i);
    if (ddgMatch) {
        const query = ddgMatch[1].trim();
        return {
            url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}&ia=web`,
            query
        };
    }

    // Google
    const googleMatch = trimmed.match(/^\/google\s+(.+)$/i);
    if (googleMatch) {
        const query = googleMatch[1].trim();
        return {
            url: `https://www.google.com/search?q=${encodeURIComponent(query)}&igu=1`, // igu=1 sometimes allows google in iframes
            query
        };
    }

    // 2. Raw URL Detection (very permissive for quick entry)
    // Check if it looks like a domain name (e.g., apple.com, www.github.com, https://news.ycombinator.com)
    const urlPattern = /^(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(?:\/.*)?$/i;
    const urlMatch = trimmed.match(urlPattern);

    if (urlMatch) {
        // If it doesn't have a protocol, prepend https://
        const finalUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
        return { url: finalUrl };
    }

    return null;
}
