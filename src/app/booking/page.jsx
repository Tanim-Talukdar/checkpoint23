
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  FiMail,
  FiMinus,
  FiPhone,
  FiPlus,
  FiShoppingBag,
  FiUser,
  FiX,
} from "react-icons/fi";

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const FACILITY_UI = [
  {
    key: "fitness",
    names: ["Gym", "Swimming Pool", "Gym + Pool"],
    title: "Fitness",
    label: "GYM & POOL",
    description: "Train, swim, or combine both.",
    image:
      "https://res.cloudinary.com/qds5td8c/image/upload/v1790701391/the-checkpoint/Checkpoint-Pictures-Optimized/swimming-pool/01.webp",
    icon: FiActivity,
  },
  {
    key: "steam",
    names: ["Steam Bath"],
    title: "Steam Bath",
    label: "PRIVATE SESSION",
    description: "A private 30-minute steam session.",
    image:
      "https://res.cloudinary.com/qds5td8c/image/upload/v1790708325/Checkpoint/gym-steamBath/05.webp",
    icon: FiActivity,
  },
  {
    key: "playground",
    names: ["Playground"],
    title: "Playground",
    label: "SPORTS",
    description: "Book the playground for your game.",
    image:
      "https://res.cloudinary.com/qds5td8c/image/upload/v1790701377/the-checkpoint/Checkpoint-Pictures-Optimized/playground/11301219-50b4-43a2-9f0f-45ac4475f40e.jpg",
    icon: FiGrid,
  },
  {
    key: "movie",
    names: ["Private Movie", "Private Cinema"],
    title: "Private Cinema",
    label: "PRIVATE VIEWING",
    description: "Choose a movie for your private viewing.",
    image:
      "https://res.cloudinary.com/qds5td8c/image/upload/v1790701371/the-checkpoint/Checkpoint-Pictures-Optimized/Movie-Theater/01.webp",
    icon: FiFilm,
  },
];

const OPEN_TIME = "11:00";
const CLOSE_TIME = "23:00";

const MOVIE_SESSIONS = [
  {
    startTime: "11:00",
    endTime: "14:00",
    displayTime: "11:00 AM – 2:00 PM",
  },
  {
    startTime: "14:00",
    endTime: "17:00",
    displayTime: "2:00 PM – 5:00 PM",
  },
  {
    startTime: "17:00",
    endTime: "20:00",
    displayTime: "5:00 PM – 8:00 PM",
  },
  {
    startTime: "20:00",
    endTime: "23:00",
    displayTime: "8:00 PM – 11:00 PM",
  },
];

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function formatPrice(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "৳0";
  }

  return `৳${number.toLocaleString("en-BD")}`;
}

function normalizeId(value) {
  return value?._id?.toString?.() || value?.id?.toString?.() || "";
}

function isMembershipService(service) {
  return (
    service?.type === "membership" ||
    service?.pricingType === "monthly"
  );
}

function isMovieService(service) {
  return (
    service?.type === "private_movie" ||
    service?.pricingType === "per_ticket"
  );
}

function serviceUnit(service) {
  if (service?.pricingType === "per_ticket") {
    return "ticket";
  }

  if (service?.pricingType === "per_booking") {
    return "booking";
  }

  if (
    service?.pricingType === "monthly" ||
    service?.type === "membership"
  ) {
    return "month";
  }

  return "person";
}

function serviceDuration(service) {
  if (isMembershipService(service)) {
    return null;
  }

  if (isMovieService(service)) {
    return 180;
  }

  const duration = Number(service?.durationMinutes);

  return Number.isFinite(duration) && duration > 0
    ? duration
    : null;
}

function isFacilityMatch(facility, names) {
  const facilityName = facility?.name?.toLowerCase?.() || "";
  const facilitySlug = facility?.slug?.toLowerCase?.() || "";

  return names.some((name) => {
    const normalized = name.toLowerCase();

    return (
      facilityName === normalized ||
      facilitySlug === normalized
    );
  });
}

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

  if (!year || !month || !day) {
    return null;
  }

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

  const previousMonthDays = new Date(
    year,
    month,
    0
  ).getDate();

  const days = [];

  for (let index = firstDay - 1; index >= 0; index--) {
    days.push({
      day: previousMonthDays - index,
      monthOffset: -1,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push({
      day,
      monthOffset: 0,
    });
  }

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

function timeToMinutes(value) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    return null;
  }

  const [hours, minutes] = value
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
}

function formatDisplayTime(value) {
  if (!value) return "";

  const minutes = timeToMinutes(value);

  if (minutes === null) {
    return value;
  }

  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;

  const suffix = hours24 >= 12 ? "PM" : "AM";

  const hours12 =
    hours24 % 12 === 0
      ? 12
      : hours24 % 12;

  return `${hours12}:${String(mins).padStart(
    2,
    "0"
  )} ${suffix}`;
}

function formatSlotDisplay(slot) {
  if (!slot) return "";

  if (slot.displayTime) {
    return slot.displayTime;
  }

  return formatDisplayTime(slot.startTime);
}

function getMinimumQuantity(service) {
  const value = Number(
    service?.minimumQuantity
  );

  return Number.isInteger(value) && value > 0
    ? value
    : 1;
}

