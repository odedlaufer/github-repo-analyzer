/**
 * @swagger
 * /api/repo:
 *   post:
 *     summary: Analyze a public GitHub repository
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               owner:
 *                 type: string
 *                 example: odedlaufer
 *               repo:
 *                 type: string
 *                 example: validator
 *     responses:
 *       200:
 *         description: Analysis successful
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Internal server error
 */

import express from 'express';
import { z, ZodError } from 'zod';
import { analyzeRepo } from '../services/analyzeRepo.js';

const router = express.Router();

const analyzeRepoSchema = z.object({
  owner: z.string().min(1, 'Owner is required'),
  repo: z.string().min(1, 'Repo is required'),
});

router.post('/', async (req, res, next) => {
  try {
    const { owner, repo } = analyzeRepoSchema.parse(req.body);
    const result = await analyzeRepo(owner, repo);
    res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      // Pass Zod errors to centralized handler
      return next(
        Object.assign(error, {
          statusCode: 400,
          isOperational: true,
        })
      );
    }

    // Forward all other errors
    next(error);
  }
});

export default router;
