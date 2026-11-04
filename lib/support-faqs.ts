export interface FaqAction {
  label: string;
  /** Path inside the business dashboard, e.g. "subscription". */
  path: string;
}

export interface FaqItem {
  question: string;
  answer: string;
  /** Shown as a shortcut button, only where a dashboard base path is known. */
  action?: FaqAction;
}

export interface FaqGroup {
  title: string;
  items: FaqItem[];
}

/** Questions a customer (shopper / person booking) is likely to have. */
export const CUSTOMER_FAQ_GROUPS: FaqGroup[] = [
  {
    title: "Bookings and orders",
    items: [
      {
        question: "How do I cancel or reschedule a booking?",
        answer:
          "Go to Bookings in your account, open the booking, and choose Cancel or Reschedule. Changes made more than 24 hours before your appointment are usually free.",
      },
      {
        question: "Where do I track my order?",
        answer:
          "Visit Orders under your account menu to see live status, from confirmed through delivered.",
      },
    ],
  },
  {
    title: "Payments",
    items: [
      {
        question: "I was charged but didn't receive a confirmation. What now?",
        answer:
          "Send us your payment reference and the email or phone number used at checkout using the form on this page, and we'll look into it right away.",
      },
    ],
  },
  {
    title: "For business owners",
    items: [
      {
        question: "How do I register my business on FreshPoint?",
        answer:
          "Head to the Register Business page and fill in your business details. Approval usually takes 1-2 business days.",
      },
    ],
  },
];

/** Questions a business owner is likely to have, shown inside the dashboard. */
export const BUSINESS_FAQ_GROUPS: FaqGroup[] = [
  {
    title: "Getting started",
    items: [
      {
        question: "Why does my business show as Pending?",
        answer:
          "New businesses are reviewed by the FreshPoint team before they go live. The badge at the top of the sidebar changes to Approved once that is done. Approval usually takes 1-2 business days.",
      },
      {
        question: "How do I change my opening hours?",
        answer:
          "Open Business Hours in the sidebar to set the days and times your business is open.",
        action: { label: "Open Business Hours", path: "schedule" },
      },
      {
        question: "How do I add or manage my services and products?",
        answer:
          "Use Add New Item to create a listing, and My Items to manage the ones you already have.",
        action: { label: "Open My Items", path: "manage-items" },
      },
    ],
  },
  {
    title: "Team and locations",
    items: [
      {
        question: "How do I add staff?",
        answer:
          "Open Staff in the sidebar and send an invitation to their email address. Starter includes 1 staff account (just you); Growth and Pro have no staff limit. If an invite email doesn't arrive, ask them to check their spam folder before trying again.",
        action: { label: "Open Staff", path: "staff" },
      },
      {
        question: "Can I run more than one branch?",
        answer:
          "Starter and Growth are limited to one location. Pro has no limit. You can manage your branches from Locations in the sidebar.",
        action: { label: "Open Locations", path: "locations" },
      },
    ],
  },
  {
    title: "Plans and billing",
    items: [
      {
        question: "What does each plan include?",
        answer:
          "The Subscription page lists the current price and features of every plan side by side, and is where you switch plans. Automated booking reminders and the full analytics dashboard need Growth or higher. Sponsored placement, promotional broadcasts and timed promotions are Pro features.",
        action: { label: "Open Subscription", path: "subscription" },
      },
      {
        question: "I paid for a plan but it still shows the old one.",
        answer:
          "Refresh the Subscription page first. If it still shows the old plan, use the form on this page and include your payment reference so we can check it.",
        action: { label: "Open Subscription", path: "subscription" },
      },
      {
        question: "Where can I see my commission rate?",
        answer:
          "Commission depends on your plan and is shown on the Subscription page. Higher plans pay a lower rate.",
        action: { label: "Open Subscription", path: "subscription" },
      },
    ],
  },
  {
    title: "Customers",
    items: [
      {
        question: "A customer says they were charged but I see no order.",
        answer:
          "Ask them for their payment reference, then send it to us using the form on this page. We can match it to the payment and sort out the order or a refund.",
      },
    ],
  },
];
