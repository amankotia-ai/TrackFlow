import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: "rgb(229, 231, 235)",
				input: "rgb(229, 231, 235)",
				ring: "rgb(229, 231, 235)",
				background: "#F7F7F7",
				foreground: "rgb(17, 24, 39)",
				primary: {
					DEFAULT: "rgb(17, 24, 39)",
					foreground: "rgb(255, 255, 255)"
				},
				secondary: {
					DEFAULT: "rgb(243, 244, 246)",
					foreground: "rgb(17, 24, 39)"
				},
				destructive: {
					DEFAULT: "rgb(239, 68, 68)",
					foreground: "rgb(255, 255, 255)"
				},
				muted: {
					DEFAULT: "rgb(243, 244, 246)",
					foreground: "rgb(107, 114, 128)"
				},
				accent: {
					DEFAULT: "rgb(243, 244, 246)",
					foreground: "rgb(17, 24, 39)"
				},
				popover: {
					DEFAULT: "rgb(255, 255, 255)",
					foreground: "rgb(17, 24, 39)"
				},
				card: {
					DEFAULT: "rgb(255, 255, 255)",
					foreground: "rgb(17, 24, 39)"
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: "0.5rem",
				md: "0.375rem",
				sm: "0.25rem"
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
