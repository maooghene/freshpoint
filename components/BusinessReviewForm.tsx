"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { StarIcon, PenLineIcon, Loader2, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BusinessReviewFormProps {
  businessId: string;
  businessName: string;
  onSuccess: () => void;
  onClose: () => void; // 🌟 NEW PROPERTY PARAMETER FOR MODAL CLOSURES
}

export default function BusinessReviewForm({
  businessId,
  businessName,
  onSuccess,
  onClose,
}: BusinessReviewFormProps) {
  const [formRating, setFormRating] = useState<number>(5);
  const [formText, setFormText] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(
    null,
  );

  const starArray: number[] = Array.from(
    { length: 5 },
    (_, i: number) => i + 1,
  );

  // Lock behind background page text body scrolling mechanisms while active
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const submitVenueFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmissionMessage(null);

    try {
      const response = await fetch("/api/ratings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: formRating,
          review: formText,
          businessId,
          itemId: "BUSINESS_OVERALL",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Submission failed.");

      setSubmissionMessage(
        "Thank you! Your hospitality review has been published.",
      );
      setFormText("");
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err: unknown) {
      setSubmissionMessage(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // 🌟 GOAL 1 FIXED: FIXED SCREEN BOX INTERCEPT WITH BACKDROP DARK BLUR EFFECT
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Darkened blur click mapping layer backdrop mask */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Main Frontal Center Modal Dialog Window Form Card */}
      <div className="relative w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl z-10 scale-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-4">
        {/* Floating Top Corner Exit Anchor Button layout */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <XIcon className="w-4 h-4" />
        </button>

        <div className="space-y-1 pr-6">
          <h3 className="text-base font-black tracking-tight text-foreground">
            {"Share Your Experience"}
          </h3>
          <p className="text-xs text-muted-foreground font-medium">
            {"Tell the community how you like the ambience or hospitality at "}
            {businessName}
          </p>
        </div>

        <form onSubmit={submitVenueFeedback} className="space-y-4">
          {/* Star Matrix Selection Bar Row */}
          <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-xl border border-border/40">
            <span className="text-xs font-bold text-muted-foreground">
              {"Your Score:"}
            </span>
            <div className="flex gap-1">
              {starArray.map((star: number) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormRating(star)}
                  className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                >
                  <StarIcon
                    className={`w-4 h-4 ${star <= formRating ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Textbox element inputs layout grids */}
          <div className="space-y-1">
            <textarea
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              placeholder="How was the ambient space quality, staff politeness, treatment skill, or cleanliness? Write your thoughts here..."
              required
              rows={4}
              className="w-full p-3 bg-background border border-border/80 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary transition-colors resize-none placeholder:text-muted-foreground/40 leading-relaxed"
            />
          </div>

          {/* Conditional notification feedback loops flags */}
          {submissionMessage && (
            <p className="text-[11px] font-bold text-primary bg-primary/5 p-2 rounded-lg border border-primary/10">
              {submissionMessage}
            </p>
          )}

          {/* Submission action CTA panel row execution nodes */}
          <div className="flex justify-end gap-2 border-t border-border/40 pt-3">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              size="sm"
              className="rounded-lg font-bold text-xs px-3 h-8 cursor-pointer"
            >
              {"Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              size="sm"
              className="rounded-lg font-bold text-xs px-4 h-8 gap-1.5 cursor-pointer shadow-xs"
            >
              {submitting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <PenLineIcon className="w-3 h-3" />
              )}
              {submitting ? "Publishing..." : "Submit Review"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
