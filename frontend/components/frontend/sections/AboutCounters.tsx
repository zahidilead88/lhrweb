export default function AboutCounters({ section }: { section: any }) {
  if (!section) return null;
  const stats: { title: string; content: string }[] = section.accordion || [];

  return (
    <section className="px-6 md:px-10 lg:px-20 py-20 border-t border-gray-100">
      {section.title && (
        <h2 className="text-2xl font-bold mb-12">{section.title}</h2>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={i}>
            <p className="text-sm text-gray-500 mb-2">{stat.title}</p>
            <p className="text-5xl md:text-6xl font-bold leading-none mb-3">
              {stat.content.split("|")[0]}
            </p>
            {stat.content.split("|")[1] && (
              <p className="text-sm text-gray-500 leading-relaxed">
                {stat.content.split("|")[1]}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
