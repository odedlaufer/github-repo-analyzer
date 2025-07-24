import { z } from "zod";

export const analyzeRepoSchema = z.object({
    owner: z.string().min(1, "Owner is required"),
    repo: z.string().min(1, "Repo is required"),
});

export type analyzeRepoInput = z.infer<typeof analyzeRepoSchema>;