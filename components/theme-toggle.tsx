"use client";

import { useTheme } from "next-themes";
import { motion, useAnimation } from "motion/react";

function MoonIcon() {
  const controls = useAnimation();

  return (
    <div
      className='inline-flex items-center justify-center overflow-hidden dark:hidden'
      onMouseEnter={() => controls.start("animate")}
    >
      <motion.svg
        width={24}
        height={24}
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth={2}
        strokeLinecap='round'
        strokeLinejoin='round'
        xmlns='http://www.w3.org/2000/svg'
        className='size-5 md:size-6'
        animate={controls}
        variants={{
          normal: { rotate: 0 },
          animate: { rotate: [0, -10, 10, -5, 5, 0] },
        }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      >
        <path d='M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z' />
      </motion.svg>
    </div>
  );
}

function SunIcon() {
  const controls = useAnimation();

  const rays = [
    "M12 2v2",
    "m19.07 4.93-1.41 1.41",
    "M20 12h2",
    "m17.66 17.66 1.41 1.41",
    "M12 20v2",
    "m6.34 17.66-1.41 1.41",
    "M2 12h2",
    "m4.93 4.93 1.41 1.41",
  ];

  return (
    <div
      className='hidden items-center justify-center dark:inline-flex'
      onMouseEnter={() => controls.start("animate")}
    >
      <svg
        width={24}
        height={24}
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth={2}
        strokeLinecap='round'
        strokeLinejoin='round'
        xmlns='http://www.w3.org/2000/svg'
        className='size-5 md:size-6'
      >
        <circle cx='12' cy='12' r='4' />
        {rays.map((d, i) => (
          <motion.path
            key={d}
            d={d}
            animate={controls}
            variants={{
              normal: { opacity: 1 },
              animate: {
                opacity: [0, 1],
                transition: { delay: i * 0.1, duration: 0.3 },
              },
            }}
            custom={i + 1}
          />
        ))}
      </svg>
    </div>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <button
      type='button'
      onClick={toggleTheme}
      aria-label='Theme Toggle'
      className='cursor-pointer text-foreground select-none'
    >
      <SunIcon />
      <MoonIcon />
    </button>
  );
}
