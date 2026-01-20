'use client';

import { useState } from 'react';

// Reuse existing types and state logic
interface ScrapeResult {
  movies: string[];
  count: number;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ScrapeResult | null>(null);

  // Existing handlers...
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'An error occurred');
        return;
      }

      setResult(data);
    } catch {
      setError('Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!result?.movies) return;

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movies: result.movies }),
      });

      if (!response.ok) {
        setError('Failed to generate CSV');
        return;
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'letterboxd_import.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      setError('Failed to download CSV');
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">

      {/* Cinematic Background Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[#00e054]/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen opacity-50 animate-pulse" style={{ animationDuration: '4s' }}></div>
      <div className="fixed top-0 right-0 w-[800px] h-[600px] bg-[#40bcf4]/5 rounded-full blur-[100px] pointer-events-none mix-blend-screen opacity-30"></div>

      <main className="flex-grow container mx-auto px-4 pt-20 pb-12 md:pt-32 md:pb-20 max-w-5xl relative z-10">

        {/* New Centered Hero Section */}
        <section className="text-center mb-16 animate-fade-in flex flex-col items-center">

          {/* Logo Mark */}
          <div className="flex gap-2 mb-6 hover:scale-105 transition-transform duration-500 cursor-default">
            <div className="w-2.5 h-4 md:w-3 md:h-5 bg-[#00e054] rounded-sm shadow-[0_0_12px_rgba(0,224,84,0.3)]"></div>
            <div className="w-2.5 h-4 md:w-3 md:h-5 bg-[#40bcf4] rounded-sm shadow-[0_0_12px_rgba(64,188,244,0.3)]"></div>
            <div className="w-2.5 h-4 md:w-3 md:h-5 bg-[#ff8000] rounded-sm shadow-[0_0_12px_rgba(255,128,0,0.3)]"></div>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-5 font-heading tracking-tight leading-[1.1]">
            Export <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">Lists.</span><br />
            Import <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00e054] via-[#40bcf4] to-[#ff8000]">Memories.</span>
          </h1>

          <p className="text-base md:text-lg text-[#99aabb] max-w-xl mx-auto leading-relaxed font-light">
            Clone any public Letterboxd list. Export to CSV and import to your account.
          </p>

          <div className="flex gap-3 mt-6 text-sm text-[#5f6e7c]">
            <span className="flex items-center gap-1.5">
              <span className="text-[#00e054]">✓</span> Simple
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#40bcf4]">✓</span> Fast
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#ff8000]">✓</span> Free
            </span>
          </div>
        </section>

        {/* Main Interaction Card */}
        <section className="max-w-3xl mx-auto mb-20 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="glass-panel rounded-2xl p-8 md:p-10 shadow-2xl shadow-black/50 relative overflow-hidden group">

            {/* Ambient Background Glow inside card */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00e054]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#99aabb] uppercase tracking-wider ml-1">
                  Public List URL
                </label>
                <div className="relative group/input">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste URL or short link (boxd.it/...)"
                    required
                    className="w-full glass-input rounded-xl px-6 py-5 text-lg text-white placeholder-white/20 outline-none"
                  />
                  <div className="absolute inset-0 rounded-xl pointer-events-none border border-white/10 group-hover/input:border-white/20 transition-colors"></div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-bold font-heading text-lg py-5 rounded-xl hover:bg-[#e0e0e0] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center gap-3 relative overflow-hidden"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-black/60" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Extracting Films...</span>
                  </>
                ) : (
                  <>
                    <span>Scrape Movies</span>
                    <svg className="w-5 h-5 -mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-200 animate-fade-in">
                <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <p>{error}</p>
              </div>
            )}

            {/* Success Result */}
            {result && (
              <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-[#00e054]/10 to-transparent border border-[#00e054]/20 animate-fade-in">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                    <h3 className="text-white font-bold text-xl mb-1">Scraping Complete!</h3>
                    <p className="text-[#00e054] font-medium">{result.count} films found ready for export.</p>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="w-full md:w-auto px-8 py-3 bg-[#00e054] hover:bg-[#00c94a] text-black font-bold rounded-lg shadow-lg shadow-[#00e054]/20 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    Download CSV
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Steps Grid */}
        <section className="mb-24 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white font-heading mb-3">How It Works</h3>
            <p className="text-[#99aabb] text-sm">Four simple steps to clone any list</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: 1,
                title: "Copy List URL",
                desc: "Find any public Letterboxd list and copy the URL from your browser",
                icon: "🔗",
                color: "bg-[#00e054]"
              },
              {
                step: 2,
                title: "Paste & Scrape",
                desc: "Paste the URL above and click 'Scrape Movies' to extract all films",
                icon: "�",
                color: "bg-[#40bcf4]"
              },
              {
                step: 3,
                title: "Download CSV",
                desc: "Download the generated CSV file to your computer",
                icon: "💾",
                color: "bg-[#ff8000]"
              },
              {
                step: 4,
                title: "Import to Letterboxd",
                desc: "Visit letterboxd.com/import and upload your CSV to create your list",
                icon: "✨",
                color: "bg-white"
              },
            ].map((item) => (
              <div key={item.step} className="glass-panel p-6 rounded-2xl relative group hover:bg-white/[0.05] hover:-translate-y-2 transition-all duration-300">
                <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center text-xl font-bold mb-4 shadow-lg`}>
                  {item.icon}
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#5f6e7c] tracking-wider">STEP {item.step}</span>
                </div>
                <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                <p className="text-[#99aabb] text-sm leading-relaxed">{item.desc}</p>

                {/* Connector Line (Desktop) */}
                {item.step < 4 && (
                  <div className="hidden md:block absolute top-[2.5rem] -right-5 w-4 h-[2px] bg-white/10" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA / Features */}
        <section className="text-center pb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p className="text-[#5f6e7c] text-sm uppercase tracking-widest font-semibold mb-6">Why use this tool?</p>
          <div className="flex flex-wrap justify-center gap-3 md:gap-8">
            {[
              "Works with any public list",
              "Smart pagination handling",
              "Perfect CSV formatting",
              "100% Free & Secure"
            ].map((feat, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-[#99aabb] bg-white/[0.03] px-4 py-2 rounded-full border border-white/[0.05] hover:bg-white/[0.08] hover:scale-105 hover:border-[#00e054]/30 transition-all duration-300 cursor-default"
              >
                <span className="text-[#00e054]">✓</span>
                <span className="text-sm font-medium">{feat}</span>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0f1115] relative overflow-hidden">
        {/* Footer Ambient Glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-[#40bcf4]/5 blur-[60px] pointer-events-none"></div>

        <div className="container mx-auto px-6 py-6 relative z-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm flex items-center gap-2">
              <span className="text-[#5f6e7c]">Made with</span>
              <span className="text-[#ff8000]">❤️</span>
              <span className="text-[#5f6e7c]">by</span>
              <span className="text-white font-medium hover:text-[#00e054] transition-colors cursor-default">Yash</span>
            </p>
            <p className="text-xs text-[#5f6e7c]">
              Not affiliated with Letterboxd
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
