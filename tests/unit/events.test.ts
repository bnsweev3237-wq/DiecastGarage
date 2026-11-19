import { describe, expect, it } from "vitest";
import { dateRange, isHttps, place } from "@/lib/events";

describe("calendar helpers", () => {
  it("date ranges", () => {
    expect(dateRange("2027-03-13", "2027-03-13")).toBe("Sat, Mar 13, 2027");
    expect(dateRange("2027-03-13", "2027-03-14")).toBe("Mar 13–14, 2027");
    expect(dateRange("2027-03-30", "2027-04-01")).toBe("Mar 30 – Apr 1, 2027");
    expect(dateRange("2027-12-31", "2028-01-02")).toBe("Dec 31, 2027 – Jan 2, 2028");
  });
  it("places and websites", () => {
    expect(place({ city: "Rosemont", region: "IL", country: "US" })).toBe("Rosemont, IL");
    expect(place({ city: "Toronto", region: "ON", country: "CA" })).toBe("Toronto, ON, Canada");
    expect(isHttps("https://example.com/show")).toBe(true);
    expect(isHttps("http://example.com")).toBe(false);
    expect(isHttps("javascript:alert(1)")).toBe(false);
  });
});
