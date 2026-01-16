import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google"; // Importing Outfit for headings
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Letterboxd List Clone",
  description: "Export any public Letterboxd list to CSV format. Import films to your watchlist or custom lists easily.",
  keywords: ["letterboxd", "movies", "film", "csv export", "movie list", "watchlist"],
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased text-white bg-[#0f1115] overflow-x-hidden selection:bg-[#00e054] selection:text-black`}>
        {children}
      </body>
    </html>
  );
}
