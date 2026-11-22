"use client";

import { JoinButton } from "@/components/Actions";
import { solidButtonClass } from "@/lib/styles";

export function SignupBand() {
  return (
    <section className="bg-black px-5 py-16 text-center sm:px-8">
      <div className="mx-auto max-w-xl">
        <h2 className="font-display text-5xl leading-none text-white sm:text-6xl">
          Be the first to know
        </h2>
        <p className="mt-4 text-white/70">Get MCC Turn It Up news first.</p>
        <JoinButton className={`${solidButtonClass} mt-6 px-8`}>
          Sign up for updates
        </JoinButton>
      </div>
    </section>
  );
}
