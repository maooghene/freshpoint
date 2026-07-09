// app/(public)/page.tsx

import * as React from "react";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import LandingFeaturesMatrix from "@/components/LandingFeaturesMatrix";
import CTA from "@/components/CTA";
import { OnboardingRedirectTracker } from "@/components/auth/OnboardingRedirectTracker"; // 🚀 Import the client trigger layer

export default function Home(): React.JSX.Element {
  return (
    <div className="w-full relative flex flex-col">
      {/* 🎯 THE HIDDEN REDIRECT GATEWAY INTERCEPTOR:
          Runs silently on mount to catch returning staff members or store owners 
          and push them to their correct dashboard layout locations! */}
      <OnboardingRedirectTracker />

      {/* 1. Entrance Greeting Header */}
      <Hero />

      {/* 2. Mechanics Explainer Process */}
      <HowItWorks />

      {/* 3. Client vs Merchant Value Comparison Split Matrix */}
      <LandingFeaturesMatrix />

      {/* 4. Interactive Merchant Tab Dashboard Form */}
      <CTA />
    </div>
  );
}
