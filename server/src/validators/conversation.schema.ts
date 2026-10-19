import { z } from "zod";

export const createConversationSchema = z.object({
  participantId: z.number().int().positive(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
