import { Sparkles } from "lucide-react";

function Footer() {
  return (
    <footer className="px-6 py-12 border-t bg-muted/30 w-full">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Branding */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2 text-primary font-sans font-bold text-xl tracking-tight">
              <Sparkles className="size-5" />
              <span>Freshpoint</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Multi-tenant workspace ecosystem for modern wellness businesses.
              Manage appointments, staff schedules, and retail items
              effortlessly.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-medium text-sm text-foreground mb-3">
              Product
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="#how-it-works"
                  className="hover:text-foreground transition-colors"
                >
                  How it Works
                </a>
              </li>
              <li>
                <a
                  href="#for-owners"
                  className="hover:text-foreground transition-colors"
                >
                  For Providers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Pricing Plans
                </a>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-medium text-sm text-foreground mb-3">
              Support
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  System Status
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-medium text-sm text-foreground mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Data Security
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>
            &copy; 2026 Freshpoint. Connecting providers, specialists, and
            clients seamlessly.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
