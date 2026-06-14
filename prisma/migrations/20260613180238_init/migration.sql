-- CreateTable
CREATE TABLE "institutions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "institution_config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "institution_config_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "institution_years" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "periodType" TEXT NOT NULL DEFAULT 'bimestral',
    CONSTRAINT "institution_years_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "academic_periods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    CONSTRAINT "academic_periods_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "academic_periods_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "institution_years" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "canViewPayments" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "user_roles_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "levels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "levels_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "grades_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "grades_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "sections_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sections_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dni" TEXT,
    "birthDate" DATETIME,
    "gender" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "students_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "student_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "enrolledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "student_enrollments_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "student_enrollments_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "student_enrollments_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "institution_years" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "student_parents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'apoderado',
    "phone" TEXT,
    "email" TEXT,
    "monthlyFee" REAL,
    CONSTRAINT "student_parents_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_parents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "staffType" TEXT NOT NULL DEFAULT 'docente',
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "staff_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "levelId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "gradeType" TEXT NOT NULL DEFAULT 'quantitative',
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "courses_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "courses_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "course_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "evalCount" INTEGER NOT NULL DEFAULT 4,
    CONSTRAINT "course_assignments_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "course_assignments_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "course_assignments_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "course_assignments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "course_assignments_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "institution_years" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "grade_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "scores" TEXT NOT NULL DEFAULT '[]',
    "finalGrade" REAL,
    "qualitative" TEXT,
    "observation" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "grade_records_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "grade_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "grade_records_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "grade_records_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "grade_records_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "academic_periods" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "student_qr_codes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "qrData" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "student_qr_codes_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_qr_codes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'present',
    "note" TEXT,
    "scannedAt" DATETIME,
    CONSTRAINT "attendance_records_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attendance_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "attendance_records_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'low',
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "incidents_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "incidents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "billing_concepts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "billing_concepts_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "dueDate" DATETIME,
    "month" INTEGER,
    "year" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    CONSTRAINT "payment_orders_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payment_orders_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payment_orders_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "billing_concepts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paidAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL DEFAULT 'cash',
    "note" TEXT,
    CONSTRAINT "payments_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "payment_orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "announcements_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "announcement_reads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "announcement_reads_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "school_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    CONSTRAINT "school_events_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "student_health_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "weight" REAL,
    "height" REAL,
    "bloodType" TEXT,
    "allergies" TEXT,
    "medications" TEXT,
    "conditions" TEXT,
    "insurance" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "student_health_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "student_medical_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "healthRecordId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "student_medical_documents_healthRecordId_fkey" FOREIGN KEY ("healthRecordId") REFERENCES "student_health_records" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "library_resources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "genre" TEXT,
    "level" TEXT,
    "grade" TEXT,
    "coverUrl" TEXT,
    "fileUrl" TEXT,
    "externalUrl" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "library_resources_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reading_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "yearId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "reading_plans_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "institution_years" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reading_plans_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reading_plan_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "dueDate" DATETIME,
    CONSTRAINT "reading_plan_assignments_planId_fkey" FOREIGN KEY ("planId") REFERENCES "reading_plans" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reading_plan_assignments_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "library_resources" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reading_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    CONSTRAINT "reading_progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reading_progress_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "reading_plan_assignments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "superadmins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "institutions_slug_key" ON "institutions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "institution_config_institutionId_key_key" ON "institution_config"("institutionId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "users_institutionId_email_key" ON "users"("institutionId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_roleId_institutionId_key" ON "user_roles"("userId", "roleId", "institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "student_enrollments_studentId_yearId_key" ON "student_enrollments"("studentId", "yearId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_userId_key" ON "staff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "course_assignments_staffId_sectionId_courseId_yearId_key" ON "course_assignments"("staffId", "sectionId", "courseId", "yearId");

-- CreateIndex
CREATE UNIQUE INDEX "grade_records_studentId_courseId_periodId_key" ON "grade_records"("studentId", "courseId", "periodId");

-- CreateIndex
CREATE UNIQUE INDEX "student_qr_codes_qrData_key" ON "student_qr_codes"("qrData");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_studentId_sectionId_date_key" ON "attendance_records"("studentId", "sectionId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_reads_announcementId_userId_key" ON "announcement_reads"("announcementId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "student_health_records_studentId_key" ON "student_health_records"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "reading_progress_studentId_assignmentId_key" ON "reading_progress"("studentId", "assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "superadmins_email_key" ON "superadmins"("email");
