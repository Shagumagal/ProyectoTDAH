/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // 👈 Important for manual toggling
    theme: {
        extend: {},
    },
    plugins: [],
}
