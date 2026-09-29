"use client";

import { useCallback, useEffect, useState } from "react";
import {
FiCreditCard,
FiDollarSign,
FiDownload,
FiEye,
FiRefreshCw,
FiSearch,
FiX,
} from "react-icons/fi";

const statusStyles = {
paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
failed: "bg-red-500/10 text-red-400 border-red-500/20",
cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
confirmed:
"bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

function formatMoney(amount) {
return `৳${Number(amount || 0).toLocaleString("en-BD")}`;
}

function formatDate(date) {
if (!date) return "—";

try {
return new Date(date).toLocaleString("en-BD", {
day: "2-digit",
month: "short",
year: "numeric",
hour: "2-digit",
minute: "2-digit",
});
} catch {
return "—";
}
}

function formatShowDate(date) {
if (!date) return "—";

try {
return new Date(date).toLocaleDateString("en-BD", {
day: "2-digit",
month: "short",
year: "numeric",
});
} catch {
return String(date);
}
}

function StatusBadge({ status }) {
const value = status || "pending";

return (
<span
className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize ${
        statusStyles[value] ||
        "border-white/10 bg-white/5 text-white/60"
      }`}
>
{value} </span>
);
}

function StatCard({ title, value, icon: Icon }) {
return ( <div className="rounded-2xl border border-white/[0.07] bg-[#080F1C] p-5"> <div className="flex items-start justify-between"> <div> <p className="text-xs font-medium uppercase tracking-wider text-white/35">
{title} </p>

      <p className="mt-3 text-2xl font-bold text-white">
        {value}
      </p>
    </div>

    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
      <Icon size={19} />
    </div>
  </div>
</div>


);
}

function getMovieName(payment) {
return (
payment?.movie?.title ||
payment?.movieSnapshot?.title ||
payment?.movieId?.title ||
payment?.manualMovieName ||
payment?.movieName ||
"Movie Name"
);
}

function getDate(payment) {
return (
payment?.showtime?.date ||
payment?.showtimeSnapshot?.date ||
payment?.showtimeId?.date ||
payment?.date ||
""
);
}

function getTime(payment) {
return (
payment?.showtime?.startTime ||
payment?.showtimeSnapshot?.startTime ||
payment?.showtimeId?.startTime ||
payment?.time ||
"—"
);
}

function getHall(payment) {
return (
payment?.hall?.name ||
payment?.hallName ||
payment?.hallId?.name ||
"—"
);
}

function getCustomer(payment) {
return {
name:
payment?.customer?.name ||
payment?.customerName ||
"—",


email:
  payment?.customer?.email ||
  payment?.email ||
  "—",

phone:
  payment?.customer?.phone ||
  payment?.phone ||
  "—",


};
}

function getSeats(payment) {
if (payment?.bookingType === "full-hall") {
return "Full Hall";
}

if (
Array.isArray(payment?.seats) &&
payment.seats.length > 0
) {
return payment.seats.join(", ");
}

return "—";
}

function getBookingType(payment) {
return payment?.bookingType === "full-hall"
? "Full Hall"
: "Seat";
}

function getRecordType(payment) {
return payment?.recordType === "manual"
? "Manual"
: "Online";
}

function getPaymentMethod(payment) {
return (
payment?.payment?.paymentMethod ||
payment?.paymentMethod ||
(payment?.recordType === "manual"
? "Cash"
: "Online")
);
}

function InfoItem({ label, value }) {
return ( <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"> <p className="text-[10px] uppercase tracking-wider text-white/30">
{label} </p>

  <p className="mt-1.5 break-words text-sm text-white/75">
    {value || "—"}
  </p>
</div>


);
}

function PaymentDetails({ payment, onClose }) {
if (!payment) return null;

const customer = getCustomer(payment);

return ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"> <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#080F1C] shadow-2xl"> <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.07] bg-[#080F1C] px-6 py-5"> <div> <h2 className="text-lg font-semibold text-white">
Payment Details </h2>


        <p className="mt-1 text-xs text-white/35">
          {payment.bookingId ||
            payment._id ||
            "Booking"}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/5 hover:text-white"
      >
        <FiX size={19} />
      </button>
    </div>

    <div className="space-y-6 p-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/30">
            Type
          </p>

          <p className="mt-2 text-sm font-medium text-white">
            {getRecordType(payment)}
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/30">
            Booking
          </p>

          <p className="mt-2 text-sm font-medium text-white">
            {getBookingType(payment)}
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/30">
            Payment
          </p>

          <div className="mt-2">
            <StatusBadge
              status={payment.paymentStatus}
            />
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/30">
            Booking Status
          </p>

          <div className="mt-2">
            <StatusBadge
              status={payment.bookingStatus}
            />
          </div>
        </div>
      </div>

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/35">
          Customer
        </h3>

        <div className="grid gap-3 sm:grid-cols-3">
          <InfoItem
            label="Name"
            value={customer.name}
          />

          <InfoItem
            label="Email"
            value={customer.email}
          />

          <InfoItem
            label="Phone"
            value={customer.phone}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/35">
          Booking
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoItem
            label="Movie"
            value={getMovieName(payment)}
          />

          <InfoItem
            label="Hall"
            value={getHall(payment)}
          />

          <InfoItem
            label="Date"
            value={formatShowDate(
              getDate(payment)
            )}
          />

          <InfoItem
            label="Time"
            value={getTime(payment)}
          />

          <InfoItem
            label="Seats"
            value={getSeats(payment)}
          />

          <InfoItem
            label="Amount"
            value={formatMoney(
              payment.totalAmount
            )}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/35">
          Payment Information
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoItem
            label="Payment Method"
            value={getPaymentMethod(payment)}
          />

          <InfoItem
            label="Transaction ID"
            value={
              payment?.payment?.tranId ||
              "—"
            }
          />

          <InfoItem
            label="Bank Transaction ID"
            value={
              payment?.payment?.bankTranId ||
              "—"
            }
          />

          <InfoItem
            label="Validation ID"
            value={
              payment?.payment?.valId ||
              "—"
            }
          />
        </div>
      </section>

      {payment.notes && (
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/35">
            Notes
          </h3>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm leading-6 text-white/60">
            {payment.notes}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/35">
          Timestamps
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoItem
            label="Created"
            value={formatDate(
              payment.createdAt
            )}
          />

          <InfoItem
            label="Updated"
            value={formatDate(
              payment.updatedAt
            )}
          />
        </div>
      </section>
    </div>
  </div>
</div>


);
}

export default function AdminPaymentsPage() {
const [payments, setPayments] = useState([]);

const [stats, setStats] = useState({
totalBookings: 0,
paidCount: 0,
pendingCount: 0,
failedCount: 0,
cancelledCount: 0,
totalRevenue: 0,
});

const [search, setSearch] = useState("");
const [paymentStatus, setPaymentStatus] =
useState("all");
const [bookingStatus, setBookingStatus] =
useState("all");

const [page, setPage] = useState(1);

const [pagination, setPagination] =
useState({
page: 1,
limit: 10,
total: 0,
totalPages: 1,
});

const [loading, setLoading] = useState(true);
const [exporting, setExporting] =
useState(false);

const [error, setError] = useState("");
const [selectedPayment, setSelectedPayment] =
useState(null);

const fetchPayments = useCallback(
async () => {
try {
setLoading(true);
setError("");


    const params =
      new URLSearchParams();

    params.set("page", String(page));
    params.set("limit", "10");
    params.set("search", search);
    params.set(
      "paymentStatus",
      paymentStatus
    );
    params.set(
      "bookingStatus",
      bookingStatus
    );

    const response = await fetch(
      `/api/payment?${params.toString()}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const data =
      await response.json();

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
          "Failed to fetch payments"
      );
    }

    setPayments(
      data.payments || []
    );

    setPagination(
      data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
      }
    );

    setStats(
      data.stats || {
        totalBookings: 0,
        paidCount: 0,
        pendingCount: 0,
        failedCount: 0,
        cancelledCount: 0,
        totalRevenue: 0,
      }
    );
  } catch (err) {
    console.error(err);

    setError(
      err.message ||
        "Failed to fetch payments"
    );

    setPayments([]);
  } finally {
    setLoading(false);
  }
},
[
  page,
  search,
  paymentStatus,
  bookingStatus,
]


);

