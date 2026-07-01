"use client";

import { StarIcon, XIcon, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface RatingModalProps {
  ratingModal: {
    bookingId: string;
    businessId: string; // 🚀 FIXED: Shifted from salonId to align with Freshpoint core schema
  } | null;
  setRatingModal: (value: null) => void;
}

const RatingModal = ({ ratingModal, setRatingModal }: RatingModalProps) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select at least 1 star");
      throw new Error("Missing rating");
    }
    if (review.length < 10) {
      toast.error("Please provide a short description of your experience");
      throw new Error("Review too short");
    }

    try {
      // 🚀 Connect to your Freshpoint dynamic review endpoint
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          review,
          bookingId: ratingModal?.bookingId,
          businessId: ratingModal?.businessId,
        }),
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      setRatingModal(null);
    } catch (error) {
      console.error("Error submitting workspace feedback:", error);
      throw error; // Propagates to toast.promise error state handler
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-background border border-border p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* DECORATIVE ORB */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl -z-10" />

        <button
          onClick={() => setRatingModal(null)}
          className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full cursor-pointer"
        >
          <XIcon size={20} />
        </button>

        <div className="flex flex-col items-center text-center space-y-2 mb-8">
          {/* 🚀 FIXED: Replaced salon scissors with multi-tenant premium Sparkles indicator */}
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-2">
            <Sparkles className="text-primary" size={24} />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Rate Your Experience
          </h2>
          <p className="text-sm text-muted-foreground font-medium">
            How was the quality of service provided today?
          </p>
        </div>

        {/* STAR RATING SELECTOR */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: 5 }, (_, i) => (
            <StarIcon
              key={i}
              className={`size-10 cursor-pointer transition-all duration-200 hover:scale-110 ${
                rating > i
                  ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                  : "text-secondary/60 fill-transparent stroke-1.5"
              }`}
              onClick={() => setRating(i + 1)}
            />
          ))}
        </div>

        {/* REVIEW TEXTAREA */}
        <div className="space-y-2 mb-6">
          <label className="text-[10px] font-bold uppercase tracking-widest text-primary pl-1">
            Your Review
          </label>
          <Textarea
            className="bg-card border border-border rounded-2xl min-h-[120px] focus-visible:ring-primary/40 placeholder:text-muted-foreground/40"
            placeholder="Tell others about the environment, the expert treatment, or the general vibe..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
          />
        </div>

        <Button
          onClick={() =>
            toast.promise(handleSubmit(), {
              pending: "Posting review...",
              success: "Thanks for the feedback!",
              error: "Failed to submit rating",
            })
          }
          className="w-full h-12 rounded-2xl font-bold shadow-md text-base transition-transform active:scale-[0.98]"
        >
          Submit Feedback
        </Button>
      </div>
    </div>
  );
};

export default RatingModal;
