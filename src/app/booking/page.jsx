
"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  FiActivity,
  FiArrowLeft,
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiFilm,
  FiGrid,
  FiMinus,
  FiPlus,
  FiShoppingBag,
  FiX,
} from "react-icons/fi";

const FACILITIES = [
  {
    id: "fitness",
    title: "Fitness",
    label: "GYM & POOL",
    description: "Train, swim, or combine both.",
    icon: FiActivity,
  },
  {
    id: "steam",
    title: "Steam Bath",
    label: "PRIVATE SESSION",
    description: "A private 30-minute steam session.",
    icon: FiActivity,
  },
  {
    id: "playground",
    title: "Playground",
    label: "SPORTS",
    description: "Book the playground for your game.",
    icon: FiGrid,
  },
  {
    id: "movie",
    title: "Private Cinema",
    label: "PRIVATE VIEWING",
    description: "Choose a movie for your private viewing.",
    icon: FiFilm,
  },
];

const SERVICES = {
  fitness: [
    {
      id: "gym-day",
      title: "Gym Day Pass",
      description: "One-day gym access.",
      price: 500,
      unit: "person",
      duration: 60,
      capacity: 15,
    },
    {
      id: "gym-monthly",
      title: "Gym Monthly",
      description: "Monthly gym membership.",
      price: 4000,
      unit: "month",
      duration: "membership",
      membership: true,
    },
    {
      id: "pool-day",
      title: "Swimming Pool Day Pass",
      description: "One-day swimming pool access.",
      price: 500,
      unit: "person",
      duration: 60,
      capacity: 15,
    },
    {
      id: "pool-monthly",
      title: "Pool Monthly",
      description: "Monthly swimming pool membership.",
      price: 4000,
      unit: "month",
      duration: "membership",
      membership: true,
    },
    {
      id: "gym-pool-day",
      title: "Gym + Pool Day Pass",
      description: "Access both gym and swimming pool.",
      price: 700,
      unit: "person",
      duration: 60,
      capacity: 15,
    },
    {
      id: "gym-pool-monthly",
      title: "Gym + Pool Monthly",
      description: "Combined monthly membership.",
      price: 6000,
      unit: "month",
      duration: "membership",
      membership: true,
    },
  ],

  steam: [
    {
      id: "steam-session",
      title: "Private Steam Session",
      description: "Private 30-minute steam bath.",
      price: 300,
      unit: "person",
      duration: 30,
      capacity: 6,
      exclusive: true,
    },
  ],

  playground: [
    {
      id: "futsal",
      title: "Futsal",
      description: "Full playground booking.",
      price: 1500,
      unit: "booking",
      duration: 90,
    },
    {
      id: "basketball",
      title: "Basketball",
      description: "Half-court basketball booking.",
      price: 900,
      unit: "booking",
      duration: 60,
    },
    {
      id: "badminton",
      title: "Badminton",
      description: "Playground badminton booking.",
      price: 800,
      unit: "booking",
      duration: 60,
    },
    {
      id: "pickleball",
      title: "Pickleball",
      description: "Playground pickleball booking.",
      price: 800,
      unit: "booking",
      duration: 60,
    },
  ],

  movie: [
    {
      id: "movie-ticket",
      title: "Private Movie Viewing",
      description:
        "Private cinema viewing with your chosen movie.",
      price: 250,
      unit: "ticket",
      duration: 120,
      capacity: 50,
      minimum: 10,
      movie: true,
    },
  ],
};

const MOVIES = [
  "Choose a movie",
  "Movie 01",
  "Movie 02",
  "Movie 03",
  "Movie 04",
];

