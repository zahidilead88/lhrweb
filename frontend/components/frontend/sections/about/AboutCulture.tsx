export default function AboutCulture({ section }: { section: any }) {
  if (!section) return null;

  return (
    <section className="px-6 md:px-10 lg:px-20 py-20 border-t border-gray-100">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left: image */}
        {section.image && (
          <div className="rounded-2xl overflow-hidden aspect-[4/3]">
            <img
              src={section.image.startsWith("http") ? section.image : `http://localhost:8000/${section.image}`}
              alt={section.title || "Culture"}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Right: text */}
        <div className={section.image ? "" : "lg:col-span-2"}>
          {section.shortDescription && (
            <div className="flex items-center gap-2 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-black" />
              <span className="text-sm text-gray-500">{section.shortDescription}</span>
            </div>
          )}
          <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            {section.title}
          </h2>
          {section.description && (
            <div className="space-y-4 text-gray-600 text-lg leading-relaxed mb-8">
              {section.description.split("\n").filter(Boolean).map((p: string, i: number) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
          {/* Accordion items as pull-quotes */}
          {section.accordion?.map((item: { title: string; content: string }, i: number) => (
            <blockquote key={i} className="border-l-2 border-black pl-6 my-6">
              <p className="text-xl font-medium leading-snug mb-2">"{item.content}"</p>
              {item.title && (
                <cite className="text-sm text-gray-500 not-italic">— {item.title}</cite>
              )}
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
