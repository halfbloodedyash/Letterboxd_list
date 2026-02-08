
const cheerio = require('cheerio');

// Mocking the NextRequest and NextResponse logic check
async function testRouteLogic(url) {
    console.log(`\nTesting URL: ${url}`);

    try {
        // --- Logic from route.ts starts here ---

        // Validate URL
        if (!url || !url.startsWith('https://letterboxd.com/')) {
            console.log('Error: Please enter a valid Letterboxd URL.');
            return;
        }

        // Normalize the URL using the URL API
        let baseUrl = '';
        try {
            const urlObj = new URL(url);
            // Ensure trailing slash
            let cleanPathname = urlObj.pathname.replace(/\/+$/, '') + '/';
            baseUrl = `${urlObj.origin}${cleanPathname}`;
            console.log(`Normalized URL: ${baseUrl}`);
        } catch (e) {
            console.log('Error: Invalid URL format.');
            return;
        }

        // If URL already has /page/X, extract base URL
        const pageMatch = baseUrl.match(/(.*)\/page\/\d+\/?$/);
        if (pageMatch) {
            baseUrl = pageMatch[1];
            if (!baseUrl.endsWith('/')) {
                baseUrl += '/';
            }
        }

        // Fetch page 1 only for verification
        const pageUrl = baseUrl;
        console.log(`Fetching: ${pageUrl}`);

        const response = await fetch(pageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
            },
        });

        if (!response.ok) {
            console.log(`Error: Failed to fetch. Status: ${response.status}`);
            return;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        let count = 0;
        $('.poster-container img, .film-poster img, li.poster-container img').each(() => count++);

        if (count === 0) {
            $('[data-film-name]').each(() => count++);
        }

        console.log(`Success! Found ${count} movies (partial check).`);

        // --- Logic ends ---

    } catch (error) {
        console.error('Scraping error:', error);
    }
}

// Test cases
(async () => {
    // Regular URL with slash
    await testRouteLogic('https://letterboxd.com/dave/list/official-top-250-narrative-feature-films/');
    // URL without slash
    await testRouteLogic('https://letterboxd.com/dave/list/official-top-250-narrative-feature-films');
    // URL with query params
    await testRouteLogic('https://letterboxd.com/dave/list/official-top-250-narrative-feature-films/?sort=name');
})();
