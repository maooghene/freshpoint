"use client";

import React, { useState, useTransition } from "react";
import { Star, X, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  businessId: string;
  item: { itemId: string; name: string } | null;
}

export function ReviewModal({
  isOpen,
  onClose,
  orderId,
  businessId,
  item,
}: ReviewModalProps) {
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch("/api/ratings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: ratingScore,
            review: comment.trim(),
            bookingId: orderId, // Carries your active order reference hash ID string
            businessId: businessId, // Carries your unique storefront link CUID string
            itemId: item.itemId, // 🚀 CRITICAL INJECTION: Injects "cmr..." itemId token to satisfy schema queries!
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Submission rejected");

        toast.success(`Feedback for ${item.name} published successfully!`);
        onClose();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network failure";
        toast.error(`Submission aborted: ${msg}`);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-muted rounded-xl text-muted-foreground cursor-pointer border-none bg-transparent outline-none"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xl font-black tracking-tight mb-1 text-foreground">
          Submit Product Review
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Sharing experience for{" "}
          <strong className="text-foreground">{item.name}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Rating
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingScore(star)}
                  className="p-1 cursor-pointer transition-transform active:scale-95 border-none bg-transparent outline-none"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${star <= ratingScore ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30 hover:text-amber-400"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="modal-comment"
              className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground"
            >
              Feedback
            </label>
            <textarea
              id="modal-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How did this treatment or product serve you?"
              className="w-full text-sm bg-muted/40 border border-border rounded-xl p-3 focus:outline-none resize-none text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-black uppercase hover:bg-muted text-muted-foreground rounded-xl cursor-pointer border-none bg-transparent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-black uppercase rounded-xl bg-primary text-primary-foreground disabled:opacity-50 font-bold transition-all hover:opacity-95 shadow-md cursor-pointer border-none"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                "Publish Review"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
