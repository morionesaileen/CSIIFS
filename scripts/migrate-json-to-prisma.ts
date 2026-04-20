import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DB_FILE = path.join(process.cwd(), 'database.json');

async function migrate() {
  console.log('Starting execution of JSON -> PostgreSQL Migration...');

  if (!fs.existsSync(DB_FILE)) {
    console.error(`Database file not found at ${DB_FILE}. Migration cancelled.`);
    return;
  }

  const rawData = fs.readFileSync(DB_FILE, 'utf-8');
  const database = JSON.parse(rawData);

  console.log(`Loaded JSON database: ${database.users?.length || 0} users, ${database.student_records?.length || 0} records.`);

  try {
    // 1. Process Users & Students
    for (const u of database.users) {
      if (u.role === 'Admin') {
        const existingAdmin = await prisma.user.findUnique({
          where: { username: u.username }
        });

        if (!existingAdmin) {
          await prisma.user.create({
            data: {
              username: u.username,
              email: u.email || `${u.username}@admin.local`,
              password_hash: u.password_hash,
              role: 'admin',
              created_at: u.created_at ? new Date(u.created_at) : new Date()
            }
          });
          console.log(`Migrated Admin: ${u.username}`);
        }
      } else if (u.role === 'Student') {
        const existingStudent = await prisma.student.findUnique({
          where: { student_number: u.student_number }
        });

        if (!existingStudent) {
          const studentRecord = database.student_records?.find((record: any) => record.user_id === u.user_id);

          const createdStudent = await prisma.student.create({
            data: {
              student_number: u.student_number,
              password_hash: u.password_hash,
              first_name: studentRecord?.first_name || null,
              middle_name: studentRecord?.middle_name || null,
              last_name: studentRecord?.last_name || null,
              sex: studentRecord?.sex || null,
              birth_date: studentRecord?.birth_date || null,
              citizenship: studentRecord?.citizenship || null,
              enrollment_status: studentRecord?.enrollment_status || null,
              department: studentRecord?.department || null,
              program: studentRecord?.program || null,
              year_level: studentRecord?.year_level || null,
              block_section: studentRecord?.block_section || null,
              scholarship_status: studentRecord?.scholarship_status || null,
              religion: studentRecord?.religion || null,
              contact_number: studentRecord?.contact_number || null,
              cellphone_num: studentRecord?.cellphone_num || null,
              annualfam_income: studentRecord?.annualfam_income || null,
              height_cm: studentRecord?.height_cm || null,
              weight_kg: studentRecord?.weight_kg || null,
              blood_type: studentRecord?.blood_type || null,
              created_at: u.created_at ? new Date(u.created_at) : new Date()
            }
          });

          console.log(`Migrated Student: ${u.student_number}`);

          // Create Identity & Profile Link
          await prisma.profile.create({
            data: {
              student_id: createdStudent.id,
              email: u.email || null,
              display_name: u.display_name || null,
              avatar_url: u.avatar_id || null,
              indigenous_other: studentRecord?.indigenous_group || null,
              has_disability: studentRecord?.has_disability === 'Yes',
              disability_type: studentRecord?.disability_status || null
            }
          });

          // Create Address Arrays
          if (studentRecord) {
             if (studentRecord.curr_province || studentRecord.curr_municipality) {
                await prisma.address.create({
                   data: {
                      student_id: createdStudent.id,
                      address_type: "current",
                      street: studentRecord.curr_street || null,
                      barangay: studentRecord.curr_barangay || null,
                      municipality: studentRecord.curr_municipality || null,
                      province: studentRecord.curr_province || null,
                      zip_code: studentRecord.curr_zipcode || null
                   }
                });
             }
             if (studentRecord.perm_province || studentRecord.perm_municipality) {
                await prisma.address.create({
                   data: {
                      student_id: createdStudent.id,
                      address_type: "permanent",
                      street: studentRecord.perm_street || null,
                      barangay: studentRecord.perm_barangay || null,
                      municipality: studentRecord.perm_municipality || null,
                      province: studentRecord.perm_province || null,
                      zip_code: studentRecord.perm_zipcode || null
                   }
                });
             }
          }
        }
      }
    }

    console.log('Migration completed successfully! Disconnecting Prism Client...');
  } catch (error) {
    console.error('Migration failed heavily:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
