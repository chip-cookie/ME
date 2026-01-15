import { Download, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { trpc } from '@/lib/trpc';

export default function Insights() {
  const insightsQuery = trpc.insights.list.useQuery();
  const insights = insightsQuery.data || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-secondary/5" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Insights & <span className="text-accent">Research</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Industry analysis and strategic insights to inform your decisions.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {insights.length > 0 ? (
              insights.map((insight) => (
                <div key={insight.id} className="p-8 rounded-lg border border-border bg-background hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <BookOpen className="w-6 h-6 text-accent flex-shrink-0" />
                    {insight.featured && <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent">Featured</span>}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{insight.title}</h3>
                  <p className="text-muted-foreground mb-4">{insight.description}</p>
                  {insight.category && <p className="text-sm text-accent mb-4">{insight.category}</p>}
                  <Button className="bg-accent hover:bg-accent/90 text-white flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No insights available yet.</p>
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
