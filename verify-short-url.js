
// Test script for short URL verification
// We will test both a short URL and a standard URL to ensure no regressions

async function testScrape(url) {
    console.log(`\nTesting URL: ${url}`);
    try {
        const response = await fetch('http://localhost:3000/api/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });

        console.log('Status:', response.status);
        const data = await response.json();

        if (response.ok) {
            console.log(`Success! Found ${data.count} movies.`);
        } else {
            console.log('Error:', data.error);
        }

    } catch (error) {
        console.error('Fetch error:', error);
    }
}

// Ensure the server is running before running this test
(async () => {
    // Short URL
    await testScrape('https://boxd.it/nVqt6');
    // Standard URL (Regression check)
    await testScrape('https://letterboxd.com/dave/list/official-top-250-narrative-feature-films/');
})();
