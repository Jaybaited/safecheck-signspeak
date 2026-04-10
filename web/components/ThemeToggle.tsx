// components/ThemeToggle.tsx
"use client";

import { useTheme }                       from "next-themes";
import { Moon, Sun, Monitor, ChevronDown } from "lucide-react";
import { useEffect, useState, useRef }     from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen,  setIsOpen]  = useState(false);
  const dropdownRef           = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) return <div className="w-32 h-10" />;

  // Active option style — maroon light / gold dark (matches brand)
  const activeStyle = 'text-[#7B1113] dark:text-[#E8C96A] font-semibold bg-[#7B1113]/5 dark:bg-[#7B1113]/20';
  const inactiveStyle = 'text-slate-700 dark:text-gray-200';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
        aria-label="Select Theme"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {theme === "light"  ? <Sun     className="w-4 h-4" /> :
         theme === "dark"   ? <Moon    className="w-4 h-4" /> :
                              <Monitor className="w-4 h-4" />}
        <span className="text-sm font-medium capitalize w-12 text-left">{theme}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Select theme"
          className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-lg shadow-lg overflow-hidden z-50"
        >
          {/* Light */}
          <button
            role="option"
            aria-selected={theme === 'light'}
            onClick={() => { setTheme("light"); setIsOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors ${
              theme === 'light' ? activeStyle : inactiveStyle
            }`}
          >
            <Sun className="w-4 h-4" /> Light
          </button>

          {/* Dark */}
          <button
            role="option"
            aria-selected={theme === 'dark'}
            onClick={() => { setTheme("dark"); setIsOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors ${
              theme === 'dark' ? activeStyle : inactiveStyle
            }`}
          >
            <Moon className="w-4 h-4" /> Dark
          </button>

          {/* System */}
          <button
            role="option"
            aria-selected={theme === 'system'}
            onClick={() => { setTheme("system"); setIsOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors ${
              theme === 'system' ? activeStyle : inactiveStyle
            }`}
          >
            <Monitor className="w-4 h-4" /> System
          </button>
        </div>
      )}
    </div>
  );
}
