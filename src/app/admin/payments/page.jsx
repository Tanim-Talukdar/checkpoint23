"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  MdArrowBack,
  MdCheckCircle,
  MdClose,
  MdContentCopy,
  MdErrorOutline,
  MdInfoOutline,
  MdPayment,
  MdRefresh,
  MdSearch,
  MdTrendingUp,
  MdWarning,
} from "react-icons/md";

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

const formatCurrency = (amount) =>
  `৳${Number(amount || 0).toLocaleString("en-BD")}`;

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getStatusClasses = (status) => {
  switch (status) {
    case "Paid":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "Pending":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";

    case "Failed":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    case "Refunded":
      return "border-violet-400/20 bg-violet-400/10 text-violet-300";

    default:
      return "border-white/10 bg-white/[0.04] text-gray-400";
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case "Paid":
      return MdCheckCircle;

    case "Pending":
      return MdWarning;

    case "Failed":
      return MdErrorOutline;

    case "Refunded":
      return MdRefresh;

    default:
      return MdInfoOutline;
  }
};

/* -------------------------------------------------------------------------- */
/* PAGE                                                                       */
/* -------------------------------------------------------------------------- */

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Statuses");
  const [type, setType] = useState("All Types");
  const [method, setMethod] = useState("All Methods");

  const [selectedTransaction, setSelectedTransaction] =
    useState(null);

  const [toast, setToast] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /* ------------------------------------------------------------------------ */
  /* LOAD TRANSACTIONS                                                        */
  /* ------------------------------------------------------------------------ */

  const loadTransactions = useCallback(
    async (showRefreshState = false) => {
      try {
        if (showRefreshState) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const params = new URLSearchParams();

        if (search.trim()) {
          params.set(
            "search",
            search.trim()
          );
        }

        if (
          status &&
          status !== "All Statuses"
        ) {
          params.set("status", status);
        }

        if (
          type &&
          type !== "All Types"
        ) {
          params.set("type", type);
        }

        if (
          method &&
          method !== "All Methods"
        ) {
          params.set("method", method);
        }

        const queryString =
          params.toString();

const response = await fetch(
  `/api/payment${
    queryString
      ? `?${queryString}`
      : ""
  }`,
  {
    method: "GET",
    cache: "no-store",
  }
);

        const result =
          await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Unable to load payments."
          );
        }

        setTransactions(
          Array.isArray(
            result.transactions
          )
            ? result.transactions
            : []
        );
      } catch (error) {
        console.error(
          "Failed to load payments:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load payments."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      search,
      status,
      type,
      method,
    ]
  );

  /* ------------------------------------------------------------------------ */
  /* INITIAL LOAD + FILTER DEBOUNCE                                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadTransactions(false);
    }, 250);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [loadTransactions]);

  /* ------------------------------------------------------------------------ */
  /* SUMMARY                                                                  */
  /* ------------------------------------------------------------------------ */

  const summary = useMemo(() => {
    const paidTransactions =
      transactions.filter(
        (transaction) =>
          transaction.status === "Paid"
      );

    const pendingTransactions =
      transactions.filter(
        (transaction) =>
          transaction.status === "Pending"
      );

    const failedTransactions =
      transactions.filter(
        (transaction) =>
          transaction.status === "Failed"
      );

    const paidAmount =
      paidTransactions.reduce(
        (sum, transaction) =>
          sum +
          Number(
            transaction.amount || 0
          ),
        0
      );

    const pendingAmount =
      pendingTransactions.reduce(
        (sum, transaction) =>
          sum +
          Number(
            transaction.amount || 0
          ),
        0
      );

    return {
      total: transactions.length,

      paid: paidTransactions.length,

      paidAmount,

      pending:
        pendingTransactions.length,

      pendingAmount,

      failed:
        failedTransactions.length,
    };
  }, [transactions]);

  /* ------------------------------------------------------------------------ */
  /* TOAST                                                                    */
  /* ------------------------------------------------------------------------ */

  const showToast = (message) => {
    setToast(message);

    window.setTimeout(() => {
      setToast("");
    }, 2500);
  };

  /* ------------------------------------------------------------------------ */
  /* RESET FILTERS                                                            */
  /* ------------------------------------------------------------------------ */

  const resetFilters = () => {
    setSearch("");
    setStatus("All Statuses");
    setType("All Types");
    setMethod("All Methods");
  };

  /* ------------------------------------------------------------------------ */
  /* REFRESH                                                                  */
  /* ------------------------------------------------------------------------ */

  const handleRefresh = async () => {
    await loadTransactions(true);

    showToast(
      "Transactions refreshed."
    );
  };

  /* ------------------------------------------------------------------------ */
  /* COPY                                                                     */
  /* ------------------------------------------------------------------------ */

  const handleCopy = async (value) => {
    if (!value) {
      showToast(
        "Nothing available to copy."
      );
      return;
    }

    try {
      if (
        navigator.clipboard &&
        typeof navigator.clipboard
          .writeText === "function"
      ) {
        await navigator.clipboard.writeText(
          value
        );

        showToast(
          "Copied to clipboard."
        );

        return;
      }

      showToast(
        "Unable to copy."
      );
    } catch {
      showToast(
        "Unable to copy."
      );
    }
  };

  /* ------------------------------------------------------------------------ */
  /* RENDER                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="min-h-screen bg-[#050A14] text-white">
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <header className="border-b border-white/[0.06] bg-[#050A14]/95 px-4 py-5 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3">
              <Link
                href="/admin"
                className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-gray-400 transition hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-white"
                aria-label="Back to dashboard"
              >
                <MdArrowBack size={20} />
              </Link>

              <div>
                <div className="mb-1 flex items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-400">
                    Finance
                  </p>

                  <span className="h-1 w-1 rounded-full bg-gray-700" />

                  <span className="text-[11px] uppercase tracking-[0.15em] text-gray-500">
                    Payments
                  </span>
                </div>

                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Payments & Transactions
                </h1>

                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  View booking and membership
                  payment transactions and
                  their current gateway status.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3.5 text-sm font-medium text-gray-300 transition hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MdRefresh
                size={18}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN                                                               */}
      {/* ------------------------------------------------------------------ */}

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {/* SUMMARY */}

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            icon={MdPayment}
            label="Transactions"
            value={summary.total}
            description="Loaded from database"
          />

          <SummaryCard
            icon={MdTrendingUp}
            label="Paid Revenue"
            value={formatCurrency(
              summary.paidAmount
            )}
            description={`${summary.paid} successful payments`}
          />

          <SummaryCard
            icon={MdWarning}
            label="Pending"
            value={formatCurrency(
              summary.pendingAmount
            )}
            description={`${summary.pending} awaiting payment`}
          />

          <SummaryCard
            icon={MdErrorOutline}
            label="Failed"
            value={summary.failed}
            description="Unsuccessful payments"
          />
        </section>

        {/* GATEWAY INFO */}

        <section className="mb-6 rounded-2xl border border-blue-400/10 bg-blue-500/[0.04] p-4">
          <div className="flex gap-3">
            <div className="mt-0.5 shrink-0 text-blue-400">
              <MdInfoOutline size={20} />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-200">
                Payment gateway
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Customer bookings use SSLCommerz.
                Payment status shown here comes
                from the booking records updated by
                the server-side payment flow.
              </p>
            </div>
          </div>
        </section>

        {/* ERROR */}

        {error && (
          <section className="mb-5 rounded-2xl border border-red-400/10 bg-red-500/[0.04] p-4">
            <div className="flex items-start gap-3">
              <MdErrorOutline
                size={20}
                className="mt-0.5 shrink-0 text-red-400"
              />

              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-300">
                  Unable to load payments
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {error}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* FILTERS */}

        <section className="mb-5 rounded-2xl border border-white/[0.06] bg-[#07101C] p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(240px,1.6fr)_repeat(3,minmax(150px,1fr))_auto]">
            <div className="relative">
              <MdSearch
                size={19}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search customer, transaction, booking..."
                className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.025] pl-10 pr-4 text-sm text-gray-200 outline-none placeholder:text-gray-600 focus:border-blue-500/40"
              />
            </div>

            <FilterSelect
              value={status}
              onChange={setStatus}
              options={[
                "All Statuses",
                "Paid",
                "Pending",
                "Failed",
                "Refunded",
              ]}
            />

            <FilterSelect
              value={type}
              onChange={setType}
              options={[
                "All Types",
                "Booking",
                "Membership",
              ]}
            />

            <FilterSelect
              value={method}
              onChange={setMethod}
              options={[
                "All Methods",
                "SSLCommerz",
              ]}
            />

            <button
              type="button"
              onClick={resetFilters}
              className="h-11 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 text-xs font-semibold text-gray-400 transition hover:bg-white/[0.05] hover:text-white"
            >
              Reset
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-[11px] text-gray-600">
              Showing{" "}
              <span className="font-medium text-gray-400">
                {transactions.length}
              </span>{" "}
              transactions
            </p>
          </div>
        </section>

        {/* TABLE */}

        <section className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#07101C]">
          {loading ? (
            <LoadingState />
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1100px]">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left">
                      <TableHead>
                        Transaction
                      </TableHead>

                      <TableHead>
                        Customer
                      </TableHead>

                      <TableHead>
                        Service
                      </TableHead>

                      <TableHead>
                        Amount
                      </TableHead>

                      <TableHead>
                        Method
                      </TableHead>

                      <TableHead>
                        Status
                      </TableHead>

                      <TableHead>
                        Date
                      </TableHead>

                      <TableHead align="right">
                        Action
                      </TableHead>
                    </tr>
                  </thead>

                  <tbody>
                    {transactions.map(
                      (transaction) => (
                        <TransactionRow
                          key={
                            transaction.id
                          }
                          transaction={
                            transaction
                          }
                          onView={() =>
                            setSelectedTransaction(
                              transaction
                            )
                          }
                        />
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE */}

              <div className="divide-y divide-white/[0.06] lg:hidden">
                {transactions.map(
                  (transaction) => (
                    <MobileTransactionRow
                      key={
                        transaction.id
                      }
                      transaction={
                        transaction
                      }
                      onView={() =>
                        setSelectedTransaction(
                          transaction
                        )
                      }
                    />
                  )
                )}
              </div>

              {transactions.length ===
                0 && <EmptyState />}
            </>
          )}
        </section>
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* DETAILS MODAL                                                      */}
      {/* ------------------------------------------------------------------ */}

      {selectedTransaction && (
        <TransactionModal
          transaction={
            selectedTransaction
          }
          onClose={() =>
            setSelectedTransaction(null)
          }
          onCopy={handleCopy}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TOAST                                                              */}
      {/* ------------------------------------------------------------------ */}

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-[#0A1624] px-4 py-3 text-sm font-medium text-gray-200 shadow-2xl shadow-black/40">
            <MdCheckCircle
              size={19}
              className="text-emerald-400"
            />

            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SUMMARY CARD                                                               */
/* -------------------------------------------------------------------------- */

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#07101C] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500">
            {label}
          </p>

          <p className="mt-2 truncate text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-gray-600">
            {description}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.035] text-gray-400">
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TABLE HEAD                                                                 */
/* -------------------------------------------------------------------------- */

function TableHead({
  children,
  align,
}) {
  return (
    <th
      className={`px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-600 ${
        align === "right"
          ? "text-right"
          : ""
      }`}
    >
      {children}
    </th>
  );
}

/* -------------------------------------------------------------------------- */
/* DESKTOP ROW                                                                */
/* -------------------------------------------------------------------------- */

function TransactionRow({
  transaction,
  onView,
}) {
  const StatusIcon =
    getStatusIcon(
      transaction.status
    );

  return (
    <tr className="border-b border-white/[0.045] last:border-b-0">
      <td className="px-5 py-4">
        <p className="text-xs font-semibold text-gray-200">
          {transaction.id}
        </p>

        <p className="mt-1 text-[10px] text-gray-600">
          {transaction.bookingGroupReference}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="text-xs font-medium text-gray-300">
          {transaction.customer}
        </p>

        <p className="mt-1 text-[10px] text-gray-600">
          {transaction.phone}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="text-xs font-medium text-gray-300">
          {transaction.service}
        </p>

        <p className="mt-1 text-[10px] text-gray-600">
          {transaction.facility}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-semibold text-white">
          {formatCurrency(
            transaction.amount
          )}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="text-xs text-gray-300">
          {transaction.method}
        </p>

        <p className="mt-1 text-[10px] text-gray-600">
          {transaction.gateway}
        </p>
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${getStatusClasses(
            transaction.status
          )}`}
        >
          <StatusIcon size={13} />

          {transaction.status}
        </span>
      </td>

      <td className="px-5 py-4">
        <p className="text-xs text-gray-400">
          {formatDate(
            transaction.date
          )}
        </p>

        <p className="mt-1 text-[10px] text-gray-600">
          {formatDateTime(
            transaction.paymentDate
          )}
        </p>
      </td>

      <td className="px-5 py-4 text-right">
        <button
          type="button"
          onClick={onView}
          className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-[10px] font-semibold text-gray-400 transition hover:bg-white/[0.05] hover:text-white"
        >
          View
        </button>
      </td>
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* MOBILE ROW                                                                 */
/* -------------------------------------------------------------------------- */

function MobileTransactionRow({
  transaction,
  onView,
}) {
  const StatusIcon =
    getStatusIcon(
      transaction.status
    );

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-gray-200">
            {transaction.id}
          </p>

          <p className="mt-1 truncate text-[10px] text-gray-600">
            {transaction.bookingGroupReference}
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.08em] ${getStatusClasses(
            transaction.status
          )}`}
        >
          <StatusIcon size={12} />

          {transaction.status}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-300">
            {transaction.customer}
          </p>

          <p className="mt-1 text-xs text-gray-600">
            {transaction.service}
          </p>
        </div>

        <p className="text-sm font-semibold text-white">
          {formatCurrency(
            transaction.amount
          )}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3">
        <div>
          <p className="text-[10px] text-gray-600">
            {formatDate(
              transaction.date
            )}
          </p>

          <p className="mt-1 text-[10px] text-gray-600">
            {transaction.gateway}
          </p>
        </div>

        <button
          type="button"
          onClick={onView}
          className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-[10px] font-semibold text-gray-400 transition hover:bg-white/[0.05] hover:text-white"
        >
          View Details
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* FILTER SELECT                                                              */
/* -------------------------------------------------------------------------- */

function FilterSelect({
  value,
  onChange,
  options,
}) {
  return (
    <select
      value={value}
      onChange={(event) =>
        onChange(
          event.target.value
        )
      }
      className="h-11 w-full appearance-none rounded-xl border border-white/[0.08] bg-white/[0.025] px-3.5 text-xs text-gray-300 outline-none focus:border-blue-500/40"
    >
      {options.map((option) => (
        <option
          key={option}
          value={option}
          className="bg-[#07101C]"
        >
          {option}
        </option>
      ))}
    </select>
  );
}

/* -------------------------------------------------------------------------- */
/* LOADING STATE                                                              */
/* -------------------------------------------------------------------------- */

function LoadingState() {
  return (
    <div className="flex min-h-[360px] items-center justify-center">
      <div className="text-center">
        <MdRefresh
          size={32}
          className="mx-auto animate-spin text-blue-400"
        />

        <p className="mt-4 text-sm font-medium text-gray-300">
          Loading transactions...
        </p>

        <p className="mt-1 text-xs text-gray-600">
          Reading payment records from the database.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* EMPTY STATE                                                                */
/* -------------------------------------------------------------------------- */

function EmptyState() {
  return (
    <div className="px-6 py-16 text-center">
      <MdPayment
        size={34}
        className="mx-auto text-gray-700"
      />

      <p className="mt-3 text-sm font-semibold text-gray-300">
        No transactions found
      </p>

      <p className="mt-1 text-xs text-gray-600">
        Try changing your search or filters.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TRANSACTION MODAL                                                          */
/* -------------------------------------------------------------------------- */

function TransactionModal({
  transaction,
  onClose,
  onCopy,
}) {
  const StatusIcon =
    getStatusIcon(
      transaction.status
    );

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/[0.08] bg-[#07101C] shadow-2xl shadow-black/60">
        {/* HEADER */}

        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-white/[0.06] bg-[#07101C]/95 p-5 backdrop-blur-xl">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-400">
              Transaction Details
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              {transaction.id}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition hover:bg-white/[0.05] hover:text-white"
            aria-label="Close"
          >
            <MdClose size={20} />
          </button>
        </div>

        <div className="p-5">
          {/* STATUS */}

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.13em] text-gray-600">
                  Payment Status
                </p>

                <div className="mt-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] ${getStatusClasses(
                      transaction.status
                    )}`}
                  >
                    <StatusIcon size={13} />

                    {transaction.status}
                  </span>
                </div>
              </div>

              <div className="sm:text-right">
                <p className="text-[10px] uppercase tracking-[0.13em] text-gray-600">
                  Amount
                </p>

                <p className="mt-1 text-2xl font-semibold text-white">
                  {formatCurrency(
                    transaction.amount
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* CUSTOMER */}

          <DetailSection title="Customer">
            <DetailRow
              label="Name"
              value={
                transaction.customer
              }
            />

            <DetailRow
              label="Email"
              value={
                transaction.email
              }
            />

            <DetailRow
              label="Phone"
              value={
                transaction.phone
              }
            />
          </DetailSection>

          {/* BOOKING */}

          <DetailSection title="Booking">
            <DetailRow
              label="Booking Reference"
              value={
                transaction.bookingId
              }
            />

            <DetailRow
              label="Booking Group"
              value={
                transaction.bookingGroupReference
              }
            />

            <DetailRow
              label="Type"
              value={
                transaction.type
              }
            />

            <DetailRow
              label="Service"
              value={
                transaction.service
              }
            />

            <DetailRow
              label="Facility"
              value={
                transaction.facility
              }
            />

            <DetailRow
              label="Date"
              value={formatDate(
                transaction.date
              )}
            />

            <DetailRow
              label="Time"
              value={
                transaction.time
              }
            />

            {transaction.movieName && (
              <DetailRow
                label="Movie"
                value={
                  transaction.movieName
                }
              />
            )}

            <DetailRow
              label="Quantity"
              value={
                transaction.quantity
              }
            />

            <DetailRow
              label="Booking Status"
              value={
                transaction.bookingStatus
              }
            />
          </DetailSection>

          {/* PAYMENT */}

          <DetailSection title="Payment">
            <DetailRow
              label="Payment Method"
              value={
                transaction.paymentMethod ||
                transaction.method
              }
            />

            <DetailRow
              label="Gateway"
              value={
                transaction.gateway
              }
            />

            <CopyableRow
              label="Gateway Transaction ID"
              value={
                transaction.transactionId
              }
              onCopy={onCopy}
            />

            <CopyableRow
              label="Booking Reference"
              value={
                transaction.bookingId
              }
              onCopy={onCopy}
            />

            <DetailRow
              label="Payment Initiated"
              value={formatDateTime(
                transaction.paymentInitiatedAt
              )}
            />

            <DetailRow
              label="Payment Paid"
              value={formatDateTime(
                transaction.paymentPaidAt
              )}
            />

            <DetailRow
              label="Bank Transaction ID"
              value={
                transaction.paymentBankTransactionId
              }
            />

            <DetailRow
              label="Card Type"
              value={
                transaction.paymentCardType
              }
            />

            <DetailRow
              label="Validation ID"
              value={
                transaction.paymentValidationId
              }
            />
          </DetailSection>
        </div>

        {/* FOOTER */}

        <div className="border-t border-white/[0.06] p-5">
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-full rounded-xl bg-blue-500 text-sm font-semibold text-white transition hover:bg-blue-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* DETAIL SECTION                                                             */
/* -------------------------------------------------------------------------- */

function DetailSection({
  title,
  children,
}) {
  return (
    <div className="mt-6">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-600">
        {title}
      </p>

      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.018]">
        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* DETAIL ROW                                                                 */
/* -------------------------------------------------------------------------- */

function DetailRow({
  label,
  value,
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/[0.05] px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
      <span className="text-[11px] text-gray-600">
        {label}
      </span>

      <span className="break-all text-xs font-medium text-gray-300 sm:text-right">
        {value || "—"}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* COPYABLE ROW                                                               */
/* -------------------------------------------------------------------------- */

function CopyableRow({
  label,
  value,
  onCopy,
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-white/[0.05] px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
      <span className="text-[11px] text-gray-600">
        {label}
      </span>

      <button
        type="button"
        disabled={!value}
        onClick={() => onCopy(value)}
        className="group inline-flex max-w-full items-center gap-2 text-left disabled:cursor-not-allowed disabled:opacity-40 sm:justify-end"
      >
        <span className="break-all text-xs font-medium text-gray-300 transition group-hover:text-white">
          {value || "—"}
        </span>

        {value && (
          <MdContentCopy
            size={14}
            className="shrink-0 text-gray-600 transition group-hover:text-blue-400"
          />
        )}
      </button>
    </div>
  );
}