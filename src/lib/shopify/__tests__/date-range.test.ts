import { describe, expect, it } from "vitest";
import { createdAtQuery, nextDay } from "../date-range";

describe("createdAtQuery", () => {
  it("includes the whole of the last day", () => {
    expect(createdAtQuery("2026-10-01", "2026-10-31")).toBe("created_at:>=2026-10-01 created_at:<2026-11-01");
  });

  it("handles month and year ends", () => {
    expect(nextDay("2026-12-31")).toBe("2027-01-01");
    expect(nextDay("2028-02-28")).toBe("2028-02-29");
  });

  it("leaves out whichever bound is missing", () => {
    expect(createdAtQuery("", "2026-11-01")).toBe("created_at:<2026-11-02");
    expect(createdAtQuery("2026-10-01", "")).toBe("created_at:>=2026-10-01");
    expect(createdAtQuery()).toBe("");
  });
});
