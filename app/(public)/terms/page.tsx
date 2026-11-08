import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { CONTACT_INFO } from "@/lib/contact-config";
import { TIER_COMMISSION_RATES, TRIAL_DAYS } from "@/lib/subscription-tiers";

export const metadata: Metadata = {
  title: "Terms of Service | FreshPoint",
  description:
    "The rules for using FreshPoint as a customer or as a business owner.",
};

const pct = (rate: number) => `${Math.round(rate * 100)}%`;

const sections: LegalSection[] = [
  {
    heading: "About FreshPoint",
    body: [
      "FreshPoint is an online marketplace that connects customers with independent businesses, such as barbershops, salons, spas and shops, in Nigeria. Customers use FreshPoint to book appointments and buy products. Businesses use it to list their services and products and manage bookings and orders.",
      "FreshPoint is not the provider of the services or products listed. Each business is independent and is responsible for what it offers, for its prices, and for the quality of its work. When you book or buy, your agreement for that service or product is with the business.",
    ],
  },
  {
    heading: "Accepting these terms",
    body: [
      "By creating an account, booking, buying, or registering a business on FreshPoint, you agree to these terms and to our Privacy Policy. If you do not agree, please do not use FreshPoint.",
      "You must be at least 18 years old, or use FreshPoint with the involvement of a parent or guardian.",
    ],
  },
  {
    heading: "Your account",
    bullets: [
      "Give accurate information and keep it up to date.",
      "Keep your sign-in details private. You are responsible for what happens under your account.",
      "Tell us straight away if you think someone else is using your account.",
      "We may refuse, suspend or close an account that breaks these terms or puts others at risk.",
    ],
  },
  {
    heading: "Payments for customers",
    body: [
      "You pay the full price of a booking or an order when you place it. Payments are processed securely by Paystack. FreshPoint does not see or store your card details.",
      "There are no extra charges added on top for the customer. FreshPoint's fee is taken from what the business receives.",
    ],
  },
  {
    heading: "No refunds once you have paid",
    body: [
      "All payments are final. We do not refund a payment once it has been made. Please check the service, date and time, or your items and delivery details, carefully before you pay. You must tick the box at checkout to confirm you understand this.",
      "This includes a missed appointment. If a business marks your appointment as missed, we will email you, but the payment is not refunded.",
      "The only exception is when we cannot complete what you paid for. For example, a time slot was taken at the same moment, an item ran out of stock, your delivery address is outside the business's delivery area, or FreshPoint was in maintenance. In those cases we refund you automatically to the original payment method.",
      "Nothing in this section limits any right you have under Nigerian law that cannot be excluded by agreement.",
    ],
  },
  {
    heading: "Bookings, orders and delivery",
    bullets: [
      "Arrive on time for your appointment. Businesses decide how they handle lateness.",
      "Delivery fees are calculated from the distance between the business and your address. Make sure the address you enter is correct.",
      "Delivery times and the condition of goods are the business's responsibility. Contact the business first if something is wrong with your order.",
      "We limit how many bookings one customer can make in a day, to prevent abuse.",
    ],
  },
  {
    heading: "Businesses on FreshPoint",
    body: [
      "To list a business you must register it, give true information, and be allowed to offer what you list. New businesses may be approved automatically or reviewed first. FreshPoint can decline, suspend or remove a business at its discretion, for example for false information, unsafe or unlawful services, fraud, or repeated complaints.",
      "You are responsible for your listing, prices, stock, working hours, staff, and for honouring the bookings and orders customers pay for. You must follow the law that applies to your business, including any licences you need.",
    ],
  },
  {
    heading: "Plans, fees and trials",
    body: [
      `FreshPoint charges businesses a commission on each paid booking or order, and the rate depends on the plan: Starter ${pct(TIER_COMMISSION_RATES.STARTER)}, Growth ${pct(TIER_COMMISSION_RATES.GROWTH)}, Pro ${pct(TIER_COMMISSION_RATES.PRO)}. Growth and Pro are paid monthly subscriptions that unlock extra features. Current prices and features are shown on the subscription page of your business dashboard.`,
      `A business may try Growth or Pro free for ${TRIAL_DAYS} days, once per business, without adding a card. When a trial or a paid period ends, the business returns to the plan it can use, and features of the higher plan stop.`,
      "Subscription payments are processed by Paystack. If you downgrade, you keep the higher plan until the end of the period you paid for. Fees already paid are not refunded.",
      "We may change prices, commission rates and plan features. We will give notice in the app or by email before a change affects you.",
    ],
  },
  {
    heading: "Content and reviews",
    body: [
      "You keep ownership of the text and images you upload, but you give FreshPoint permission to show them on the platform to run and promote the service. Only upload content you have the right to use.",
      "Reviews and ratings must be honest and come from real experience. We may remove content that is false, abusive, unlawful or that breaks someone else's rights.",
    ],
  },
  {
    heading: "What you must not do",
    bullets: [
      "Break the law or use FreshPoint for fraud, money laundering or anything illegal.",
      "List or sell illegal, dangerous or stolen goods or services.",
      "Pretend to be someone else, or post fake businesses or fake reviews.",
      "Harass, threaten or discriminate against others.",
      "Try to break into, overload, copy or interfere with the platform, or to get around its limits and payment checks.",
      "Use the platform to take customers or payments outside FreshPoint in a way that avoids fees.",
    ],
  },
  {
    heading: "Complaints and disputes",
    body: [
      `If something goes wrong, contact the business first. If you cannot resolve it, use the contact or support form in the app, or email ${CONTACT_INFO.supportEmail}. We aim to reply ${CONTACT_INFO.replyTime}. We may review a complaint, speak to both sides, and act on a business's account, but we are not obliged to settle disputes between customers and businesses.`,
    ],
  },
  {
    heading: "Availability",
    body: [
      "We work to keep FreshPoint running, but we do not promise it will always be available or error-free. We may pause the service for maintenance or updates. Third-party services we rely on, such as payments, sign-in and email, can also fail.",
    ],
  },
  {
    heading: "Our responsibility",
    body: [
      "To the extent the law allows, FreshPoint is not responsible for the services or products sold by businesses, for losses caused by a business or a customer, or for indirect losses such as lost profit. Our total responsibility to you for any claim is limited to the fees you paid to FreshPoint in the three months before the claim.",
      "This does not exclude responsibility that cannot legally be excluded, such as for fraud or for death or personal injury caused by negligence.",
    ],
  },
  {
    heading: "Ending your use",
    body: [
      "You can stop using FreshPoint at any time. We can suspend or end access if you break these terms or if we must by law. Sections that by their nature should continue, such as payments already made and limits on responsibility, continue after your account ends.",
    ],
  },
  {
    heading: "Changes to these terms",
    body: [
      "We may update these terms. When we make an important change, we will tell you in the app or by email. If you keep using FreshPoint after a change takes effect, you accept the new terms.",
    ],
  },
  {
    heading: "Law and contact",
    body: [
      "These terms are governed by the laws of the Federal Republic of Nigeria, and Nigerian courts have jurisdiction, unless the law gives you a right to go elsewhere.",
      `Questions about these terms: ${CONTACT_INFO.supportEmail}.`,
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="8 November 2026"
      intro="These terms explain the rules for using FreshPoint, whether you are a customer booking or buying, or a business owner selling. Please read them. They are written in plain language on purpose."
      sections={sections}
    />
  );
}