useEffect(() => {
fetchPayments();
}, [fetchPayments]);

useEffect(() => {
setPage(1);
}, [
search,
paymentStatus,
bookingStatus,
]);

async function downloadExcel() {
try {
setExporting(true);

  const params =
    new URLSearchParams();

  params.set("search", search);
  params.set(
    "paymentStatus",
    paymentStatus
  );
  params.set(
    "bookingStatus",
    bookingStatus
  );

  const response = await fetch(
    `/api/payment/export?${params.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    let message =
      "Failed to export payments";

    try {
      const data =
        await response.json();

      message =
        data.message || message;
    } catch {}

    throw new Error(message);
  }

  const blob =
    await response.blob();

  const url =
    window.URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    `checkpoint-payments-${new Date()
      .toISOString()
      .slice(0, 10)}.xls`;

  document.body.appendChild(link);

  link.click();

  link.remove();

  window.URL.revokeObjectURL(url);
} catch (err) {
  console.error(err);

  alert(
    err.message ||
      "Failed to download Excel file"
  );
} finally {
  setExporting(false);
}


}

function resetFilters() {
setSearch("");
setPaymentStatus("all");
setBookingStatus("all");
setPage(1);
}

return ( <div className="min-h-screen bg-[#030712] text-white"> <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
{/* Header */} <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"> <div> <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
Payments </h1>

```
        <p className="mt-2 text-sm text-white/40">
          Manage movie booking payments
          and transactions.
        </p>
      </div>

      <button
        type="button"
        onClick={downloadExcel}
        disabled={exporting}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {exporting ? (
          <FiRefreshCw
            size={17}
            className="animate-spin"
          />
        ) : (
          <FiDownload size={17} />
        )}

        {exporting
          ? "Preparing..."
          : "Download Excel"}
      </button>
    </div>

    {/* Stats */}
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        title="Total Bookings"
        value={stats.totalBookings}
        icon={FiCreditCard}
      />

      <StatCard
        title="Paid"
        value={stats.paidCount}
        icon={FiDollarSign}
      />

      <StatCard
        title="Pending"
        value={stats.pendingCount}
        icon={FiCreditCard}
      />

      <StatCard
        title="Failed"
        value={stats.failedCount}
        icon={FiCreditCard}
      />

      <StatCard
        title="Cancelled"
        value={stats.cancelledCount}
        icon={FiCreditCard}
      />

      <StatCard
        title="Revenue"
        value={formatMoney(
          stats.totalRevenue
        )}
        icon={FiDollarSign}
      />
    </div>

    {/* Filters */}
    <div className="mb-6 rounded-2xl border border-white/[0.07] bg-[#080F1C] p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <FiSearch
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          />

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search customer, phone, email, booking ID, transaction..."
            className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-blue-500/40"
          />
        </div>

        <select
          value={paymentStatus}
          onChange={(e) =>
            setPaymentStatus(
              e.target.value
            )
          }
          className="h-11 rounded-xl border border-white/[0.08] bg-[#080F1C] px-4 text-sm text-white/70 outline-none focus:border-blue-500/40"
        >
          <option value="all">
            All Payment Status
          </option>
          <option value="paid">Paid</option>
          <option value="pending">
            Pending
          </option>
          <option value="failed">
            Failed
          </option>
          <option value="cancelled">
            Cancelled
          </option>
        </select>

        <select
          value={bookingStatus}
          onChange={(e) =>
            setBookingStatus(
              e.target.value
            )
          }
          className="h-11 rounded-xl border border-white/[0.08] bg-[#080F1C] px-4 text-sm text-white/70 outline-none focus:border-blue-500/40"
        >
          <option value="all">
            All Booking Status
          </option>
          <option value="confirmed">
            Confirmed
          </option>
          <option value="pending">
            Pending
          </option>
          <option value="cancelled">
            Cancelled
          </option>
        </select>

        <button
          type="button"
          onClick={resetFilters}
          className="h-11 rounded-xl border border-white/[0.08] px-4 text-sm text-white/50 transition hover:bg-white/5 hover:text-white"
        >
          Reset
        </button>
      </div>
    </div>

    {/* Error */}
    {error && (
      <div className="mb-6 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
        <span>{error}</span>

        <button
          type="button"
          onClick={fetchPayments}
          className="inline-flex items-center gap-2 text-xs font-medium text-white/60 hover:text-white"
        >
          <FiRefreshCw size={14} />
          Retry
        </button>
      </div>
    )}

    {/* Table */}
    <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#080F1C]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead>
            <tr className="border-b border-white/[0.07]">
              <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-white/30">
                Customer
              </th>

              <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-white/30">
                Movie
              </th>

              <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-white/30">
                Showtime
              </th>

              <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-white/30">
                Seats
              </th>

              <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-white/30">
                Amount
              </th>

              <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-white/30">
                Payment
              </th>

              <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-white/30">
                Date
              </th>

              <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-wider text-white/30">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-16 text-center"
                >
                  <div className="flex items-center justify-center gap-3 text-sm text-white/40">
                    <FiRefreshCw
                      size={17}
                      className="animate-spin"
                    />
                    Loading payments...
                  </div>
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-16 text-center"
                >
                  <div className="mx-auto flex max-w-sm flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-white/30">
                      <FiCreditCard
                        size={22}
                      />
                    </div>

                    <p className="mt-4 text-sm font-medium text-white/60">
                      No payments found
                    </p>

                    <p className="mt-1 text-xs text-white/30">
                      Try changing your
                      search or filters.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              payments.map((payment) => {
                const customer =
                  getCustomer(payment);

                return (
                  <tr
                    key={
                      payment._id ||
                      payment.bookingId
                    }
                    className="border-b border-white/[0.05] transition hover:bg-white/[0.015]"
                  >
                    <td className="px-5 py-4">
                      <div className="max-w-[210px]">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-white">
                            {customer.name}
                          </p>

                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                              payment.recordType ===
                              "manual"
                                ? "bg-orange-500/10 text-orange-400"
                                : "bg-blue-500/10 text-blue-400"
                            }`}
                          >
                            {getRecordType(
                              payment
                            )}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-xs text-white/30">
                          {customer.phone}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="max-w-[180px]">
                        <p className="truncate text-sm text-white/75">
                          {getMovieName(
                            payment
                          )}
                        </p>

                        <p className="mt-1 text-[11px] text-white/30">
                          {getBookingType(
                            payment
                          )}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm text-white/70">
                          {formatShowDate(
                            getDate(payment)
                          )}
                        </p>

                        <p className="mt-1 text-xs text-white/30">
                          {getTime(payment)}{" "}
                          ·{" "}
                          {getHall(payment)}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="max-w-[130px] truncate text-sm text-white/60">
                        {getSeats(payment)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-white">
                        {formatMoney(
                          payment.totalAmount
                        )}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-1.5">
                        <StatusBadge
                          status={
                            payment.paymentStatus
                          }
                        />

                        <p className="text-[10px] capitalize text-white/30">
                          {getPaymentMethod(
                            payment
                          )}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="whitespace-nowrap text-xs text-white/45">
                        {formatDate(
                          payment.createdAt
                        )}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPayment(
                            payment
                          )
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-white/40 transition hover:bg-white/5 hover:text-white"
                        title="View payment"
                      >
                        <FiEye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading &&
        pagination.total > 0 && (
          <div className="flex flex-col gap-3 border-t border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-white/30">
              Showing{" "}
              <span className="text-white/60">
                {(pagination.page - 1) *
                  pagination.limit +
                  1}
              </span>{" "}
              to{" "}
              <span className="text-white/60">
                {Math.min(
                  pagination.page *
                    pagination.limit,
                  pagination.total
                )}
              </span>{" "}
              of{" "}
              <span className="text-white/60">
                {pagination.total}
              </span>{" "}
              payments
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={
                  pagination.page <= 1
                }
                onClick={() =>
                  setPage(
                    pagination.page - 1
                  )
                }
                className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-white/50 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                Previous
              </button>

              <span className="px-2 text-xs text-white/40">
                {pagination.page} /{" "}
                {pagination.totalPages}
              </span>

              <button
                type="button"
                disabled={
                  pagination.page >=
                  pagination.totalPages
                }
                onClick={() =>
                  setPage(
                    pagination.page + 1
                  )
                }
                className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs text-white/50 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        )}
    </div>
  </div>

  {selectedPayment && (
    <PaymentDetails
      payment={selectedPayment}
      onClose={() =>
        setSelectedPayment(null)
      }
    />
  )}
</div>


);
}
