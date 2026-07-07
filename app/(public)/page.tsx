// app/page.tsx

import * as React from "react";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import LandingFeaturesMatrix from "@/components/LandingFeaturesMatrix"; // 🌟 ADDED EMBED MATRIX HERE
import CTA from "@/components/CTA";

export default function Home() {
  return (
    // 🌟 FIXED: Arranged in clean, tight, space-efficient logical section sequences
    <div className="w-full relative flex flex-col">
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
