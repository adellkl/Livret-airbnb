export default function TrustLogos() {
  const logos = [
    { name: 'HostnFly', color: 'text-muted-foreground' },
    { name: 'Conciergerie', color: 'text-muted-foreground' },
    { name: 'GuestReady', color: 'text-muted-foreground' },
    { name: 'BNB', color: 'text-muted-foreground' },
    { name: 'Made For You', color: 'text-muted-foreground' },
    { name: 'KeyNest', color: 'text-muted-foreground' },
  ];

  return (
    <section className="py-12 border-y border-border bg-surface-soft">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Ils nous font confiance
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
          {logos.map((logo) => (
            <div key={logo.name} className={`text-lg font-semibold ${logo.color} opacity-60 hover:opacity-100 transition-opacity`}>
              {logo.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
