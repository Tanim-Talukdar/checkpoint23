"use client";

export default function LocationMap() {
  return (
    <div className="relative h-full min-h-[360px] w-full overflow-hidden">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3649.9450131572203!2d90.42470297659835!3d23.820554278622655!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c700213ef523%3A0xcfc6ad954899221c!2sThe%20Checkpoint!5e0!3m2!1sen!2sbd!4v1790763526761!5m2!1sen!2sbd"
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