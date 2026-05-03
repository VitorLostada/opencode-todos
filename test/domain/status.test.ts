import { describe, expect, test } from "bun:test";
import { getActionErrorStatus, getListStatus } from "../../src/domain/status";

describe("todo status", () => {
  test("prefers action error status", () => {
    expect(getActionErrorStatus("append failed")).toEqual({
      title: "append failed",
      error: true,
    });
    expect(getActionErrorStatus(undefined)).toBeUndefined();
  });

  test("resolves loading, error, empty, and ready states", () => {
    expect(getListStatus("loading", undefined, 0)).toEqual({
      title: "Scanning TODO comments...",
      error: false,
    });
    expect(getListStatus("error", "boom", 0)).toEqual({ title: "boom", error: true });
    expect(getListStatus("ready", undefined, 0)).toEqual({
      title: "No TODO comments found",
      error: false,
    });
    expect(getListStatus("ready", undefined, 1)).toBeUndefined();
  });
});
