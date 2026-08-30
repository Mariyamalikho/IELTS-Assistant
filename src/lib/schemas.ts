import { z } from "zod";

export const writingSubmissionSchema = z.object({
  essay: z
    .string()
    .trim()
    .min(50, "Your essay must be at least 50 words to be evaluated accurately.")
    .refine((val) => val.split(/\s+/).length >= 50, {
      message: "Your essay must be at least 50 words long to be evaluated accurately.",
    }),
  taskType: z.enum(["task1", "task2"]),
});

export type WritingSubmission = z.infer<typeof writingSubmissionSchema>;
