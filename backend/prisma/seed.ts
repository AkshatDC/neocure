import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create sample users
  const patientPassword = await bcrypt.hash('patient123', 10);
  const doctorPassword = await bcrypt.hash('doctor123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  const patient = await prisma.user.upsert({
    where: { email: 'patient@neocure.com' },
    update: {},
    create: {
      name: 'John Patient',
      email: 'patient@neocure.com',
      passwordHash: patientPassword,
      role: 'PATIENT',
    },
  });

  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@neocure.com' },
    update: {},
    create: {
      name: 'Dr. Sarah Smith',
      email: 'doctor@neocure.com',
      passwordHash: doctorPassword,
      role: 'DOCTOR',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@neocure.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@neocure.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  // Create sample profile for patient
  await prisma.userProfile.upsert({
    where: { userId: patient.id },
    update: {},
    create: {
      userId: patient.id,
      geneticData: { bloodType: 'O+', familyHistory: ['diabetes', 'hypertension'] },
      environmentData: { location: 'Urban', pollutionLevel: 'Moderate' },
      preferences: { language: 'en', notifications: true },
    },
  });

  // Create sample cures
  await prisma.cure.upsert({
    where: { allergyType: 'Pollen' },
    update: {},
    create: {
      allergyType: 'Pollen',
      treatmentPlan: 'Antihistamines, nasal sprays, immunotherapy',
      doctorNotes: 'Avoid outdoor activities during high pollen count days',
    },
  });

  await prisma.cure.upsert({
    where: { allergyType: 'Penicillin' },
    update: {},
    create: {
      allergyType: 'Penicillin',
      treatmentPlan: 'Use alternative antibiotics like azithromycin or fluoroquinolones',
      doctorNotes: 'Always inform healthcare providers about penicillin allergy',
    },
  });

  // Create sample alternative medicines
  await prisma.alternativeMedicine.create({
    data: {
      medicineName: 'Aspirin',
      saferAlternative: 'Acetaminophen',
      notes: 'Lower risk of gastrointestinal bleeding',
    },
  });

  // Create sample prescriptions for patient
  const prescription1 = await prisma.prescription.create({
    data: {
      userId: patient.id,
      doctorId: doctor.id,
      drugName: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      status: 'ACTIVE',
      notes: 'For type 2 diabetes management',
    },
  });

  const prescription2 = await prisma.prescription.create({
    data: {
      userId: patient.id,
      doctorId: doctor.id,
      drugName: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      status: 'ACTIVE',
      notes: 'For blood pressure control',
    },
  });

  // Create sample drug interaction
  await prisma.drugInteraction.create({
    data: {
      userId: patient.id,
      prescriptionId: prescription1.id,
      drugsInvolved: ['Metformin', 'Alcohol'],
      severity: 'MODERATE',
      description: 'Combining metformin with alcohol may increase the risk of lactic acidosis, a serious condition.',
      saferAlternatives: ['Avoid alcohol consumption', 'Limit alcohol to moderate amounts with food'],
      aiExplanation: 'Metformin and alcohol can both affect lactate metabolism. When combined, there is an increased risk of lactic acidosis, especially in patients with kidney problems. Patients should avoid excessive alcohol consumption while taking metformin.',
      autoChecked: true,
    },
  });

  console.log('Seeding completed!');
  console.log('Sample credentials:');
  console.log('Patient: patient@neocure.com / patient123');
  console.log('Doctor: doctor@neocure.com / doctor123');
  console.log('Admin: admin@neocure.com / admin123');
  console.log('\nSample data created:');
  console.log('- 2 active prescriptions for patient');
  console.log('- 1 drug interaction warning');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
