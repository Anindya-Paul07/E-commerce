import { Router } from 'express';
import { listThemePresets } from '../controller/theme.controller.js';

const router = Router();

router.get('/', listThemePresets);

export default router;
