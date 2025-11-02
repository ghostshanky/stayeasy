import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
        colors: {
            "primary": "#14b8a6",
            "background-light": "#f6f7f8",
            "background-dark": "#101a22",
            "success": "#28A745",
            "warning": "#FFC107",
            "error": "#DC3545",
            "orange-accent": "#f59e0b",
            "text-light-primary": "#111518",
            "text-light-secondary": "#617989",
            "text-dark-primary": "#f6f7f8",
            "text-dark-secondary": "#a0aec0",
            "border-light": "#dbe1e6",
            "border-dark": "#2d3748",
            "surface-light": "#ffffff",
            "surface-dark": "#1a2a38"
        },
        fontFamily: {
            "display": ["Plus Jakarta Sans", "sans-serif"]
        },
        borderRadius: {
            "DEFAULT": "0.5rem",
            "lg": "0.75rem",
            "xl": "1rem",
            "full": "9999px"
        },
    },
  },
  plugins: [
    containerQueries,
  ],
}