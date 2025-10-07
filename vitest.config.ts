import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./src/test/setup.ts"],
		css: true,
		include: ["src/**/*.{test,spec}.{ts,tsx}"], // Only test files in src/
		exclude: [
			"node_modules/",
			"legacy/**", // Exclude legacy tests (they use a different format)
			"dist/",
			".idea/",
			".git/",
			".cache/",
		],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/",
				"src/test/",
				"**/*.d.ts",
				"**/*.config.*",
				"**/mockData/**",
				"src/routeTree.gen.ts",
				"src/components/old_*.tsx",
				"src/routes/old_*.tsx",
			],
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