function getMaximumQuantity(service) {
  const value = Number(
    service?.maximumQuantity
  );

  if (
    Number.isInteger(value) &&
    value > 0
  ) {
    return value;
  }

  const capacity = Number(service?.capacity);

  if (
    Number.isInteger(capacity) &&
    capacity > 0 &&
    service?.pricingType !== "per_booking"
  ) {
    return capacity;
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

export default function BookingPage() {
  const today = new Date();

  const [selectedFacility, setSelectedFacility] =
    useState("fitness");

  const [selectedServiceId, setSelectedServiceId] =
    useState("");

  const [selectedDate, setSelectedDate] =
    useState("");

  const [selectedSlot, setSelectedSlot] =
    useState("");

  const [movieName, setMovieName] =
    useState("");

  const [quantity, setQuantity] =
    useState(1);

  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [cart, setCart] = useState([]);

  const [apiFacilities, setApiFacilities] =
    useState([]);

  const [availabilitySlots, setAvailabilitySlots] =
    useState([]);

  const [loadingFacilities, setLoadingFacilities] =
    useState(true);

  const [loadingAvailability, setLoadingAvailability] =
    useState(false);

  const [facilityError, setFacilityError] =
    useState("");

  const [availabilityError, setAvailabilityError] =
    useState("");

  const [submitError, setSubmitError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [cartOpen, setCartOpen] =
    useState(false);

  const [calendarMonth, setCalendarMonth] =
    useState(today.getMonth());

  const [calendarYear, setCalendarYear] =
    useState(today.getFullYear());

  const serviceRef = useRef(null);
  const dateRef = useRef(null);
  const timeRef = useRef(null);
  const quantityRef = useRef(null);

  /* ------------------------------------------------------------------------ */
  /* LOAD FACILITIES                                                          */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;

    async function loadFacilities() {
      try {
        setLoadingFacilities(true);
        setFacilityError("");

        const response = await fetch(
          "/api/facilites",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (
          !response.ok ||
          !data?.success
        ) {
          throw new Error(
            data?.error ||
              data?.message ||
              "Failed to load facilities."
          );
        }

        if (!cancelled) {
          setApiFacilities(
            Array.isArray(data.facilities)
              ? data.facilities
              : []
          );
        }
      } catch (error) {
        if (!cancelled) {
          setFacilityError(
            error?.message ||
              "Failed to load facilities."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingFacilities(false);
        }
      }
    }

    loadFacilities();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /* BUILD CURRENT SERVICES FROM DATABASE                                     */
  /* ------------------------------------------------------------------------ */

  const currentServices = useMemo(() => {
    const uiFacility = FACILITY_UI.find(
      (item) =>
        item.key === selectedFacility
    );

    if (!uiFacility) {
      return [];
    }

    const matchedFacilities =
      apiFacilities.filter((facility) =>
        isFacilityMatch(
          facility,
          uiFacility.names
        )
      );

    const services = [];

    for (const facility of matchedFacilities) {
      const dbServices = Array.isArray(
        facility.services
      )
        ? facility.services
        : [];

      for (const service of dbServices) {
        if (service.active === false) {
          continue;
        }

        services.push({
          ...service,
          id: normalizeId(service),
          facilityId: normalizeId(facility),
          facilityName: facility.name,
          displayUnit: serviceUnit(service),
          displayDuration:
            serviceDuration(service),
          membership:
            isMembershipService(service),
          movie:
            isMovieService(service),
        });
      }
    }

    return services;
  }, [
    apiFacilities,
    selectedFacility,
  ]);

  const selectedService = useMemo(
    () =>
      currentServices.find(
        (service) =>
          service.id === selectedServiceId
      ) || null,
    [
      currentServices,
      selectedServiceId,
    ]
  );

  /* ------------------------------------------------------------------------ */
  /* SELECT FIRST SERVICE                                                     */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!currentServices.length) {
      setSelectedServiceId("");
      return;
    }

    const exists = currentServices.some(
      (service) =>
        service.id === selectedServiceId
    );

    if (!exists) {
      const firstService =
        currentServices[0];

      setSelectedServiceId(
        firstService.id
      );

      setQuantity(
        getMinimumQuantity(
          firstService
        )
      );

      setSelectedSlot("");
      setMovieName("");
    }
  }, [
    currentServices,
    selectedServiceId,
  ]);

  /* ------------------------------------------------------------------------ */
  /* LOAD AVAILABILITY                                                        */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      if (
        !selectedDate ||
        !selectedService ||
        isMembershipService(
          selectedService
        )
      ) {
        setAvailabilitySlots([]);
        setAvailabilityError("");
        setLoadingAvailability(false);
        return;
      }

      try {
        setLoadingAvailability(true);
        setAvailabilityError("");
        setAvailabilitySlots([]);
        setSelectedSlot("");

        const params =
          new URLSearchParams({
            facilityId:
              selectedService.facilityId,
            serviceId:
              selectedService.id,
            date: selectedDate,
          });

        const response = await fetch(
          `/api/booking-slots?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (
          !response.ok ||
          !data?.success
        ) {
          throw new Error(
            data?.error ||
              data?.message ||
              "Failed to load availability."
          );
        }

        const slots = Array.isArray(
          data.slots
        )
          ? data.slots
          : [];

        if (!cancelled) {
          setAvailabilitySlots(
            slots
          );
        }
      } catch (error) {
        if (!cancelled) {
          setAvailabilityError(
            error?.message ||
              "Failed to load availability."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingAvailability(false);
        }
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [
    selectedDate,
    selectedService,
  ]);

  /* ------------------------------------------------------------------------ */
  /* CALCULATIONS                                                             */
  /* ------------------------------------------------------------------------ */

  const isMembership =
    Boolean(
      selectedService?.membership
    );

  const isMovie =
    Boolean(
      selectedService?.movie
    );

  const minimumQuantity =
    getMinimumQuantity(
      selectedService
    );

  const maximumQuantity =
    getMaximumQuantity(
      selectedService
    );

  const itemTotal =
    selectedService
      ? Number(selectedService.price || 0) *
        quantity
      : 0;

  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total +
          Number(item.total || 0),
        0
      ),
    [cart]
  );

  const cartCount = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total +
          Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  const canAdd =
    Boolean(
      selectedService &&
        selectedDate &&
        customer.name.trim() &&
        customer.email.trim() &&
        customer.phone.trim() &&
        (isMembership ||
          selectedSlot) &&
        (!isMovie ||
          movieName.trim()) &&
        quantity >= minimumQuantity
    );

  const calendarDays = useMemo(
    () =>
      getCalendarDays(
        calendarYear,
        calendarMonth
      ),
    [
      calendarYear,
      calendarMonth,
    ]
  );

  const calendarMonthName =
    new Date(
      calendarYear,
      calendarMonth,
      1
    ).toLocaleString(
      "en-US",
      {
        month: "long",
      }
    );

  /* ------------------------------------------------------------------------ */
  /* UI HELPERS                                                               */
  /* ------------------------------------------------------------------------ */

  function scrollToSection(ref) {
    window.setTimeout(() => {
      ref.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  function handleFacilityChange(key) {
    setSelectedFacility(key);
    setSelectedServiceId("");
    setSelectedDate("");
    setSelectedSlot("");
    setMovieName("");
    setQuantity(1);
    setAvailabilitySlots([]);
    setAvailabilityError("");

    scrollToSection(
      serviceRef
    );
  }

  function handleServiceChange(id) {
    const service =
      currentServices.find(
        (item) => item.id === id
      );

    setSelectedServiceId(id);
    setSelectedDate("");
    setSelectedSlot("");
    setMovieName("");
    setQuantity(
      getMinimumQuantity(service)
    );
    setAvailabilitySlots([]);
    setAvailabilityError("");

    scrollToSection(
      dateRef
    );
  }

  function handleDateChange(value) {
    setSelectedDate(value);
    setSelectedSlot("");

    if (
      isMembershipService(
        selectedService
      )
    ) {
      scrollToSection(
        quantityRef
      );
    } else {
      scrollToSection(
        timeRef
      );
    }
  }

  function handleCalendarDateClick(
    day,
    monthOffset
  ) {
    const targetMonth = new Date(
      calendarYear,
      calendarMonth + monthOffset,
      1
    );

    const year =
      targetMonth.getFullYear();

    const month =
      targetMonth.getMonth();

    const value =
      formatDateValue(
        year,
        month,
        day
      );

    const clickedDate =
      new Date(
        year,
        month,
        day
      );

    const todayStart =
      new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

    if (
      clickedDate < todayStart
    ) {
      return;
    }

    setSelectedDate(value);
    setSelectedSlot("");

    if (monthOffset !== 0) {
      setCalendarYear(year);
      setCalendarMonth(month);
    }

    if (
      isMembershipService(
        selectedService
      )
    ) {
      scrollToSection(
        quantityRef
      );
    } else {
      window.setTimeout(() => {
        timeRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    }
  }

  function goToPreviousMonth() {
    setCalendarMonth(
      (current) => {
        if (current === 0) {
          setCalendarYear(
            (year) => year - 1
          );

          return 11;
        }

        return current - 1;
      }
    );
  }

  function goToNextMonth() {
    setCalendarMonth(
      (current) => {
        if (current === 11) {
          setCalendarYear(
            (year) => year + 1
          );

          return 0;
        }

        return current + 1;
      }
    );
  }

  function goToCurrentMonth() {
    const current =
      new Date();

    setCalendarYear(
      current.getFullYear()
    );

    setCalendarMonth(
      current.getMonth()
    );
  }

  function handleSlotChange(slot) {
    if (
      slot?.available === false ||
      slot?.status === "full"
    ) {
      return;
    }

    if (
      Number(slot?.remaining ?? 1) <= 0
    ) {
      return;
    }

    const startTime =
      slot.startTime || "";

    setSelectedSlot(
      startTime
    );

    scrollToSection(
      quantityRef
    );
  }

  function increaseQuantity() {
    if (!selectedService) {
      return;
    }

    setQuantity(
      (current) => {
        const next =
          current + 1;

        if (
          maximumQuantity !== null
        ) {
          return Math.min(
            next,
            maximumQuantity
          );
        }

        return next;
      }
    );
  }

  function decreaseQuantity() {
    setQuantity(
      (current) =>
        Math.max(
          current - 1,
          minimumQuantity
        )
    );
  }

  /* ------------------------------------------------------------------------ */
  /* ADD TO CART                                                              */
  /* ------------------------------------------------------------------------ */

  function addToBooking() {
    if (!canAdd) {
      setSubmitError(
        "Please complete all required booking details first."
      );

      return;
    }

    const selectedAvailability =
      availabilitySlots.find(
        (item) =>
          item.startTime ===
          selectedSlot
      );

    let startTime =
      isMembership
        ? OPEN_TIME
        : selectedAvailability
            ?.startTime || "";

    let endTime =
      isMembership
        ? CLOSE_TIME
        : selectedAvailability
            ?.endTime || "";

    if (
      !isMembership &&
      (!startTime ||
        !endTime)
    ) {
      setSubmitError(
        "Please select a valid available time slot."
      );

      return;
    }

    const newItem = {
      id: `${selectedService.facilityId}-${selectedService.id}-${selectedDate}-${startTime}-${Date.now()}`,

      facilityId:
        selectedService.facilityId,

      facilityName:
        selectedService.facilityName,

      serviceId:
        selectedService.id,

      title:
        selectedService.name,

      price:
        Number(
          selectedService.price || 0
        ),

      quantity,

      date:
        selectedDate,

      startTime,

      endTime,

      slot:
        isMembership
          ? null
          : startTime,

      movie:
        isMovie
          ? movieName.trim()
          : "",

      total:
        Number(
          selectedService.price || 0
        ) * quantity,
    };

    setCart(
      (current) => [
        ...current,
        newItem,
      ]
    );

    setSubmitError("");
    setCartOpen(true);
  }

  /* ------------------------------------------------------------------------ */
  /* REMOVE CART ITEM                                                         */
  /* ------------------------------------------------------------------------ */

  function removeFromCart(id) {
    setCart(
      (current) =>
        current.filter(
          (item) =>
            item.id !== id
        )
    );
  }

  /* ------------------------------------------------------------------------ */
  /* CREATE BOOKINGS + START PAYMENT                                          */
  /* ------------------------------------------------------------------------ */

  async function handleSecurePayment() {
    if (!cart.length) {
      setSubmitError(
        "Your booking cart is empty."
      );

      return;
    }

    if (submitting) {
      return;
    }

    const name =
      customer.name.trim();

    const email =
      customer.email.trim();

    const phone =
      customer.phone.trim();

    if (!name || !email || !phone) {
      setSubmitError(
        "Please complete your name, email and phone number before payment."
      );

      return;
    }

    setSubmitError("");
    setSubmitting(true);

    try {
      /*
       * IMPORTANT:
       *
       * We intentionally do NOT send price or total.
       *
       * The backend must calculate those values
       * from MongoDB.
       */

      const items = cart.map(
        (item) => ({
          facilityId:
            item.facilityId,

          serviceId:
            item.serviceId,

          date:
            item.date,

          startTime:
            item.startTime,

          endTime:
            item.endTime,

          quantity:
            item.quantity,

          movieName:
            item.movie || "",
        })
      );

      /* ------------------------------------------------------------------ */
      /* CREATE BOOKING DOCUMENTS                                           */
      /* ------------------------------------------------------------------ */

      const bookingResponse =
        await fetch(
          "/api/bookings",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              customer: {
                name,
                email,
                phone,
              },

              items,
            }),
          }
        );

      const bookingData =
        await bookingResponse.json();

      if (
        !bookingResponse.ok ||
        !bookingData?.success
      ) {
        const error =
          new Error(
            bookingData?.error ||
              bookingData?.message ||
              "Unable to create your booking."
          );

        error.code =
          bookingData?.code;

        throw error;
      }

      if (
        !bookingData.bookingGroupReference
      ) {
        throw new Error(
          "Booking was created without a payment group reference."
        );
      }

      /* ------------------------------------------------------------------ */
      /* START ONE SSLCommerz PAYMENT                                       */
      /* ------------------------------------------------------------------ */

      const paymentResponse =
        await fetch(
          "/api/payment/sslcommerz",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              bookingGroupReference:
                bookingData.bookingGroupReference,
            }),
          }
        );

      const paymentData =
        await paymentResponse.json();

      /*
       * FIX:
       *
       * The SSLCommerz backend returns `paymentUrl`.
       * The previous frontend was incorrectly checking
       * `GatewayPageURL`, which caused a successful HTTP 200
       * response to be treated as a payment failure.
       */

      if (
        !paymentResponse.ok ||
        !paymentData?.success ||
        !paymentData?.paymentUrl
      ) {
        throw new Error(
          paymentData?.error ||
            paymentData?.message ||
            "Unable to start secure payment."
        );
      }

      /*
       * Redirect to SSLCommerz.
       */
      window.location.href =
        paymentData.paymentUrl;
    } catch (error) {
      console.error(
        "Booking/payment error:",
        error
      );

      if (
        error?.code ===
        "BOOKING_CONFLICT"
      ) {
        setSubmitError(
          "One of your selected slots was just taken by another customer. Please refresh the availability and try again."
        );
      } else {
        setSubmitError(
          error?.message ||
            "Something went wrong while preparing your payment. Please try again."
        );
      }

      setSubmitting(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* FACILITY LOADING ERROR                                                   */
  /* ------------------------------------------------------------------------ */

  if (
    loadingFacilities
  ) {
    return (
      <main className="min-h-screen bg-[#030712] text-white">
        <section className="px-4 pb-24 pt-32 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
            >
              <FiArrowLeft
                size={16}
              />
              Back to Checkpoint
            </Link>

            <div className="mt-16 rounded-3xl border border-white/10 bg-[#07101c] p-10 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />

              <p className="mt-5 text-sm text-white/45">
                Loading booking options...
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* MAIN UI                                                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="min-h-screen bg-[#030712] text-white">
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <section className="px-4 pb-10 pt-28 sm:px-6 sm:pt-32">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
          >
            <FiArrowLeft
              size={16}
            />
            Back to Checkpoint
          </Link>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">
                BOOK YOUR EXPERIENCE
              </p>

              <h1 className="max-w-5xl text-5xl font-semibold tracking-[-0.05em] sm:text-6xl lg:text-8xl">
                Book your experience
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-6 text-white/50 sm:text-base">
                Select your facility, check live availability, and add
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

      {/* ------------------------------------------------------------------ */}
      {/* MAIN                                                               */}
      {/* ------------------------------------------------------------------ */}

      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-7xl">
          {/* CUSTOMER DETAILS */}

          <div className="mb-6 rounded-3xl border border-white/10 bg-[#07101c] p-5 sm:p-7">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                YOUR DETAILS
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Tell us who is booking
              </h2>

              <p className="mt-2 text-sm text-white/40">
                These details will be used for your booking and payment.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <CustomerInput
                icon={<FiUser size={16} />}
                label="Name"
                value={customer.name}
                placeholder="Your full name"
                type="text"
                autoComplete="name"
                onChange={(value) =>
                  setCustomer(
                    (current) => ({
                      ...current,
                      name: value,
                    })
                  )
                }
              />

              <CustomerInput
                icon={<FiMail size={16} />}
                label="Email"
                value={customer.email}
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
                onChange={(value) =>
                  setCustomer(
                    (current) => ({
                      ...current,
                      email: value,
                    })
                  )
                }
              />

              <CustomerInput
                icon={<FiPhone size={16} />}
                label="Phone"
                value={customer.phone}
                placeholder="+880 1XXXXXXXXX"
                type="tel"
                autoComplete="tel"
                onChange={(value) =>
                  setCustomer(
                    (current) => ({
                      ...current,
                      phone: value,
                    })
                  )
                }
              />
            </div>
          </div>

          {facilityError && (
            <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-sm text-red-300">
              {facilityError}
            </div>
          )}

          {/* FACILITY + SERVICES */}

          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="min-w-0">
              {/* FACILITIES */}

              <div className="rounded-3xl border border-white/10 bg-[#07101c] p-5 sm:p-7">
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                    01
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    Choose a facility
                  </h2>

                  <p className="mt-2 text-sm text-white/40">
                    Select what you want to book.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {FACILITY_UI.map(
                    (item) => {
                      const Icon =
                        item.icon;

                      const active =
                        selectedFacility ===
                        item.key;

                      return (
                        <button
                          key={
                            item.key
                          }
                          type="button"
                          onClick={() =>
                            handleFacilityChange(
                              item.key
                            )
                          }
                          className={`group relative min-h-[180px] overflow-hidden rounded-2xl border text-left transition ${
                            active
                              ? "border-blue-500/60"
                              : "border-white/10 hover:border-white/20"
                          }`}
                        >
                          <img
                            src={
                              item.image
                            }
                            alt={
                              item.title
                            }
                            className="absolute inset-0 h-full w-full object-cover opacity-45 transition duration-500 group-hover:scale-105 group-hover:opacity-55"
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/70 to-transparent" />

                          <div className="relative flex min-h-[180px] flex-col justify-end p-5">
                            <div className="mb-3 flex items-center justify-between">
                              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                                <Icon
                                  size={17}
                                />
                              </span>

                              {active && (
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500">
                                  <FiCheck
                                    size={14}
                                  />
                                </span>
                              )}
                            </div>

                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300">
                              {item.label}
                            </p>

                            <h3 className="mt-1 text-xl font-semibold">
                              {item.title}
                            </h3>

                            <p className="mt-1 text-xs text-white/45">
                              {
                                item.description
                              }
                            </p>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* SERVICES */}

              <div
                ref={serviceRef}
                className="mt-6 scroll-mt-28 rounded-3xl border border-white/10 bg-[#07101c] p-5 sm:scroll-mt-32 sm:p-7"
              >
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                    02
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    Choose your service
                  </h2>

                  <p className="mt-2 text-sm text-white/40">
                    Select the exact service you want.
                  </p>
                </div>

                {!currentServices.length ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                    <p className="text-sm text-white/45">
                      No active services are currently available.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {currentServices.map(
                      (service) => (
                        <ServiceCard
                          key={
                            service.id
                          }
                          service={
                            service
                          }
                          active={
                            selectedServiceId ===
                            service.id
                          }
                          onClick={() =>
                            handleServiceChange(
                              service.id
                            )
                          }
                        />
                      )
                    )}
                  </div>
                )}
              </div>

              {/* DATE */}

              <div
                ref={dateRef}
                className="mt-6 scroll-mt-28 rounded-3xl border border-white/10 bg-[#07101c] p-5 sm:scroll-mt-32 sm:p-7"
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

                <div className="rounded-2xl border border-white/10 bg-[#030712] p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={
                        goToPreviousMonth
                      }
                      aria-label="Previous month"
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/50 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                    >
                      <FiChevronLeft
                        size={18}
                      />
                    </button>

                    <div className="text-center">
                      <p className="text-base font-semibold">
                        {
                          calendarMonthName
                        }{" "}
                        {
                          calendarYear
                        }
                      </p>

                      <button
                        type="button"
                        onClick={
                          goToCurrentMonth
                        }
                        className="mt-1 text-[10px] font-medium uppercase tracking-wider text-blue-400 transition hover:text-blue-300"
                      >
                        Today
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={
                        goToNextMonth
                      }
                      aria-label="Next month"
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/50 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                    >
                      <FiChevronRight
                        size={18}
                      />
                    </button>
                  </div>

                  <div className="mt-6 grid grid-cols-7">
                    {[
                      "Sun",
                      "Mon",
                      "Tue",
                      "Wed",
                      "Thu",
                      "Fri",
                      "Sat",
                    ].map(
                      (day) => (
                        <div
                          key={day}
                          className="pb-3 text-center text-[10px] font-semibold uppercase tracking-wider text-white/25"
                        >
                          {day}
                        </div>
                      )
                    )}
                  </div>

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
                            selectedDate,
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

                        const todayStart =
                          new Date(
                            today.getFullYear(),
                            today.getMonth(),
                            today.getDate()
                          );

                        const isPast =
                          targetDate <
                          todayStart;

                        const outsideMonth =
                          calendarDay.monthOffset !==
                          0;

                        return (
                          <button
                            key={`${calendarYear}-${calendarMonth}-${index}`}
                            type="button"
                            disabled={
                              isPast
                            }
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
                            {
                              calendarDay.day
                            }

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
                      {selectedDate
                        ? new Date(
                            `${selectedDate}T00:00:00`
                          ).toLocaleDateString(
                            "en-US",
                            {
                              weekday:
                                "long",
                              year:
                                "numeric",
                              month:
                                "long",
                              day:
                                "numeric",
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
                  className="mt-6 scroll-mt-28 rounded-3xl border border-white/10 bg-[#07101c] p-5 sm:scroll-mt-32 sm:p-7"
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
                  </div>

                  {availabilityError &&
                    selectedDate && (
                      <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-4 text-sm text-red-300">
                        {
                          availabilityError
                        }
                      </div>
                    )}

                  {!selectedDate ? (
                    <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                      <FiCalendar
                        size={22}
                        className="mx-auto text-white/20"
                      />

                      <p className="mt-3 text-sm text-white/45">
                        Select a date first
                      </p>
                    </div>
                  ) : loadingAvailability ? (
                    <div className="rounded-2xl border border-white/10 bg-[#030712] p-8 text-center">
                      <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />

                      <p className="mt-4 text-sm text-white/40">
                        Checking live availability...
                      </p>
                    </div>
                  ) : !availabilitySlots.length ? (
                    <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                      <FiClock
                        size={22}
                        className="mx-auto text-white/20"
                      />

                      <p className="mt-3 text-sm text-white/45">
                        No available time slots for this date.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {availabilitySlots.map(
                        (slot) => {
                          const full =
                            slot.available ===
                              false ||
                            slot.status ===
                              "full" ||
                            Number(
                              slot.remaining ??
                                1
                            ) <= 0;

                          const active =
                            selectedSlot ===
                            slot.startTime;

                          return (
                            <button
                              key={`${slot.startTime}-${slot.endTime}`}
                              type="button"
                              disabled={
                                full
                              }
                              onClick={() =>
                                handleSlotChange(
                                  slot
                                )
                              }
                              className={`rounded-2xl border p-4 text-left transition ${
                                full
                                  ? "cursor-not-allowed border-white/5 bg-white/[0.02] opacity-45"
                                  : active
                                    ? "border-blue-500/70 bg-blue-500/10"
                                    : "border-white/10 bg-[#030712] hover:border-blue-500/40 hover:bg-blue-500/[0.04]"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="text-sm font-semibold">
                                    {formatSlotDisplay(
                                      slot
                                    )}
                                  </span>

                                  {slot.endTime &&
                                    slot.startTime !==
                                      slot.endTime && (
                                      <p className="mt-1 text-[10px] text-white/25">
                                        {
                                          slot.startTime
                                        }{" "}
                                        –{" "}
                                        {
                                          slot.endTime
                                        }
                                      </p>
                                    )}
                                </div>

                                {active && (
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                                    <FiCheck
                                      size={12}
                                    />
                                  </span>
                                )}
                              </div>

                              <div className="mt-3">
                                {full ? (
                                  <span className="text-xs text-white/30">
                                    Fully booked
                                  </span>
                                ) : Number.isFinite(
                                    Number(
                                      slot.remaining
                                    )
                                  ) ? (
                                  <span className="text-xs text-blue-300/70">
                                    {
                                      slot.remaining
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
                        }
                      )}
                    </div>
                  )}

                  {selectedService?.exclusive && (
                    <div className="mt-5 rounded-2xl border border-blue-500/20 bg-blue-500/[0.05] p-4">
                      <p className="text-sm font-medium">
                        Private session
                      </p>

                      <p className="mt-1 text-xs leading-5 text-white/40">
                        Once this slot is booked, it becomes unavailable to other customers.
                      </p>
                    </div>
                  )}

                  {selectedFacility ===
                    "playground" && (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-sm font-medium">
                        Shared playground
                      </p>

                      <p className="mt-1 text-xs leading-5 text-white/40">
                        All playground activities share the same physical resource. Overlapping bookings cannot be made.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* MEMBERSHIP RULES */}

              {isMembership && (
                <div className="mt-6 rounded-3xl border border-blue-500/20 bg-blue-500/[0.05] p-5 sm:p-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                    04
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    Membership Rules
                  </h2>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                      {
                        title:
                          "11 AM – 11 PM",
                        description:
                          "Come anytime during opening hours.",
                      },
                      {
                        title:
                          "One entry per day",
                        description:
                          "Membership allows one entry per day.",
                      },
                      {
                        title:
                          "No re-entry",
                        description:
                          "Leaving the facility ends that day's entry.",
                      },
                    ].map(
                      (
                        rule,
                        index
                      ) => (
                        <div
                          key={
                            rule.title
                          }
                          className="rounded-2xl border border-white/10 bg-[#030712] p-4"
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-xs font-semibold text-blue-300">
                              {index +
                                1}
                            </span>

                            <div>
                              <p className="text-sm font-medium">
                                {
                                  rule.title
                                }
                              </p>

                              <p className="mt-1 text-xs text-white/35">
                                {
                                  rule.description
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* MOVIE */}

              {isMovie && (
                <div className="mt-6 rounded-3xl border border-white/10 bg-[#07101c] p-5 sm:p-7">
                  <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                      05
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold">
                      Movie details
                    </h2>

                    <p className="mt-2 text-sm text-white/40">
                      Enter the movie you want to watch.
                    </p>
                  </div>

                  <input
                    value={
                      movieName
                    }
                    onChange={(
                      event
                    ) =>
                      setMovieName(
                        event.target
                          .value
                      )
                    }
                    type="text"
                    maxLength={200}
                    placeholder="Enter movie name"
                    className="h-14 w-full rounded-2xl border border-white/10 bg-[#030712] px-4 text-sm text-white outline-none placeholder:text-white/20 transition focus:border-blue-500/60"
                  />

                  <p className="mt-3 text-xs leading-5 text-white/35">
                    Minimum 10 tickets · Maximum 50 seats · ৳250 per ticket · 3-hour private viewing.
                  </p>
                </div>
              )}

              {/* QUANTITY */}

              <div
                ref={quantityRef}
                className="mt-6 scroll-mt-28 rounded-3xl border border-white/10 bg-[#07101c] p-5 sm:scroll-mt-32 sm:p-7"
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
                      {isMovie
                        ? "Number of tickets"
                        : isMembership
                          ? "Membership quantity"
                          : "Number of people"}
                    </h2>

                    <p className="mt-2 text-sm text-white/40">
                      {isMovie
                        ? "Choose the number of seats you need."
                        : isMembership
                          ? "Membership is booked for one member at a time."
                          : "Choose how many people will use this service."}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={
                        decreaseQuantity
                      }
                      disabled={
                        quantity <=
                        minimumQuantity
                      }
                      className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#030712] text-white/60 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <FiMinus
                        size={17}
                      />
                    </button>

                    <span className="flex h-12 min-w-16 items-center justify-center rounded-xl border border-white/10 bg-[#030712] px-4 text-lg font-semibold">
                      {
                        quantity
                      }
                    </span>

                    <button
                      type="button"
                      onClick={
                        increaseQuantity
                      }
                      disabled={
                        maximumQuantity !==
                          null &&
                        quantity >=
                          maximumQuantity
                      }
                      className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#030712] text-white/60 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <FiPlus
                        size={17}
                      />
                    </button>
                  </div>
                </div>

                {maximumQuantity !==
                  null && (
                  <p className="mt-4 text-xs text-white/30">
                    Maximum:{" "}
                    {
                      maximumQuantity
                    }
                  </p>
                )}

                <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-[#030712] px-4 py-4">
                  <div>
                    <p className="text-xs text-white/35">
                      Current total
                    </p>

                    <p className="mt-1 text-xl font-semibold">
                      {formatPrice(
                        itemTotal
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={
                      addToBooking
                    }
                    disabled={
                      !canAdd
                    }
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Add to booking
                    <FiPlus
                      size={16}
                    />
                  </button>
                </div>

                {!canAdd && (
                  <p className="mt-3 text-center text-xs text-white/25">
                    Select the required date
                    {!isMembership
                      ? " and an available time"
                      : ""}
                    {isMovie
                      ? " and movie"
                      : ""}{" "}
                    and complete your contact details to continue.
                  </p>
                )}
              </div>

              {submitError && (
                <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-sm leading-6 text-red-300">
                  {submitError}
                </div>
              )}
            </div>

            {/* DESKTOP CART */}

            <aside className="hidden lg:block">
              <div className="sticky top-28 rounded-3xl border border-white/10 bg-[#07101c] p-5">
                <CartContent
                  cart={cart}
                  total={cartTotal}
                  count={cartCount}
                  onRemove={
                    removeFromCart
                  }
                  onPay={
                    handleSecurePayment
                  }
                  submitting={
                    submitting
                  }
                />
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* MOBILE CART BUTTON */}

      <button
        type="button"
        onClick={() =>
          setCartOpen(true)
        }
        className="fixed bottom-5 left-4 right-4 z-40 flex h-14 items-center justify-between rounded-2xl border border-blue-400/20 bg-[#07101c]/95 px-5 shadow-2xl backdrop-blur-xl lg:hidden"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
            <FiShoppingBag
              size={17}
            />
          </span>

          <span className="text-sm font-medium">
            {cartCount}{" "}
            {cartCount === 1
              ? "item"
              : "items"}
          </span>
        </span>

        <span className="flex items-center gap-2 text-sm font-semibold">
          {formatPrice(
            cartTotal
          )}

          <FiArrowRight
            size={16}
          />
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
                  setCartOpen(
                    false
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-white/60"
              >
                <FiX
                  size={18}
                />
              </button>
            </div>

            <CartContent
              cart={cart}
              total={cartTotal}
              count={cartCount}
              onRemove={
                removeFromCart
              }
              onPay={
                handleSecurePayment
              }
              submitting={
                submitting
              }
            />
          </div>
        </div>
      )}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* CUSTOMER INPUT                                                             */
/* -------------------------------------------------------------------------- */

function CustomerInput({
  icon,
  label,
  value,
  placeholder,
  type,
  autoComplete,
  onChange,
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/35">
        {label}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/25">
          {icon}
        </span>

        <input
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder={
            placeholder
          }
          type={type}
          autoComplete={
            autoComplete
          }
          className="h-14 w-full rounded-2xl border border-white/10 bg-[#030712] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/20 transition focus:border-blue-500/60"
        />
      </div>
    </div>
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
  const unit =
    service?.displayUnit ===
    "person"
      ? "per person"
      : service?.displayUnit ===
          "ticket"
        ? "per ticket"
        : service?.displayUnit ===
            "month"
          ? "per month"
          : "per booking";

  const duration =
    serviceDuration(
      service
    );

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex min-h-[165px] w-full flex-col justify-between rounded-2xl border p-5 text-left transition ${
        active
          ? "border-blue-500/60 bg-blue-500/[0.08]"
          : "border-white/10 bg-[#030712] hover:border-white/20 hover:bg-white/[0.03]"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="pr-2 font-semibold leading-5">
            {
              service.name
            }
          </h3>

          {active && (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500">
              <FiCheck
                size={13}
              />
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {service.membership && (
            <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-blue-300">
              Membership
            </span>
          )}

          {service.movie && (
            <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-blue-300">
              Private movie
            </span>
          )}

          {service.exclusive && (
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-white/50">
              Private
            </span>
          )}
        </div>

        <p className="mt-3 text-xs leading-5 text-white/35">
          {service.membership
            ? "Monthly membership."
            : service.movie
              ? "Private 3-hour movie viewing."
              : service.name}
        </p>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-xl font-semibold">
            {formatPrice(
              service.price
            )}
          </p>

          <p className="mt-1 text-xs text-white/35">
            {unit}
          </p>
        </div>

        {duration && (
          <span className="text-[10px] uppercase tracking-wider text-white/25">
            {duration} min
          </span>
        )}
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
  onPay,
  submitting,
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
            {cart.map(
              (item) => (
                <div
                  key={
                    item.id
                  }
                  className="rounded-2xl border border-white/10 bg-[#030712] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {
                          item.title
                        }
                      </p>

                      <p className="mt-1 text-xs text-white/35">
                        {
                          item.quantity
                        }{" "}
                        ×{" "}
                        {formatPrice(
                          item.price
                        )}
                      </p>

                      {item.movie && (
                        <p className="mt-2 text-xs text-blue-300/70">
                          Movie:{" "}
                          {
                            item.movie
                          }
                        </p>
                      )}

                      <p className="mt-2 text-xs text-white/30">
                        {
                          item.date
                        }
                      </p>

                      {item.slot && (
                        <p className="mt-1 text-xs text-white/30">
                          Time:{" "}
                          {formatDisplayTime(
                            item.slot
                          )}
                        </p>
                      )}

                      {item.startTime &&
                        item.endTime &&
                        item.startTime !==
                          item.endTime && (
                          <p className="mt-1 text-[10px] text-white/20">
                            {
                              item.startTime
                            }{" "}
                            –{" "}
                            {
                              item.endTime
                            }
                          </p>
                        )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onRemove(
                          item.id
                        )
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
                      {formatPrice(
                        item.total
                      )}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/40">
                Total
              </span>

              <span className="text-2xl font-semibold">
                {formatPrice(
                  total
                )}
              </span>
            </div>

            <button
              type="button"
              onClick={
                onPay
              }
              disabled={
                submitting
              }
              className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Preparing secure payment..."
                : "Continue to secure payment"}

              {!submitting && (
                <FiArrowRight
                  size={16}
                />
              )}
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
