// ── Canvas builder types ────────────────────────────────────────────────────────

export type CanvasElType = "heading" | "text" | "image" | "button" | "list" | "divider" | "spacer" | "div";
export type CanvasRowLayout = "1" | "1-1" | "1-2" | "2-1" | "1-1-1" | "1-1-1-1";

export interface CanvasEl {
  id: string;
  type: CanvasElType;
  content: string;
  // ── nested div container
  children?: CanvasEl[];
  divStyle?: CanvasColStyle;
  props?: {
    // ── shared
    align?: "left" | "center" | "right";
    marginBottom?: "none" | "sm" | "md" | "lg" | "xl";
    // ── heading
    size?: "sm" | "md" | "lg" | "xl" | "2xl";
    textColor?: string;
    fontWeight?: "normal" | "medium" | "semibold" | "bold" | "black";
    letterSpacing?: "normal" | "wide" | "wider" | "widest";
    // ── text / paragraph
    textSize?: "xs" | "sm" | "base" | "lg" | "xl";
    lineHeight?: "tight" | "normal" | "relaxed" | "loose";
    // ── button
    variant?: "filled" | "outline" | "ghost";
    color?: string;
    href?: string;
    btnRadius?: "none" | "md" | "lg" | "full";
    btnSize?: "sm" | "md" | "lg";
    fullWidth?: boolean;
    newTab?: boolean;
    // ── image
    src?: string;
    alt?: string;
    imgWidth?: "auto" | "1/2" | "3/4" | "full";
    imgRadius?: "none" | "sm" | "md" | "lg" | "full";
    imgShadow?: "none" | "sm" | "md" | "lg";
    imgFit?: "cover" | "contain" | "auto";
    // ── list
    items?: string[];
    bulletStyle?: "check" | "dot" | "number" | "arrow" | "none";
    itemColor?: string;
    itemSize?: "sm" | "md" | "lg";
    itemSpacing?: "tight" | "normal" | "loose";
    // ── divider
    divColor?: string;
    divThickness?: "1" | "2" | "4";
    divStyle?: "solid" | "dashed" | "dotted";
    divWidth?: "full" | "3/4" | "1/2" | "1/4";
    // ── spacer
    spacerHeight?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  };
}

export interface CanvasColStyle {
  bg?: string;
  padding?: "none" | "sm" | "md" | "lg";
  radius?: "none" | "sm" | "md" | "lg";
  border?: boolean;
  borderColor?: string;
  shadow?: "none" | "sm" | "md";
}

export interface CanvasCol { id: string; elements: CanvasEl[]; style?: CanvasColStyle; }
export interface CanvasRow { id: string; layout: CanvasRowLayout; cols: CanvasCol[]; }
export interface CanvasData { rows: CanvasRow[]; }

// ── BlockStyles ─────────────────────────────────────────────────────────────────