const DEMO_AVAILABILITY = {
  default: {
    "11:00 AM": { status: "available", remaining: 9 },
    "12:00 PM": { status: "available", remaining: 15 },
    "1:00 PM": { status: "full", remaining: 0 },
    "2:00 PM": { status: "available", remaining: 6 },
    "3:00 PM": { status: "available", remaining: 12 },
    "4:00 PM": { status: "full", remaining: 0 },
    "5:00 PM": { status: "available", remaining: 4 },
    "6:00 PM": { status: "available", remaining: 10 },
    "7:00 PM": { status: "available", remaining: 15 },
    "8:00 PM": { status: "full", remaining: 0 },
    "9:00 PM": { status: "available", remaining: 7 },
    "10:00 PM": { status: "available", remaining: 13 },
  },

  steam: {
    "11:00 AM": { status: "available", remaining: 6 },
    "11:30 AM": { status: "full", remaining: 0 },
    "12:00 PM": { status: "available", remaining: 4 },
    "12:30 PM": { status: "available", remaining: 6 },
    "1:00 PM": { status: "full", remaining: 0 },
    "1:30 PM": { status: "available", remaining: 2 },
    "2:00 PM": { status: "available", remaining: 6 },
    "2:30 PM": { status: "full", remaining: 0 },
    "3:00 PM": { status: "available", remaining: 5 },
    "3:30 PM": { status: "available", remaining: 6 },
    "4:00 PM": { status: "full", remaining: 0 },
    "4:30 PM": { status: "available", remaining: 6 },
    "5:00 PM": { status: "available", remaining: 3 },
    "5:30 PM": { status: "full", remaining: 0 },
    "6:00 PM": { status: "available", remaining: 6 },
    "6:30 PM": { status: "available", remaining: 4 },
    "7:00 PM": { status: "full", remaining: 0 },
    "7:30 PM": { status: "available", remaining: 6 },
    "8:00 PM": { status: "available", remaining: 6 },
    "8:30 PM": { status: "full", remaining: 0 },
    "9:00 PM": { status: "available", remaining: 5 },
    "9:30 PM": { status: "available", remaining: 6 },
    "10:00 PM": { status: "full", remaining: 0 },
    "10:30 PM": { status: "available", remaining: 6 },
  },

  futsal: {
    "11:00 AM": { status: "available" },
    "12:30 PM": { status: "available" },
    "2:00 PM": { status: "full" },
    "3:30 PM": { status: "available" },
    "5:00 PM": { status: "available" },
    "6:30 PM": { status: "full" },
    "8:00 PM": { status: "available" },
    "9:30 PM": { status: "available" },
  },

  standard: {
    "11:00 AM": { status: "available" },
    "12:00 PM": { status: "available" },
    "1:00 PM": { status: "full" },
    "2:00 PM": { status: "available" },
    "3:00 PM": { status: "available" },
    "4:00 PM": { status: "full" },
    "5:00 PM": { status: "available" },
    "6:00 PM": { status: "available" },
    "7:00 PM": { status: "full" },
    "8:00 PM": { status: "available" },
    "9:00 PM": { status: "available" },
    "10:00 PM": { status: "full" },
  },
};

const formatPrice = (price) =>
  `৳${price.toLocaleString("en-BD")}`;

const getService = (id) =>
  Object.values(SERVICES)
    .flat()
    .find((service) => service.id === id);

function getTimeSlots(service) {
  if (!service || service.membership) return [];

  if (service.id === "steam-session") {
    return Object.keys(DEMO_AVAILABILITY.steam);
  }

  if (service.id === "futsal") {
    return Object.keys(DEMO_AVAILABILITY.futsal);
  }

  if (service.duration === 120) {
    return [
      "11:00 AM",
      "1:00 PM",
      "3:00 PM",
      "5:00 PM",
      "7:00 PM",
      "9:00 PM",
    ];
  }

  return Object.keys(DEMO_AVAILABILITY.standard);
}

function getAvailability(service, time) {
  if (service?.id === "steam-session") {
    return DEMO_AVAILABILITY.steam[time];
  }

  if (service?.id === "futsal") {
    return DEMO_AVAILABILITY.futsal[time];
  }

  if (
    service?.duration === 120 &&
    DEMO_AVAILABILITY.standard[time]
  ) {
    return DEMO_AVAILABILITY.standard[time];
  }

  return (
    DEMO_AVAILABILITY.default[time] ||
    DEMO_AVAILABILITY.standard[time]
  );
}

/* -------------------------------------------------------------------------- */
/* DATE HELPERS                                                               */
/* -------------------------------------------------------------------------- */

