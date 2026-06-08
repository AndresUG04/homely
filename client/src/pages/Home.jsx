import Navbar from "../components/landing-page/Navbar";
import HeroSection from "../components/landing-page/HeroSection";
import StatsSection from "../components/landing-page/StatsSection";
import FeaturesSection from "../components/landing-page/FeaturesSection";
import HowItWorksSection from "../components/landing-page/HowItWorksSection";
import PortableProfileSection from "../pages/profile/PortableProfileSection";
import PricingSection from "../components/landing-page/PricingSection";
import TestimonialsSection from "../components/landing-page/TestimonialsSection";
import CTASection from "../components/landing-page/CTASection";
import Footer from "../components/landing-page/Footer";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: "#FBF5E0" }}>
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PortableProfileSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
