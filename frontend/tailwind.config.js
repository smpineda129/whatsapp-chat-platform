/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                whatsapp: {
                    light: '#d9fdd3',
                    DEFAULT: '#25d366',
                    dark: '#128c7e',
                    darker: '#075e54',
                },
            },
        },
    },
    plugins: [],
    // Important for Material UI compatibility
    corePlugins: {
        preflight: false,
    },
}
