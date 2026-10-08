import dotenv from "dotenv";
import mongoose from "mongoose";
import Facility from "../models/facility.js";

dotenv.config({
  path: ".env.local",
});
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI is not defined. Check your .env.local file."
  );
}

const now = new Date();

/* -----------------------------
   Schedule helpers
----------------------------- */

function createDailySchedule(slotDurationMinutes) {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    startTime: "11:00",
    endTime: "23:00",
    slotDurationMinutes,
    active: true,
  }));
}

function createMovieSchedule() {
  const sessions = [
    ["11:00", "14:00"],
    ["14:00", "17:00"],
    ["17:00", "20:00"],
    ["20:00", "23:00"],
  ];

  return Array.from({ length: 7 }, (_, dayOfWeek) =>
    sessions.map(([startTime, endTime]) => ({
      dayOfWeek,
      startTime,
      endTime,
      slotDurationMinutes: 180,
      active: true,
    }))
  ).flat();
}

/* -----------------------------
   Service helper
----------------------------- */

function createService({
  name,
  slug,
  type,
  pricingType,
  price,
  capacity = null,
  durationMinutes = null,
  minimumQuantity = 1,
  maximumQuantity = null,
  exclusive = false,
}) {
  return {
    name,
    slug,
    type,
    pricingType,
    price,

    priceHistory: [
      {
        price,
        effectiveFrom: now,
      },
    ],

    capacity,
    durationMinutes,
    minimumQuantity,
    maximumQuantity,
    exclusive,
    active: true,
  };
}

/* -----------------------------
   Fixed facilities
----------------------------- */

const facilities = [
  /* ============================
     GYM
  ============================ */

  {
    name: "Gym",
    slug: "gym",

    description:
      "Premium gym access with modern equipment and fitness facilities.",

    image: "",

    facilityType: "fitness",

    active: true,

    sharedResource: false,

    services: [
      createService({
        name: "Gym Day Pass",
        slug: "gym-day-pass",
        type: "day_pass",
        pricingType: "per_person",
        price: 500,
        capacity: 15,
        durationMinutes: 60,
        minimumQuantity: 1,
        maximumQuantity: 15,
        exclusive: false,
      }),

      createService({
        name: "Gym Monthly Membership",
        slug: "gym-monthly",
        type: "membership",
        pricingType: "monthly",
        price: 4000,
        capacity: null,
        durationMinutes: null,
        minimumQuantity: 1,
        maximumQuantity: null,
        exclusive: false,
      }),
    ],

    schedules: createDailySchedule(60),
  },

  /* ============================
     SWIMMING POOL
  ============================ */

  {
    name: "Swimming Pool",
    slug: "swimming-pool",

    description:
      "Swimming pool access with comfortable facilities for members and day-pass visitors.",

    image: "",

    facilityType: "fitness",

    active: true,

    sharedResource: false,

    services: [
      createService({
        name: "Swimming Pool Day Pass",
        slug: "pool-day-pass",
        type: "day_pass",
        pricingType: "per_person",
        price: 500,
        capacity: 15,
        durationMinutes: 60,
        minimumQuantity: 1,
        maximumQuantity: 15,
        exclusive: false,
      }),

      createService({
        name: "Swimming Pool Monthly Membership",
        slug: "pool-monthly",
        type: "membership",
        pricingType: "monthly",
        price: 4000,
        capacity: null,
        durationMinutes: null,
        minimumQuantity: 1,
        maximumQuantity: null,
        exclusive: false,
      }),
    ],

    schedules: createDailySchedule(60),
  },

  /* ============================
     GYM + POOL
  ============================ */

  {
    name: "Gym + Pool",
    slug: "gym-pool",

    description:
      "Combined gym and swimming pool access for customers who want both facilities.",

    image: "",

    facilityType: "fitness",

    active: true,

    sharedResource: false,

    services: [
      createService({
        name: "Gym + Pool Day Pass",
        slug: "gym-pool-day-pass",
        type: "day_pass",
        pricingType: "per_person",
        price: 700,
        capacity: 15,
        durationMinutes: 60,
        minimumQuantity: 1,
        maximumQuantity: 15,
        exclusive: false,
      }),

      createService({
        name: "Gym + Pool Monthly Membership",
        slug: "gym-pool-monthly",
        type: "membership",
        pricingType: "monthly",
        price: 6000,
        capacity: null,
        durationMinutes: null,
        minimumQuantity: 1,
        maximumQuantity: null,
        exclusive: false,
      }),
    ],

    schedules: createDailySchedule(60),
  },

  /* ============================
     STEAM BATH
  ============================ */

  {
    name: "Steam Bath",
    slug: "steam-bath",

    description:
      "Private steam bath sessions with exclusive slot booking.",

    image: "",

    facilityType: "steam",

    active: true,

    sharedResource: false,

    services: [
      createService({
        name: "Steam Bath",
        slug: "steam-bath-session",
        type: "activity",
        pricingType: "per_person",
        price: 300,
        capacity: 6,
        durationMinutes: 30,
        minimumQuantity: 1,
        maximumQuantity: 6,
        exclusive: true,
      }),
    ],

    schedules: createDailySchedule(30),
  },

  /* ============================
     PLAYGROUND
  ============================ */

  {
    name: "Playground",
    slug: "playground",

    description:
      "Shared playground space for futsal, basketball, badminton and pickleball.",

    image: "",

    facilityType: "playground",

    active: true,

    /*
     * One physical playground.
     *
     * Booking any activity blocks the overlapping
     * time for all other playground activities.
     */
    sharedResource: true,

    services: [
      createService({
        name: "Futsal",
        slug: "futsal",
        type: "activity",
        pricingType: "per_booking",
        price: 1500,
        capacity: 1,
        durationMinutes: 90,
        minimumQuantity: 1,
        maximumQuantity: 1,
        exclusive: true,
      }),

      createService({
        name: "Basketball",
        slug: "basketball",
        type: "activity",
        pricingType: "per_booking",
        price: 900,
        capacity: 1,
        durationMinutes: 60,
        minimumQuantity: 1,
        maximumQuantity: 1,
        exclusive: true,
      }),

      createService({
        name: "Badminton",
        slug: "badminton",
        type: "activity",
        pricingType: "per_booking",
        price: 800,
        capacity: 1,
        durationMinutes: 60,
        minimumQuantity: 1,
        maximumQuantity: 1,
        exclusive: true,
      }),

      createService({
        name: "Pickleball",
        slug: "pickleball",
        type: "activity",
        pricingType: "per_booking",
        price: 800,
        capacity: 1,
        durationMinutes: 60,
        minimumQuantity: 1,
        maximumQuantity: 1,
        exclusive: true,
      }),
    ],

    /*
     * 30-minute base schedule.
     *
     * Futsal = 90 minutes
     * Basketball = 60 minutes
     * Badminton = 60 minutes
     * Pickleball = 60 minutes
     */
    schedules: createDailySchedule(30),
  },

  /* ============================
     PRIVATE MOVIE
  ============================ */

  {
    name: "Private Movie",
    slug: "private-movie",

    description:
      "Private movie viewing with a minimum booking of 10 tickets and a maximum capacity of 50 seats.",

    image: "",

    facilityType: "movie",

    active: true,

    sharedResource: false,

    services: [
      createService({
        name: "Private Movie",
        slug: "private-movie-booking",
        type: "private_movie",
        pricingType: "per_ticket",
        price: 250,
        capacity: 50,
        durationMinutes: 180,
        minimumQuantity: 10,
        maximumQuantity: 50,
        exclusive: true,
      }),
    ],

    /*
     * Four fixed sessions every day:
     *
     * 11:00 - 14:00
     * 14:00 - 17:00
     * 17:00 - 20:00
     * 20:00 - 23:00
     */
    schedules: createMovieSchedule(),
  },
];

