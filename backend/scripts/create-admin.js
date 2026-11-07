
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

async function createAdmin() {
  try {
    const fullName = process.env.ADMIN_NAME;
    const username = process.env.ADMIN_USERNAME;
    const mobileNumber = process.env.ADMIN_MOBILE;
    const pin = process.env.ADMIN_PIN;
    const password = process.env.ADMIN_PASSWORD;

    if (!fullName || !username || !mobileNumber || !pin || !password) {
      throw new Error(
        "ADMIN_NAME, ADMIN_USERNAME, ADMIN_MOBILE, ADMIN_PIN and ADMIN_PASSWORD are required"
      );
    }

    if (!/^[0-9]{4,8}$/.test(pin)) {
      throw new Error("Admin PIN must contain 4 to 8 digits");
    }

    if (password.length < 12 || password.length > 72) {
      throw new Error("Admin password must be 12 to 72 characters");
    }

    await prisma.$connect();

    const [passwordHash, pinHash] = await Promise.all([
      bcrypt.hash(password, 12),
      bcrypt.hash(pin, 12),
    ]);

    const admin = await prisma.admin.upsert({
      where: { mobileNumber },
      update: {
        fullName,
        username,
        password: passwordHash,
        pinHash,
        role: "SUPER_ADMIN",
        isActive: true,
      },
      create: {
        fullName,
        username,
        mobileNumber,
        password: passwordHash,
        pinHash,
        role: "SUPER_ADMIN",
        isActive: true,
      },
    });

    console.log("Admin created/updated successfully!");
    console.log("Admin ID:", admin.id);
    console.log("Admin Username:", admin.username);
    console.log("Admin Mobile:", admin.mobileNumber);
  } catch (error) {
    console.error("Admin creation failed:", error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
