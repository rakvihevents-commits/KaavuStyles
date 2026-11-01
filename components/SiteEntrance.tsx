"use client";

import siteIcon from "@/public/icon.webp";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function SiteEntrance({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  const [finished, setFinished] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const content = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAdmin) {
      setFinished(true);
      return;
    }
    // The page stays mounted and fetches data throughout this one-time entrance.
    const fade = setTimeout(() => setLeaving(true), 3700);
    const complete = setTimeout(() => setFinished(true), 4000);
    return () => { clearTimeout(fade); clearTimeout(complete); };
  }, [isAdmin]);

  useEffect(() => {
    if (finished || isAdmin) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (content.current) content.current.inert = true;
    return () => {
      document.body.style.overflow = previous;
      if (content.current) content.current.inert = false;
    };
  }, [finished, isAdmin]);

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {!finished && (
        <div className={`site-entrance ${leaving ? "site-entrance-leaving" : ""}`} role="status" aria-live="polite" aria-label="Loading Kaavu Styles">
          <div className="site-entrance-emblem">
            <Image src={siteIcon.src} alt="" width={88} height={88} priority className="rounded-full object-cover" />
          </div>
          <p className="font-serif text-3xl sm:text-4xl tracking-[0.16em] text-ivory uppercase mt-7">Kaavu Styles</p>
          <p className="text-gold text-[10px] sm:text-xs tracking-[0.28em] uppercase mt-3">For Every Version Of You</p>
          <div className="site-entrance-track" aria-hidden="true"><span /></div>
          <span className="sr-only">Loading your shopping experience…</span>
        </div>
      )}
      <div ref={content} className="flex w-full min-w-0 max-w-full min-h-screen flex-col" aria-hidden={!finished || undefined}>{children}</div>
    </>
  );
}