/* -----------------------------
   Seed
----------------------------- */

async function seedFacilities() {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(MONGODB_URI);

    console.log("MongoDB connected.");
    console.log("");

    let createdFacilities = 0;
    let updatedFacilities = 0;
    let addedServices = 0;

    for (const facilityData of facilities) {
      let facility = await Facility.findOne({
        slug: facilityData.slug,
      });

      /* -------------------------
         Create missing facility
      ------------------------- */

      if (!facility) {
        await Facility.create(facilityData);

        createdFacilities++;

        console.log(
          `✓ Created facility: ${facilityData.name}`
        );

        continue;
      }

      let changed = false;

      /* -------------------------
         Add missing fixed services
      ------------------------- */

      for (const newService of facilityData.services) {
        const existingService = facility.services.find(
          (service) => service.slug === newService.slug
        );

        if (!existingService) {
          facility.services.push(newService);

          addedServices++;
          changed = true;

          console.log(
            `  + Added service: ${newService.name}`
          );
        }
      }

      /* -------------------------
         Add schedules if missing
      ------------------------- */

      if (
        !Array.isArray(facility.schedules) ||
        facility.schedules.length === 0
      ) {
        facility.schedules = facilityData.schedules;

        changed = true;

        console.log("  + Added default schedules");
      }

      /* -------------------------
         Initialize price history
      ------------------------- */

      for (const existingService of facility.services) {
        if (
          (!Array.isArray(existingService.priceHistory) ||
            existingService.priceHistory.length === 0) &&
          typeof existingService.price === "number"
        ) {
          existingService.priceHistory = [
            {
              price: existingService.price,
              effectiveFrom:
                facility.createdAt || now,
            },
          ];

          changed = true;

          console.log(
            `  + Added price history: ${existingService.name}`
          );
        }
      }

      /* -------------------------
         Save changes
      ------------------------- */

      if (changed) {
        await facility.save();

        updatedFacilities++;

        console.log(
          `✓ Updated facility: ${facilityData.name}`
        );
      } else {
        console.log(
          `• Already configured: ${facilityData.name}`
        );
      }

      console.log("");
    }

    console.log("======================================");
    console.log("FACILITY SEED COMPLETE");
    console.log("======================================");

    console.log(
      `Facilities created: ${createdFacilities}`
    );

    console.log(
      `Facilities updated: ${updatedFacilities}`
    );

    console.log(
      `Services added:     ${addedServices}`
    );

    console.log(
      `Total facilities:   ${facilities.length}`
    );

    console.log("======================================");
  } catch (error) {
    console.error("");
    console.error("FACILITY SEED FAILED");
    console.error("======================================");
    console.error(error);
    console.error("======================================");

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();

    console.log("MongoDB disconnected.");
  }
}

seedFacilities();