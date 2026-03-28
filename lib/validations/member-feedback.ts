import { z } from "zod";

export const memberFeedbackBodySchema = z.object({
  message: z
    .string()
    .trim()
    .min(10, "Please write at least a few words (10+ characters).")
    .max(8000, "Feedback is too long (max 8000 characters)."),
});

export type MemberFeedbackBody = z.infer<typeof memberFeedbackBodySchema>;
