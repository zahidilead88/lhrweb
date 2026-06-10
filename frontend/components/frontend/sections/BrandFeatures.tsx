const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import Image from "next/image";

interface FeatureCard {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
}

interface BrandFeaturesProps {
  section: {
    title?: string;
    shortDescription?: string;
    description?: string;
    accordion?: Array<{
      title: string;
      content?: string;
      subFields?: string[];
    }>;
  };
}

const DEFAULT_FEATURES: FeatureCard[] = [
  {
    title: "Write like a pro",
    description: "AI creates unique copy for your website – from headlines to product descriptions.",
    image: "",
    imageAlt: "AI Writer interface",
  },
  {
    title: "Design your logo",
    description: "Use our AI logo maker to create designs that fit your brand in seconds.",
    image: "",
    imageAlt: "Logo design tool",
  },
  {
    title: "Create product pages",
    description: "Describe what you're selling, and AI will generate titles, descriptions, and images.",
    image: "",
    imageAlt: "Product page builder",
  },
  {
    title: "Add custom visuals",
    description: "Create polished images for any page – from hero sections to blog posts.",
    image: "",
    imageAlt: "Custom visuals generator",
  },
];

const CARD_BG_COLORS = [
  "bg-blue-50",
  "bg-gray-100",
  "bg-indigo-100",
  "bg-gray-200",
];

export default function BrandFeatures({ section }: BrandFeaturesProps) {
  const badge = section?.shortDescription || "Limitless customization";
  const heading = section?.title || "Match your website to your brand";
  const subtext =
    section?.description ||
    "Our drag-and-drop editor and AI tools make it easy to bend your website to your personal style or brand. Don't like the color scheme? Change it. Images not right? Swap them out.";

  const rawItems = section?.accordion ?? [];
  const features: FeatureCard[] =
    rawItems.length > 0
      ? rawItems.map((item) => {
          const parts = (item.content || "").split("|");
          return {
            title: item.title,
            description: parts[0] || "",
            image: parts[1] || "",
            imageAlt: item.title,
          };
        })
      : DEFAULT_FEATURES;

  return (
    <section className="px-6 md:px-10 lg:px-20 py-20 bg-white">
      {/* Header */}
      <div className="max-w-2xl mx-auto text-center mb-14">
        <span className="inline-block bg-purple-100 text-purple-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          {badge}
        </span>
        <h2 className="heading text-4xl md:text-5xl font-bold leading-tight mb-5">{heading}</h2>
        <p className="text-gray-500 text-base md:text-lg leading-relaxed">{subtext}</p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, i) => (
          <div key={i} className="flex flex-col">
            {/* Image area */}
            <div
              className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-4 ${CARD_BG_COLORS[i % CARD_BG_COLORS.length]}`}
            >
              {feature.image ? (
                <Image
                  src={
                    feature.image.startsWith("http")
                      ? feature.image
                      : `${API}/${feature.image}`
                  }
                  alt={feature.imageAlt || feature.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FeatureIllustration index={i} />
                </div>
              )}
            </div>

            {/* Text */}
            <h3 className="heading font-bold text-base mb-1.5">{feature.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeatureIllustration({ index }: { index: number }) {
  const illustrations = [
    // AI Writer
    <svg key={0} viewBox="0 0 200 150" className="w-32 h-24 opacity-60">
      <rect x="20" y="15" width="160" height="120" rx="10" fill="white" />
      <rect x="30" y="30" width="80" height="10" rx="3" fill="#6366f1" opacity="0.7" />
      <rect x="30" y="50" width="140" height="6" rx="3" fill="#e5e7eb" />
      <rect x="30" y="62" width="120" height="6" rx="3" fill="#e5e7eb" />
      <rect x="30" y="74" width="100" height="6" rx="3" fill="#e5e7eb" />
      <rect x="30" y="95" width="60" height="22" rx="11" fill="#111" />
      <text x="60" y="111" fontSize="9" fill="white" textAnchor="middle">Generate</text>
    </svg>,

    // Logo Design
    <svg key={1} viewBox="0 0 200 150" className="w-32 h-24 opacity-60">
      <circle cx="100" cy="75" r="45" fill="white" stroke="#e5e7eb" strokeWidth="2" />
      <polygon points="100,35 130,90 70,90" fill="#6366f1" opacity="0.6" />
      <circle cx="100" cy="95" r="12" fill="#818cf8" opacity="0.8" />
    </svg>,

    // Product Page
    <svg key={2} viewBox="0 0 200 150" className="w-32 h-24 opacity-60">
      <rect x="20" y="10" width="80" height="100" rx="8" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
      <rect x="25" y="15" width="70" height="50" rx="5" fill="#e0e7ff" />
      <rect x="25" y="72" width="50" height="6" rx="2" fill="#374151" />
      <rect x="25" y="84" width="35" height="6" rx="2" fill="#6366f1" opacity="0.7" />
      <rect x="110" y="10" width="70" height="130" rx="8" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
      <rect x="115" y="20" width="60" height="40" rx="4" fill="#e0e7ff" />
      <rect x="115" y="67" width="45" height="5" rx="2" fill="#374151" />
      <rect x="115" y="78" width="30" height="5" rx="2" fill="#6366f1" opacity="0.7" />
      <rect x="115" y="95" width="60" height="18" rx="9" fill="#111" />
    </svg>,

    // Custom Visuals
    <svg key={3} viewBox="0 0 200 150" className="w-32 h-24 opacity-60">
      <rect x="30" y="20" width="140" height="110" rx="10" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
      <rect x="40" y="30" width="120" height="70" rx="6" fill="#d1d5db" />
      <circle cx="100" cy="65" r="18" fill="#6366f1" opacity="0.5" />
      <text x="100" y="70" fontSize="16" fill="#4f46e5" textAnchor="middle">+</text>
      <rect x="40" y="110" width="120" height="6" rx="2" fill="#6366f1" opacity="0.4" />
      <text x="100" y="142" fontSize="9" fill="#9ca3af" textAnchor="middle">Generating image…</text>
    </svg>,
  ];
  return illustrations[index % illustrations.length];
}
