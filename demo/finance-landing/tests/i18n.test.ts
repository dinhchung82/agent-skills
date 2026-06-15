import { describe, it, expect } from "vitest";
import vi from "@/messages/vi.json";
import en from "@/messages/en.json";

function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    return v && typeof v === "object"
      ? flattenKeys(v as Record<string, unknown>, key)
      : [key];
  });
}

describe("i18n message files", () => {
  it("vi and en have identical key sets", () => {
    const viKeys = flattenKeys(vi).sort();
    const enKeys = flattenKeys(en).sort();
    expect(viKeys).toEqual(enKeys);
  });

  it("include required form + hero keys", () => {
    const keys = flattenKeys(vi);
    expect(keys).toContain("hero.disclaimer");
    expect(keys).toContain("form.submit");
    expect(keys).toContain("form.options.over_1b");
  });
});
