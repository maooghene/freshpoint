"use client";

import React, { useEffect, useState, ChangeEvent } from "react";
import Image from "next/image";
import { toast } from "sonner"; // Swapped react-toastify with sonner to match our layout
import Loading from "@/components/Loading";
import { useRouter } from "next/navigation";
import { UploadCloudIcon, InfoIcon, Sparkles, ArrowLeft } from "lucide-react";
import { useUser, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface BusinessStatusResponse {
  isBusinessOwner: boolean;
  businessInfo?: {
    slug: string;
    isActive: boolean;
  };
}

export default function RegisterBusiness() {
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();

  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Aligned to capture core properties matching your exact Prisma Business schema
  const [businessInfo, setBusinessInfo] = useState({
    name: "",
    slug: "", // Added required tenant routing identifier
    description: "",
    email: "",
    phone: "",
    address: "",
    sittingCapacity: 1, // Migrated from totalChairs
    image: null as File | null,
  });

  const onChangeHandler = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setBusinessInfo((prev) => {
      const nextState = {
        ...prev,
        [name]:
          name === "sittingCapacity"
            ? Math.max(1, parseInt(value) || 1)
            : value,
      };

      // Auto-generate a url-safe slug when the user types a business name
      if (name === "name" && !prev.slug) {
        nextState.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
      }
      return nextState;
    });
  };

  // ✅ CHECK ACTIVE MULTI-TENANT WORKSPACE STATUS
  useEffect(() => {
    if (!userLoaded) return;

    const fetchBusinessStatus = async () => {
      try {
        const res = await fetch("/api/businesses/is-owner");
        if (!res.ok) return;

        const data: BusinessStatusResponse = await res.json();

        if (data.isBusinessOwner && data.businessInfo) {
          setAlreadySubmitted(true);
          const isActive = data.businessInfo.isActive;

          setMessage(
            isActive
              ? "Your workspace is live! Redirecting to your dashboard..."
              : "Your application is currently under review by our team.",
          );

          if (isActive) {
            setTimeout(
              () => router.push(`/dashboard/${data.businessInfo?.slug}`),
              2000,
            );
          }
        }
      } catch (error) {
        console.error("Workspace verification check dropped:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessStatus();
  }, [userLoaded, router]);

  // ✅ HANDSHAKE DISPATCH WORKSPACE MUTATIONS TO BACKEND
  const onSubmitHandler = async () => {
    if (!user) throw new Error("Authentication verification failed.");
    if (submitting) return;

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", businessInfo.name);
      formData.append("slug", businessInfo.slug);
      formData.append("description", businessInfo.description);
      formData.append("email", businessInfo.email);
      formData.append("phone", businessInfo.phone);
      formData.append("address", businessInfo.address);
      formData.append(
        "sittingCapacity",
        businessInfo.sittingCapacity.toString(),
      );

      if (businessInfo.image) {
        formData.append("image", businessInfo.image);
      }

      const res = await fetch("/api/businesses/create", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration operation failed.");
      }

      setAlreadySubmitted(true);
      setMessage(
        "Application received! We will activate your provider profile shortly.",
      );
      return data;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      throw new Error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !userLoaded) return <Loading />;

  // ✅ NOT SIGNED IN STATE
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
        <div className="text-center space-y-6 max-w-sm w-full">
          <Sparkles className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Login Required
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Please sign in to configure and register your provider space on
              Freshpoint.
            </p>
          </div>

          <SignInButton mode="modal">
            <Button
              size="lg"
              className="w-full font-semibold rounded-xl shadow-md"
            >
              Sign In to Proceed
            </Button>
          </SignInButton>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-24 px-6 bg-background text-foreground">
      <div className="w-full max-w-2xl p-8 border border-border bg-card rounded-3xl shadow-xl relative overflow-hidden">
        {/* BACKING PATTERN GRIDS */}
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent -z-10" />

        {!alreadySubmitted ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();

              // Native promise loading controller using modern Sonner API
              toast.promise(onSubmitHandler(), {
                loading: "Creating your multi-tenant workspace profile...",
                success: "Application submitted successfully!",
                error: (err) =>
                  err instanceof Error ? err.message : "Registration failed",
              });
            }}
            className="space-y-5"
          >
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold tracking-tight">
                Register your <span className="text-primary">Workspace</span>
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                Configure your service treatments catalog parameters and
                establish your public business URL slot.
              </p>
            </div>

            {/* IMAGE UPLOAD CONTAINER FRAME */}
            <label className="relative flex flex-col items-center justify-center h-44 border-2 border-dashed border-border hover:border-primary/40 rounded-2xl cursor-pointer bg-muted/20 overflow-hidden transition-colors group">
              {businessInfo.image ? (
                <Image
                  src={URL.createObjectURL(businessInfo.image)}
                  alt="Workspace cover banner preview"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="text-center space-y-2 text-muted-foreground group-hover:text-foreground transition-colors">
                  <UploadCloudIcon
                    className="mx-auto text-primary/70"
                    size={32}
                  />
                  <p className="text-xs font-bold uppercase tracking-wider">
                    Upload Cover Image
                  </p>
                  <p className="text-[10px] font-medium">
                    JPEG, PNG up to 4MB dimensions
                  </p>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file)
                    setBusinessInfo((prev) => ({ ...prev, image: file }));
                }}
              />
            </label>

            {/* FORM FIELD MATRICES */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Business Name
                </label>
                <input
                  name="name"
                  type="text"
                  placeholder="e.g. Haven Luxury Spa"
                  required
                  value={businessInfo.name}
                  onChange={onChangeHandler}
                  className="w-full p-3 bg-muted/40 border border-border/85 rounded-xl text-sm focus:border-primary/50 outline-hidden transition-colors text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Custom Handle Subdomain URL
                </label>
                <div className="relative flex items-center">
                  <input
                    name="slug"
                    type="text"
                    placeholder="haven-spa"
                    required
                    value={businessInfo.slug}
                    onChange={onChangeHandler}
                    className="w-full p-3 pr-28 bg-muted/40 border border-border/85 rounded-xl text-xs focus:border-primary/50 outline-hidden transition-colors font-mono text-foreground"
                  />
                  <span className="absolute right-3 text-[10px] font-bold text-muted-foreground/70 bg-border px-2 py-1 rounded-md">
                    .freshpoint.com
                  </span>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Public Support Email
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="contact@yourdomain.com"
                  required
                  value={businessInfo.email}
                  onChange={onChangeHandler}
                  className="w-full p-3 bg-muted/40 border border-border/85 rounded-xl text-sm focus:border-primary/50 outline-hidden transition-colors text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Business Phone Contact
                </label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="+234..."
                  required
                  value={businessInfo.phone}
                  onChange={onChangeHandler}
                  className="w-full p-3 bg-muted/40 border border-border/85 rounded-xl text-sm focus:border-primary/50 outline-hidden transition-colors text-foreground"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 items-end">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Physical Address
                </label>
                <input
                  name="address"
                  type="text"
                  placeholder="Street, City, State Location"
                  required
                  value={businessInfo.address}
                  onChange={onChangeHandler}
                  className="w-full p-3 bg-muted/40 border border-border/85 rounded-xl text-sm focus:border-primary/50 outline-hidden transition-colors text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Concurrent Capacity
                </label>
                <input
                  name="sittingCapacity"
                  type="number"
                  min="1"
                  required
                  value={businessInfo.sittingCapacity}
                  onChange={onChangeHandler}
                  className="w-full p-3 bg-muted/40 border border-border/85 rounded-xl text-sm focus:border-primary/50 outline-hidden transition-colors text-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Workspace Summary Description
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Describe the wellness treatments, premium services, or specializations your space provides..."
                value={businessInfo.description}
                onChange={onChangeHandler}
                className="w-full p-3 bg-muted/40 border border-border/85 rounded-xl text-sm focus:border-primary/50 outline-hidden transition-colors resize-none text-foreground"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="w-full py-6 font-bold text-base rounded-xl shadow-md hover:shadow-lg transition-all duration-300 mt-4 cursor-pointer"
            >
              Submit Workspace Application
            </Button>
          </form>
        ) : (
          /* ALREADY SUBMITTED APP PROFILE REVIEW SHIELD */
          <div className="text-center py-10 space-y-6 max-w-sm mx-auto">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2 mx-auto text-primary">
              <InfoIcon size={28} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                Application Recorded
              </h2>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                {message}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl font-semibold"
              onClick={() => router.push("/")}
            >
              Return to Home
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
