"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";

interface SlideshowItemShape {
  src: string;
  label: string;
  short: string;
}

const heroImages: SlideshowItemShape[] = [
  {
    src: "/hero/clothes.jpg",
    label: "Curated Apparels & Trend Styles",
    short: "Clothing & Styles",
  },
  {
    src: "/hero/shoes.jpg",
    label: "Designer Footwear Collections",
    short: "Footwear & Shoes",
  },
  {
    src: "/hero/fashion-accessories.jpg",
    label: "Bespoke Fashion Accessories",
    short: "Fashion Details",
  },
  {
    src: "/hero/consultation.jpg",
    label: "Health & Wellness Consults",
    short: "Consultations",
  },
  {
    src: "/hero/salon.jpg",
    label: "Premium Hair Salons",
    short: "Hair Salons",
  },
  { src: "/hero/spa.jpg", label: "Luxury Spas & Massage", short: "Spas & Spa" },
  {
    src: "/hero/nails.jpg",
    label: "Nails & Pedicure Studios",
    short: "Nails & Pedi",
  },
  { src: "/hero/skincare.jpg", label: "Skincare & Facials", short: "Skincare" },
  {
    src: "/hero/wellness-beauty.jpg",
    label: "Wellness & Beauty Hubs",
    short: "Wellness",
  },
  {
    src: "/hero/hairdresser.jpg",
    label: "Elite Hair Styling",
    short: "Hair Styling",
  },
  {
    src: "/hero/barber.jpg",
    label: "Modern Barbershops & Grooming",
    short: "Barbershops",
  },
  {
    src: "/hero/makeup-artist.jpg",
    label: "Expert Makeup Artists",
    short: "Makeup Art",
  },
];

const SLIDE_DURATION = 4500; // total time each slide is shown
const EXIT_DURATION = 450; // time reserved for the exit sweep before switching

export default function HeroSlideshow() {
  const [index, setIndex] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const timer1 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timer2 = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleNext = useCallback(function schedule() {
    timer1.current = setTimeout(() => {
      setExiting(true);
      timer2.current = setTimeout(() => {
        setIndex((prev) => (prev + 1) % heroImages.length);
        setExiting(false);
        schedule();
      }, EXIT_DURATION);
    }, SLIDE_DURATION - EXIT_DURATION);
  }, []);

  useEffect(() => {
    scheduleNext();
    return () => {
      if (timer1.current) clearTimeout(timer1.current);
      if (timer2.current) clearTimeout(timer2.current);
    };
  }, [scheduleNext]);

  const handleImageError = useCallback((src: string) => {
    setFailedImages((prev) => ({ ...prev, [src]: true }));
  }, []);

  const handleManualSelection = (i: number) => {
    if (timer1.current) clearTimeout(timer1.current);
    if (timer2.current) clearTimeout(timer2.current);
    setExiting(false);
    setIndex(i);
    scheduleNext();
  };

  const current = heroImages[index];

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-slate-900">
      {/* Crossfading full-bleed image layers */}
      {heroImages.map((img, i) => {
        const isCurrent = i === index;
        const isBroken = !!failedImages[img.src];
        return (
          <div
            key={img.src}
            className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${
              isCurrent ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            {!isBroken ? (
              <Image
                src={img.src}
                alt={img.label}
                fill
                sizes="100vw"
                priority={i === 0}
                onError={() => handleImageError(img.src)}
                className={`object-cover ${isCurrent ? "animate-[kenburns_9s_ease-out_forwards]" : ""}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-black">
                <Sparkles className="w-10 h-10 text-white/10" />
              </div>
            )}
          </div>
        );
      })}

      {/* Scrims for text readability */}
      <div className="absolute inset-0 z-20 bg-gradient-to-r from-black/80 via-black/40 to-black/10" />
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/65 via-transparent to-black/10" />

      {/* ── BOLD SWEEPING LABEL ── */}
      <div className="absolute bottom-8 left-0 right-0 z-30 overflow-hidden h-16 sm:h-20 flex items-center">
        <div
          key={index}
          className={`relative flex items-center gap-4 pl-6 sm:pl-10 pr-8 py-3 ${
            exiting
              ? "animate-[sweepOut_0.45s_cubic-bezier(0.6,0,1,1)_forwards]"
              : "animate-[sweepIn_0.75s_cubic-bezier(0.16,1,0.3,1)_forwards]"
          }`}
        >
          {/* trailing accent bar */}
          <span className="absolute inset-y-0 left-0 -z-10 w-full bg-gradient-to-r from-primary/90 via-primary/40 to-transparent rounded-r-full" />

          <span className="h-2 w-2 rounded-full bg-white shrink-0 animate-pulse" />
          <span className="text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-lg whitespace-nowrap">
            {current.short}
          </span>
        </div>
      </div>

      {/* Progress dots (manual control) */}
      <div className="absolute top-6 right-6 z-30 flex gap-1.5">
        {heroImages.map((img, i) => (
          <button
            key={img.src}
            type="button"
            aria-label={`Show ${img.short}`}
            onClick={() => handleManualSelection(i)}
            className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
              i === index
                ? "w-6 bg-primary"
                : "w-1.5 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
