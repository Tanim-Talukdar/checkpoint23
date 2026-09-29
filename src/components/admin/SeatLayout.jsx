"use client";

export default function SeatLayout({ seats = [] }) {
  const groupedSeats = seats.reduce((groups, seat) => {
    if (!groups[seat.row]) {
      groups[seat.row] = [];
    }

    groups[seat.row].push(seat);

    return groups;
  }, {});

  return (
    <div className="w-full">
      {/* SCREEN */}

      <div className="mb-10 flex flex-col items-center">
        <div className="h-1 w-3/4 rounded-full bg-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.35)]" />

        <p className="mt-3 text-xs uppercase tracking-[0.3em] text-slate-600">
          Screen
        </p>
      </div>

      {/* SEATS */}

      <div className="space-y-4 overflow-x-auto pb-2">
        {Object.entries(groupedSeats).map(
          ([row, rowSeats]) => (
            <div
              key={row}
              className="flex min-w-[650px] items-center justify-center gap-2"
            >
              {/* Row label */}

              <span className="mr-3 w-5 text-xs font-medium text-slate-600">
                {row}
              </span>

              {rowSeats.map((seat) => (
                <div
                  key={seat.seatNumber}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-[10px] font-medium text-slate-400 transition hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400"
                  title={seat.seatNumber}
                >
                  {seat.number}
                </div>
              ))}

              <span className="ml-3 w-5 text-xs font-medium text-slate-600">
                {row}
              </span>
            </div>
          )
        )}
      </div>

      {/* LEGEND */}

      <div className="mt-10 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded border border-white/[0.08] bg-white/[0.03]" />

          <span className="text-xs text-slate-500">
            Seat
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-blue-500" />

          <span className="text-xs text-slate-500">
            Available
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-red-500" />

          <span className="text-xs text-slate-500">
            Booked
          </span>
        </div>
      </div>
    </div>
  );
}