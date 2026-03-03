import {
  assertMutationSucceeded,
  getNextPosition,
  parseOptionalPositionValue,
  slugify
} from "@/lib/admin-utils";

describe("admin-utils", () => {
  it("slugifies titles into stable route-safe values", () => {
    expect(slugify("  AI Foundations for Ops Teams  ")).toBe("ai-foundations-for-ops-teams");
    expect(slugify("Revenue & Growth 101")).toBe("revenue-growth-101");
  });

  it("parses optional positions and rejects blank or invalid values", () => {
    expect(parseOptionalPositionValue("")).toBeNull();
    expect(parseOptionalPositionValue("  ")).toBeNull();
    expect(parseOptionalPositionValue("2")).toBe(2);
    expect(parseOptionalPositionValue("0")).toBeNull();
    expect(parseOptionalPositionValue("abc")).toBeNull();
  });

  it("computes the next numeric position", () => {
    expect(getNextPosition([])).toBe(1);
    expect(getNextPosition([{ position: 1 }, { position: 4 }, { position: 2 }])).toBe(5);
  });

  it("returns data for successful mutations", () => {
    expect(
      assertMutationSucceeded({ data: { id: "course-1" }, error: null }, "fallback")
    ).toEqual({ id: "course-1" });
  });

  it("throws the database error when a mutation fails", () => {
    expect(() =>
      assertMutationSucceeded(
        { data: null, error: { message: 'duplicate key value violates unique constraint "courses_slug_key"' } },
        "fallback"
      )
    ).toThrow('duplicate key value violates unique constraint "courses_slug_key"');
  });
});
