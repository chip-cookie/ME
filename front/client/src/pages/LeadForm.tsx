import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function LeadForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    companySize: '',
    industry: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    projectScope: '',
    projectTimeline: '',
    budgetRange: '',
    challenges: '',
    goals: '',
  });

  const createLeadMutation = trpc.leadInquiries.create.useMutation();

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await createLeadMutation.mutateAsync(formData);
      toast.success('Thank you! We will contact you soon.');
      setFormData({
        companyName: '',
        companySize: '',
        industry: '',
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        projectScope: '',
        projectTimeline: '',
        budgetRange: '',
        challenges: '',
        goals: '',
      });
      setStep(1);
    } catch (error) {
      toast.error('Failed to submit form. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-secondary/5" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-center">
              Get in <span className="text-accent">Touch</span>
            </h1>
            <p className="text-xl text-muted-foreground text-center">
              Tell us about your project and let's explore how we can help.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Company Information</h2>
                  <input
                    type="text"
                    name="companyName"
                    placeholder="Company Name"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground"
                  />
                  <select
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground"
                  >
                    <option value="">Select Company Size</option>
                    <option value="1-50">1-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-1000">201-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground"
                  >
                    <option value="">Select Industry</option>
                    <option value="Technology">Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Retail">Retail</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Contact Information</h2>
                  <input
                    type="text"
                    name="contactName"
                    placeholder="Your Name"
                    value={formData.contactName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground"
                  />
                  <input
                    type="email"
                    name="contactEmail"
                    placeholder="Email Address"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground"
                  />
                  <input
                    type="tel"
                    name="contactPhone"
                    placeholder="Phone Number"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-foreground mb-6">Project Details</h2>
                  <textarea
                    name="projectScope"
                    placeholder="Describe your project scope"
                    value={formData.projectScope}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground"
                  />
                  <select
                    name="projectTimeline"
                    value={formData.projectTimeline}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground"
                  >
                    <option value="">Select Timeline</option>
                    <option value="0-3 months">0-3 months</option>
                    <option value="3-6 months">3-6 months</option>
                    <option value="6-12 months">6-12 months</option>
                    <option value="12+ months">12+ months</option>
                  </select>
                  <select
                    name="budgetRange"
                    value={formData.budgetRange}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground"
                  >
                    <option value="">Select Budget Range</option>
                    <option value="$50k-$100k">$50k-$100k</option>
                    <option value="$100k-$250k">$100k-$250k</option>
                    <option value="$250k-$500k">$250k-$500k</option>
                    <option value="$500k+">$500k+</option>
                  </select>
                </div>
              )}

              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  onClick={() => setStep(Math.max(1, step - 1))}
                  variant="outline"
                  disabled={step === 1}
                  className="px-6 py-3"
                >
                  Previous
                </Button>
                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    className="bg-accent hover:bg-accent/90 text-white px-6 py-3"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="bg-accent hover:bg-accent/90 text-white px-6 py-3"
                    disabled={createLeadMutation.isPending}
                  >
                    {createLeadMutation.isPending ? 'Submitting...' : 'Submit'}
                  </Button>
                )}
              </div>
            </form>
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
