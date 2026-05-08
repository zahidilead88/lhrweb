export default function AboutIntro({ section }: { section: any }) {
  if (!section) return null;
  const badges: { title: string; content: string }[] = section.accordion || [];

  return (
    <section className="px-6 md:px-10 lg:px-20 py-20 border-t border-gray-100">
      {/* Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        <div>
          {section.shortDescription && (
            <div className="flex items-center gap-2 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-black" />
              <span className="text-sm text-gray-500">{section.shortDescription}</span>
            </div>
          )}
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">{section.title}</h2>
        </div>
        <div className="space-y-4 text-gray-600 text-lg leading-relaxed lg:pt-4">
          {section.description?.split("\n").filter(Boolean).map((p: string, i: number) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>

      {/* Award badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-8 items-center pt-12 border-t border-gray-100">
          {badges.map((badge, i) => (
            <div key={i} className="flex flex-col items-center gap-1 text-center">
              <span className="text-2xl font-bold">{badge.content}</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest">{badge.title}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