function formatDateValue(year, month, day) {
  return [
    year,
    String(month + 1).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

function parseDateValue(value) {
  if (!value) return null;

  const [year, month, day] = value
    .split("-")
    .map(Number);

  if (!year || !month || !day) return null;

  return {
    year,
    month: month - 1,
    day,
  };
}

function isSameDate(value, year, month, day) {
  const parsed = parseDateValue(value);

  return (
    parsed &&
    parsed.year === year &&
    parsed.month === month &&
    parsed.day === day
  );
}

function isToday(year, month, day) {
  const today = new Date();

  return (
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day
  );
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const daysInPreviousMonth = new Date(
    year,
    month,
    0
  ).getDate();

  const days = [];

  /*
    Previous month's trailing days.
    Sunday = 0, Monday = 1, etc.
  */
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      day: daysInPreviousMonth - i,
      monthOffset: -1,
    });
  }

  /*
    Current month.
  */
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      day,
      monthOffset: 0,
    });
  }

  /*
    Next month's leading days.
  */
  let nextDay = 1;

  while (days.length < 42) {
    days.push({
      day: nextDay,
      monthOffset: 1,
    });

    nextDay++;
  }

  return days;
}

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

export default function BookingPage() {
  const today = new Date();

  const [facility, setFacility] = useState("fitness");
  const [serviceId, setServiceId] = useState("gym-day");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [movie, setMovie] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [calendarMonth, setCalendarMonth] = useState(
    today.getMonth()
  );

  const [calendarYear, setCalendarYear] = useState(
    today.getFullYear()
  );

  const serviceRef = useRef(null);
  const dateRef = useRef(null);
  const timeRef = useRef(null);
  const quantityRef = useRef(null);

  const services = SERVICES[facility] || [];
  const selectedService = getService(serviceId);

  const isMembership = selectedService?.membership;
  const isMovie = selectedService?.movie;

  const timeSlots = getTimeSlots(selectedService);

  const quantityTitle =
    selectedService?.unit === "person"
      ? "Number of People"
      : selectedService?.unit === "ticket"
        ? "Number of Tickets"
        : selectedService?.unit === "booking"
          ? "Number of Bookings"
          : "Number of Memberships";

  const quantityDescription =
    selectedService?.unit === "person"
      ? selectedService.capacity
        ? `Choose how many people will use this service. Up to ${selectedService.capacity} people per slot.`
        : "Choose how many people will use this service."
      : selectedService?.unit === "ticket"
        ? "Choose how many tickets you need."
        : selectedService?.unit === "booking"
          ? "Choose how many bookings you want to make."
          : "Choose how many memberships you want.";

  const itemTotal = selectedService
    ? selectedService.price * quantity
    : 0;

  const canAdd =
    selectedService &&
    date &&
    (isMembership || slot) &&
    (!isMovie || movie);

  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + item.total,
        0
      ),
    [cart]
  );

  const cartCount = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + item.quantity,
        0
      ),
    [cart]
  );

  const calendarDays = useMemo(
    () =>
      getCalendarDays(
        calendarYear,
        calendarMonth
      ),
    [calendarYear, calendarMonth]
  );

  const calendarMonthName = new Date(
    calendarYear,
    calendarMonth,
    1
  ).toLocaleString("en-US", {
    month: "long",
  });

  function scrollToSection(ref) {
    setTimeout(() => {
      ref.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  function handleFacilityChange(id) {
    const firstService = SERVICES[id]?.[0];

    setFacility(id);
    setServiceId(firstService?.id || "");
    setQuantity(firstService?.minimum || 1);
    setSlot("");
    setMovie("");

    scrollToSection(serviceRef);
  }

  function handleServiceChange(id) {
    const service = getService(id);

    setServiceId(id);
    setQuantity(service?.minimum || 1);
    setSlot("");
    setMovie("");

    scrollToSection(dateRef);
  }

  function handleDateChange(value) {
    setDate(value);
    setSlot("");

    if (selectedService?.membership) {
      scrollToSection(quantityRef);
    } else {
      scrollToSection(timeRef);
    }
  }

  function handleCalendarDateClick(
    day,
    monthOffset
  ) {
    const selectedMonth = new Date(
      calendarYear,
      calendarMonth + monthOffset,
      1
    );

    const selectedYear =
      selectedMonth.getFullYear();

    const selectedMonthIndex =
      selectedMonth.getMonth();

    const value = formatDateValue(
      selectedYear,
      selectedMonthIndex,
      day
    );

    setDate(value);
    setSlot("");

    if (monthOffset !== 0) {
      setCalendarYear(selectedYear);
      setCalendarMonth(selectedMonthIndex);
    }

    if (selectedService?.membership) {
      scrollToSection(quantityRef);
    } else {
      setTimeout(() => {
        timeRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    }
  }

  function goToPreviousMonth() {
    setCalendarMonth((currentMonth) => {
      if (currentMonth === 0) {
        setCalendarYear((currentYear) => currentYear - 1);
        return 11;
      }

      return currentMonth - 1;
    });
  }

  function goToNextMonth() {
    setCalendarMonth((currentMonth) => {
      if (currentMonth === 11) {
        setCalendarYear((currentYear) => currentYear + 1);
        return 0;
      }

      return currentMonth + 1;
    });
  }

  function goToCurrentMonth() {
    const current = new Date();

    setCalendarYear(current.getFullYear());
    setCalendarMonth(current.getMonth());
  }

  function handleSlotChange(time) {
    setSlot(time);
    scrollToSection(quantityRef);
  }

  function increaseQuantity() {
    if (!selectedService) return;

    const max =
      selectedService.capacity || Infinity;

    setQuantity((current) =>
      Math.min(current + 1, max)
    );
  }

  function decreaseQuantity() {
    if (!selectedService) return;

    const minimum =
      selectedService.minimum || 1;

    setQuantity((current) =>
      Math.max(current - 1, minimum)
    );
  }

  function addToBooking() {
    if (!selectedService || !canAdd) return;

    const newItem = {
      id: `${selectedService.id}-${date}-${
        slot || "membership"
      }-${movie || "none"}-${Date.now()}`,
      serviceId: selectedService.id,
      title: selectedService.title,
      price: selectedService.price,
      quantity,
      date,
      slot: isMembership ? null : slot,
      movie: isMovie ? movie : null,
      total:
        selectedService.price * quantity,
    };

    setCart((current) => [
      ...current,
      newItem,
    ]);

    setCartOpen(true);
  }

  function removeFromCart(id) {
    setCart((current) =>
      current.filter(
        (item) => item.id !== id
      )
    );
  }

  return (
    <main className="min-h-screen bg-[#030712] text-white">
      {/* HEADER */}
      <section className="px-4 pb-10 pt-28 sm:px-6 sm:pt-32">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
          >
            <FiArrowLeft size={16} />
            Back to Checkpoint
          </Link>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">
                BOOK YOUR EXPERIENCE
              </p>

              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Choose how you want
                <span className="block text-white/45">
                  to spend your time.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-6 text-white/50 sm:text-base">
                Select your facility, check live-style availability, and add
                everything you want to one booking.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-[#07101c] px-4 py-3">
              <FiClock className="text-blue-400" />

              <div>
                <p className="text-xs uppercase tracking-wider text-white/35">
                  Opening hours
                </p>

                <p className="mt-1 text-sm font-medium">
                  11 AM – 11 PM
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {/* FACILITY */}
            <div className="scroll-mt-28 rounded-3xl border border-white/10 bg-[#07101c] p-5 sm:scroll-mt-32 sm:p-7">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                  01
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Select a facility
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {FACILITIES.map((item) => {
                  const Icon = item.icon;
                  const active =
                    facility === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        handleFacilityChange(
                          item.id
                        )
                      }
                      className={`group rounded-2xl border p-5 text-left transition ${
                        active
                          ? "border-blue-500/60 bg-blue-500/10"
                          : "border-white/10 bg-[#030712] hover:border-white/20 hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                            active
                              ? "bg-blue-500 text-white"
                              : "bg-white/[0.05] text-white/50"
                          }`}
                        >
                          <Icon size={20} />
                        </div>

                        {active && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                            <FiCheck size={14} />
                          </div>
                        )}
                      </div>

                      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                        {item.label}
                      </p>

                      <h3 className="mt-2 text-lg font-semibold">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-sm leading-5 text-white/45">
                        {item.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SERVICE */}
            <div
              ref={serviceRef}
              className="scroll-mt-28 rounded-3xl border border-white/10 bg-[#07101c] p-5 sm:scroll-mt-32 sm:p-7"
            >
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                  02
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Choose your service
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {services.map((service) => {
                  const active =
                    serviceId === service.id;

                  return (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      active={active}
                      onClick={() =>
                        handleServiceChange(
                          service.id
                        )
                      }
                    />
                  );
                })}
              </div>
            </div>

            {/* DATE + TIME */}
            <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
              {/* CALENDAR */}
              <div
                ref={dateRef}
                className="scroll-mt-28 rounded-3xl border border-white/10 bg-[#07101c] p-5 sm:scroll-mt-32 sm:p-7"
              >
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                    03
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    Choose your date
                  </h2>

                  <p className="mt-2 text-sm text-white/40">
                    Select your preferred date.
                  </p>
                </div>

                {/* CALENDAR */}
                <div className="rounded-2xl border border-white/10 bg-[#030712] p-4 sm:p-5">
                  {/* CALENDAR HEADER */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={goToPreviousMonth}
                      aria-label="Previous month"
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/50 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                    >
                      <FiChevronLeft size={18} />
                    </button>

                    <div className="text-center">
                      <p className="text-base font-semibold">
                        {calendarMonthName}{" "}
                        {calendarYear}
                      </p>

                      <button
                        type="button"
                        onClick={goToCurrentMonth}
                        className="mt-1 text-[10px] font-medium uppercase tracking-wider text-blue-400 transition hover:text-blue-300"
                      >
                        Today
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={goToNextMonth}
                      aria-label="Next month"
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/50 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                    >
                      <FiChevronRight size={18} />
                    </button>
                  </div>

                  {/* WEEKDAYS */}
                  <div className="mt-6 grid grid-cols-7">
                    {[
                      "Sun",
                      "Mon",
                      "Tue",
                      "Wed",
                      "Thu",
                      "Fri",
                      "Sat",
                    ].map((day) => (
                      <div
                        key={day}
                        className="pb-3 text-center text-[10px] font-semibold uppercase tracking-wider text-white/25"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* DAYS */}
                  <div className="grid grid-cols-7 gap-y-1">
                    {calendarDays.map(
                      (
                        calendarDay,
                        index
                      ) => {
                        const targetDate =
                          new Date(
                            calendarYear,
                            calendarMonth +
                              calendarDay.monthOffset,
                            calendarDay.day
                          );

                        const targetYear =
                          targetDate.getFullYear();

                        const targetMonth =
                          targetDate.getMonth();

                        const selected =
                          isSameDate(
                            date,
                            targetYear,
                            targetMonth,
                            calendarDay.day
                          );

                        const todayDate =
                          isToday(
                            targetYear,
                            targetMonth,
                            calendarDay.day
                          );

                        const isPast =
                          targetDate <
                            new Date(
                              today.getFullYear(),
                              today.getMonth(),
                              today.getDate()
                            );

                        const outsideMonth =
                          calendarDay.monthOffset !==
                          0;

                        return (
                          <button
                            key={`${calendarYear}-${calendarMonth}-${index}`}
                            type="button"
                            disabled={isPast}
                            onClick={() =>
                              handleCalendarDateClick(
                                calendarDay.day,
                                calendarDay.monthOffset
                              )
                            }
                            className={`relative mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-sm transition sm:h-11 sm:w-11 ${
                              selected
                                ? "bg-blue-600 font-semibold text-white"
                                : todayDate
                                  ? "border border-blue-500/50 text-blue-300"
                                  : outsideMonth
                                    ? "text-white/15"
                                    : isPast
                                      ? "cursor-not-allowed text-white/15"
                                      : "text-white/65 hover:bg-white/[0.06] hover:text-white"
                            }`}
                          >
                            {calendarDay.day}

                            {todayDate &&
                              !selected && (
                                <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-blue-400" />
                              )}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* SELECTED DATE */}
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#030712] px-4 py-3">
                  <FiCalendar
                    size={17}
                    className="shrink-0 text-blue-400"
                  />

                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-white/30">
                      Selected date
                    </p>

                    <p className="mt-1 truncate text-sm font-medium">
                      {date
                        ? new Date(
                            `${date}T00:00:00`
                          ).toLocaleDateString(
                            "en-US",
                            {
                              weekday:
                                "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "Choose a date from the calendar"}
                    </p>
                  </div>
                </div>
              </div>

              {/* TIME */}
              {!isMembership && (
                <div
                  ref={timeRef}
                  className="scroll-mt-28 rounded-3xl border border-white/10 bg-[#07101c] p-5 sm:scroll-mt-32 sm:p-7"
                >
                  <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                      04
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold">
                      Choose your time
                    </h2>

                    <p className="mt-2 text-sm text-white/40">
                      Select an available time slot.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-white/40">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        Available
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-white/20" />
                        Fully booked
                      </span>
                    </div>
                  </div>

                  {!date ? (
                    <div className="rounded-2xl border border-dashed border-white/10 p-7 text-center">
                      <FiCalendar
                        size={22}
                        className="mx-auto text-white/20"
                      />

                      <p className="mt-3 text-sm text-white/45">
                        Select a date first
                      </p>

                      <p className="mt-1 text-xs text-white/25">
                        Available time slots will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {timeSlots.map((time) => {
                        const availability =
                          getAvailability(
                            selectedService,
                            time
                          );

                        const full =
                          availability?.status ===
                          "full";

                        const selected =
                          slot === time;

                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={full}
                            onClick={() =>
                              handleSlotChange(
                                time
                              )
                            }
                            className={`rounded-2xl border p-4 text-left transition ${
                              full
                                ? "cursor-not-allowed border-white/5 bg-white/[0.02] opacity-45"
                                : selected
                                  ? "border-blue-500/70 bg-blue-500/10"
                                  : "border-white/10 bg-[#030712] hover:border-blue-500/40 hover:bg-blue-500/[0.04]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-semibold">
                                {time}
                              </span>

                              {selected && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                                  <FiCheck size={12} />
                                </span>
                              )}
                            </div>

                            <div className="mt-3">
                              {full ? (
                                <span className="text-xs font-medium text-white/30">
                                  Fully booked
                                </span>
                              ) : selectedService?.capacity ? (
                                <span className="text-xs text-blue-300/70">
                                  {
                                    availability?.remaining
                                  }{" "}
                                  spots left
                                </span>
                              ) : (
                                <span className="text-xs text-blue-300/70">
                                  Available
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedService?.exclusive && (
                    <div className="mt-5 rounded-2xl border border-blue-500/20 bg-blue-500/[0.05] p-4">
                      <p className="text-sm font-medium">
                        Private steam session
                      </p>

                      <p className="mt-1 text-xs leading-5 text-white/40">
                        Steam sessions are 30 minutes. When a customer books
                        a slot, the entire slot becomes unavailable to others.
                      </p>
                    </div>
                  )}

                  {selectedService?.id ===
                    "futsal" && (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-sm font-medium">
                        90-minute booking
                      </p>

                      <p className="mt-1 text-xs leading-5 text-white/40">
                        Each Futsal booking occupies the playground for 90
                        minutes. Overlapping playground activities cannot be
                        booked.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* MEMBERSHIP NOTICE */}
            {isMembership && (
              <div className="scroll-mt-28 rounded-3xl border border-blue-500/20 bg-blue-500/[0.05] p-5 sm:scroll-mt-32 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                  04
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Membership access
                </h2>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-[#030712] p-4">
                    <p className="text-sm font-medium">
                      11 AM – 11 PM
                    </p>

                    <p className="mt-1 text-xs text-white/35">
                      Come anytime during opening hours.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#030712] p-4">
                    <p className="text-sm font-medium">
                      One entry
                    </p>

                    <p className="mt-1 text-xs text-white/35">
                      Membership allows one entry.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#030712] p-4">
                    <p className="text-sm font-medium">
                      No re-entry
                    </p>

                    <p className="mt-1 text-xs text-white/35">
                      Leaving the facility ends that day's entry.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* MOVIE */}
            {isMovie && (
              <div className="scroll-mt-28 rounded-3xl border border-white/10 bg-[#07101c] p-5 sm:scroll-mt-32 sm:p-7">
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                    05
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    Choose your movie
                  </h2>
                </div>

                <select
                  value={movie}
                  onChange={(event) =>
                    setMovie(event.target.value)
                  }
                  className="h-14 w-full rounded-2xl border border-white/10 bg-[#030712] px-4 text-sm text-white outline-none transition focus:border-blue-500/60"
                >
                  {MOVIES.map((item) => (
                    <option
                      key={item}
                      value={
                        item === "Choose a movie"
                          ? ""
                          : item
                      }
                    >
                      {item}
                    </option>
                  ))}
                </select>

                <p className="mt-3 text-xs text-white/35">
                  Minimum 10 tickets. Maximum 50 seats. Each ticket is
                  ৳250.
                </p>
              </div>
            )}

            {/* QUANTITY */}
            <div
              ref={quantityRef}
              className="scroll-mt-28 rounded-3xl border border-white/10 bg-[#07101c] p-5 sm:scroll-mt-32 sm:p-7"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                    {isMovie
                      ? "06"
                      : isMembership
                        ? "05"
                        : "05"}
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    {quantityTitle}
                  </h2>

                  <p className="mt-2 text-sm text-white/40">
                    {isMovie
                      ? "Choose between 10 and 50 tickets."
                      : quantityDescription}
                  </p>
                </div>

                <div className="flex items-center rounded-2xl border border-white/10 bg-[#030712] p-1">
                  <button
                    type="button"
                    onClick={decreaseQuantity}
                    disabled={
                      quantity <=
                      (selectedService?.minimum ||
                        1)
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-white/50 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiMinus size={16} />
                  </button>

                  <span className="w-12 text-center text-sm font-semibold">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={increaseQuantity}
                    disabled={
                      quantity >=
                      (selectedService?.capacity ||
                        Infinity)
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-white/50 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <FiPlus size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* CURRENT SELECTION */}
            <div className="rounded-3xl border border-blue-500/20 bg-blue-500/[0.05] p-5 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/35">
                    Current selection
                  </p>

                  <h3 className="mt-2 text-lg font-semibold">
                    {selectedService?.title}
                  </h3>

                  <p className="mt-1 text-sm text-white/40">
                    {quantity} ×{" "}
                    {formatPrice(
                      selectedService?.price || 0
                    )}
                  </p>

                  {date && (
                    <p className="mt-2 text-xs text-white/30">
                      {new Date(
                        `${date}T00:00:00`
                      ).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}

                      {slot
                        ? ` • ${slot}`
                        : ""}
                    </p>
                  )}
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs uppercase tracking-wider text-white/35">
                    Subtotal
                  </p>

                  <p className="mt-1 text-2xl font-semibold">
                    {formatPrice(itemTotal)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={addToBooking}
                disabled={!canAdd}
                className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
              >
                <FiPlus size={17} />
                Add to booking
              </button>

              {!canAdd && (
                <p className="mt-3 text-center text-xs text-white/30">
                  Select the required date
                  {!isMembership
                    ? " and an available time"
                    : ""}
                  {isMovie ? " and movie" : ""} to continue.
                </p>
              )}
            </div>
          </div>

          {/* DESKTOP BOOKING SUMMARY */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-3xl border border-white/10 bg-[#07101c] p-5">
              <CartContent
                cart={cart}
                total={cartTotal}
                count={cartCount}
                onRemove={removeFromCart}
              />
            </div>
          </aside>
        </div>
      </section>

      {/* MOBILE CART BUTTON */}
      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="fixed bottom-5 left-4 right-4 z-40 flex h-14 items-center justify-between rounded-2xl border border-blue-400/20 bg-[#07101c]/95 px-5 shadow-2xl backdrop-blur-xl lg:hidden"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
            <FiShoppingBag size={17} />
          </span>

          <span className="text-sm font-medium">
            {cartCount}{" "}
            {cartCount === 1
              ? "item"
              : "items"}
          </span>
        </span>

        <span className="flex items-center gap-2 text-sm font-semibold">
          {formatPrice(cartTotal)}
          <FiArrowRight size={16} />
        </span>
      </button>

      {/* MOBILE CART */}
      {cartOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close cart"
            onClick={() =>
              setCartOpen(false)
            }
            className="absolute inset-0 bg-black/70"
          />

          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border border-white/10 bg-[#07101c] p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-blue-400">
                  Your booking
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Booking summary
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setCartOpen(false)
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-white/60"
              >
                <FiX size={18} />
              </button>
            </div>

            <CartContent
              cart={cart}
              total={cartTotal}
              count={cartCount}
              onRemove={removeFromCart}
            />
          </div>
        </div>
      )}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* SERVICE CARD                                                               */
/* -------------------------------------------------------------------------- */

function ServiceCard({
  service,
  active,
  onClick,
}) {
  const unitLabel =
    service.unit === "person"
      ? "per person"
      : service.unit === "ticket"
        ? "per ticket"
        : service.unit === "month"
          ? "per month"
          : "per booking";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex min-h-[150px] w-full flex-col justify-between rounded-2xl border p-5 text-left transition ${
        active
          ? "border-blue-500/60 bg-blue-500/[0.08]"
          : "border-white/10 bg-[#030712] hover:border-white/20 hover:bg-white/[0.03]"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="pr-2 font-semibold leading-5">
            {service.title}
          </h3>

          {active && (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500">
              <FiCheck size={13} />
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {service.membership && (
            <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-blue-300">
              Membership
            </span>
          )}

          {service.exclusive && (
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-white/50">
              Private
            </span>
          )}
        </div>

        <p className="mt-3 text-xs leading-5 text-white/35">
          {service.description}
        </p>
      </div>

      <div className="mt-5">
        <p className="text-xl font-semibold">
          {formatPrice(service.price)}
        </p>

        <p className="mt-1 text-xs text-white/35">
          {unitLabel}
        </p>
      </div>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* CART CONTENT                                                               */
/* -------------------------------------------------------------------------- */

function CartContent({
  cart,
  total,
  count,
  onRemove,
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-blue-400">
            Your booking
          </p>

          <h2 className="mt-1 text-xl font-semibold">
            Summary
          </h2>
        </div>

        <div className="flex h-9 min-w-9 items-center justify-center rounded-full bg-white/[0.05] px-2 text-xs text-white/60">
          {count}
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-6 text-center">
          <FiShoppingBag
            className="mx-auto text-white/20"
            size={25}
          />

          <p className="mt-4 text-sm font-medium text-white/60">
            Your booking is empty
          </p>

          <p className="mt-1 text-xs leading-5 text-white/30">
            Add a facility or service to see it here.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-3">
            {cart.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-[#030712] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {item.title}
                    </p>

                    <p className="mt-1 text-xs text-white/35">
                      {item.quantity} ×{" "}
                      {formatPrice(item.price)}
                    </p>

                    {item.movie && (
                      <p className="mt-2 text-xs text-blue-300/70">
                        Movie: {item.movie}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-white/30">
                      {item.date}
                    </p>

                    {item.slot && (
                      <p className="mt-1 text-xs text-white/30">
                        Time: {item.slot}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onRemove(item.id)
                    }
                    className="shrink-0 text-xs text-white/25 transition hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-xs text-white/30">
                    Subtotal
                  </span>

                  <span className="text-sm font-semibold">
                    {formatPrice(item.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/40">
                Total
              </span>

              <span className="text-2xl font-semibold">
                {formatPrice(total)}
              </span>
            </div>

            <button
              type="button"
              className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-semibold transition hover:bg-blue-500"
            >
              Continue to secure payment
              <FiArrowRight size={16} />
            </button>

            <p className="mt-3 text-center text-[11px] leading-5 text-white/25">
              Secure payment via SSLCommerz.
            </p>
          </div>
        </>
      )}
    </>
  );
}
