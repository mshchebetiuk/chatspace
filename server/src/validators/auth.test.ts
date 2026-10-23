import { describe, it, expect } from "vitest";
import { registerSchema } from "./auth.schema.js";

const testCases = [
  {
    name: "Valid registration",
    data: {
      name: "Maksym",
      email: "maksym@example.com",
      password: "SecurePass123",
    },
  },
  {
    name: "Invalid email",
    data: {
      name: "Maksym",
      email: "invalid-email",
      password: "SecurePass123",
    },
  },
  {
    name: "Short password",
    data: {
      name: "Maksym",
      email: "maksym@example.com",
      password: "123",
    },
  },
  {
    name: "Short name",
    data: {
      name: "A",
      email: "maksym@example.com",
      password: "SecurePass123",
    },
  },
];

const validCase = testCases[0];
const invalidEmailCase = testCases[1];
const shortPasswordCase = testCases[2];
const shortNameCase = testCases[3];

if (!validCase || !invalidEmailCase || !shortPasswordCase || !shortNameCase)
  throw new Error("Valid test case is missing");

describe("Register schema validation", () => {
  it("should accept valid registration data", () => {
    const result = registerSchema.safeParse(validCase.data);
    expect(result.success).toBe(true);
  });

  it("should reject invalid email:", () => {
    const result = registerSchema.safeParse(invalidEmailCase.data);
    expect(result.success).toBe(false);
  });

  it("should reject short password:", () => {
    const result = registerSchema.safeParse(shortPasswordCase.data);
    expect(result.success).toBe(false);
  });

  it("should reject short name:", () => {
    const result = registerSchema.safeParse(shortNameCase.data);
    expect(result.success).toBe(false);
  });
});

for (const testCase of testCases) {
  const result = registerSchema.safeParse(testCase.data);
  console.log(`${testCase.name}: ${result.success ? "VALID" : "INVALID"}`);
}
