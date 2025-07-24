import express from 'express';
import { z } from 'zod';
import { ZodError } from 'zod';
import { analyzeRepo } from '../services/analyzeRepo';

const router = express.Router();

const analyzeRepoSchema = z.object({
  owner: z.string().min(1, "Owner is required"),
  repo: z.string().min(1, "Repo is required"),
});

router.post('/', async (req, res, next) => {
  try {
    const { owner, repo } = analyzeRepoSchema.parse(req.body);
    const result = await analyzeRepo(owner, repo);
    res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'Invalid input',
        details: error.issues,
      });
    }
    next(error);
  }
});

export default router;
