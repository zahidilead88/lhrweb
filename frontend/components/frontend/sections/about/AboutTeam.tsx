export default function AboutTeam({ section }: { section: any }) {
  if (!section) return null;
  const members: { title: string; content: string }[] = section.accordion || [];

  // Split content field as "role|imageUrl"
  const parsed = members.map((m) => {
    const [role, img] = m.content.split("|");
    return { name: m.title, role: role?.trim(), img: img?.trim() };
  });

  return (
    <section className="px-6 md:px-10 lg:px-20 py-20 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-black" />
        <span className="text-sm text-gray-500">Our Team</span>
      </div>
      <h2 className="text-4xl md:text-5xl font-bold mb-16 max-w-md leading-tight">
        {section.title || "Multiple personalities, No egos."}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {parsed.map((member, i) => (
          <div key={i} className="group relative">
            {/* Photo or placeholder */}
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 mb-3 relative">
              {member.img ? (
                <img
                  src={member.img.startsWith("http") ? member.img : `http://localhost:8000/${member.img}`}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <span className="text-4xl font-bold text-gray-300">
                    {member.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <p className="font-semibold text-sm">{member.name}</p>
            {member.role && <p className="text-xs text-gray-500">{member.role}</p>}
          </div>
        ))}
      </div>

      {section.button?.label && (
        <div className="mt-12">
          <a
            href={section.button.url || "/about/team"}
            className="inline-flex items-center gap-2 border border-black/20 rounded-full px-6 py-3 text-sm font-medium hover:bg-black hover:text-white transition-all"
          >
            {section.button.label}
          </a>
        </div>
      )}
    </section>
  );
}
