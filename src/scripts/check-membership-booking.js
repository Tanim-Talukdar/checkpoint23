import dotenv from "dotenv";
import mongoose from "mongoose";
import Booking from "../models/booking.js";
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

async function checkMembershipBooking() {
  try {
    console.log("Connecting to MongoDB...\n");

    await mongoose.connect(MONGODB_URI);

    console.log("✓ MongoDB connected\n");

    // ------------------------------------------------------------
    // Find recent monthly membership bookings
    // ------------------------------------------------------------

    const bookings = await Booking.find({
      serviceName: {
        $regex: /monthly|membership/i,
      },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    console.log("======================================");
    console.log("RECENT MEMBERSHIP-RELATED BOOKINGS");
    console.log("======================================\n");

    if (!bookings.length) {
      console.log("No membership-related bookings found.");
      return;
    }

    for (const booking of bookings) {
      console.log("--------------------------------------");

      console.log("Booking:");
      console.log({
        _id: booking._id,
        bookingReference: booking.bookingReference,
        bookingGroupReference: booking.bookingGroupReference,

        customerName: booking.customerName,
        customerEmail: booking.customerEmail,

        facilityId: booking.facilityId,
        facilityName: booking.facilityName,

        serviceId: booking.serviceId,
        serviceName: booking.serviceName,

        bookingDate: booking.bookingDate,
        quantity: booking.quantity,

        priceAtBooking: booking.priceAtBooking,
        totalAmount: booking.totalAmount,

        status: booking.status,
        paymentStatus: booking.paymentStatus,

        paymentTransactionId: booking.paymentTransactionId,

        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      });

      // ----------------------------------------------------------
      // Find Facility
      // ----------------------------------------------------------

      const facility = await Facility.findOne({
        _id: booking.facilityId,
      }).lean();

      console.log("\nFacility:");

      if (!facility) {
        console.log("❌ FACILITY NOT FOUND");
        console.log(
          "Booking facilityId:",
          booking.facilityId?.toString()
        );
      } else {
        console.log({
          _id: facility._id,
          name: facility.name,
          slug: facility.slug,
        });

        // --------------------------------------------------------
        // Find service by serviceId
        // --------------------------------------------------------

        const service = Array.isArray(facility.services)
          ? facility.services.find(
              (item) =>
                item._id?.toString() ===
                booking.serviceId?.toString()
            )
          : null;

        console.log("\nService matched by serviceId:");

        if (!service) {
          console.log("❌ SERVICE NOT FOUND");

          console.log("\nAvailable services:");

          if (Array.isArray(facility.services)) {
            for (const item of facility.services) {
              console.log({
                _id: item._id,
                name: item.name,
                slug: item.slug,
                type: item.type,
                pricingType: item.pricingType,
                price: item.price,
              });
            }
          }
        } else {
          console.log({
            _id: service._id,
            name: service.name,
            slug: service.slug,
            type: service.type,
            pricingType: service.pricingType,
            price: service.price,
            active: service.active,
          });

          // ------------------------------------------------------
          // Membership detection
          // ------------------------------------------------------

          const membershipSlugs = [
            "gym-monthly",
            "pool-monthly",
            "gym-pool-monthly",
          ];

          const isMembershipService =
            membershipSlugs.includes(service.slug);

          console.log("\nMembership detection:");

          console.log({
            serviceSlug: service.slug,
            isMembershipService,
          });

          if (!isMembershipService) {
            console.log(
              "❌ THIS SERVICE SLUG WILL NOT CREATE A MEMBERSHIP"
            );
          } else {
            console.log(
              "✓ THIS SERVICE SHOULD CREATE A MEMBERSHIP"
            );
          }
        }
      }

      console.log("\n");
    }

    console.log("======================================");
    console.log("DIAGNOSTIC COMPLETE");
    console.log("======================================");
  } catch (error) {
    console.error("\n❌ DIAGNOSTIC FAILED");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("\nMongoDB disconnected.");
  }
}

checkMembershipBooking();