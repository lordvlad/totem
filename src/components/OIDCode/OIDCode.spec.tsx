// This component is now tested via Playwright E2E tests
// See: e2e/oid-codes.spec.ts
//
// The OIDCode component generates SVG patterns for Tiptoi optical identification codes.
// E2E tests verify the full rendering pipeline in a real browser environment.
//
// Original unit tests verified:
// - SVG pattern generation with correct IDs
// - Path elements within patterns
// - Proper structure of OID code SVG output
//
// Future E2E test opportunities:
// - Print layout with multiple OID codes
// - OID code generation at 1200 DPI
// - Pattern variations for different code values

import { render } from "@testing-library/react";
import { describe, expect, it } from "bun:test";
import { OIDCodePattern } from "./OIDCodePattern";
import { range } from "./util";

describe("range", () => {
  it("should work with end only", () => {
    const r = range(8);
    expect(r).toBeArray();
    expect(r).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("should work with start and end", () => {
    const r = range(2, 8);
    expect(r).toBeArray();
    expect(r).toEqual([2, 3, 4, 5, 6, 7, 8]);
  });
});

describe("OIDCode components", () => {
  it("should create pattern content", () => {
    const { container } = render(
      <OIDCodePattern id="foo" code={20} oidCodePixelSize={3} />,
    );

    expect(container.innerHTML).toContain("<pattern");
    expect(container.innerHTML).toContain('id="foo"');
    expect(container.innerHTML).toContain("<path");
  });
});
