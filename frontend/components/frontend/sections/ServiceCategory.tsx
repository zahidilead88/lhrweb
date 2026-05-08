import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function ServiceCategory({ section }: { section: any }) {
  if (!section) return null;
  const items: { title: string; content: string }[] = section.accordion || [];

  return (
    <section className="border-t border-black/10">
      <div className="px-6 md:px-10 lg:px-16 pt-6 overflow-hidden">
        <span className="font-almiregodisplay font-bold text-[22vw] leading-none tracking-tighter select-none block">
          {section.title}
        </span>
      </div>

      <div className="px-6 md:px-10 lg:px-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-24 mt-10">
        <p className="text-2xl md:text-3xl font-medium leading-snug max-w-xs">
          {section.shortDescription}
        </p>

        <div>
          {items.map((item, i) => (
            <Link
              key={i}
              href={item.content || "#"}
              className={`group flex items-center justify-between py-5 border-b border-black/10 transition-colors duration-200 hover:border-black ${
                i === 0 ? "border-t border-black/10" : ""
              }`}
            >
              <div className="flex items-center gap-8">
                <span className="text-xs text-gray-400 font-mono w-4">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-lg font-medium">{item.title}</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
