
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/requireAdmin";
import Booking from "@/models/booking";
import Facility from "@/models/facility";
import Payment from "@/models/payment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIME_ZONE = "Asia/Dhaka";
const UPCOMING_LIMIT = 10;
const ACTIVE_STATUSES = ["pending", "confirmed"];

function jsonError(message, status = 500) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

function getDhakaDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );
}

function getDateRange(dateString, days = 1) {
  const start = new Date(`${dateString}T00:00:00.000Z`);
  const end = new Date(start);

  end.setUTCDate(end.getUTCDate() + days);

  return { $gte: start, $lt: end };
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function toMinutes(time) {
  const [hours, minutes] = String(time || "")
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
}

function toTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function getCurrentSlot(schedules, service, dayOfWeek, nowMinutes) {
  const duration = Number(
    service.durationMinutes
  );

  for (const schedule of schedules || []) {
    if (
      !schedule.active ||
      Number(schedule.dayOfWeek) !== dayOfWeek
    ) {
      continue;
    }

    const scheduleStart = toMinutes(schedule.startTime);
    const scheduleEnd = toMinutes(schedule.endTime);
    const slotDuration =
      duration > 0
        ? duration
        : Number(schedule.slotDurationMinutes);

    if (
      !Number.isFinite(slotDuration) ||
      slotDuration <= 0 ||
      nowMinutes < scheduleStart ||
      nowMinutes >= scheduleEnd
    ) {
      continue;
    }

    const slotStart =
      scheduleStart +
      Math.floor((nowMinutes - scheduleStart) / slotDuration) *
        slotDuration;

    const slotEnd = Math.min(
      slotStart + slotDuration,
      scheduleEnd
    );

    return {
      startTime: toTime(slotStart),
      endTime: toTime(slotEnd),
      startMinutes: slotStart,
      endMinutes: slotEnd,
    };
  }

  return null;
}

function isActiveBooking(booking, now) {
  if (booking.status === "confirmed") return true;

  return (
    booking.status === "pending" &&
    booking.expiresAt &&
    new Date(booking.expiresAt).getTime() > now.getTime()
  );
}

function overlapsSlot(booking, slot) {
  const start = toMinutes(booking.startTime);
  const end = toMinutes(booking.endTime);

  return (
    start < slot.endMinutes &&
    end > slot.startMinutes
  );
}

function serializeUpcomingBooking(booking) {
  return {
    id: String(booking._id),
    bookingReference: booking.bookingReference,
    customerName: booking.customerName,
    facilityId: String(booking.facilityId),
    facilityName: booking.facilityName,
    serviceId: String(booking.serviceId),
    serviceName: booking.serviceName,
    startTime: booking.startTime,
    endTime: booking.endTime,
    quantity: booking.quantity,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
  };
}

export async function GET() {
  try {
    const auth = await requireAdmin();

    if (!auth?.authenticated) {
      return jsonError("Unauthorized", 401);
    }

    await connectDB();

    const now = new Date();
    const parts = getDhakaDateParts(now);
    const today = `${parts.year}-${parts.month}-${parts.day}`;
    const nowMinutes =
      Number(parts.hour) * 60 + Number(parts.minute);

    const weekdays = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };

    const dayOfWeek = weekdays[parts.weekday];
    const todayRange = getDateRange(today);
    const nextSevenDaysRange = getDateRange(today, 7);
    const nowTime = toTime(nowMinutes);

    // Fetch only the fields required by the dashboard.
    const [facilities, todayBookings, revenueResult] =
      await Promise.all([
        Facility.find({ active: true })
          .select("name slug facilityType sharedResource services schedules")
          .lean(),

        Booking.find({
          bookingDate: todayRange,
          status: { $in: ACTIVE_STATUSES },
          $or: [
            { status: "confirmed" },
            {
              status: "pending",
              expiresAt: { $gt: now },
            },
          ],
        })
          .select(
            "_id bookingReference customerName facilityId facilityName serviceId serviceName bookingDate startTime endTime quantity status paymentStatus expiresAt"
          )
          .sort({ startTime: 1 })
          .lean(),

        Payment.aggregate([
          {
            $match: {
              status: "paid",
              paidAt: todayRange,
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

    const membershipIds = facilities.flatMap((facility) =>
      (facility.services || [])
        .filter((service) => service.type === "membership")
        .map((service) => service._id)
    );

    const nonMembershipFilter = membershipIds.length
      ? { serviceId: { $nin: membershipIds } }
      : {};

    const [todayBookingCount, upcomingBookingCount, activeMemberships] =
      await Promise.all([
        Booking.countDocuments({
          bookingDate: todayRange,
          status: { $in: ["pending", "confirmed", "completed"] },
          ...nonMembershipFilter,
          $or: [
            { status: { $in: ["confirmed", "completed"] } },
            {
              status: "pending",
              expiresAt: { $gt: now },
            },
          ],
        }),

        Booking.countDocuments({
          bookingDate: nextSevenDaysRange,
          status: { $in: ACTIVE_STATUSES },
          ...nonMembershipFilter,
          $or: [
            { status: "confirmed" },
            {
              status: "pending",
              expiresAt: { $gt: now },
            },
          ],
        }),

        membershipIds.length
          ? Booking.countDocuments({
              serviceId: { $in: membershipIds },
              status: "confirmed",
              paymentStatus: "paid",
            })
          : Promise.resolve(0),
      ]);

    // Expired pending reservations are never included in occupancy.
    const activeTodayBookings = todayBookings.filter((booking) =>
      isActiveBooking(booking, now)
    );

    const facilityOverview = facilities.map((facility) => {
      const services = (facility.services || [])
        .filter(
          (service) =>
            service.active &&
            service.type !== "membership"
        )
        .map((service) => {
          const capacity = Number(service.capacity);
          const slot = getCurrentSlot(
            facility.schedules,
            service,
            dayOfWeek,
            nowMinutes
          );

          if (
            !slot ||
            !Number.isFinite(capacity) ||
            capacity <= 0
          ) {
            return {
              id: String(service._id),
              name: service.name,
              capacity: capacity > 0 ? capacity : null,
              currentSlot: slot
                ? {
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                  }
                : null,
              booked: 0,
              occupancyPercent: 0,
              full: false,
            };
          }

          const bookings = activeTodayBookings.filter((booking) => {
            if (!overlapsSlot(booking, slot)) return false;

            if (facility.sharedResource) {
              return (
                String(booking.facilityId) === String(facility._id)
              );
            }

            return (
              String(booking.facilityId) === String(facility._id) &&
              String(booking.serviceId) === String(service._id)
            );
          });

          const booked = bookings.reduce(
            (total, booking) => total + Number(booking.quantity || 0),
            0
          );

          return {
            id: String(service._id),
            name: service.name,
            capacity,
            currentSlot: {
              startTime: slot.startTime,
              endTime: slot.endTime,
            },
            booked,
            occupancyPercent: Math.min(
              100,
              Math.round((booked / capacity) * 100)
            ),
            full: booked >= capacity,
          };
        });

      // Use the first service with an active slot as the facility summary.
      const current = services.find((service) => service.currentSlot);

      return {
        id: String(facility._id),
        name: facility.name,
        slug: facility.slug,
        facilityType: facility.facilityType,
        currentSlot: current?.currentSlot || null,
        booked: current?.booked ?? 0,
        capacity: current?.capacity ?? null,
        occupancyPercent: current?.occupancyPercent ?? 0,
        full: current?.full ?? false,
        services,
      };
    });

    const upcomingBookings = activeTodayBookings
      .filter((booking) => booking.startTime > nowTime)
      .filter(
        (booking) =>
          !membershipIds.some(
            (id) => String(id) === String(booking.serviceId)
          )
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .slice(0, UPCOMING_LIMIT)
      .map(serializeUpcomingBooking);

    const revenue = revenueResult[0] || {
      total: 0,
      count: 0,
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          date: today,
          currentTime: nowTime,
          stats: {
            todayBookings: todayBookingCount,
            todayRevenue: revenue.total,
            todayPayments: revenue.count,
            upcomingBookings: upcomingBookingCount,
            activeMemberships,
            averageOccupancy: facilityOverview.length
              ? Math.round(
                  facilityOverview.reduce(
                    (total, facility) =>
                      total + facility.occupancyPercent,
                    0
                  ) / facilityOverview.length
                )
              : 0,
          },
          facilities: facilityOverview,
          todaySchedule: upcomingBookings,
        },
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Dashboard API error:", error);
    return jsonError("Unable to load dashboard data.");
  }
}
