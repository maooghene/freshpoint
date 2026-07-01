// components/HeroSlideshow.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const heroImages = [
  { src: "/hero/salon.jpg", label: "Hair salons" },
  { src: "/hero/spa.jpg", label: "Spas and massage" },
  { src: "/hero/nails.jpg", label: "Nails and pedicure" },
  { src: "/hero/skincare.jpg", label: "Skincare and facials" },
  { src: "/hero/wellness-beauty.jpg", label: "Wellness and beauty" },
  { src: "/hero/hairdresser.jpg", label: "Hair styling" },
  { src: "/hero/barber.jpg", label: "Barbershops" },
  { src: "/hero/makeup-artist.jpg", label: "Makeup artists" },
];

export default function HeroSlideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % heroImages.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-[450px] h-[450px] max-w-full m-4 rounded-2xl border-4 border-muted/20 shadow-2xl bg-background overflow-hidden">
      {heroImages.map((img, i) => (
        <div
          key={img.src}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={img.src}
            alt={img.label}
            fill
            className="object-cover"
            priority={i === 0}
          />
        </div>
      ))}

      <div className="absolute bottom-4 left-4 right-4">
        <span className="inline-block px-3 py-1 bg-background/80 backdrop-blur-sm rounded-full text-xs font-bold text-foreground">
          {heroImages[index].label}
        </span>
      </div>
    </div>
  );
}
