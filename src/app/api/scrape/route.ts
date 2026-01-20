import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    let { url } = await request.json();

    // Validate URL - accept both letterboxd.com and boxd.it short links
    const isLetterboxdUrl = url && url.startsWith('https://letterboxd.com/');
    const isShortLink = url && (url.startsWith('https://boxd.it/') || url.startsWith('http://boxd.it/'));

    if (!url || (!isLetterboxdUrl && !isShortLink)) {
      return NextResponse.json(
        { error: 'Please enter a valid Letterboxd URL or short link (boxd.it).' },
        { status: 400 }
      );
    }

    // Resolve short links to full Letterboxd URLs
    if (isShortLink) {
      try {
        // Use manual redirect to capture the Location header
        const resolveResponse = await fetch(url, {
          method: 'GET',
          redirect: 'manual',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });

        // Get the redirect location from the 301/302 response
        const redirectUrl = resolveResponse.headers.get('location');

        if (redirectUrl) {
          url = redirectUrl;
        } else if (resolveResponse.url && resolveResponse.url.startsWith('https://letterboxd.com/')) {
          // Fallback: some environments may auto-follow and give us the final URL
          url = resolveResponse.url;
        } else {
          // If no redirect found, the short link may be invalid
          return NextResponse.json(
            { error: 'The short link did not redirect to a Letterboxd page. Please check the link.' },
            { status: 400 }
          );
        }

        // Verify it resolved to a letterboxd.com URL
        if (!url.startsWith('https://letterboxd.com/')) {
          return NextResponse.json(
            { error: 'The short link did not resolve to a valid Letterboxd page.' },
            { status: 400 }
          );
        }

        console.log(`Resolved short link to: ${url}`);
      } catch (resolveError) {
        console.error('Failed to resolve short link:', resolveError);
        return NextResponse.json(
          { error: 'Failed to resolve the short link. Please try the full Letterboxd URL instead.' },
          { status: 400 }
        );
      }
    }

    // Handle pagination - Letterboxd lists can have multiple pages
    let allMovies: string[] = [];
    let currentPage = 1;
    let hasMorePages = true;

    // Normalize the URL - remove trailing slash and handle pagination
    let baseUrl = url.replace(/\/+$/, '');

    // If URL already has /page/X, extract base URL
    const pageMatch = baseUrl.match(/(.*)\/page\/\d+/);
    if (pageMatch) {
      baseUrl = pageMatch[1];
    }

    while (hasMorePages && currentPage <= 20) { // Limit to 20 pages max
      const pageUrl = currentPage === 1 ? baseUrl : `${baseUrl}/page/${currentPage}/`;

      console.log(`Fetching page ${currentPage}: ${pageUrl}`);

      const response = await fetch(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        if (currentPage === 1) {
          return NextResponse.json(
            { error: 'Failed to fetch the Letterboxd page. Please check the URL.' },
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

      console.log(`Found ${pageMovies.length} movies on page ${currentPage}`);

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
