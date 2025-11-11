-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utorid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "spent" REAL,
    "earned" INTEGER,
    "amount" INTEGER,
    "remark" TEXT,
    "promotionIds" TEXT,
    "createdBy" TEXT NOT NULL,
    "relatedId" INTEGER,
    "suspicious" BOOLEAN NOT NULL DEFAULT false,
    "processedBy" TEXT,
    "redeemed" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_utorid_fkey" FOREIGN KEY ("utorid") REFERENCES "User" ("utorid") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("amount", "createdBy", "earned", "id", "processedBy", "promotionIds", "redeemed", "relatedId", "remark", "spent", "suspicious", "type", "utorid") SELECT "amount", "createdBy", "earned", "id", "processedBy", "promotionIds", "redeemed", "relatedId", "remark", "spent", "suspicious", "type", "utorid" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
