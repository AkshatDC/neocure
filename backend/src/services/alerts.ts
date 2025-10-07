import { Server } from 'socket.io';
import { db, collections } from '../config/firebase.js';
import { env } from '../server/config/env.js';

// Socket.IO server instance
let io: Server | null = null;

/**
 * Initialize Socket.IO server for real-time notifications
 */
export function initializeSocketIO(server: any): Server {
  io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Join doctor-specific room for targeted notifications
    socket.on('join-doctor-room', (doctorId: string) => {
      socket.join(`doctor-${doctorId}`);
      console.log(`👨‍⚕️ Doctor ${doctorId} joined their notification room`);
    });

    // Join patient-specific room for patient notifications
    socket.on('join-patient-room', (patientId: string) => {
      socket.join(`patient-${patientId}`);
      console.log(`👤 Patient ${patientId} joined their notification room`);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });

  console.log('✅ Socket.IO initialized for real-time alerts');
  return io;
}

/**
 * Send alert to specific doctor
 */
export async function sendAlertToDoctor(
  doctorId: string,
  alert: {
    type: 'ADR' | 'NEW_DOCUMENT' | 'CRITICAL_INTERACTION' | 'MEDICATION_REMINDER';
    patientId: string;
    severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    title: string;
    message: string;
    data?: any;
  }
): Promise<void> {
  try {
    // Save alert to Firebase
    const alertRef = await db.collection(collections.alerts).add({
      ...alert,
      doctorId,
      read: false,
      createdAt: new Date(),
    });

    // Send real-time notification via Socket.IO
    if (io) {
      io.to(`doctor-${doctorId}`).emit('new-alert', {
        id: alertRef.id,
        ...alert,
        createdAt: new Date(),
      });

      console.log(`🚨 Sent alert to doctor ${doctorId}: ${alert.title}`);
    }

    // Also send to patient if relevant
    if (alert.patientId) {
      io?.to(`patient-${alert.patientId}`).emit('patient-alert', {
        id: alertRef.id,
        ...alert,
        createdAt: new Date(),
      });
    }

  } catch (error: any) {
    console.error('Error sending doctor alert:', error.message);
  }
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(alertId: string, userId: string): Promise<void> {
  try {
    await db.collection(collections.alerts).doc(alertId).update({
      read: true,
      readAt: new Date(),
      readBy: userId,
    });

    console.log(`✅ Alert ${alertId} marked as read by ${userId}`);
  } catch (error: any) {
    console.error('Error marking alert as read:', error.message);
  }
}

/**
 * Get unread alerts for a user
 */
export async function getUserAlerts(
  userId: string,
  userRole: 'PATIENT' | 'DOCTOR' | 'ADMIN',
  limit: number = 20
): Promise<any[]> {
  try {
    let query = db.collection(collections.alerts)
      .where('read', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    // Filter based on role
    if (userRole === 'DOCTOR') {
      query = query.where('doctorId', '==', userId);
    } else if (userRole === 'PATIENT') {
      // Patients can see alerts about themselves
      query = query.where('patientId', '==', userId);
    }
    // Admins can see all alerts

    const snapshot = await query.get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    }));

  } catch (error: any) {
    console.error('Error getting user alerts:', error.message);
    return [];
  }
}

/**
 * Get alert statistics for dashboard
 */
export async function getAlertStats(
  userId: string,
  userRole: 'PATIENT' | 'DOCTOR' | 'ADMIN'
): Promise<{
  total: number;
  unread: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}> {
  try {
    let query = db.collection(collections.alerts);

    if (userRole === 'DOCTOR') {
      query = query.where('doctorId', '==', userId);
    } else if (userRole === 'PATIENT') {
      query = query.where('patientId', '==', userId);
    }

    const snapshot = await query.get();

    const alerts = snapshot.docs.map(doc => doc.data());

    const stats = {
      total: alerts.length,
      unread: alerts.filter(alert => !alert.read).length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
    };

    // Count by type and severity
    alerts.forEach(alert => {
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
      stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1;
    });

    return stats;

  } catch (error: any) {
    console.error('Error getting alert stats:', error.message);
    return { total: 0, unread: 0, byType: {}, bySeverity: {} };
  }
}

/**
 * Send medication reminder alert
 */
export async function sendMedicationReminder(
  patientId: string,
  doctorId: string,
  medicationName: string,
  reminderTime: Date
): Promise<void> {
  await sendAlertToDoctor(doctorId, {
    type: 'MEDICATION_REMINDER',
    patientId,
    severity: 'LOW',
    title: 'Medication Reminder',
    message: `Patient should take ${medicationName} at ${reminderTime.toLocaleTimeString()}`,
    data: {
      medicationName,
      reminderTime: reminderTime.toISOString(),
    },
  });
}

/**
 * Send critical interaction alert
 */
export async function sendCriticalInteractionAlert(
  patientId: string,
  doctorId: string,
  interaction: {
    drugs: string[];
    severity: string;
    description: string;
  }
): Promise<void> {
  await sendAlertToDoctor(doctorId, {
    type: 'CRITICAL_INTERACTION',
    patientId,
    severity: 'CRITICAL',
    title: 'Critical Drug Interaction Detected',
    message: `Patient has potential ${interaction.severity} interaction: ${interaction.drugs.join(' + ')}`,
    data: interaction,
  });
}

/**
 * Send new document alert
 */
export async function sendNewDocumentAlert(
  patientId: string,
  doctorId: string,
  documentName: string
): Promise<void> {
  await sendAlertToDoctor(doctorId, {
    type: 'NEW_DOCUMENT',
    patientId,
    severity: 'MODERATE',
    title: 'New Medical Document Uploaded',
    message: `Patient uploaded: ${documentName}`,
    data: {
      documentName,
      uploadedAt: new Date().toISOString(),
    },
  });
}

/**
 * Broadcast system-wide announcement
 */
export function broadcastAnnouncement(
  message: string,
  severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO'
): void {
  if (io) {
    io.emit('system-announcement', {
      message,
      severity,
      timestamp: new Date().toISOString(),
    });
    console.log(`📢 System announcement sent: ${message}`);
  }
}

/**
 * Get Socket.IO instance (for cleanup)
 */
export function getSocketIO(): Server | null {
  return io;
}

/**
 * Clean up Socket.IO connections
 */
export function cleanupSocketIO(): void {
  if (io) {
    io.close();
    io = null;
    console.log('🔌 Socket.IO connections cleaned up');
  }
}
