
const shortUrl = 'https://boxd.it/nVqt6';

async function testShortUrl() {
    console.log('Testing Short URL:', shortUrl);

    try {
        const response = await fetch(shortUrl, {
            method: 'HEAD', // Use HEAD to just get headers and status if possible, or GET
            redirect: 'manual', // Don't follow yet, I want to see the Location header
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
        });

        console.log('Status:', response.status);
        console.log('Location:', response.headers.get('location'));

        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('location');
            if (location) {
                console.log('Redirects to:', location);
                // Verify if the redirected URL is a valid letterboxd list URL
            }
        } else if (response.status === 200) {
            console.log('No redirect, maybe it returns the page directly?');
            console.log('Final URL:', response.url);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testShortUrl();
