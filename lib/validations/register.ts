import { z } from "zod";
import { HALQA_VALUES } from "@/lib/constants/halqas";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  email: z.string().trim().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Minimum 8 characters")
    .regex(/[0-9]/, "Include at least one number"),
  phone: z.string().trim().min(5, "Enter at least 5 digits").max(20),
  halqa: z.enum(HALQA_VALUES),
  genderUnit: z.enum(["MALE", "FEMALE"]),
});

export type RegisterInput = z.infer<typeof registerSchema>;
