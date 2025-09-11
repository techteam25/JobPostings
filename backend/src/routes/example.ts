import { Router, Request, Response } from 'express';

const router = Router();

// GET /example
router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Example route',
    timestamp: new Date().toISOString(),
  });
});

// POST /example
router.post('/', (req: Request, res: Response) => {
  const { name } = req.body;
  
  res.json({
    message: 'Data received successfully',
    data: { name },
    timestamp: new Date().toISOString(),
  });
});

export default router;
