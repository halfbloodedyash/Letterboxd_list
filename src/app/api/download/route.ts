import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { movies } = await request.json();

        if (!movies || !Array.isArray(movies) || movies.length === 0) {
            return NextResponse.json(
                { error: 'No movies provided for CSV generation.' },
                { status: 400 }
            );
        }

        // Generate CSV content with Letterboxd import format
        // Letterboxd accepts: Title, Year, Rating10, WatchedDate, Rewatch, Tags, Review
        // For list imports, Title is the minimum required
        const csvHeader = 'Title';

        const csvRows = movies.map((movie: string) => {
            // Clean and escape the movie title for CSV
            let title = movie.trim();

            // Remove any year in parentheses from the title if present (e.g., "Movie Name (2023)")
            // Letterboxd handles this internally
            title = title.replace(/\s*\(\d{4}\)\s*$/, '').trim();

            // Escape quotes by doubling them and wrap in quotes if needed
            if (title.includes(',') || title.includes('"') || title.includes('\n')) {
                title = `"${title.replace(/"/g, '""')}"`;
            }

            return title;
        });

        // Filter out any empty rows
        const filteredRows = csvRows.filter(row => row.length > 0);

        const csvContent = [csvHeader, ...filteredRows].join('\r\n');

        // Return CSV as downloadable file with proper encoding
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="letterboxd_import.csv"',
            },
        });
    } catch (error) {
        console.error('CSV generation error:', error);
        return NextResponse.json(
            { error: 'An error occurred while generating the CSV.' },
            { status: 500 }
        );
    }
}
