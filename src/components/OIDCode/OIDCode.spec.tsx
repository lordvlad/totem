// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { assert, describe, expect, it } from "vitest";
import { OIDCodePattern } from "./OIDCodePattern";
import { range } from "./util";

describe("range", () => {
  it("should work with end only", () => {
    const r = range(8);
    assert.isArray(r);
    assert.deepEqual(r, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("should work with start and end", () => {
    const r = range(2, 8);
    assert.isArray(r);
    assert.deepEqual(r, [2, 3, 4, 5, 6, 7, 8]);
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
