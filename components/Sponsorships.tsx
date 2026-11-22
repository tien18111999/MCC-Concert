const sponsors = [
  { name: "Bank of America", src: "/extra/Sponsor 1.png" },
  { name: "PepsiCo", src: "/extra/Sponso 2.jpg" },
  { name: "Windy City Limousine", src: "/extra/Sponsor 3.jpg" },
  { name: "Kraft Heinz", src: "/extra/Sponsor 4.jpg" },
  { name: "Jewel-Osco", src: "/extra/Sponsor 5.jpg" },
];

export function Sponsorships() {
  return (
    <section id="sponsorships" className="scroll-mt-24 bg-black px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl border border-white/15 px-4 py-10 sm:px-8 sm:py-14">
        <h2 className="text-center text-sm font-bold uppercase tracking-[0.35em] text-white">
          Sponsorships
        </h2>
        <p className="mt-4 text-center">
          <a href="/sponsorships" className="text-sm font-semibold text-[#ff7ac6] hover:text-white">
            View sponsorship packages
          </a>
        </p>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {sponsors.map((sponsor) => (
            <li key={sponsor.name} className="grid aspect-[5/3] place-items-center bg-white p-3 sm:p-4">
              <img
                src={encodeURI(sponsor.src)}
                alt={sponsor.name}
                className="max-h-full max-w-full object-contain"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
