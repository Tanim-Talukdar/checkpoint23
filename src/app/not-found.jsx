
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiArrowUpRight,
  FiAlertTriangle,
} from "react-icons/fi";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030712] px-6 text-white">

      {/* =====================================================
          BACKGROUND
      ====================================================== */}

      <div className="pointer-events-none absolute inset-0">

        {/* Blue glow */}

        <motion.div
          initial={{
            opacity: 0,
            scale: 0.5,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            duration: 1.5,
            ease: "easeOut",
          }}
          className="
            absolute
            left-1/2
            top-1/2
            h-[500px]
            w-[500px]
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            bg-blue-600/[0.08]
            blur-[140px]
          "
        />

        {/* Grid */}

        <div
          className="
            absolute
            inset-0
            opacity-[0.035]
            [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)]
            [background-size:60px_60px]
          "
        />

        {/* Vignette */}

        <div
          className="
            absolute
            inset-0
            bg-[radial-gradient(circle_at_center,transparent_0%,#030712_75%)]
          "
        />

      </div>


      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="relative z-10 mx-auto w-full max-w-3xl text-center">

        {/* =================================================
            LOGO
        ================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: -20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.6,
          }}
          className="mb-10 flex justify-center"
        >

          <Link
            href="/"
            className="group flex items-center gap-3"
          >

            {/* Logo */}

            <motion.div
              whileHover={{
                scale: 1.08,
                rotate: -4,
              }}
              whileTap={{
                scale: 0.95,
              }}
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-lg
                bg-blue-600
                shadow-[0_0_30px_rgba(37,99,235,0.25)]
              "
            >
              <span className="text-xl font-black italic">
                C
              </span>
            </motion.div>

            {/* Logo text */}

            <div className="text-left leading-none">

              <h1 className="text-[15px] font-black tracking-[0.08em]">
                THE CHECKPOINT
              </h1>

              <p className="mt-1 text-[7px] font-medium tracking-[0.3em] text-slate-500">
                GAMING · DINING · FITNESS
              </p>

            </div>

          </Link>

        </motion.div>


        {/* =================================================
            ERROR LABEL
        ================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.15,
            duration: 0.6,
          }}
          className="
            mb-5
            flex
            items-center
            justify-center
            gap-3
          "
        >

          <motion.div
            animate={{
              rotate: [0, -8, 8, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 2,
            }}
          >
            <FiAlertTriangle
              size={13}
              className="text-blue-500"
            />
          </motion.div>

          <span
            className="
              text-[10px]
              font-bold
              uppercase
              tracking-[0.35em]
              text-blue-400
            "
          >
            SYSTEM ERROR
          </span>

          <motion.div
            animate={{
              rotate: [0, 8, -8, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 2,
            }}
          >
            <FiAlertTriangle
              size={13}
              className="text-blue-500"
            />
          </motion.div>

        </motion.div>


        {/* =================================================
            404
        ================================================== */}

        <motion.h2
          initial={{
            opacity: 0,
            scale: 0.8,
            y: 20,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          transition={{
            delay: 0.25,
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="
            text-[clamp(8rem,25vw,16rem)]
            font-black
            leading-[0.7]
            tracking-[-0.09em]
          "
        >

          4

          <motion.span
            animate={{
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-blue-500"
          >
            0
          </motion.span>

          4

        </motion.h2>


        {/* =================================================
            MESSAGE
        ================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 25,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.45,
            duration: 0.7,
          }}
        >

          <h3
            className="
              mt-10
              text-2xl
              font-black
              tracking-[-0.03em]
              sm:text-3xl
            "
          >
            YOU LEFT THE ARENA.
          </h3>

          <p
            className="
              mx-auto
              mt-4
              max-w-md
              text-sm
              leading-7
              text-slate-500
            "
          >
            Looks like this page doesn't exist.
            Maybe you took a wrong turn between
            the gaming zone and the restaurant.
          </p>

        </motion.div>


        {/* =================================================
            BUTTONS
        ================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 25,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.6,
            duration: 0.6,
          }}
          className="
            mt-9
            flex
            flex-wrap
            items-center
            justify-center
            gap-3
          "
        >

          {/* ================= BACK HOME ================= */}

          <motion.div
            whileHover={{
              y: -4,
              scale: 1.02,
            }}
            whileTap={{
              scale: 0.97,
            }}
          >

            <Link
              href="/"
              className="
                group
                flex
                items-center
                gap-3
                rounded-xl
                bg-blue-600
                px-6
                py-4
                text-xs
                font-black
                tracking-wide
                shadow-lg
                shadow-blue-600/10
                transition
                hover:bg-blue-500
                hover:shadow-[0_10px_35px_rgba(37,99,235,0.25)]
              "
            >

              <motion.span
                whileHover={{
                  x: -3,
                }}
              >
                <FiArrowLeft size={15} />
              </motion.span>

              BACK TO HOME

            </Link>

          </motion.div>


          {/* ================= EXPLORE ================= */}

          <motion.div
            whileHover={{
              y: -4,
              scale: 1.02,
            }}
            whileTap={{
              scale: 0.97,
            }}
          >

            <Link
              href="/#experience"
              className="
                group
                flex
                items-center
                gap-3
                rounded-xl
                border
                border-white/10
                bg-white/[0.03]
                px-6
                py-4
                text-xs
                font-bold
                tracking-wide
                text-white/70
                backdrop-blur-md
                transition
                hover:border-white/20
                hover:bg-white/[0.06]
                hover:text-white
              "
            >

              EXPLORE CHECKPOINT

              <motion.span
                whileHover={{
                  x: 4,
                  y: -4,
                }}
              >
                <FiArrowUpRight size={15} />
              </motion.span>

            </Link>

          </motion.div>

        </motion.div>


        {/* =================================================
            SYSTEM STATUS
        ================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 1,
            duration: 0.6,
          }}
          className="
            mx-auto
            mt-14
            flex
            w-fit
            items-center
            gap-3
            rounded-full
            border
            border-white/10
            bg-white/[0.02]
            px-4
            py-2
          "
        >

          {/* Status dot */}

          <motion.span
            animate={{
              opacity: [0.4, 1, 0.4],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="
              h-1.5
              w-1.5
              rounded-full
              bg-blue-500
              shadow-[0_0_10px_rgba(59,130,246,0.8)]
            "
          />

          {/* Simple icon using guaranteed Feather icon */}

          <FiArrowUpRight
            size={13}
            className="text-white/30"
          />

          <span
            className="
              text-[9px]
              font-bold
              tracking-[0.2em]
              text-white/30
            "
          >
            CHECKPOINT ONLINE
          </span>

        </motion.div>

      </div>


      {/* =====================================================
          CORNER DETAILS
      ====================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          x: -15,
          y: -15,
        }}
        animate={{
          opacity: 1,
          x: 0,
          y: 0,
        }}
        transition={{
          delay: 0.8,
          duration: 0.6,
        }}
        className="
          pointer-events-none
          absolute
          left-6
          top-6
          h-16
          w-16
          border-l
          border-t
          border-blue-500/20
        "
      />

      <motion.div
        initial={{
          opacity: 0,
          x: 15,
          y: 15,
        }}
        animate={{
          opacity: 1,
          x: 0,
          y: 0,
        }}
        transition={{
          delay: 0.8,
          duration: 0.6,
        }}
        className="
          pointer-events-none
          bottom-6
          right-6
          h-16
          w-16
          border-b
          border-r
          border-blue-500/20
        "
      />

    </main>
  );
}

