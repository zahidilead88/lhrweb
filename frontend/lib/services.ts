export interface Package {
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  popular: boolean;
}

export interface Service {
  id: string;
  label: string;
  headline: string;
  description: string;
  longDescription: string;
  capabilities: string[];
  process: { step: string; title: string; body: string }[];
  packages: Package[];
}

export const services: Service[] = [
  {
    id: "web-design",
    label: "Web Design",
    headline: "Websites that leave\na lasting impression.",
    description:
      "We design stunning, user-focused websites that don't just look great — they drive real results.",
    longDescription:
      "From sleek marketing sites to complex platforms, we build websites that reflect your brand, speak to your audience, and convert visitors into customers. Every pixel is intentional — we don't do templates.",
    capabilities: ["Custom UI Design", "Mobile Responsive", "CMS Integration", "Speed Optimised", "Brand Aligned", "SEO Ready"],
    process: [
      { step: "01", title: "Discovery", body: "We dig into your business, goals, and audience. A proper brief means better results." },
      { step: "02", title: "Design", body: "Wireframes, mockups, and brand-aligned visuals — refined until they're exactly right." },
      { step: "03", title: "Build", body: "Clean, performant code. CMS integration. Cross-browser and device testing." },
      { step: "04", title: "Launch", body: "QA, deployment, and a smooth handover. We don't disappear after go-live." },
    ],
    packages: [
      {
        name: "Starter",
        price: "$499",
        period: "one-time",
        tagline: "Perfect for small businesses just launching.",
        features: ["5-page website", "Mobile responsive", "Basic SEO setup", "Contact form", "1 revision round", "2-week delivery"],
        popular: false,
      },
      {
        name: "Professional",
        price: "$1,299",
        period: "one-time",
        tagline: "For growing businesses that need more.",
        features: ["Up to 15 pages", "Custom animations", "CMS integration", "Advanced SEO", "Google Analytics", "3 revision rounds", "4-week delivery", "1 month support"],
        popular: true,
      },
      {
        name: "Enterprise",
        price: "Custom",
        period: "one-time",
        tagline: "Tailored for complex, large-scale projects.",
        features: ["Unlimited pages", "Custom functionality", "Third-party integrations", "Performance optimisation", "Dedicated project manager", "Unlimited revisions", "Priority support", "Ongoing maintenance"],
        popular: false,
      },
    ],
  },
  {
    id: "ecommerce",
    label: "eCommerce",
    headline: "Sell more with a store\nbuilt to convert.",
    description:
      "We build powerful eCommerce experiences that turn browsers into buyers.",
    longDescription:
      "From product pages to checkout flows, every touchpoint is crafted to reduce friction and maximise revenue. We work with Shopify, WooCommerce, and custom-built stores depending on your scale.",
    capabilities: ["Custom Storefront", "Secure Checkout", "Inventory Management", "Payment Gateways", "Order Tracking", "Conversion Optimised"],
    process: [
      { step: "01", title: "Strategy", body: "Product catalogue structure, user journey mapping, and payment flow planning." },
      { step: "02", title: "Design", body: "Storefront design, product page layout, and checkout UX optimised for conversion." },
      { step: "03", title: "Development", body: "Platform setup, payment integration, and rigorous testing on all devices." },
      { step: "04", title: "Launch", body: "Load testing, go-live monitoring, and post-launch support to iron out any issues." },
    ],
    packages: [
      {
        name: "Basic Store",
        price: "$799",
        period: "one-time",
        tagline: "Launch your store fast.",
        features: ["Up to 50 products", "Payment gateway setup", "Order management", "Mobile responsive", "Basic analytics", "3-week delivery"],
        popular: false,
      },
      {
        name: "Growth Store",
        price: "$2,199",
        period: "one-time",
        tagline: "Scale your eCommerce business.",
        features: ["Unlimited products", "Inventory management", "Email automation", "Advanced analytics", "Discount & coupon system", "Reviews integration", "5-week delivery", "2 months support"],
        popular: true,
      },
      {
        name: "Enterprise Store",
        price: "Custom",
        period: "one-time",
        tagline: "For high-volume, multi-channel retail.",
        features: ["Multi-store setup", "Custom integrations", "ERP / CRM sync", "Performance optimisation", "Dedicated manager", "Ongoing retainer option", "24/7 support", "SLA guarantee"],
        popular: false,
      },
    ],
  },
  {
    id: "brand-identity",
    label: "Brand & Identity",
    headline: "Brands that people\nremember.",
    description:
      "Your brand is more than a logo. We craft complete brand identities that connect with your audience.",
    longDescription:
      "From visual language to tone of voice, we build brands that feel cohesive, credible, and compelling. Whether you're starting from scratch or refreshing an existing identity, we'll create something that lasts.",
    capabilities: ["Logo Design", "Brand Guidelines", "Typography System", "Colour Palette", "Social Media Kit", "Brand Strategy"],
    process: [
      { step: "01", title: "Research", body: "Competitor analysis, audience profiling, and brand positioning to guide all creative decisions." },
      { step: "02", title: "Concepts", body: "Multiple directions explored, then narrowed down based on your feedback." },
      { step: "03", title: "Refinement", body: "The winning concept is polished across all touchpoints until it's perfect." },
      { step: "04", title: "Delivery", body: "Full brand pack delivered — files, guidelines, and everything you need to stay consistent." },
    ],
    packages: [
      {
        name: "Essentials",
        price: "$299",
        period: "one-time",
        tagline: "Get a brand identity that stands out.",
        features: ["Primary logo + 2 variants", "Colour palette", "Typography selection", "Business card design", "2 revision rounds", "1-week delivery"],
        popular: false,
      },
      {
        name: "Professional",
        price: "$799",
        period: "one-time",
        tagline: "A complete brand system.",
        features: ["Full logo suite", "Brand guidelines PDF", "Social media kit", "Email signature design", "Letterhead & stationery", "4 revision rounds", "2-week delivery"],
        popular: true,
      },
      {
        name: "Premium",
        price: "Custom",
        period: "one-time",
        tagline: "Brand strategy + full visual ecosystem.",
        features: ["Brand strategy workshop", "Multiple logo concepts", "Full brand guidelines", "Marketing collateral", "Presentation templates", "Packaging design", "Unlimited revisions", "Brand launch support"],
        popular: false,
      },
    ],
  },
  {
    id: "ui-ux",
    label: "UI/UX Design",
    headline: "Experiences users\nlove using.",
    description:
      "We design interfaces that feel intuitive and look beautiful.",
    longDescription:
      "Through user research, wireframing, and prototyping, we ensure every product delivers a seamless experience. Good UX isn't just about looks — it's about reducing friction, building trust, and helping users achieve their goals effortlessly.",
    capabilities: ["UX Research", "Wireframing", "Prototyping", "User Testing", "Design Systems", "Accessibility"],
    process: [
      { step: "01", title: "Research", body: "User interviews, competitor analysis, and persona building to ground all design decisions in reality." },
      { step: "02", title: "Wireframes", body: "Low-fidelity wireframes to map out structure and user flows before any visual design begins." },
      { step: "03", title: "Prototype", body: "Interactive, high-fidelity prototypes that let you experience the product before it's built." },
      { step: "04", title: "Handoff", body: "Developer-ready specs, annotated designs, and component documentation in Figma." },
    ],
    packages: [
      {
        name: "Basic",
        price: "$399",
        period: "one-time",
        tagline: "Solid UX foundations.",
        features: ["Up to 5 screens", "User flow mapping", "Wireframes", "Hi-fi UI design", "2 revision rounds", "Figma handoff"],
        popular: false,
      },
      {
        name: "Professional",
        price: "$999",
        period: "one-time",
        tagline: "Research-backed design for real products.",
        features: ["Up to 15 screens", "User research & personas", "Full wireframe set", "Interactive prototype", "Usability testing", "Component library", "4 revision rounds", "Developer-ready specs"],
        popular: true,
      },
      {
        name: "Enterprise",
        price: "Custom",
        period: "one-time",
        tagline: "A dedicated design partner.",
        features: ["Unlimited screens", "Full design system", "Accessibility audit", "A/B testing support", "Cross-platform (web + app)", "Ongoing retainer", "Dedicated designer", "Priority turnaround"],
        popular: false,
      },
    ],
  },
  {
    id: "seo-marketing",
    label: "SEO & Marketing",
    headline: "Get found by\nthe right people.",
    description:
      "We help businesses rank higher, reach further, and grow faster.",
    longDescription:
      "Our data-driven SEO and digital marketing strategies deliver measurable, compounding results every single month. We focus on the work that moves the needle — not vanity metrics.",
    capabilities: ["Technical SEO", "Keyword Research", "Content Strategy", "Link Building", "Analytics & Reporting", "PPC Campaigns"],
    process: [
      { step: "01", title: "Audit", body: "A full technical and content audit to identify exactly where you're losing ground." },
      { step: "02", title: "Strategy", body: "A tailored roadmap — keywords, content gaps, link opportunities, and quick wins." },
      { step: "03", title: "Execute", body: "On-page optimisation, content creation, link building, and ad campaigns launched." },
      { step: "04", title: "Report", body: "Monthly reporting with clear metrics, insights, and next-month priorities." },
    ],
    packages: [
      {
        name: "Starter",
        price: "$299",
        period: "/month",
        tagline: "Get your SEO foundations right.",
        features: ["On-page SEO optimisation", "10 target keywords", "Monthly report", "Google Search Console setup", "Meta tags & schema markup", "Email support"],
        popular: false,
      },
      {
        name: "Growth",
        price: "$699",
        period: "/month",
        tagline: "Scale your organic reach.",
        features: ["Technical SEO audit", "30 target keywords", "Content strategy & creation", "Link building (5/month)", "Weekly reports", "Google Ads management", "Social media boost", "Monthly strategy call"],
        popular: true,
      },
      {
        name: "Full Service",
        price: "$1,499",
        period: "/month",
        tagline: "Complete digital marketing partnership.",
        features: ["Everything in Growth", "PPC campaign management", "Social media management", "Email marketing", "Conversion rate optimisation", "Competitor analysis", "Dedicated account manager", "24/7 support"],
        popular: false,
      },
    ],
  },
  {
    id: "web-hosting",
    label: "Web Hosting",
    headline: "Fast, reliable hosting\nyou can trust.",
    description:
      "Managed web hosting that keeps your site fast, secure, and online 24/7.",
    longDescription:
      "No tech headaches — just complete peace of mind. We handle server management, security updates, backups, and monitoring so you can focus on running your business. All plans include free SSL and daily backups.",
    capabilities: ["99.9% Uptime", "Free SSL Certificate", "Daily Backups", "CDN Included", "24/7 Monitoring", "One-click Installs"],
    process: [
      { step: "01", title: "Setup", body: "Server provisioning, domain configuration, and SSL setup — done for you in under 24 hours." },
      { step: "02", title: "Migration", body: "We migrate your existing site with zero downtime and verify everything is working perfectly." },
      { step: "03", title: "Optimise", body: "CDN configuration, caching, and performance tuning to get the fastest possible load times." },
      { step: "04", title: "Monitor", body: "24/7 uptime monitoring with instant alerts and proactive maintenance to prevent issues." },
    ],
    packages: [
      {
        name: "Starter",
        price: "$29",
        period: "/month",
        tagline: "Everything you need to go live.",
        features: ["1 website", "10GB SSD storage", "Free SSL certificate", "Daily backups", "5 email accounts", "Basic support"],
        popular: false,
      },
      {
        name: "Business",
        price: "$79",
        period: "/month",
        tagline: "For growing businesses.",
        features: ["5 websites", "50GB SSD storage", "Free SSL + CDN", "Daily & weekly backups", "Unlimited email accounts", "Priority support", "Performance monitoring", "Staging environment"],
        popular: true,
      },
      {
        name: "Enterprise",
        price: "$199",
        period: "/month",
        tagline: "Dedicated resources, maximum performance.",
        features: ["Unlimited websites", "Dedicated server resources", "Advanced security firewall", "Real-time monitoring", "Auto-scaling", "Dedicated IP address", "24/7 support + SLA", "Custom backup schedule"],
        popular: false,
      },
    ],
  },
];
