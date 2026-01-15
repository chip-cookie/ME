import { BarChart3, TrendingUp } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { trpc } from '@/lib/trpc';

export default function Results() {
  const resultsQuery = trpc.clientResults.list.useQuery();
  const results = resultsQuery.data || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-secondary/5" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Client <span className="text-accent">Results</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Measurable impact delivered across our client portfolio.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {results.length > 0 ? (
              results.map((result) => (
                <div key={result.id} className="p-8 rounded-lg border border-border bg-background hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-6 h-6 text-accent" />
                    <h3 className="text-lg font-semibold text-foreground">{result.metric}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{result.clientName}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Before</p>
                      <p className="text-2xl font-bold text-foreground">{result.beforeValue}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">After</p>
                      <p className="text-2xl font-bold text-accent">{result.afterValue}</p>
                    </div>
                  </div>
                  {result.improvement && (
                    <p className="text-sm text-accent font-semibold mt-4">+{result.improvement}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No results data available yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-foreground text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p>&copy; 2024 Stratify Consulting. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
