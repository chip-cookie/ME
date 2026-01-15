import { Briefcase, Zap, TrendingUp, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { trpc } from '@/lib/trpc';

export default function Services() {
  const servicesQuery = trpc.services.list.useQuery();
  const services = servicesQuery.data || [];

  const defaultServices = [
    {
      id: 1,
      title: 'Strategy Development',
      description: 'Develop comprehensive strategies aligned with your business goals and market dynamics.',
      details: 'Our strategic consulting services help you identify opportunities, assess competitive landscapes, and develop actionable roadmaps for growth.',
      icon: 'briefcase' as const,
    },
    {
      id: 2,
      title: 'Implementation',
      description: 'Execute strategies with precision, ensuring seamless integration across your organization.',
      details: 'We manage complex implementations with structured methodologies, ensuring minimal disruption and maximum adoption.',
      icon: 'zap' as const,
    },
    {
      id: 3,
      title: 'Performance Optimization',
      description: 'Optimize operations and maximize efficiency through data-driven insights.',
      details: 'Leverage advanced analytics and best practices to identify inefficiencies and unlock operational excellence.',
      icon: 'trending' as const,
    },
    {
      id: 4,
      title: 'Team Training',
      description: 'Empower your team with skills and knowledge for sustained success.',
      details: 'Build organizational capability through targeted training programs and change management initiatives.',
      icon: 'users' as const,
    },
  ];

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'briefcase':
        return <Briefcase className="w-6 h-6 text-accent" />;
      case 'zap':
        return <Zap className="w-6 h-6 text-accent" />;
      case 'trending':
        return <TrendingUp className="w-6 h-6 text-accent" />;
      case 'users':
        return <Users className="w-6 h-6 text-accent" />;
      default:
        return <Briefcase className="w-6 h-6 text-accent" />;
    }
  };

  const displayServices = services.length > 0 ? services : defaultServices;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-secondary/5" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-pulse" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Our <span className="text-accent">Consulting Services</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Comprehensive solutions designed to drive transformation and deliver measurable results across your organization.
            </p>
          </div>
        </div>
      </section>

      {/* Services Detail Section */}
      <section className="section-padding bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {displayServices.map((service, index) => {
              return (
                <div
                  key={service.id}
                  className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${
                    index % 2 === 1 ? 'md:grid-cols-2 md:[&>*:first-child]:order-2' : ''
                  }`}
                >
                  {/* Content */}
                  <div className="fade-in-up">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                        {service.icon && typeof service.icon === 'string' ? getIcon(service.icon) : <Briefcase className="w-6 h-6 text-accent" />}
                      </div>
                      <span className="text-sm font-semibold text-accent">Service {index + 1}</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                      {service.title}
                    </h2>
                    <p className="text-lg text-muted-foreground mb-6">
                      {service.description}
                    </p>
                    {'details' in service && service.details && (
                      <p className="text-muted-foreground mb-8">
                        {service.details}
                      </p>
                    )}
                    <Button className="bg-accent hover:bg-accent/90 text-white px-6 py-3 rounded-lg flex items-center gap-2">
                      Learn More <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Image Placeholder */}
                  <div className="relative h-96 rounded-lg overflow-hidden bg-gradient-to-br from-accent/20 to-secondary/20 flex items-center justify-center">
                    <div className="text-center">
                      {service.icon && typeof service.icon === 'string' ? (
                        <div className="text-accent/30 mb-4 flex justify-center">
                          {getIcon(service.icon)}
                        </div>
                      ) : (
                        <Briefcase className="w-24 h-24 text-accent/30 mx-auto mb-4" />
                      )}
                      <p className="text-muted-foreground">Service Visualization</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Why Choose Stratify?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We combine deep industry expertise with proven methodologies to deliver exceptional results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Proven Track Record',
                description: 'Decades of combined experience delivering transformational results for Fortune 500 companies.',
              },
              {
                title: 'Expert Team',
                description: 'Industry veterans and thought leaders dedicated to your success.',
              },
              {
                title: 'Measurable Results',
                description: 'We focus on tangible outcomes with clear KPIs and continuous monitoring.',
              },
              {
                title: 'Custom Solutions',
                description: 'Tailored approaches that address your unique business challenges.',
              },
              {
                title: 'Change Management',
                description: 'Comprehensive support to ensure successful adoption and sustainability.',
              },
              {
                title: 'Ongoing Support',
                description: 'Partnership extends beyond implementation with continuous optimization.',
              },
            ].map((benefit, index) => (
              <div
                key={index}
                className="p-8 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow duration-300"
              >
                <h3 className="text-xl font-bold text-foreground mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding premium-gradient text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Let's discuss how our services can help you achieve your strategic objectives.
          </p>
          <a href="/contact">
            <Button className="bg-white hover:bg-gray-100 text-accent px-8 py-6 text-lg rounded-lg font-semibold">
              Schedule a Consultation
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p>&copy; 2024 Stratify Consulting. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
