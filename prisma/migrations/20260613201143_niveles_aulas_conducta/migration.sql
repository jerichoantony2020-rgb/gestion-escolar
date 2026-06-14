-- AlterTable
ALTER TABLE "library_resources" ADD COLUMN "fileName" TEXT;
ALTER TABLE "library_resources" ADD COLUMN "fileType" TEXT;

-- CreateTable
CREATE TABLE "section_grades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectionId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    CONSTRAINT "section_grades_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "section_grades_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_attendance_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'present',
    "note" TEXT,
    "scannedAt" DATETIME,
    "entryAt" DATETIME,
    "exitAt" DATETIME,
    "notifiedEntry" BOOLEAN NOT NULL DEFAULT false,
    "notifiedExit" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "attendance_records_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attendance_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "attendance_records_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_attendance_records" ("date", "id", "institutionId", "note", "scannedAt", "sectionId", "status", "studentId") SELECT "date", "id", "institutionId", "note", "scannedAt", "sectionId", "status", "studentId" FROM "attendance_records";
DROP TABLE "attendance_records";
ALTER TABLE "new_attendance_records" RENAME TO "attendance_records";
CREATE UNIQUE INDEX "attendance_records_studentId_sectionId_date_key" ON "attendance_records"("studentId", "sectionId", "date");
CREATE TABLE "new_incidents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'negative',
    "title" TEXT,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'low',
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportedBy" TEXT,
    CONSTRAINT "incidents_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "incidents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_incidents" ("date", "description", "id", "institutionId", "severity", "studentId") SELECT "date", "description", "id", "institutionId", "severity", "studentId" FROM "incidents";
DROP TABLE "incidents";
ALTER TABLE "new_incidents" RENAME TO "incidents";
CREATE TABLE "new_sections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "levelId" TEXT,
    "gradeId" TEXT,
    "name" TEXT NOT NULL,
    "poligrado" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "sections_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sections_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sections_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_sections" ("gradeId", "id", "institutionId", "name") SELECT "gradeId", "id", "institutionId", "name" FROM "sections";
DROP TABLE "sections";
ALTER TABLE "new_sections" RENAME TO "sections";
CREATE TABLE "new_student_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "gradeId" TEXT,
    "yearId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "enrolledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "student_enrollments_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "student_enrollments_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "student_enrollments_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "student_enrollments_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "institution_years" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_student_enrollments" ("active", "enrolledAt", "id", "institutionId", "sectionId", "studentId", "yearId") SELECT "active", "enrolledAt", "id", "institutionId", "sectionId", "studentId", "yearId" FROM "student_enrollments";
DROP TABLE "student_enrollments";
ALTER TABLE "new_student_enrollments" RENAME TO "student_enrollments";
CREATE UNIQUE INDEX "student_enrollments_studentId_yearId_key" ON "student_enrollments"("studentId", "yearId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "section_grades_sectionId_gradeId_key" ON "section_grades"("sectionId", "gradeId");
