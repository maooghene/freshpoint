"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

const SLIDE_DURATION = 4500;
const EXIT_DURATION = 400;

export default function HeroSlideshow() {
  const [index, setIndex] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const timer1 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timer2 = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleNext = useCallback(function recursiveScheduleNext() {
    timer1.current = setTimeout(() => {
      setExiting(true);
      timer2.current = setTimeout(() => {
        setIndex((prev) => (prev + 1) % heroImages.length);
        setExiting(false);
        recursiveScheduleNext();
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
    <div className="relative w-full">
      {/* Ambient glow blobs — reinforce the "radiating from center" feel */}
      <div className="absolute -inset-8 -z-10 hidden lg:block">
        <div className="absolute top-1/4 -left-10 w-56 h-56 bg-primary/20 rounded-full blur-[90px]" />
        <div className="absolute bottom-1/4 -right-10 w-64 h-64 bg-emerald-500/15 rounded-full blur-[100px]" />
      </div>

      {/* The image card itself — fixed, sane aspect ratio so photos display in full */}
      <div
        className="relative w-full aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/5] xl:aspect-[16/12]
                   rounded-[1.75rem] sm:rounded-[2.25rem] overflow-hidden
                   ring-1 ring-white/10 shadow-2xl shadow-black/40 bg-slate-900"
      >
        {heroImages.map((img, i) => {
          const isCurrent = i === index;
          const isBroken = !!failedImages[img.src];
          return (
            <div
              key={img.src}
              className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out ${
                isCurrent ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              {!isBroken ? (
                <Image
                  src={img.src}
                  alt={img.label}
                  fill
                  sizes="(max-width: 1024px) 90vw, 45vw"
                  priority={i === 0}
                  onError={() => handleImageError(img.src)}
                  className={`object-cover ${isCurrent ? "animate-[kenburns_9s_ease-out_forwards]" : ""}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-black">
                  <Sparkles className="w-8 h-8 text-white/10" />
                </div>
              )}
            </div>
          );
        })}

        {/* Bottom scrim, scoped to the card only — never touches the text zone */}
        <div className="absolute inset-x-0 bottom-0 h-28 z-20 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Sweeping category label, scoped inside the card */}
        <div className="absolute bottom-4 left-4 right-4 z-30 overflow-hidden h-9">
          <div
            key={index}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
                        bg-white/10 backdrop-blur-md border border-white/20 shadow-lg
                        ${
                          exiting
                            ? "animate-[sweepOutSm_0.4s_cubic-bezier(0.6,0,1,1)_forwards]"
                            : "animate-[sweepInSm_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                        }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-white tracking-tight whitespace-nowrap">
              {current.short}
            </span>
          </div>
        </div>

        {/* Progress dots */}
        <div className="absolute top-4 right-4 z-30 flex gap-1.5">
          {heroImages.map((img, i) => (
            <button
              key={img.src}
              type="button"
              aria-label={`Show ${img.short}`}
              onClick={() => handleManualSelection(i)}
              className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                i === index
                  ? "w-5 bg-white"
                  : "w-1.5 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
