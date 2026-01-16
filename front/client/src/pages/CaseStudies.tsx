import { Filter, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { trpc } from '@/lib/api';
import { useState } from 'react';

export default function CaseStudies() {
  const [selectedIndustry, setSelectedIndustry] = useState<string>();
  const caseStudiesQuery = trpc.caseStudies.list.useQuery();
  const caseStudies = caseStudiesQuery.data || [];

  const industries = ['Technology', 'Finance', 'Healthcare', 'Retail'];
  const scopes = ['Enterprise', 'Mid-Market', 'Startup'];
  const impacts = ['High', 'Medium', 'Low'];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-secondary/5" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Case <span className="text-accent">Studies</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Explore how we've helped leading enterprises achieve their strategic objectives.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Filter className="w-5 h-5 text-accent" />
              <h2 className="text-2xl font-bold text-foreground">Filter by Industry</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setSelectedIndustry(undefined)}
                variant={selectedIndustry === undefined ? 'default' : 'outline'}
                className={selectedIndustry === undefined ? 'bg-accent text-white' : ''}
              >
                All
              </Button>
              {industries.map((industry) => (
                <Button
                  key={industry}
                  onClick={() => setSelectedIndustry(industry)}
                  variant={selectedIndustry === industry ? 'default' : 'outline'}
                  className={selectedIndustry === industry ? 'bg-accent text-white' : ''}
                >
                  {industry}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {caseStudies.length > 0 ? (
              caseStudies.map((study) => (
                <div key={study.id} className="rounded-lg overflow-hidden border border-border bg-background hover:shadow-lg transition-shadow duration-300">
                  <div className="h-48 bg-gradient-to-br from-accent/20 to-secondary/20 flex items-center justify-center">
                    <span className="text-muted-foreground">Case Study Image</span>
                  </div>
                  <div className="p-6">
                    <div className="flex gap-2 mb-3">
                      {study.industry && <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent">{study.industry}</span>}
                      {study.scope && <span className="text-xs px-2 py-1 rounded bg-secondary/10 text-secondary-foreground">{study.scope}</span>}
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{study.title}</h3>
                    <p className="text-muted-foreground mb-4">{study.description}</p>
                    <Button className="w-full bg-accent hover:bg-accent/90 text-white flex items-center justify-center gap-2">
                      Read Case Study <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No case studies available yet.</p>
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
