-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_student_parents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'apoderado',
    "phone" TEXT,
    "email" TEXT,
    "monthlyFee" REAL,
    CONSTRAINT "student_parents_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_parents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "student_parents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_student_parents" ("email", "id", "institutionId", "monthlyFee", "name", "phone", "relationship", "studentId") SELECT "email", "id", "institutionId", "monthlyFee", "name", "phone", "relationship", "studentId" FROM "student_parents";
DROP TABLE "student_parents";
ALTER TABLE "new_student_parents" RENAME TO "student_parents";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
