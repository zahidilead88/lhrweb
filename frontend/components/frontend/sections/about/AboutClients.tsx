export default function AboutClients({ section }: { section: any }) {
  if (!section) return null;
  const clients: { title: string; content: string }[] = section.accordion || [];

  return (
    <section className="bg-black text-white px-6 md:px-10 lg:px-20 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        <div>
          {section.shortDescription && (
            <div className="flex items-center gap-2 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-white opacity-50" />
              <span className="text-sm text-gray-400">{section.shortDescription}</span>
            </div>
          )}
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">
            {section.title || "We work with ambitious businesses."}
          </h2>
          {section.description && (
            <p className="mt-6 text-gray-400 text-lg leading-relaxed">{section.description}</p>
          )}
        </div>

        {clients.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px border border-white/10">
            {clients.map((client, i) => (
              <div
                key={i}
                className="flex items-center justify-center p-8 border border-white/10 text-center"
              >
                {client.content ? (
                  <img
                    src={client.content.startsWith("http") ? client.content : `http://localhost:8000/${client.content}`}
                    alt={client.title}
                    className="max-h-8 object-contain filter invert opacity-70 hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <span className="text-sm text-gray-400 font-medium tracking-wide uppercase">
                    {client.title}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
