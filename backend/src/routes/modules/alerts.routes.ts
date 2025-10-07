import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { 
  getUserAlerts, 
  markAlertAsRead, 
  getAlertStats 
} from '../../services/alerts.js';

const router = Router();

/**
 * Get user's alerts
 */
router.get('/', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { limit } = req.query;
    
    const alerts = await getUserAlerts(userId, userRole, limit ? Number(limit) : 20);
    
    return res.json(alerts);
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    return res.status(500).json({ error: 'Failed to fetch alerts', message: error.message });
  }
});

/**
 * Get alert statistics
 */
router.get('/stats', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const stats = await getAlertStats(userId, userRole);
    
    return res.json(stats);
  } catch (error: any) {
    console.error('Error fetching alert stats:', error);
    return res.status(500).json({ error: 'Failed to fetch alert stats', message: error.message });
  }
});

/**
 * Mark alert as read
 */
router.patch('/:alertId/read', authenticate, async (req: any, res) => {
  try {
    const { alertId } = req.params;
    const userId = req.user.id;
    
    await markAlertAsRead(alertId, userId);
    
    return res.json({ message: 'Alert marked as read' });
  } catch (error: any) {
    console.error('Error marking alert as read:', error);
    return res.status(500).json({ error: 'Failed to mark alert as read', message: error.message });
  }
});

export default router;
