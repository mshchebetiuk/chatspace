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

for (const testCase of testCases) {
  const result = registerSchema.safeParse(testCase.data);
  console.log(`${testCase.name}: ${result.success ? "VALID" : "INVALID"}`);
}
