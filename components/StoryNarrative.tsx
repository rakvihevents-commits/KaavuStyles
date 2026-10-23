import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function StoryNarrative() {
  return (
    <section aria-labelledby="story-heading" className="px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Photo Column - Brought closer to content */}
        <div data-reveal="left" className="md:col-span-5 relative group flex items-center justify-center md:justify-end px-2 pt-2 md:py-4">
          <div className="relative w-48 sm:w-56 lg:w-72 aspect-[3/4] rounded-t-[999px] border-2 border-gold p-2 bg-ivory shadow-luxury flex-shrink-0">
            <div className="relative w-full h-full rounded-t-[990px] overflow-hidden">
              <Image
                src="/foundations-home.webp"
                alt="Kaavu Styless atelier and drapery"
                fill
                sizes="(min-width: 1024px) 288px, (min-width: 640px) 224px, 192px"
                className="object-cover transition-transform duration-1000 group-hover:scale-[1.03]"
              />
            </div>
          </div>
        </div>

        {/* Content Column - Positioned close to photo */}
        <div data-reveal="right" className="md:col-span-7 flex flex-col justify-center px-2 sm:px-4 md:pl-2 lg:pl-4 py-2 sm:py-4">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <span className="w-8 h-px bg-gold" aria-hidden="true" />
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-gold font-medium">Our Story Narrative</p>
          </div>
          <h2 id="story-heading" className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-[1.1] tracking-tight text-ink text-balance">
            Made for every <em className="font-normal text-crimson">version of you.</em>
          </h2>
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm leading-relaxed text-ink-muted max-w-lg">
            Kaavu Styless began with a simple idea: getting dressed should feel like a quiet ritual, not a decision. Each piece is chosen for its fall, its finish, and the way it makes you feel.
          </p>
          <blockquote className="border-l border-gold/60 pl-4 mt-4 sm:mt-5 max-w-lg">
            <p className="font-serif text-lg sm:text-xl leading-relaxed text-crimson italic">
              &ldquo;We all have those outfits that make us feel a little more confident, a little more comfortable, and a little more ourselves. That’s exactly what we want Kaavu Styless to be about.&rdquo;
            </p>
            <footer className="mt-2 text-[9px] uppercase tracking-[0.22em] text-gold">The Kaavu ethos</footer>
          </blockquote>
          <Link href="/story" className="group mt-6 sm:mt-7 inline-flex self-start items-center justify-center gap-4 bg-crimson text-ivory px-6 py-3 text-[11px] uppercase tracking-[0.16em] transition-colors hover:bg-crimson-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crimson shadow-sm">
            Read full story <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
