type FeatureCard = {
  number: string;
  tag: string;
  title: string;
  description: string;
};

const FEATURES: FeatureCard[] = [
  {
    number: '01',
    tag: 'Cluster',
    title: 'Similarity, not marketing',
    description:
      'Edges are drawn from benchmark profiles, lineage and licensing — so lookalikes sit next to each other whoever made them.',
  },
  {
    number: '02',
    tag: 'Dossier',
    title: 'Every number, one panel',
    description:
      'Context, price per million, latency, eval scores, tool-use reliability, licence terms and the honest weaknesses.',
  },
  {
    number: '03',
    tag: 'Picker',
    title: 'A shortlist in two minutes',
    description:
      "Answer what you're building, latency and budget. Get three ranked picks with the reasoning written out.",
  },
];

export function FeaturesSection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-24">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.number}
            className="group flex flex-col gap-3 rounded-xl border p-6 transition-all duration-300 hover:border-white/15"
            style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderColor: 'rgba(255,255,255,0.07)',
            }}
          >
            {/* Number / Tag */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-medium" style={{ color: '#6C63FF' }}>
                {feature.number} /
              </span>
              <span
                className="font-mono text-xs font-medium uppercase tracking-widest"
                style={{ color: '#6C63FF' }}
              >
                {feature.tag}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold leading-snug text-white">{feature.title}</h3>

            {/* Description */}
            <p className="text-sm leading-relaxed text-white/50">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
