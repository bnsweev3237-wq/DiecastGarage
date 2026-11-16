import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "@/lib/csv";
import { matchColumn } from "@/lib/item-columns";

describe("CSV", () => {
  it("reads quotes, commas and line breaks inside cells, and Excel's marker", () => {
    const rows = parseCsv('﻿Name,Notes\r\n"Goodwrench, 1998","Signed ""Dale""\nmint"\r\n');
    expect(rows).toEqual([["Name", "Notes"], ["Goodwrench, 1998", 'Signed "Dale"\nmint']]);
  });
  it("reads semicolon files", () => expect(parseCsv("Name;Price\nCard;12,50\n")).toEqual([["Name", "Price"], ["Card", "12,50"]]));
  it("skips blank rows", () => expect(parseCsv("a,b\n,\n1,2\n")).toEqual([["a", "b"], ["1", "2"]]));
  it("round-trips what it writes", () => {
    const data = [["a,b", 'He said "hi"', "line\nbreak", ""]];
    expect(parseCsv(toCsv(data))).toEqual(data);
  });
});

describe("import column matching", () => {
  const cases: [string, string | null][] = [
    ["Item Name", "title"], ["Name", "title"], ["Brand", "brand"], ["Scale", "a_scale"], ["Price Paid", "paid"], ["Qty", "quantity"],
    ["Boxed?", "in_package"], ["Storage", "storage_location"], ["Notes", "description"], ["Grader", "cert_by"], ["Grade", "cert_grade"],
    ["Card number", "a_number"], ["Detail: Set", "a_set"], ["Where it's stored", "storage_location"], ["Favourite colour", null],
  ];
  for (const [header, want] of cases) it(`${header} → ${want ?? "skip"}`, () => expect(matchColumn(header)).toBe(want));
});
