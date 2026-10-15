import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z.email(),
  password: z
    .string()
    .min(8)
    .refine((value) => Buffer.byteLength(value, "utf8") <= 72, {
      message: "Password must not exceed 72 bytes",
    }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
