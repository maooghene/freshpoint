import { MailIcon, MessageCircleIcon } from "lucide-react";
import { CONTACT_INFO } from "@/lib/contact-config";

// Custom Instagram SVG since brand icons are removed from newer Lucide versions
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://w3.org"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface ContactChannel {
  label: string;
  value: string | null;
  href: string | null;
  icon: React.ReactNode;
}

export default function ContactSupportPage(): React.JSX.Element {
  const channels: ContactChannel[] = [
    {
      label: "Email",
      value: CONTACT_INFO.supportEmail,
      href: `mailto:${CONTACT_INFO.supportEmail}`,
      icon: <MailIcon className="size-5" />,
    },
    {
      label: "WhatsApp",
      value: CONTACT_INFO.whatsapp,
      href: CONTACT_INFO.whatsapp
        ? `https://wa.me{CONTACT_INFO.whatsapp.replace(/\D/g, "")}`
        : null,
      icon: <MessageCircleIcon className="size-5" />,
    },
    {
      label: "Instagram",
      value: CONTACT_INFO.socials.instagram,
      href: CONTACT_INFO.socials.instagram,
      icon: <InstagramIcon className="size-5" />,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-foreground">
          {" "}
          Contact support{" "}
        </h1>
        <p className="text-muted-foreground">
          Reach us directly — we typically respond within a day.
        </p>
      </div>

      <div className="grid gap-4 bg-background/40 backdrop-blur-md border border-primary/10 p-8 rounded-[2rem] shadow-xl">
        {channels.map((channel) => (
          <div
            key={channel.label}
            className="flex items-center justify-between p-4 rounded-xl border border-primary/10 bg-background/50"
          >
            <div className="flex items-center gap-3">
              <span className="text-primary">{channel.icon}</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {channel.label}
                </p>
                <p className="text-sm text-foreground">
                  {channel.value ?? "Coming soon"}
                </p>
              </div>
            </div>

            {channel.href && (
              <a
                href={channel.href}
                target={channel.label === "Email" ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="text-sm font-semibold text-primary hover:underline"
              >
                Reach out
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
