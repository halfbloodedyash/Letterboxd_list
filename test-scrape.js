
// URL WITHOUT trailing slash, but we will add it in code
const rawUrl = 'https://letterboxd.com/dave/list/official-top-250-narrative-feature-films';
const url = rawUrl.endsWith('/') ? rawUrl : rawUrl + '/';

async function testScrape() {
    try {
        console.log('Fetching:', url);
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
            },
            redirect: 'follow'
        });

        console.log('STATUS_CODE:', response.status);
        console.log('STATUS_TEXT:', response.statusText);

    } catch (error) {
        console.error('FETCH_ERROR:', error);
    }
}

testScrape();
