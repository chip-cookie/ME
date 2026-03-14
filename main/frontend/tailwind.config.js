/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    400: "#22d3ee",
                    500: "#06b6d4",
                    600: "#0891b2",
                    700: "#0e7490",
                },
                energy: {
                    blue: "#93C5FD",
                    coral: "#FDA4AF",
                    mint: "#A7F3D0",
                    yellow: "#FDE047",
                },
                slate: {
                    850: "#1e293b",
                    900: "#0f172a",
                },
                pastel: {
                    lavender: "#F3E8FF",
                    mint: "#E6FFFA",
                    peach: "#FFF7ED",
                    sky: "#F0F9FF",
                    cream: "#FFFBF7",
                    blue: "#E0F2FE",
                    coral: "#FFE4E6",
                    gray: "#F8FAFC",
                },
                energy: {
                    blue: "#93C5FD",
                    coral: "#FDA4AF",
                    mint: "#A7F3D0",
                    yellow: "#FDE047",
                },
            },
            fontFamily: {
                display: ["Inter", "Noto Sans KR", "sans-serif"],
                body: ["Inter", "Noto Sans KR", "sans-serif"],
            },
            animation: {
                'dash': 'dash 1.5s linear infinite',
                'bounce-slow': 'bounce 3s infinite',
                'float': 'float 6s ease-in-out infinite',
                'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                dash: {
                    '0%': { strokeDashoffset: '20' },
                    '100%': { strokeDashoffset: '0' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                pulseGlow: {
                    '0%, 100%': { opacity: 1, filter: 'brightness(100%)' },
                    '50%': { opacity: .7, filter: 'brightness(150%)' },
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
    ],
}
