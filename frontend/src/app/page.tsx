import Navigation from '@/components/landing/Navigation'
import HeroSection from '@/components/landing/HeroSection'
import VelocityScroller from '@/components/landing/VelocityScroller'
import FeaturesSection from '@/components/landing/FeaturesSection'
import MayaSection from '@/components/landing/MayaSection'
import SocialProof from '@/components/landing/SocialProof'
import PricingSection from '@/components/landing/PricingSection'
import FAQSection from '@/components/landing/FAQSection'
import CTASection from '@/components/landing/CTASection'
import Footer from '@/components/landing/Footer'
import FloatingDock from '@/components/landing/FloatingDock'

export default function LandingPage() {
  return (
    <main className="relative overflow-x-hidden" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Global hex grid — fixed base layer, sections layer their own hex-bg on top */}
      <div
        className="fixed inset-0 pointer-events-none select-none"
        aria-hidden
        style={{
          zIndex: 0,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100' viewBox='0 0 56 100'%3E%3Cpath d='M28 66L0 50V17L28 0l28 17v33z' fill='none' stroke='rgba(66%2C132%2C117%2C0.35)' stroke-width='1'/%3E%3Cpath d='M28 100L0 84V50l28-17 28 17v33z' fill='none' stroke='rgba(66%2C132%2C117%2C0.35)' stroke-width='1'/%3E%3C/svg%3E\")",
          backgroundSize: '56px 100px',
          opacity: 0.22,
        }}
      />
      <Navigation />
      <HeroSection />
      <VelocityScroller />
      <FeaturesSection />
      <MayaSection />
      <SocialProof />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
      <FloatingDock />
    </main>
  )
}
