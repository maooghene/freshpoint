// src/components/business/dashboard/index.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { toast } from "react-toastify";
import {
  StarIcon,
  CircleDollarSignIcon,
  CalendarCheckIcon,
  PackageIcon,
  SparklesIcon,
} from "lucide-react";
import Loading from "@/components/Loading";
import StatCard from "./StatCard";

interface DashboardRating {
  id: string;
  rating: number;
  review: string | null;
  user: {
    name: string | null;
    image: string | null;
  };
  service: {
    name: string;
  };
  createdAt: string;
}

interface DashboardState {
  totalServices: number;
  totalProducts: number;
  totalEarnings: number;
  totalBookings: number;
  ratings: DashboardRating[];
}

interface BusinessDashboardProps {
  businessSlug: string;
}

export default function BusinessDashboard({
  businessSlug,
}: BusinessDashboardProps) {
  const { getToken } = useAuth();
  const currency = "₦";

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardState>({
    totalServices: 0,
    totalProducts: 0,
    totalEarnings: 0,
    totalBookings: 0,
    ratings: [],
  });

  useEffect(() => {
    if (!businessSlug) return;
    let mounted = true;

    const fetchDashboard = async () => {
      try {
        const token = await getToken();

        // Pass businessSlug securely to fetch tenant-isolated metrics
        const { data } = await axios.get(
          `/api/business/dashboard?slug=${businessSlug}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!mounted) return;

        setDashboardData({
          totalServices: data?.totalServices ?? 0,
          totalProducts: data?.totalProducts ?? 0,
          totalEarnings: data?.totalEarnings ?? 0,
          totalBookings: data?.totalBookings ?? 0,
          ratings: data?.ratings ?? [],
        });
      } catch (err) {
        toast.error("Failed to load dashboard parameters");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDashboard();
    return () => {
      mounted = false;
    };
  }, [getToken, businessSlug]);

  if (loading) return <Loading />;

  const statCards = [
    {
      title: "Services Offered",
      value: dashboardData.totalServices,
      icon: SparklesIcon, // Universal industry icon replacing Scissors
      color: "text-blue-500",
    },
    {
      title: "Products Listed",
      value: dashboardData.totalProducts,
      icon: PackageIcon,
      color: "text-purple-500",
    },
    {
      title: "Total Earnings",
      value: currency + dashboardData.totalEarnings.toLocaleString(),
      icon: CircleDollarSignIcon,
      color: "text-green-500",
    },
    {
      title: "Total Bookings",
      value: dashboardData.totalBookings,
      icon: CalendarCheckIcon,
      color: "text-primary",
    },
  ];

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Workspace Control Panel
        </h1>
        <p className="text-muted-foreground text-sm">
          Track revenue streams, catalog performance, and customer satisfaction
          metrics.
        </p>
      </div>

      {/* STATISTICS MATRIX GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <StatCard
            key={i}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
          />
        ))}
      </div>

      {/* FEEDBACK & RATINGS LAYER */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2">
          <StarIcon className="w-5 h-5 text-amber-500 fill-amber-500" />
          <h2 className="text-xl font-bold text-foreground">
            Recent Client Reviews
          </h2>
        </div>

        {dashboardData.ratings.length === 0 ? (
          <div className="text-center p-12 border border-dashed rounded-2xl text-muted-foreground text-sm">
            No customer reviews recorded yet for this workspace.
          </div>
        ) : (
          <div className="grid gap-4 max-w-3xl">
            {dashboardData.ratings.map((rating) => (
              <div
                key={rating.id}
                className="p-5 border border-border bg-card text-card-foreground rounded-2xl shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-foreground">
                    {rating.user.name || "Anonymous Client"}
                  </p>
                  <span className="text-xs bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-full">
                    {rating.service.name}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  &ldquo;{rating.review || "No descriptive comment provided."}
                  &rdquo;
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
