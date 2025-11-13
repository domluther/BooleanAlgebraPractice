import { describe, expect, it } from "vitest";

/**
 * Sample test to verify testing infrastructure is set up correctly
 * This file can be deleted once real tests are written
 */
describe("Testing Infrastructure", () => {
	it("should run basic assertions", () => {
		expect(true).toBe(true);
		expect(1 + 1).toBe(2);
	});

	it("should have access to Jest DOM matchers", () => {
		const element = document.createElement("div");
		element.textContent = "Hello, World!";
		expect(element).toHaveTextContent("Hello, World!");
	});

	it("should have localStorage mock available", () => {
		localStorage.setItem("test", "value");
		expect(localStorage.getItem("test")).toBe("value");
		localStorage.clear();
		expect(localStorage.getItem("test")).toBeNull();
	});
});
