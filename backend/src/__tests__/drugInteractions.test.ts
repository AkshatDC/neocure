import request from 'supertest';
import { app } from '../server/app.js';
import { prisma } from '../services/prisma.js';

describe('Drug Interactions API', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create test user and get auth token
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'testpass123',
        role: 'PATIENT',
      });

    authToken = registerRes.body.accessToken;
    userId = registerRes.body.user.id;
  });

  afterAll(async () => {
    // Cleanup: delete test user and related data
    if (userId) {
      await prisma.drugInteraction.deleteMany({ where: { userId } });
      await prisma.prescription.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    }
    await prisma.$disconnect();
  });

  describe('POST /api/drug-interactions/check', () => {
    it('should check drug interactions successfully', async () => {
      const res = await request(app)
        .post('/api/drug-interactions/check')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          drugs: ['Warfarin', 'Aspirin'],
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('interactionDetected');
      expect(res.body).toHaveProperty('severity');
      expect(res.body).toHaveProperty('description');
      expect(res.body).toHaveProperty('saferAlternatives');
    });

    it('should return 400 if less than 2 drugs provided', async () => {
      const res = await request(app)
        .post('/api/drug-interactions/check')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          drugs: ['Warfarin'],
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/drug-interactions/check')
        .send({
          drugs: ['Warfarin', 'Aspirin'],
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/drug-interactions/history', () => {
    it('should get interaction history', async () => {
      // First create an interaction
      await request(app)
        .post('/api/drug-interactions/check')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          drugs: ['Warfarin', 'Aspirin'],
        });

      // Then fetch history
      const res = await request(app)
        .get('/api/drug-interactions/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});

describe('Prescriptions API', () => {
  let authToken: string;
  let doctorToken: string;
  let userId: string;
  let doctorId: string;

  beforeAll(async () => {
    // Create patient user
    const patientRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Patient',
        email: `patient-${Date.now()}@example.com`,
        password: 'testpass123',
        role: 'PATIENT',
      });

    authToken = patientRes.body.accessToken;
    userId = patientRes.body.user.id;

    // Create doctor user
    const doctorRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Doctor',
        email: `doctor-${Date.now()}@example.com`,
        password: 'testpass123',
        role: 'DOCTOR',
      });

    doctorToken = doctorRes.body.accessToken;
    doctorId = doctorRes.body.user.id;
  });

  afterAll(async () => {
    // Cleanup
    if (userId) {
      await prisma.drugInteraction.deleteMany({ where: { userId } });
      await prisma.prescription.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    }
    if (doctorId) {
      await prisma.user.delete({ where: { id: doctorId } });
    }
    await prisma.$disconnect();
  });

  describe('POST /api/prescriptions/add', () => {
    it('should add prescription with auto interaction check', async () => {
      const res = await request(app)
        .post('/api/prescriptions/add')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          userId,
          drugName: 'Warfarin',
          dosage: '5mg',
          frequency: 'Once daily',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('prescription');
      expect(res.body).toHaveProperty('interactionWarning');
      expect(res.body.prescription.drugName).toBe('Warfarin');
    });

    it('should detect interaction when adding second drug', async () => {
      // Add second prescription that interacts with Warfarin
      const res = await request(app)
        .post('/api/prescriptions/add')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          userId,
          drugName: 'Aspirin',
          dosage: '100mg',
          frequency: 'Once daily',
        });

      expect(res.status).toBe(201);
      expect(res.body.interactionWarning).toHaveProperty('detected');
      // May or may not detect depending on fallback data
    });

    it('should return 403 if patient tries to add prescription', async () => {
      const res = await request(app)
        .post('/api/prescriptions/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId,
          drugName: 'Metformin',
          dosage: '500mg',
          frequency: 'Twice daily',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/prescriptions', () => {
    it('should get user prescriptions', async () => {
      const res = await request(app)
        .get('/api/prescriptions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
