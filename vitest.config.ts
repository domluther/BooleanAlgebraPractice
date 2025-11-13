import path from "node:path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./test/setup.ts"],
		css: true,
		include: ["test/**/*.{test,spec}.{ts,tsx}"], // Test files in test/ directory
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
				"test/",
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
