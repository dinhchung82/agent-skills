import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  isDisposableEmail,
  isValidVNPhone,
} from "@/lib/validation";

describe("isValidEmail", () => {
  it("accepts a normal email", () => {
    expect(isValidEmail("an.nguyen@example.com")).toBe(true);
  });

  it("rejects missing @", () => {
    expect(isValidEmail("an.nguyen.example.com")).toBe(false);
  });

  it("rejects missing domain", () => {
    expect(isValidEmail("an@")).toBe(false);
  });

  it("rejects empty / whitespace", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("   ")).toBe(false);
  });
});

describe("isDisposableEmail", () => {
  it("flags known disposable domains", () => {
    expect(isDisposableEmail("x@mailinator.com")).toBe(true);
    expect(isDisposableEmail("x@10minutemail.com")).toBe(true);
    expect(isDisposableEmail("x@guerrillamail.com")).toBe(true);
  });

  it("is case-insensitive on domain", () => {
    expect(isDisposableEmail("x@MailInator.COM")).toBe(true);
  });

  it("allows real provider domains", () => {
    expect(isDisposableEmail("x@gmail.com")).toBe(false);
    expect(isDisposableEmail("x@company.vn")).toBe(false);
  });
});

describe("isValidVNPhone", () => {
  it("accepts 10-digit number starting with 0", () => {
    expect(isValidVNPhone("0912345678")).toBe(true);
  });

  it("accepts +84 prefixed number", () => {
    expect(isValidVNPhone("+84912345678")).toBe(true);
  });

  it("tolerates spaces", () => {
    expect(isValidVNPhone("091 234 5678")).toBe(true);
  });

  it("rejects too short / too long", () => {
    expect(isValidVNPhone("09123")).toBe(false);
    expect(isValidVNPhone("09123456789999")).toBe(false);
  });

  it("rejects non-digit junk", () => {
    expect(isValidVNPhone("phone-me")).toBe(false);
  });
});
