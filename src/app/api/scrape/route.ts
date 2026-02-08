import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    // Validate URL
    if (!url) {
      return NextResponse.json(
        { error: 'Please enter a valid Letterboxd URL.' },
        { status: 400 }
      );
    }

    let targetUrl = url;

    // Handle boxd.it short URLs
    if (url.startsWith('https://boxd.it/')) {
      try {
        const redirectResponse = await fetch(url, {
          method: 'HEAD',
          redirect: 'manual',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        if (redirectResponse.status >= 300 && redirectResponse.status < 400) {
          const location = redirectResponse.headers.get('location');
          if (location && location.startsWith('https://letterboxd.com/')) {
            targetUrl = location;
          } else {
            return NextResponse.json(
              { error: 'Short URL did not redirect to a valid Letterboxd page.' },
              { status: 400 }
            );
          }
        } else {
          return NextResponse.json(
            { error: 'Could not resolve short URL.' },
            { status: 400 }
          );
        }
      } catch (e) {
        return NextResponse.json(
          { error: 'Failed to resolve short URL.' },
          { status: 400 }
        );
      }
    } else if (!url.startsWith('https://letterboxd.com/')) {
      return NextResponse.json(
        { error: 'Please enter a valid Letterboxd URL.' },
        { status: 400 }
      );
    }

    // Handle pagination - Letterboxd lists can have multiple pages
    let allMovies: string[] = [];
    let currentPage = 1;
    let hasMorePages = true;

    // Normalize the URL using the URL API
    let baseUrl = '';
    try {
      const urlObj = new URL(targetUrl);
      // Remove trailing slash from pathname if present, then add it back to ensure consistency
      // actually, just ensure it ends with /
      let cleanPathname = urlObj.pathname.replace(/\/+$/, '') + '/';

      // Reconstruct URL without query params or hash
      baseUrl = `${urlObj.origin}${cleanPathname}`;
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid URL format.' },
        { status: 400 }
      );
    }

    // If URL already has /page/X, extract base URL
    // We can do this safely now that we have a clean base URL
    const pageMatch = baseUrl.match(/(.*)\/page\/\d+\/?$/);
    if (pageMatch) {
      baseUrl = pageMatch[1];
      // Ensure it ends with /
      if (!baseUrl.endsWith('/')) {
        baseUrl += '/';
      }
    }
    // Ensure no trailing slash after regex extraction just in case
    // baseUrl = baseUrl.replace(/\/+$/, '');


    while (hasMorePages && currentPage <= 20) { // Limit to 20 pages max
      // baseUrl already has trailing slash, so we append page/X/ directly
      const pageUrl = currentPage === 1 ? baseUrl : `${baseUrl}page/${currentPage}/`;



      const response = await fetch(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch page ${currentPage}. Status: ${response.status} ${response.statusText}`);
        if (currentPage === 1) {
          return NextResponse.json(
            { error: `Failed to fetch the Letterboxd page. Status: ${response.status}` },
            { status: 400 }
          );
        }
        break; // No more pages
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const pageMovies: string[] = [];

      // Try multiple selectors for movie titles
      // Selector 1: Poster containers with img alt text
      $('.poster-container img, .film-poster img, li.poster-container img').each((_, element) => {
        const alt = $(element).attr('alt');
        if (alt && alt.trim()) {
          pageMovies.push(alt.trim());
        }
      });

      // Selector 2: Film list items with data-film-name
      if (pageMovies.length === 0) {
        $('[data-film-name]').each((_, element) => {
          const name = $(element).attr('data-film-name');
          if (name && name.trim()) {
            pageMovies.push(name.trim());
          }
        });
      }

      // Selector 3: Headline links in film entries
      if (pageMovies.length === 0) {
        $('.headline-2 a, .film-detail .headline-3 a, h2.headline-2 a').each((_, element) => {
          const text = $(element).text();
          if (text && text.trim()) {
            pageMovies.push(text.trim());
          }
        });
      }

      // Selector 4: List page specific - poster with data-target-link
      if (pageMovies.length === 0) {
        $('li.poster-container').each((_, element) => {
          const img = $(element).find('img');
          const alt = img.attr('alt');
          if (alt && alt.trim()) {
            pageMovies.push(alt.trim());
          }
        });
      }

      // Selector 5: Generic film poster fallback
      if (pageMovies.length === 0) {
        $('.film-poster').each((_, element) => {
          const img = $(element).find('img');
          const alt = img.attr('alt');
          if (alt && alt.trim()) {
            pageMovies.push(alt.trim());
          }
        });
      }

      // Selector 6: linked-film-poster
      if (pageMovies.length === 0) {
        $('.linked-film-poster').each((_, element) => {
          const img = $(element).find('img');
          const alt = img.attr('alt');
          if (alt && alt.trim()) {
            pageMovies.push(alt.trim());
          }
        });
      }



      if (pageMovies.length === 0) {
        hasMorePages = false;
      } else {
        allMovies = [...allMovies, ...pageMovies];

        // Check if there's a next page link
        const nextPageLink = $('a.next, .paginate-nextprev a.next, .pagination a.next');
        hasMorePages = nextPageLink.length > 0;
        currentPage++;
      }
    }

    // Remove duplicates while preserving order
    const uniqueMovies = [...new Set(allMovies)];

    if (uniqueMovies.length === 0) {
      return NextResponse.json(
        { error: 'No movies found. Please check the URL or try a different list.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      movies: uniqueMovies,
      count: uniqueMovies.length,
    });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'An error occurred while scraping. Please try again.' },
      { status: 500 }
    );
  }
}
