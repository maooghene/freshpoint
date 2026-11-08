import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { CONTACT_INFO } from "@/lib/contact-config";

export const metadata: Metadata = {
  title: "Privacy Policy | FreshPoint",
  description: "What personal information FreshPoint collects and how it is used.",
};

const sections: LegalSection[] = [
  {
    heading: "Who we are",
    body: [
      `FreshPoint runs the FreshPoint marketplace website and app. We decide how your personal information is used on the platform, which makes us the data controller. You can reach us at ${CONTACT_INFO.supportEmail}.`,
    ],
  },
  {
    heading: "Information we collect",
    bullets: [
      "Account details: your name, email address and sign-in details. Sign-in is handled by our authentication provider, Clerk, including sign-in with Google if you choose it.",
      "Contact and delivery details: phone number, delivery address and the map coordinates of that address, so we can calculate delivery fees and distance.",
      "Bookings and orders: what you booked or bought, from which business, when, the amount, and the status.",
      "Payment information: payments are handled by Paystack. We receive confirmation, the amount and a reference, but we do not see or store your full card details.",
      "Business information: if you register a business, its name, address, phone, email, description, photos, opening hours, staff details and prices.",
      "Messages and feedback: reviews and ratings, questions and complaints you send us, and your conversations with our AI assistant.",
      "Notification settings: if you allow push notifications, a token that lets us send them to your device.",
      "Technical data: your device and browser type, IP address and error logs, used to keep the service secure and working. The app stores some information in your browser to remember your session and preferences.",
    ],
  },
  {
    heading: "How we use it",
    bullets: [
      "To create your account and let you sign in.",
      "To make bookings and orders, process payments, calculate delivery fees and send receipts.",
      "To send you emails and notifications about your bookings, orders, reminders, missed appointments, approvals and account.",
      "To let businesses see the customer details they need to serve a booking or order.",
      "To handle complaints and support requests, and to review safety problems.",
      "To prevent fraud, abuse and misuse, for example with rate limits and audit records of administrator actions.",
      "To improve and fix the platform.",
    ],
  },
  {
    heading: "Why we are allowed to use it",
    body: [
      "We use your information to carry out the contract with you (for example, to complete a booking), to meet legal obligations, for our legitimate interests in running a safe and reliable service, and, where the law requires it, with your consent (for example, push notifications). You can withdraw consent at any time in your device or browser settings.",
    ],
  },
  {
    heading: "Who we share it with",
    body: [
      "We do not sell your personal information. We share it only as needed:",
    ],
    bullets: [
      "The business you book with or buy from, who sees your name, contact details, and delivery address for that booking or order.",
      "Service providers who run the platform for us: Clerk (sign-in), Paystack (payments), Neon (database), Vercel (hosting), ImageKit (image storage), Gmail (sending email), OpenStreetMap Nominatim (turning addresses into map coordinates), and Hugging Face (the AI assistant and complaint sorting). They only receive what they need to do their job.",
      "Authorities, when the law requires us to, or to protect people and the platform from fraud or harm.",
    ],
  },
  {
    heading: "AI features",
    body: [
      "Our assistant and the system that sorts complaints send the text you type to an AI service to produce a reply or a category. Please do not put passwords, card numbers or other highly sensitive details into the assistant or a complaint.",
    ],
  },
  {
    heading: "Where your data is kept",
    body: [
      "Our providers may process data on servers outside Nigeria. When that happens we rely on providers that protect personal information, and we take reasonable steps so that it keeps the protection the law requires.",
    ],
  },
  {
    heading: "How long we keep it",
    body: [
      "We keep information for as long as your account is active and as long as needed for the purposes above, including payments and records we must keep by law. Some old operational data, such as expired notifications and stale records, is removed automatically on a schedule. When you ask us to delete your account, we delete or anonymise your information unless we must keep some of it for legal, fraud-prevention or accounting reasons.",
    ],
  },
  {
    heading: "Your rights",
    body: [
      "Under Nigerian data protection law you have the right to know what we hold about you, to get a copy, to correct it, to ask us to delete it, to object to or restrict certain uses, and to withdraw consent. To use any of these rights, email us. We may need to confirm it is you first.",
      "If you are unhappy with how we handled your information, you also have the right to complain to the Nigeria Data Protection Commission.",
    ],
  },
  {
    heading: "Security",
    body: [
      "We use sign-in protection, access checks on every request, rate limits, encrypted connections and audit records to protect your information. No system is perfectly secure, so we cannot promise absolute security. If a breach affects your information, we will tell you and the authorities as the law requires.",
    ],
  },
  {
    heading: "Children",
    body: [
      "FreshPoint is not meant for children under 18 to use on their own. If you believe a child has given us personal information, contact us and we will delete it.",
    ],
  },
  {
    heading: "Changes to this policy",
    body: [
      "We may update this policy. When we make an important change, we will tell you in the app or by email, and we will change the date at the top.",
    ],
  },
  {
    heading: "Contact",
    body: [
      `Questions or requests about your information: ${CONTACT_INFO.supportEmail}. We aim to reply ${CONTACT_INFO.replyTime}.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="8 November 2026"
      intro="This policy explains what personal information FreshPoint collects, why, who sees it, and the choices you have. We have kept it in plain language."
      sections={sections}
    />
  );
}
