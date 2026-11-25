import { describe, expect, it } from "vitest";
import { qrSrc } from "@/components/TwoStepSettings";

describe("two-step QR code", () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path fill="#000" d="M0 0h1v1H0z"/></svg>';
  it("encodes the raw SVG Supabase sends", () => {
    expect(qrSrc(`data:image/svg+xml;utf-8,${svg}`)).toBe(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  });
  it("leaves an already-encoded or non-SVG image working", () => {
    expect(qrSrc(`data:image/svg+xml;utf-8,${encodeURIComponent(svg)}`)).toBe(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
    expect(qrSrc(`data:image/svg+xml;utf-8,data:image/svg+xml;utf-8,${svg}`)).toBe(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
    expect(qrSrc("data:image/png;base64,AAAA")).toBe("data:image/png;base64,AAAA");
  });
});
