import { describe, expect, it } from "vitest";
import cases from "../content-cases.json";
import { checkFields, contentDbMessage, contentProblem } from "@/lib/content-rules";

describe("content rules", () => {
  for (const [problem, examples] of Object.entries(cases.blocked))
    for (const text of examples)
      it(`blocks ${problem}: ${text}`, () => expect(contentProblem(text)).toBe(problem));
  for (const text of cases.allowed)
    it(`allows: ${text}`, () => expect(contentProblem(text)).toBeNull());

  it("names the field in its message", () => {
    expect(checkFields([["the description", "call 312-555-0199"]])).toMatch(/^The description can't include phone numbers/);
    expect(checkFields([["the name", "Charizard"]])).toBeNull();
  });
  it("turns database errors into the same messages", () => {
    expect(contentDbMessage("ERROR: CONTENT_LINK:bio")).toMatch(/^Bio can't include web links/);
    expect(contentDbMessage("ERROR: DUPLICATE_COMMENT")).toMatch(/already posted/);
    expect(contentDbMessage("something else")).toBeNull();
  });
});
