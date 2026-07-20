"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Sparkles, ArrowRight } from "lucide-react";

interface SlideshowItemShape {
  src: string;
  label: string;
  short: string;
}

// 🎯 UNIFIED MASTER INSTANCE: Holds all 12 of your original wellness services and new fashion product lines together with zero restrictions!
const heroImages: SlideshowItemShape[] = [
  /* ── BRAND NEW FASHION & APPAREL CATEGORIES ── */
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
  /* ── ALL ORIGINAL SERVICES FULLY RESTORED & ALIGNED ── */
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
  {
    src: "/hero/spa.jpg",
    label: "Luxury Spas & Massage",
    short: "Spas & Spa",
  },
  {
    src: "/hero/nails.jpg",
    label: "Nails & Pedicure Studios",
    short: "Nails & Pedi",
  },
  {
    src: "/hero/skincare.jpg",
    label: "Skincare & Facials",
    short: "Skincare",
  },
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

export default function HeroSlideshow() {
  const [index, setIndex] = useState<number>(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const scrollToActiveElement = (targetIdx: number) => {
    const container = containerRef.current;
    const activeEl = buttonRefs.current[targetIdx];

    if (container && activeEl) {
      const targetScrollTop =
        activeEl.offsetTop -
        container.clientHeight / 2 +
        activeEl.clientHeight / 2;

      container.scrollTo({
        top: targetScrollTop,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev: number) => {
        const nextIndex = (prev + 1) % heroImages.length;
        scrollToActiveElement(nextIndex);
        return nextIndex;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const handleManualSelection = (i: number) => {
    setIndex(i);
    scrollToActiveElement(i);
  };

  const handleImageError = (src: string) => {
    setFailedImages((prev) => ({ ...prev, [src]: true }));
  };

  return (
    <div className="w-full max-w-[580px] aspect-[4/3] md:h-[380px] rounded-[2rem] border border-border/80 bg-card p-4 shadow-2xl overflow-hidden flex gap-4 relative select-none shrink-0">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 -z-10" />

      {/* ── LEFT PANEL: ISO-SCROLLING TEXT CHANNELS SELECTOR ── */}
      <div className="w-[46%] flex flex-col justify-between border-r border-border/40 pr-3 shrink-0 h-full">
        <div className="space-y-1 pt-1 pb-2 shrink-0 bg-card/40">
          <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-primary tracking-widest">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>{"Marketplace"}</span>
          </div>
          <h4 className="text-sm font-black text-foreground tracking-tight leading-tight">
            {"Products & Services"}
          </h4>
        </div>

        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto pr-1 space-y-2 py-1 scroll-smooth select-none min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden relative"
        >
          {heroImages.map((img: SlideshowItemShape, i: number) => {
            const isActive = i === index;

            return (
              <button
                key={`ticker-${img.short}`}
                type="button"
                ref={(el: HTMLButtonElement | null) => {
                  buttonRefs.current[i] = el;
                }}
                onClick={() => handleManualSelection(i)}
                className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between text-left transition-all duration-300 w-full cursor-pointer leading-none h-8 shrink-0 ${
                  isActive
                    ? "bg-primary/10 border-primary/30 text-primary shadow-2xs font-black translate-x-1"
                    : "bg-background/40 border-border/40 text-muted-foreground hover:text-foreground hover:bg-background/80"
                }`}
              >
                <span className="truncate pr-1">{img.short}</span>
                {isActive && (
                  <ArrowRight className="w-3 h-3 text-primary shrink-0 animate-in fade-in slide-in-from-left-1" />
                )}
              </button>
            );
          })}
        </div>

        <div className="h-2 shrink-0" />
      </div>

      {/* ── RIGHT PANEL: REAL-TIME PHOTO FRAME ── */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-border/40 bg-muted flex items-center justify-center shadow-inner h-full">
        {heroImages.map((img: SlideshowItemShape, i: number) => {
          const isCurrent = i === index;
          const isBroken = !!failedImages[img.src];

          return (
            <div
              key={img.src}
              className={`absolute inset-0 transition-all duration-1000 flex items-center justify-center ${
                isCurrent
                  ? "opacity-100 scale-100 visible z-10"
                  : "opacity-0 scale-95 invisible z-0"
              }`}
            >
              {!isBroken ? (
                <Image
                  src={img.src}
                  alt={img.label}
                  fill
                  sizes="(max-w-7xl) 40vw"
                  className="object-cover transition-transform duration-[3500ms] ease-out scale-102"
                  priority={i === 0}
                  onError={() => handleImageError(img.src)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-muted to-primary/10 text-primary/30 p-4 text-center animate-in fade-in duration-200">
                  <Sparkles className="w-7 h-7 mb-1 text-primary/20" />
                  <span className="text-[10px] font-black tracking-widest uppercase opacity-75">
                    {"FreshPoint"}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        <div className="absolute bottom-3 left-3 right-3 z-20">
          <div className="inline-block px-3 py-1.5 bg-background/80 backdrop-blur-md rounded-xl text-xs font-black text-foreground border border-border/40 shadow-sm tracking-tight max-w-full truncate animate-in fade-in slide-in-from-bottom-1">
            {heroImages[index].label}
          </div>
        </div>
      </div>
    </div>
  );
}
