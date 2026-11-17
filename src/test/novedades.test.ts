import { describe, expect, it } from "vitest";
import { calculateInclusiveDays } from "@/lib/novedades";

describe("inclusive novelty date range", () => {
  it("counts both the start and end dates", () => {
    expect(calculateInclusiveDays("2026-11-01", "2026-11-16")).toBe(16);
  });

  it("counts a same-day novelty as one day", () => {
    expect(calculateInclusiveDays("2026-11-01", "2026-11-01")).toBe(1);
  });

  it("does not calculate incomplete or reversed date ranges", () => {
    expect(calculateInclusiveDays("", "2026-11-16")).toBeNull();
    expect(calculateInclusiveDays("2026-11-16", "2026-11-01")).toBeNull();
  });
});
