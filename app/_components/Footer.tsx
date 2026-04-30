import {
  Camera,
  Globe,
  MessageCircle,
  Heart,
  Mail,
  ArrowUpRight,
} from "lucide-react";

const footerLinks = {
  Product: [
    { label: "How It Works", href: "#features" },
    { label: "Restaurants", href: "#restaurants" },
    { label: "Pricing", href: "#" },
    { label: "API", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
  ],
  Support: [
    { label: "Help Center", href: "#" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "#" },
    { label: "Contact", href: "#" },
  ],
};

const socials = [
  { icon: MessageCircle, href: "#", label: "Twitter" },
  { icon: Heart, href: "#", label: "Instagram" },
  { icon: Globe, href: "#", label: "Website" },
  { icon: Mail, href: "#", label: "Email" },
];

export default function Footer() {
  return (
    <footer id="footer" className="relative border-t border-border/50 pb-24">
      <div className="mx-auto max-w-7xl px-5 pt-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="#" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white">
                <Camera size={18} strokeWidth={2.5} />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                Snap<span className="text-accent">Order</span>
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Upload any food photo and instantly order the closest matching dish
              from top restaurants near you.
            </p>

            {/* Socials */}
            <div className="mt-6 flex gap-3">
              {socials.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted transition-all hover:border-accent hover:text-accent hover:bg-accent/5"
                  >
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="group flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
                    >
                      {link.label}
                      <ArrowUpRight
                        size={12}
                        className="opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 sm:flex-row">
          <p className="text-xs text-muted">
            © 2026 SnapOrder. All rights reserved.
          </p>
          <p className="text-xs text-muted">
            Made with{" "}
            <span className="text-accent">♥</span> for food lovers
            everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}
