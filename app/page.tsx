import {
  Navbar,
  Hero,
  Features,
  HowItWorks,
  Pricing,
  FAQ,
  Testimonials,
  CTA,
  Footer,
} from '@/components/landing';

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