export interface BlockStyles {
  // ── Solid background color
  sectionBg?: string;
  // ── Background type selector
  bgType?: "color" | "gradient" | "image";
  // ── Gradient
  bgGradientFrom?: string;
  bgGradientTo?: string;
  bgGradientDir?: "to-r" | "to-br" | "to-b" | "to-bl" | "to-l" | "to-tr";
  // ── Background image
  bgImage?: string;
  bgImageSize?: "cover" | "contain" | "repeat";
  bgImagePos?: "center" | "top" | "bottom";
  bgImageFixed?: boolean;
  bgOverlay?: boolean;
  bgOverlayColor?: string;
  bgOverlayOpacity?: "10" | "20" | "30" | "40" | "50" | "60" | "70" | "80";
  // ── Section borders
  borderTop?: boolean;
  borderBottom?: boolean;
  sectionBorderColor?: string;
  // ── Section shadow
  sectionShadow?: "none" | "sm" | "md" | "lg";
  // ── Layout
  paddingY?: "xs" | "sm" | "md" | "lg" | "xl";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  // ── Typography
  headingColor?: string;
  headingSize?: "sm" | "md" | "lg" | "xl";
  bodyColor?: string;
  textAlign?: "left" | "center" | "right";
  fontFamily?: "sans" | "serif" | "mono";
  // ── Accents
  accentColor?: string;
  buttonVariant?: "filled" | "outline" | "ghost";
  buttonRadius?: "md" | "lg" | "full";
  // ── Cards
  cardBg?: string;
  cardRadius?: "md" | "lg" | "xl";
  cardShadow?: "none" | "sm" | "md";
  gridCols?: "2" | "3" | "4";
  // ── Content layout & arrangement
  contentLayout?: "centered" | "left" | "right" | "split-left" | "split-right";
  // ── Button customization
  buttonAlign?: "left" | "center" | "right";
  buttonSize?: "sm" | "md" | "lg";
  buttonColor?: string;
  buttonTextColor?: string;
  // ── Advanced / developer settings
  blockId?:      string;
  cssClasses?:   string;
  animation?:    "none" | "fade-in" | "slide-up" | "scale-in";
  hideOnMobile?: boolean;
  hideOnDesktop?: boolean;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface ComponentDef {
  id:              string;
  category:        string;
  categoryKey:     string;
  label:           string;
  description:     string;
  blockType:       string;
  defaultContent:  Record<string, unknown>;
  defaultStyles?:  BlockStyles;
}

export const CATEGORIES = [
  { key: "header",       label: "Header",       color: "#0f172a" },
  { key: "banner",       label: "Banner",       color: "#1e293b" },
  { key: "statement",    label: "Statement",    color: "#0a0a0a" },
  { key: "whyus",        label: "Why Us",       color: "#0f3460" },
  { key: "features",     label: "Features",     color: "#4f46e5" },
  { key: "services",     label: "Services",     color: "#059669" },
  { key: "testimonials", label: "Testimonials", color: "#7c3aed" },
  { key: "team",         label: "Team",         color: "#db2777" },
  { key: "gallery",      label: "Gallery",      color: "#0284c7" },
  { key: "pricing",      label: "Pricing",      color: "#d97706" },
  { key: "faq",          label: "FAQ",          color: "#64748b" },
  { key: "cta",          label: "CTA",          color: "#dc2626" },
  { key: "contact",      label: "Contact",      color: "#0891b2" },
  { key: "footer",       label: "Footer",       color: "#020617" },
  { key: "process",      label: "Process",      color: "#0891b2" },
  { key: "stats",        label: "Stats",        color: "#7c3aed" },
] as const;

export const COMPONENTS: ComponentDef[] = [
  // ── Header ─────────────────────────────────────────────────────────────────
  {
    id: "header-1", category: "Header", categoryKey: "header",
    label: "Classic Header", description: "Logo left, navigation right with CTA button",
    blockType: "header",
    defaultContent: { siteName: "Your Brand", logoText: "YB", navItems: [{ label: "Home", href: "/" }, { label: "About", href: "/about" }, { label: "Services", href: "/services" }, { label: "Contact", href: "/contact" }], ctaText: "Get Started", ctaLink: "#contact" },
  },
  {
    id: "header-2", category: "Header", categoryKey: "header",
    label: "Minimal Header", description: "Centered logo with simple navigation, no CTA",
    blockType: "header",
    defaultContent: { siteName: "Your Brand", logoText: "YB", navItems: [{ label: "Home", href: "/" }, { label: "About", href: "/about" }, { label: "Services", href: "/services" }, { label: "Contact", href: "/contact" }], ctaText: "", ctaLink: "" },
  },

  // ── Banner ─────────────────────────────────────────────────────────────────
  {
    id: "banner-1", category: "Banner", categoryKey: "banner",
    label: "Bold Hero", description: "Large headline with sub-text and CTA button",
    blockType: "hero",
    defaultContent: { headline: "We Build Websites That Drive Results", subheadline: "Professional web design and development for growing businesses.", ctaText: "Get a Free Quote", ctaLink: "#contact" },
  },
  {
    id: "banner-2", category: "Banner", categoryKey: "banner",
    label: "Split Hero", description: "Text on left, visual space on right",
    blockType: "hero",
    defaultContent: { headline: "Transform Your Business Online", subheadline: "We create stunning websites that convert visitors into customers.", ctaText: "Start Your Project", ctaLink: "#contact" },
  },
  {
    id: "banner-3", category: "Banner", categoryKey: "banner",
    label: "Minimal Hero", description: "Clean text-only hero, no distractions",
    blockType: "hero",
    defaultContent: { headline: "Simple. Effective. Powerful.", subheadline: "Everything your business needs to succeed online.", ctaText: "Learn More", ctaLink: "#about" },
  },

  // ── Statement ──────────────────────────────────────────────────────────────
  {
    id: "statement-1", category: "Statement", categoryKey: "statement",
    label: "Editorial Statement", description: "Large bold statement with label, CTAs and client logos strip",
    blockType: "statement",
    defaultContent: {
      label: "Who are we?",
      headline: "An independent web design and branding agency set up in 2010 who care, build relationships, have industry experience, and win awards.",
      ctaText: "About Us", ctaLink: "#about",
      secondaryCta: "Meet the Team", secondaryCtaLink: "#team",
      logosText: "SACHA LORD, University of Salford, ROSEBUD, NHS",
    },
    defaultStyles: { sectionBg: "#0a0a0a", headingColor: "#ffffff", bodyColor: "rgba(255,255,255,0.55)", paddingY: "xl" },
  },
  {
    id: "statement-2", category: "Statement", categoryKey: "statement",
    label: "Light Statement", description: "Editorial statement section on white background",
    blockType: "statement",
    defaultContent: {
      label: "Our Mission",
      headline: "We build products that put people first — beautiful, fast, and crafted with real intention.",
      ctaText: "Our Work", ctaLink: "#work",
      secondaryCta: "Get in touch", secondaryCtaLink: "#contact",
      logosText: "",
    },
    defaultStyles: { sectionBg: "#ffffff", headingColor: "#0a0a0a", bodyColor: "#6b7280", paddingY: "xl" },
  },

  // ── Why Us ─────────────────────────────────────────────────────────────────
  {
    id: "whyus-1", category: "Why Us", categoryKey: "whyus",
    label: "3 Reasons", description: "Three key differentiators in a row",
    blockType: "whyus",
    defaultContent: { title: "Why Choose Us", subtitle: "We deliver results that matter to your business", items: [{ title: "Expert Team", description: "Years of experience building successful digital products." }, { title: "Fast Delivery", description: "We deliver projects on time, every time, without compromise." }, { title: "Ongoing Support", description: "We're here for you long after your website launches." }] },
  },
  {
    id: "whyus-2", category: "Why Us", categoryKey: "whyus",
    label: "Stats Grid", description: "Key statistics and benefits in a grid",
    blockType: "whyus",
    defaultContent: { title: "Built for Growth", subtitle: "Numbers that speak for themselves", items: [{ title: "200+ Projects", description: "Successfully delivered across industries." }, { title: "98% Satisfied", description: "Client satisfaction rate across all projects." }, { title: "5 Years", description: "Of excellence in web design and development." }, { title: "24/7 Support", description: "We're always here when you need us." }] },
  },

  // ── Features ───────────────────────────────────────────────────────────────
  {
    id: "features-1", category: "Features", categoryKey: "features",
    label: "Icon Grid", description: "6 feature cards in a responsive grid",
    blockType: "features",
    defaultContent: { title: "Everything You Need", subtitle: "Powerful features to help your business grow", items: [{ title: "Custom Design", description: "Unique designs tailored to your brand identity." }, { title: "Mobile Ready", description: "Looks perfect on every screen size." }, { title: "SEO Optimized", description: "Built to rank high on search engines." }, { title: "Fast Loading", description: "Optimized for speed and performance." }, { title: "Secure", description: "Enterprise-grade security built in." }, { title: "Analytics", description: "Track your website performance in real time." }] },
  },
  {
    id: "features-2", category: "Features", categoryKey: "features",
    label: "Two Column", description: "Features list alongside visual content",
    blockType: "features",
    defaultContent: { title: "Why It Works", subtitle: "The details that make the difference", items: [{ title: "Pixel-perfect Design", description: "Every element crafted with precision and intent." }, { title: "Performance First", description: "Core Web Vitals optimized for top Google scores." }, { title: "Accessibility", description: "Built to WCAG standards, usable by everyone." }, { title: "Scalable", description: "Grows with your business without a rebuild." }] },
  },

  // ── Services ───────────────────────────────────────────────────────────────
  {
    id: "services-1", category: "Services", categoryKey: "services",
    label: "Cards Grid", description: "Service cards in a responsive grid layout",
    blockType: "services",
    defaultContent: { title: "Our Services", subtitle: "What we offer to help you succeed", items: [{ title: "Web Design", description: "Beautiful, conversion-focused website design." }, { title: "Development", description: "Clean, maintainable code for your website." }, { title: "SEO", description: "Rank higher and drive more organic traffic." }] },
  },
  {
    id: "services-2", category: "Services", categoryKey: "services",
    label: "Detailed List", description: "Services as a numbered, detailed list",
    blockType: "services",
    defaultContent: { title: "What We Do", subtitle: "Full-service digital solutions", items: [{ title: "Strategy & Planning", description: "We start with understanding your goals before writing a single line of code." }, { title: "Design & Branding", description: "Crafting visual identities that resonate with your target market." }, { title: "Development & Launch", description: "Building fast, secure, and scalable web applications." }] },
  },

  // ── Testimonials ───────────────────────────────────────────────────────────
  {
    id: "testimonials-1", category: "Testimonials", categoryKey: "testimonials",
    label: "Quote Cards", description: "Client testimonials in a 3-column grid",
    blockType: "testimonials",
    defaultContent: { title: "What Our Clients Say", items: [{ name: "Ahmed Khan", role: "CEO", company: "TechStart", quote: "Outstanding work. Delivered beyond our expectations and significantly increased our leads." }, { name: "Sarah Ahmed", role: "Founder", company: "StyleHouse", quote: "Professional, responsive, and truly understood our vision. Highly recommend!" }, { name: "Omar Malik", role: "Director", company: "BuildPro", quote: "Best investment we made. Our online presence has completely transformed." }] },
  },
  {
    id: "testimonials-2", category: "Testimonials", categoryKey: "testimonials",
    label: "Featured Quote", description: "Single large testimonial, highlighted",
    blockType: "testimonials",
    defaultContent: { title: "Trusted by Businesses", items: [{ name: "Ayesha Noor", role: "Managing Director", company: "AgroTech", quote: "The team delivered a world-class website that truly represents our brand. The attention to detail and professionalism was second to none. We've seen a 40% increase in online inquiries since launch." }] },
  },

  // ── Team ───────────────────────────────────────────────────────────────────
  {
    id: "team-1", category: "Team", categoryKey: "team",
    label: "Team Cards", description: "Team member cards with name and role",
    blockType: "team",
    defaultContent: { title: "Meet the Team", subtitle: "The people behind our work", items: [{ name: "Ali Hassan", role: "Creative Director", bio: "10 years of experience in digital design and branding." }, { name: "Fatima Zahra", role: "Lead Developer", bio: "Full-stack developer specializing in modern web technologies." }, { name: "Bilal Ahmed", role: "Project Manager", bio: "Ensuring every project is delivered on time and on budget." }] },
  },

  // ── Gallery ────────────────────────────────────────────────────────────────
  {
    id: "gallery-1", category: "Gallery", categoryKey: "gallery",
    label: "Portfolio Grid", description: "Image grid showcasing your work",
    blockType: "gallery",
    defaultContent: { title: "Our Work", subtitle: "A selection of our recent projects" },
  },
  {
    id: "gallery-2", category: "Gallery", categoryKey: "gallery",
    label: "Showcase Strip", description: "Horizontal image showcase with captions",
    blockType: "gallery",
    defaultContent: { title: "Featured Projects", subtitle: "Handpicked highlights from our portfolio" },
  },

  // ── Pricing ────────────────────────────────────────────────────────────────
  {
    id: "pricing-1", category: "Pricing", categoryKey: "pricing",
    label: "3-Tier Pricing", description: "Three pricing packages with feature lists",
    blockType: "pricing",
    defaultContent: { title: "Simple, Transparent Pricing", subtitle: "Choose the plan that's right for your business", tiers: [{ name: "Starter", price: "$499", period: "one-time", features: ["5-page website", "Mobile responsive", "Contact form", "Basic SEO"], popular: false }, { name: "Professional", price: "$1,299", period: "one-time", features: ["Up to 15 pages", "Custom design", "CMS integration", "Advanced SEO", "3 months support"], popular: true }, { name: "Enterprise", price: "Custom", period: "one-time", features: ["Unlimited pages", "Custom features", "Priority support", "Dedicated manager"], popular: false }] },
  },

  // ── FAQ ────────────────────────────────────────────────────────────────────
  {
    id: "faq-1", category: "FAQ", categoryKey: "faq",
    label: "Accordion FAQ", description: "Questions and answers in accordion style",
    blockType: "faq",
    defaultContent: { title: "Frequently Asked Questions", items: [{ question: "How long does it take to build a website?", answer: "Typically 2-4 weeks depending on the size and complexity of the project." }, { question: "Do you provide ongoing support?", answer: "Yes, we offer monthly maintenance and support packages." }, { question: "Can I update the website myself?", answer: "Absolutely. We build with a user-friendly CMS so you can update content easily." }, { question: "What happens after launch?", answer: "We provide a handover session, documentation, and 30 days of free support." }] },
  },

  // ── CTA ────────────────────────────────────────────────────────────────────
  {
    id: "cta-1", category: "CTA", categoryKey: "cta",
    label: "Bold Banner CTA", description: "Full-width call to action with headline",
    blockType: "cta",
    defaultContent: { headline: "Ready to Build Something Great?", subtext: "Let's work together to create a website that drives real results.", buttonText: "Get in Touch", buttonLink: "#contact" },
  },
  {
    id: "cta-2", category: "CTA", categoryKey: "cta",
    label: "Newsletter CTA", description: "Email subscription call to action",
    blockType: "cta",
    defaultContent: { headline: "Stay in the Loop", subtext: "Get our latest insights, tips, and offers delivered to your inbox.", buttonText: "Subscribe Now", buttonLink: "#subscribe" },
  },

  // ── Contact ────────────────────────────────────────────────────────────────
  {
    id: "contact-1", category: "Contact", categoryKey: "contact",
    label: "Form + Details", description: "Contact form alongside contact information",
    blockType: "contact",
    defaultContent: { title: "Get in Touch", subtitle: "We'd love to hear from you. We'll respond within 24 hours.", email: "hello@yourbusiness.com", phone: "+92 300 0000000", address: "Lahore, Pakistan" },
  },
  {
    id: "contact-2", category: "Contact", categoryKey: "contact",
    label: "Minimal Contact", description: "Simple contact section with key details",
    blockType: "contact",
    defaultContent: { title: "Let's Talk", subtitle: "Reach out and we'll be happy to help.", email: "hello@yourbusiness.com", phone: "+92 300 0000000", address: "" },
  },

  // ── Footer ─────────────────────────────────────────────────────────────────
  {
    id: "footer-1", category: "Footer", categoryKey: "footer",
    label: "Full Footer", description: "Multi-column footer with links and contact info",
    blockType: "footer",
    defaultContent: { companyName: "Your Brand", tagline: "Building digital experiences that matter.", email: "hello@yourbusiness.com", phone: "+92 300 0000000", copyright: "© 2024 Your Brand. All rights reserved.", links: [{ label: "Home", href: "/" }, { label: "About", href: "/about" }, { label: "Services", href: "/services" }, { label: "Projects", href: "/projects" }, { label: "Contact", href: "/contact" }] },
  },
  {
    id: "footer-2", category: "Footer", categoryKey: "footer",
    label: "Simple Footer", description: "Minimal footer with copyright and basic links",
    blockType: "footer",
    defaultContent: { companyName: "Your Brand", tagline: "", email: "hello@yourbusiness.com", phone: "", copyright: "© 2024 Your Brand. All rights reserved.", links: [{ label: "Privacy Policy", href: "/privacy" }, { label: "Terms of Service", href: "/terms" }] },
  },

  // ── Process ────────────────────────────────────────────────────────────────
  {
    id: "process-1", category: "Process", categoryKey: "process",
    label: "Numbered Steps", description: "Step-by-step process with large number badges",
    blockType: "process",
    defaultContent: {
      title: "How We Work",
      subtitle: "Our proven process for delivering exceptional results",
      steps: [
        { step: "01", title: "Discovery",  description: "We start by understanding your business, goals, and target audience in depth." },
        { step: "02", title: "Strategy",   description: "We craft a tailored plan covering design direction, timeline, and deliverables." },
        { step: "03", title: "Design",     description: "Our designers create stunning visuals that align with your brand identity." },
        { step: "04", title: "Launch",     description: "We deliver, test, and launch your project with full handover and support." },
      ],
    },
    defaultStyles: { sectionBg: "#ffffff", headingColor: "#111111", bodyColor: "#6b7280", paddingY: "xl" },
  },
  {
    id: "process-2", category: "Process", categoryKey: "process",
    label: "Dark Process", description: "Numbered steps on a dark background",
    blockType: "process",
    defaultContent: {
      title: "Our Process",
      subtitle: "Four focused steps to your perfect website",
      steps: [
        { step: "01", title: "Brief",   description: "Understanding your vision, requirements, and success criteria." },
        { step: "02", title: "Design",  description: "Creating the visual identity, layout, and user experience." },
        { step: "03", title: "Build",   description: "Developing with clean, fast, and maintainable code." },
        { step: "04", title: "Launch",  description: "Go live with rigorous testing and ongoing support." },
      ],
    },
    defaultStyles: { sectionBg: "#0a0a0a", headingColor: "#ffffff", bodyColor: "rgba(255,255,255,0.6)", accentColor: "#a78bfa", paddingY: "xl" },
  },

  // ── Stats ──────────────────────────────────────────────────────────────────
  {
    id: "stats-1", category: "Stats", categoryKey: "stats",
    label: "Stats Grid", description: "Large numbers in a bold grid — projects, clients, years",
    blockType: "stats",
    defaultContent: {
      title: "By the Numbers",
      subtitle: "Real results for real businesses",
      items: [
        { value: "200+",  label: "Projects Delivered" },
        { value: "98%",   label: "Client Satisfaction" },
        { value: "8+",    label: "Years of Experience" },
        { value: "40+",   label: "Team Members" },
      ],
    },
    defaultStyles: { sectionBg: "#ffffff", headingColor: "#111111", bodyColor: "#6b7280", accentColor: "#111111", paddingY: "xl" },
  },
  {
    id: "stats-2", category: "Stats", categoryKey: "stats",
    label: "Dark Stats", description: "Stats counter section on dark background",
    blockType: "stats",
    defaultContent: {
      title: "",
      subtitle: "",
      items: [
        { value: "150+",  label: "Happy Clients" },
        { value: "5★",    label: "Average Rating" },
        { value: "12",    label: "Countries Served" },
        { value: "24/7",  label: "Support Available" },
      ],
    },
    defaultStyles: { sectionBg: "#0a0a0a", headingColor: "#ffffff", bodyColor: "rgba(255,255,255,0.5)", accentColor: "#a78bfa", paddingY: "lg" },
  },
];

export const BLOCK_FIELDS: Record<string, { key: string; label: string; type: "text" | "textarea" | "url" | "nav-items" }[]> = {
  header:       [{ key: "siteName", label: "Site Name", type: "text" }, { key: "logoText", label: "Logo Text", type: "text" }, { key: "navItems", label: "Navigation Menu", type: "nav-items" }, { key: "ctaText", label: "CTA Button Text", type: "text" }, { key: "ctaLink", label: "CTA Link", type: "url" }],
  hero:         [{ key: "headline", label: "Headline", type: "text" }, { key: "subheadline", label: "Subheadline", type: "textarea" }, { key: "ctaText", label: "Button Text", type: "text" }, { key: "ctaLink", label: "Button Link", type: "url" }],
  about:        [{ key: "title", label: "Title", type: "text" }, { key: "body", label: "Body Text", type: "textarea" }],
  whyus:        [{ key: "title", label: "Title", type: "text" }, { key: "subtitle", label: "Subtitle", type: "textarea" }],
  features:     [{ key: "title", label: "Title", type: "text" }, { key: "subtitle", label: "Subtitle", type: "text" }],
  services:     [{ key: "title", label: "Title", type: "text" }, { key: "subtitle", label: "Subtitle", type: "text" }],
  contact:      [{ key: "title", label: "Title", type: "text" }, { key: "subtitle", label: "Subtitle", type: "text" }, { key: "email", label: "Email", type: "text" }, { key: "phone", label: "Phone", type: "text" }, { key: "address", label: "Address", type: "textarea" }],
  cta:          [{ key: "headline", label: "Headline", type: "text" }, { key: "subtext", label: "Subtext", type: "textarea" }, { key: "buttonText", label: "Button Text", type: "text" }, { key: "buttonLink", label: "Button Link", type: "url" }],
  testimonials: [{ key: "title", label: "Title", type: "text" }],
  faq:          [{ key: "title", label: "Title", type: "text" }],
  team:         [{ key: "title", label: "Title", type: "text" }, { key: "subtitle", label: "Subtitle", type: "text" }],
  pricing:      [{ key: "title", label: "Title", type: "text" }, { key: "subtitle", label: "Subtitle", type: "text" }],
  gallery:      [{ key: "title", label: "Title", type: "text" }, { key: "subtitle", label: "Subtitle", type: "text" }],
  footer:       [{ key: "companyName", label: "Company Name", type: "text" }, { key: "tagline", label: "Tagline", type: "text" }, { key: "email", label: "Email", type: "text" }, { key: "phone", label: "Phone", type: "text" }, { key: "copyright", label: "Copyright Text", type: "text" }, { key: "links", label: "Footer Links", type: "nav-items" }],
  custom:       [{ key: "heading", label: "Heading", type: "text" }, { key: "subheading", label: "Subheading / Body", type: "textarea" }, { key: "cta", label: "Button Text", type: "text" }, { key: "ctaLink", label: "Button Link", type: "url" }, { key: "col1", label: "Column 1", type: "textarea" }, { key: "col2", label: "Column 2", type: "textarea" }],
  statement:    [{ key: "label", label: "Label (top-left)", type: "text" }, { key: "headline", label: "Statement Text", type: "textarea" }, { key: "ctaText", label: "Primary Button", type: "text" }, { key: "ctaLink", label: "Primary Link", type: "url" }, { key: "secondaryCta", label: "Secondary Link Text", type: "text" }, { key: "secondaryCtaLink", label: "Secondary Link URL", type: "url" }, { key: "logosText", label: "Client Logos (comma-separated)", type: "textarea" }],
  canvas:       [],
  process:      [{ key: "title", label: "Title", type: "text" }, { key: "subtitle", label: "Subtitle", type: "text" }],
  stats:        [{ key: "title", label: "Title (optional)", type: "text" }, { key: "subtitle", label: "Subtitle (optional)", type: "text" }],
};

export function getCategoryColor(categoryKey: string): string {
  return CATEGORIES.find((c) => c.key === categoryKey)?.color ?? "#1e293b";
}

export function getComponentsByCategory(categoryKey: string): ComponentDef[] {
  return COMPONENTS.filter((c) => c.categoryKey === categoryKey);
}

export const BLOCK_FIELDS_EXTRA: Record<string, { key: string; label: string; type: "text" | "textarea" | "url" }[]> = {
  custom: [
    { key: "heading",    label: "Heading",          type: "text"     },
    { key: "subheading", label: "Subheading / Body", type: "textarea" },
    { key: "cta",        label: "Button Text",       type: "text"     },
    { key: "ctaLink",    label: "Button Link",       type: "url"      },
    { key: "col1",       label: "Column 1",          type: "textarea" },
    { key: "col2",       label: "Column 2",          type: "textarea" },
  ],
};

export const ITEM_FIELDS: Record<string, { key: string; label: string; type: "text" | "textarea" }[]> = {
  whyus:        [{ key: "title", label: "Title", type: "text" }, { key: "description", label: "Description", type: "textarea" }],
  features:     [{ key: "title", label: "Title", type: "text" }, { key: "description", label: "Description", type: "textarea" }],
  services:     [{ key: "title", label: "Title", type: "text" }, { key: "description", label: "Description", type: "textarea" }],
  testimonials: [{ key: "quote", label: "Quote", type: "textarea" }, { key: "name", label: "Name", type: "text" }, { key: "role", label: "Role", type: "text" }],
  team:         [{ key: "name", label: "Name", type: "text" }, { key: "role", label: "Role", type: "text" }, { key: "bio", label: "Bio", type: "textarea" }],
  faq:          [{ key: "question", label: "Question", type: "text" }, { key: "answer", label: "Answer", type: "textarea" }],
  pricing:      [{ key: "name", label: "Plan Name", type: "text" }, { key: "price", label: "Price", type: "text" }, { key: "period", label: "Period", type: "text" }],
  process:      [{ key: "step", label: "Step #", type: "text" }, { key: "title", label: "Title", type: "text" }, { key: "description", label: "Description", type: "textarea" }],
  stats:        [{ key: "value", label: "Value", type: "text" }, { key: "label", label: "Label", type: "text" }],
  custom:       [{ key: "title", label: "Title", type: "text" }, { key: "text", label: "Text", type: "textarea" }],
};

export const ITEM_ARRAY_KEY: Record<string, string> = {
  whyus: "items", features: "items", services: "items",
  testimonials: "items", team: "items", faq: "items", pricing: "tiers",
  process: "steps", stats: "items", custom: "items",
};

export const DEFAULT_ITEM: Record<string, Record<string, unknown>> = {
  whyus:        { title: "New Point", description: "Description here." },
  features:     { title: "New Feature", description: "Feature description." },
  services:     { title: "New Service", description: "Service description." },
  testimonials: { quote: "A great quote from our client.", name: "Client Name", role: "CEO" },
  team:         { name: "Team Member", role: "Role", bio: "Brief bio here." },
  faq:          { question: "New Question?", answer: "Answer here." },
  pricing:      { name: "New Plan", price: "$99", period: "/mo", features: ["Feature 1", "Feature 2"], popular: false },
  process:      { step: "0" + String(0), title: "New Step", description: "Step description." },
  stats:        { value: "99", label: "New Metric" },
  custom:       { title: "New Item", text: "Item description." },
};
