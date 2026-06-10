export interface FieldConfig {
  label: string;
  placeholder?: string;
  hint?: string;
}

export interface SubField {
  label: string;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
}

export interface AccordionConfig {
  label: string;
  hint?: string;
  titleLabel: string;
  titlePlaceholder: string;
  /** Single content field (used when there is only one value per item) */
  contentLabel?: string;
  contentPlaceholder?: string;
  /** Multiple distinct fields — values are joined with "|" for storage */
  subFields?: SubField[];
}

export interface SectionFields {
  title?:            FieldConfig;
  shortDescription?: FieldConfig;
  description?:      FieldConfig;
  image?:            FieldConfig;
  featuredImage?:    FieldConfig;
  accordion?:        AccordionConfig;
  button?:           boolean;
  /** When set, no content fields are shown — the section populates itself automatically */
  autoContent?:      string;
  /** When true, show a blog-post picker instead of free-form accordion items */
  blogPicker?:       boolean;
  /** When true, show a project picker instead of free-form accordion items */
  projectPicker?:    boolean;
}

export interface SectionType {
  key:         string;
  label:       string;
  group:       string;
  description: string;
  fields:      SectionFields;
}

export const SECTION_TYPES: SectionType[] = [
  // ── Home ─────────────────────────────────────────────────────────────────
  {
    key:         "voila-banner",
    label:       "Voila Banner (Studio style)",
    group:       "Home",
    description: "Full-screen hero inspired by Studio Voila — stacked project cards on the right, headline + project circles on the left. Fetches projects automatically.",
    fields: {
      autoContent: "This banner auto-fetches your projects and displays them as stacked cards. No manual content needed.",
    },
  },
  {
    key:         "home-banner",
    label:       "Home Banner (Classic)",
    group:       "Home",
    description: "Full-screen hero with a large headline, service pills, project marquee, and scroll-driven LHRWEB SVG",
    fields: {
      title: {
        label:       "Headline",
        placeholder: "e.g. We are your digital partner for strategy, design and development.",
        hint:        "Displayed in large AlmiregO font at the centre of the hero",
      },
      shortDescription: {
        label:       "Tagline",
        placeholder: "e.g. Branding & Digital Studio — Lahore",
      },
    },
  },
  {
    key:         "home-projects",
    label:       "Projects Carousel",
    group:       "Home",
    description: "Horizontal scroll showcase — automatically populated from your Projects",
    fields: {
      autoContent: "This section pulls your latest projects automatically. No content to fill in.",
    },
  },
  {
    key:         "home-blog",
    label:       "Blog Posts",
    group:       "Home",
    description: "Hand-pick which blog posts to display on this page",
    fields: {
      title: {
        label:       "Section heading",
        placeholder: "e.g. From the blog",
      },
      shortDescription: {
        label:       "Small label above heading",
        placeholder: "e.g. Latest thinking",
      },
      blogPicker: true,
    },
  },
  {
    key:         "build-future",
    label:       "Build Future",
    group:       "Home",
    description: "Full-height panel with a large heading, tagline and a 'Let's talk' button",
    fields: {
      title: {
        label:       "Big heading",
        placeholder: "e.g. Build the future",
        hint:        "Shown in large AlmiregO font on the left",
      },
      shortDescription: {
        label:       "Tagline",
        placeholder: "e.g. We help ambitious brands grow online",
        hint:        "Smaller subtitle line below the heading",
      },
      description: {
        label:       "Body text",
        placeholder: "Optional longer paragraph",
      },
    },
  },
  {
    key:         "our-expertise",
    label:       "Our Expertise",
    group:       "Home",
    description: "Dark full-height section with accordion items showing your service areas",
    fields: {
      title: {
        label:       "Section heading",
        placeholder: "e.g. Our Expertise",
      },
      shortDescription: {
        label:       "Subtitle",
        placeholder: "e.g. What we do best",
        hint:        "Shown in a larger font above the accordion",
      },
      description: {
        label:       "Left column body text",
        placeholder: "Brief paragraph about your team or approach",
      },
      image: {
        label: "Side image",
        hint:  "Displayed on the left column next to the accordion",
      },
      accordion: {
        label:            "Expertise items",
        hint:             "Each item is a clickable row in the accordion",
        titleLabel:       "Item name",
        titlePlaceholder: "e.g. Web Design",
        contentLabel:     "Description",
        contentPlaceholder: "Brief description shown when expanded",
      },
    },
  },

  // ── Services ─────────────────────────────────────────────────────────────
  {
    key:         "services-hero",
    label:       "Services Hero",
    group:       "Services",
    description: "Split two-column hero for a services page",
    fields: {
      title: {
        label:       "Page heading",
        placeholder: "e.g. Services we offer",
        hint:        "Large bold heading on the left column",
      },
      shortDescription: {
        label:       "Subtitle",
        placeholder: "e.g. Strategy, design and development under one roof.",
        hint:        "Medium-weight text on the right column",
      },
    },
  },
  {
    key:         "services-design",
    label:       "Service Category",
    group:       "Services",
    description: "Giant display word + numbered list of service links",
    fields: {
      title: {
        label:       "Category display word",
        placeholder: "e.g. Design",
        hint:        "Shown in massive AlmiregO font — keep it one word",
      },
      shortDescription: {
        label:       "Category tagline",
        placeholder: "e.g. We create brands that leave a lasting impression",
      },
      accordion: {
        label:              "Service links",
        hint:               "Each item becomes a numbered row linking to a service page",
        titleLabel:         "Service name",
        titlePlaceholder:   "e.g. Web Design",
        contentLabel:       "Link URL",
        contentPlaceholder: "e.g. /services/web-design",
      },
    },
  },

  // ── About ────────────────────────────────────────────────────────────────
  {
    key:         "about-hero",
    label:       "About Hero",
    group:       "About",
    description: "Full-screen hero with fanned project photos — no content needed",
    fields: {
      title: {
        label:       "Headline",
        placeholder: "e.g. Good design makes life better.",
        hint:        "Large centred heading above the fanned photos",
      },
      button: true,
      autoContent: "Project photos are pulled automatically from your latest projects.",
    },
  },
  {
    key:         "about-intro",
    label:       "About Intro",
    group:       "About",
    description: "Two-column intro with tagline, heading, body paragraphs and optional award badges",
    fields: {
      title: {
        label:       "Heading",
        placeholder: "e.g. We're a design-led digital agency.",
      },
      shortDescription: {
        label:       "Small label above heading",
        placeholder: "e.g. About Us",
      },
      description: {
        label:       "Body paragraphs",
        placeholder: "Each new line becomes a separate paragraph",
        hint:        "Shown in the right column",
      },
      accordion: {
        label:              "Award / badge items",
        hint:               "Displayed as a row of badges below the text",
        titleLabel:         "Label",
        titlePlaceholder:   "e.g. Awwwards",
        contentLabel:       "Value / year",
        contentPlaceholder: "e.g. 2024",
      },
    },
  },
  {
    key:         "about-team",
    label:       "About Team",
    group:       "About",
    description: "Grid of team members with photo, name and role",
    fields: {
      title: {
        label:       "Section heading",
        placeholder: "e.g. Multiple personalities, No egos.",
      },
      accordion: {
        label:            "Team members",
        titleLabel:       "Full name",
        titlePlaceholder: "e.g. Jane Smith",
        subFields: [
          { label: "Role / Job title", placeholder: "e.g. Lead Designer" },
          { label: "Photo URL (optional)", placeholder: "e.g. uploads/jane.jpg" },
        ],
      },
      button: true,
    },
  },
  {
    key:         "about-counters",
    label:       "About Counters",
    group:       "About",
    description: "4-column grid of large stats / numbers",
    fields: {
      title: {
        label:       "Section heading (optional)",
        placeholder: "e.g. By the numbers",
      },
      accordion: {
        label:            "Stat items",
        titleLabel:       "Label (shown above the number)",
        titlePlaceholder: "e.g. Projects completed",
        subFields: [
          { label: "Big number / value", placeholder: "e.g. 200+" },
          { label: "Description (optional)", placeholder: "e.g. Across 12 countries" },
        ],
      },
    },
  },
  {
    key:         "about-clients",
    label:       "About Clients",
    group:       "About",
    description: "Dark-background section with heading and a grid of client logos or names",
    fields: {
      title: {
        label:       "Heading",
        placeholder: "e.g. We work with ambitious businesses.",
      },
      shortDescription: {
        label:       "Small label above heading",
        placeholder: "e.g. Our Clients",
      },
      description: {
        label:       "Body text (optional)",
        placeholder: "e.g. From start-ups to established brands.",
      },
      accordion: {
        label:              "Client entries",
        hint:               "Title = client name (shown as fallback). Content = logo image URL (optional).",
        titleLabel:         "Client name",
        titlePlaceholder:   "e.g. Acme Corp",
        contentLabel:       "Logo image URL (optional)",
        contentPlaceholder: "e.g. uploads/acme-logo.png",
      },
    },
  },
  {
    key:         "about-testimonials",
    label:       "About Testimonials",
    group:       "About",
    description: "Carousel of client reviews with quote, author and role",
    fields: {
      title: {
        label:       "Section heading",
        placeholder: "e.g. People love us",
      },
      shortDescription: {
        label:       "Small label above heading",
        placeholder: "e.g. Testimonials",
      },
      accordion: {
        label:            "Reviews",
        titleLabel:       "Display name (shown in tab list)",
        titlePlaceholder: "e.g. Sarah — Acme Corp",
        subFields: [
          { label: "Quote", placeholder: "e.g. Working with them was absolutely brilliant.", multiline: true },
          { label: "Author name", placeholder: "e.g. Sarah Jones" },
          { label: "Role / Company", placeholder: "e.g. CEO at Acme" },
        ],
      },
    },
  },
  {
    key:         "about-culture",
    label:       "About Culture",
    group:       "About",
    description: "Left image + right text with optional pull-quotes",
    fields: {
      title: {
        label:       "Heading",
        placeholder: "e.g. Our culture & values",
      },
      shortDescription: {
        label:       "Small label above heading",
        placeholder: "e.g. Culture",
      },
      description: {
        label:       "Body paragraphs",
        placeholder: "Each new line becomes a separate paragraph",
      },
      image: {
        label: "Left image",
        hint:  "Displayed on the left column",
      },
      accordion: {
        label:              "Pull-quotes (optional)",
        hint:               "Each item becomes a blockquote",
        titleLabel:         "Attribution",
        titlePlaceholder:   "e.g. Our founding principle",
        contentLabel:       "Quote text",
        contentPlaceholder: "e.g. Great design is invisible.",
      },
    },
  },
  {
    key:         "about-blog",
    label:       "About Blog",
    group:       "About",
    description: "Hand-pick which blog posts to display on the About page",
    fields: {
      title: {
        label:       "Section heading",
        placeholder: "e.g. From the blog",
      },
      shortDescription: {
        label:       "Small label above heading",
        placeholder: "e.g. Latest thinking",
      },
      blogPicker: true,
    },
  },
  {
    key:         "about-carousel",
    label:       "About Image Carousel",
    group:       "About",
    description: "Horizontal scroll carousel of images (awards, work, culture photos)",
    fields: {
      title: {
        label:       "Section heading",
        placeholder: "e.g. Award-winning work",
      },
      shortDescription: {
        label:       "Small label above heading",
        placeholder: "e.g. Our work",
      },
      accordion: {
        label:              "Carousel images",
        hint:               "Title = caption (shown on hover). Content = image URL.",
        titleLabel:         "Caption",
        titlePlaceholder:   "e.g. Awwwards SOTD – Jan 2024",
        contentLabel:       "Image URL",
        contentPlaceholder: "e.g. uploads/award-jan-2024.jpg",
      },
    },
  },

  // ── Generic ───────────────────────────────────────────────────────────────
  {
    key:         "faq",
    label:       "FAQ / Accordion",
    group:       "Generic",
    description: "Expandable Q&A list — usable on any page",
    fields: {
      title: {
        label:       "Section heading (optional)",
        placeholder: "e.g. Frequently Asked Questions",
      },
      accordion: {
        label:              "FAQ items",
        hint:               "Each item is an expandable row",
        titleLabel:         "Question",
        titlePlaceholder:   "e.g. How long does a project take?",
        contentLabel:       "Answer",
        contentPlaceholder: "Typically 2–4 weeks depending on scope…",
      },
    },
  },
  {
    key:         "pricing",
    label:       "Pricing Plans",
    group:       "Generic",
    description: "Toggle between Subscription and Project pricing with feature lists",
    fields: {
      title: {
        label:       "Subscriptions heading",
        placeholder: "e.g. Subscriptions are like having an in-house creative department.",
        hint:        "Shown when the toggle is set to Subscriptions",
      },
      shortDescription: {
        label:       "Projects heading",
        placeholder: "e.g. One-off projects, delivered end to end.",
        hint:        "Shown when the toggle is set to Projects",
      },
      description: {
        label:       "\"Build your own\" card text",
        placeholder: "e.g. Build your own plan. We'll tailor the perfect team.",
        hint:        "Shown in the last card on the right",
      },
      button: true,
      accordion: {
        label:            "Pricing plans",
        hint:             "Each item is one pricing card. Type must be \"subscription\" or \"project\".",
        titleLabel:       "Plan name",
        titlePlaceholder: "e.g. Part-time Pro",
        subFields: [
          { label: "Type",        placeholder: "subscription  or  project" },
          { label: "Badge",       placeholder: "e.g. Most Popular  (leave blank for none)" },
          { label: "Price",       placeholder: "e.g. 10200  (numbers only, no $)" },
          { label: "Period",      placeholder: "e.g. /month  or  /project  or  one-time" },
          { label: "Description", placeholder: "e.g. One part-time creative for ongoing projects." },
          { label: "Features (separate each with ;)", placeholder: "e.g. Dedicated creative, 20 hrs weekly;Two ongoing tasks;Multiple revisions", multiline: true },
          { label: "Button text", placeholder: "e.g. Subscribe now" },
          { label: "Note below button (optional)", placeholder: "e.g. Need more info? Let's chat." },
        ],
      },
    },
  },
  {
    key:         "cta",
    label:       "CTA Banner",
    group:       "Generic",
    description: "Full-width call-to-action with a large heading and button",
    fields: {
      title: {
        label:       "CTA heading",
        placeholder: "e.g. Let's work together.",
        hint:        "Displayed in large AlmiregO font",
      },
      shortDescription: {
        label:       "Label above heading",
        placeholder: "e.g. Ready to get started?",
        hint:        "Small pill text shown above the heading",
      },
      button:  true,
    },
  },
  {
    key:         "contact-form",
    label:       "Contact Form",
    group:       "Generic",
    description: "Full-width contact section with form and sidebar contact info",
    fields: {
      autoContent: "This component is a fixed form. No content to fill in.",
    },
  },
  {
    key:         "projects-listing",
    label:       "Projects Listing (Full)",
    group:       "Generic",
    description: "Full-page projects grid with category filters",
    fields: {
      autoContent: "This section pulls all projects automatically with category filters.",
    },
  },
  {
    key:         "blog-listing",
    label:       "Blog Listing (Full)",
    group:       "Generic",
    description: "Full-page blog grid with category filters",
    fields: {
      autoContent: "This section pulls all blog posts automatically with category filters.",
    },
  },
  {
    key:         "brand-features",
    label:       "Brand Features",
    group:       "Home",
    description: "4-card feature grid with badge, heading, and description — highlights key capabilities",
    fields: {
      shortDescription: {
        label:       "Badge text",
        placeholder: "e.g. Limitless customization",
        hint:        "Shown in a small pill above the heading",
      },
      title: {
        label:       "Section heading",
        placeholder: "e.g. Match your website to your brand",
      },
      description: {
        label:       "Subtitle paragraph",
        placeholder: "e.g. Our tools make it easy to bend your website to your brand.",
      },
      accordion: {
        label:            "Feature cards",
        hint:             "Each item is one feature card. Description and image URL are joined with \"|\" in the content field.",
        titleLabel:       "Card title",
        titlePlaceholder: "e.g. Write like a pro",
        contentLabel:     "Description | Image URL (separated by |)",
        contentPlaceholder: "e.g. AI creates unique copy for your website.|uploads/feature1.jpg",
      },
    },
  },
  {
    key:         "conversion-section",
    label:       "Conversion Steps",
    group:       "Home",
    description: "Interactive 1-2-3 steps with images and a CTA button",
    fields: {
      autoContent: "This component currently uses hardcoded Shopify-style steps. (Future: make editable)",
    },
  },
  {
    key:         "featured-projects",
    label:       "Featured Projects",
    group:       "Generic",
    description: "Grid of hand-picked projects showcase",
    fields: {
      title: {
        label:       "Section heading",
        placeholder: "e.g. Featured Work",
      },
      shortDescription: {
        label:       "Subtitle",
        placeholder: "e.g. Selected projects we're proud of",
      },
      projectPicker: true,
    },
  },
  {
    key:         "featured-blogs",
    label:       "Featured Blogs",
    group:       "Generic",
    description: "Grid of hand-picked blog posts",
    fields: {
      title: {
        label:       "Section heading",
        placeholder: "e.g. Latest Insights",
      },
      shortDescription: {
        label:       "Subtitle",
        placeholder: "e.g. Thinking and news from our team",
      },
      blogPicker: true,
    },
  },
];

export const SECTION_TYPES_BY_KEY: Record<string, SectionType> =
  Object.fromEntries(SECTION_TYPES.map((s) => [s.key, s]));

export const SECTION_TYPES_GROUPED: Record<string, SectionType[]> =
  SECTION_TYPES.reduce<Record<string, SectionType[]>>((acc, s) => {
    (acc[s.group] ||= []).push(s);
    return acc;
  }, {});
