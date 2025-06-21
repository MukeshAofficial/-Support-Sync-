import Navigation from "@/components/navigation"
import Hero from "@/components/hero"
import Features from "@/components/features"
import WhySection from "@/components/why-section"
import CTASection from "@/components/cta-section"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      <Features />
      <WhySection />
      <CTASection />
      <Footer />
    </div>
  )
}
