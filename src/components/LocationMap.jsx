"use client";

export default function LocationMap() {
  return (
    <div className="relative h-full min-h-[360px] w-full overflow-hidden">
      <iframe
        src="https://www.google.com/maps?q=23.820677610325287,90.42723974608134&z=16&output=embed"
        className="h-full w-full border-0"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        title="The Checkpoint Location"
      />

      {/* Overlay */}
      <div className="pointer-events-none absolute inset-0 z-[400] bg-blue-500/[0.02]" />
      <div className="pointer-events-none absolute inset-0 z-[401] bg-gradient-to-t from-[#030712]/75 via-transparent to-transparent" />

      {/* Label */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-[402] flex items-center gap-2 rounded-lg border border-white/10 bg-[#030712]/80 px-3 py-2 backdrop-blur-md">
        <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
        <span className="text-[9px] font-bold tracking-[0.18em] text-white/70">
          THE CHECKPOINT
        </span>
      </div>
    </div>
  );
}