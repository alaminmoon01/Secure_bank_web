
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { rateLimit } from "express-rate-limit";
import crypto from "crypto";

import { prisma } from "../lib/prisma.js";
import {
  authenticate,
  authorizeRoles,
} from "../middleware/auth.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Try again later.",
  },
});

const MAX_LOGIN_ATTEMPTS = 5;
const OTP_EXPIRY_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;

function generateToken(userId, role) {
  return jwt.sign(
    { role },
    process.env.JWT_SECRET,
    {
      subject: String(userId),
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      issuer: "securebank-api",
      audience: "securebank-client",
    }
  );
}

function hashFingerprint(fingerprint) {
  return crypto
    .createHash("sha256")
    .update(fingerprint)
    .digest("hex");
}

function getRequestInfo(req) {
  const userAgent = req.get("user-agent") || "Unknown";

  let browser = "Unknown";
  let operatingSystem = "Unknown";

  if (userAgent.includes("Edg/")) browser = "Microsoft Edge";
  else if (userAgent.includes("Chrome/")) browser = "Google Chrome";
  else if (userAgent.includes("Firefox/")) browser = "Mozilla Firefox";
  else if (userAgent.includes("Safari/")) browser = "Safari";

  if (userAgent.includes("Windows")) operatingSystem = "Windows";
  else if (userAgent.includes("Android")) operatingSystem = "Android";
  else if (userAgent.includes("iPhone")) operatingSystem = "iOS";
  else if (userAgent.includes("Mac OS")) operatingSystem = "macOS";
  else if (userAgent.includes("Linux")) operatingSystem = "Linux";

  return {
    ipAddress: req.ip || null,
    browser,
    operatingSystem,
    userAgent,
  };
}

function generateOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}

async function createSecurityLog(data) {
  return prisma.securityLog.create({ data });
}

// CUSTOMER REGISTRATION
router.post("/customer/register", authLimiter, async (req, res) => {
  try {
    const {
      accountNumber,
      mobileNumber,
      password,
      confirmPassword,
    } = req.body;

    if (!accountNumber || !mobileNumber || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!/^\d{10,15}$/.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid mobile number",
      });
    }

    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must contain uppercase, lowercase, number and special character",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const account = await prisma.account.findUnique({
      where: { accountNumber },
      include: { customer: true },
    });

    if (
      !account ||
      account.customer.mobileNumber !== mobileNumber ||
      !account.customer.isActive ||
      account.status !== "ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message: "Account number or mobile number is incorrect",
      });
    }

    if (account.customer.isRegistered || account.customer.password) {
      return res.status(409).json({
        success: false,
        message: "This account is already registered. Please login.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.customer.update({
      where: { id: account.customerId },
      data: {
        password: hashedPassword,
        isRegistered: true,
      },
    });

    await createSecurityLog({
      customerId: account.customerId,
      eventType: "CUSTOMER_REGISTRATION",
      severity: "INFO",
      description: "Customer completed initial registration",
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful. You can now login.",
    });
  } catch (error) {
    console.error("Customer registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
});

// CUSTOMER LOGIN - PASSWORD + DEVICE APPROVAL
router.post("/customer/login", authLimiter, async (req, res) => {
  try {
    const {
      mobileNumber,
      password,
      deviceFingerprint,
      deviceName,
      approximateLocation,
    } = req.body;

    if (!mobileNumber || !password || !deviceFingerprint) {
      return res.status(400).json({
        success: false,
        message: "Mobile number, password and device fingerprint are required",
      });
    }

    if (typeof deviceFingerprint !== "string" || deviceFingerprint.length < 10 || deviceFingerprint.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Invalid device fingerprint",
      });
    }

    const customer = await prisma.customer.findUnique({
      where: { mobileNumber },
    });

    if (
      !customer ||
      !customer.isActive ||
      !customer.isRegistered ||
      !customer.password
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid login credentials or registration not completed",
      });
    }

    if (customer.isLocked) {
      return res.status(423).json({
        success: false,
        message: "Your account is locked. Admin approval is required.",
      });
    }

    const fingerprintHash = hashFingerprint(deviceFingerprint);
    const requestInfo = getRequestInfo(req);

    let device = await prisma.trustedDevice.findUnique({
      where: {
        customerId_fingerprintHash: {
          customerId: customer.id,
          fingerprintHash,
        },
      },
    });

    if (device?.isLocked) {
      return res.status(423).json({
        success: false,
        message: "This device is locked. Admin approval is required.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      customer.password
    );

    if (!passwordMatch) {
      const nextAttempts = customer.failedLoginAttempts + 1;
      const shouldLock = nextAttempts >= MAX_LOGIN_ATTEMPTS;

      await prisma.$transaction(async (tx) => {
        await tx.customer.update({
          where: { id: customer.id },
          data: {
            failedLoginAttempts: nextAttempts,
            ...(shouldLock
              ? {
                  isLocked: true,
                  lockedAt: new Date(),
                  lockReason: "Five consecutive incorrect login attempts",
                }
              : {}),
          },
        });

        if (device) {
          await tx.trustedDevice.update({
            where: { id: device.id },
            data: {
              failedAttempts: { increment: 1 },
              ...(shouldLock
                ? {
                    isLocked: true,
                    lockedAt: new Date(),
                    status: "LOCKED",
                    isActive: false,
                  }
                : {}),
            },
          });
        }

        await tx.loginAttempt.create({
          data: {
            customerId: customer.id,
            mobileNumber,
            ipAddress: requestInfo.ipAddress,
            fingerprintHash,
            success: false,
            reason: "Incorrect password",
          },
        });

        if (shouldLock) {
          await tx.securityLog.create({
            data: {
              customerId: customer.id,
              eventType: "ACCOUNT_DEVICE_LOCKED",
              severity: "HIGH",
              description: "Customer account locked after five incorrect login attempts",
              ipAddress: requestInfo.ipAddress,
            },
          });

          await tx.loginRequest.create({
            data: {
              customerId: customer.id,
              deviceId: device?.id || null,
              status: "PENDING",
              reason: "Account and device locked after five incorrect login attempts",
            },
          });
        }
      });

      return res.status(shouldLock ? 423 : 401).json({
        success: false,
        locked: shouldLock,
        remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - nextAttempts),
        message: shouldLock
          ? "Five incorrect attempts reached. Account and known device locked. Admin approval is required."
          : "Invalid login credentials",
      });
    }

    // Correct password: reset failed password attempts.
    await prisma.customer.update({
      where: { id: customer.id },
      data: { failedLoginAttempts: 0 },
    });

    await prisma.loginAttempt.create({
      data: {
        customerId: customer.id,
        mobileNumber,
        ipAddress: requestInfo.ipAddress,
        fingerprintHash,
        success: true,
        reason: "Password verified",
      },
    });

    // NEW DEVICE: SAVE AND REQUEST ADMIN APPROVAL.
    if (!device) {
      device = await prisma.trustedDevice.create({
        data: {
          customerId: customer.id,
          fingerprintHash,
          deviceName: deviceName || "Unknown device",
          ipAddress: requestInfo.ipAddress,
          browser: requestInfo.browser,
          operatingSystem: requestInfo.operatingSystem,
          approximateLocation: approximateLocation || null,
          status: "PENDING",
          isActive: true,
        },
      });

      const existingRequest = await prisma.loginRequest.findFirst({
        where: {
          customerId: customer.id,
          deviceId: device.id,
          status: "PENDING",
        },
      });

      if (!existingRequest) {
        await prisma.loginRequest.create({
          data: {
            customerId: customer.id,
            deviceId: device.id,
            status: "PENDING",
            reason: "Login attempt from a new device",
          },
        });
      }

      await createSecurityLog({
        customerId: customer.id,
        eventType: "NEW_DEVICE_LOGIN_REQUEST",
        severity: "WARNING",
        description: "New device requires Admin approval",
        ipAddress: requestInfo.ipAddress,
        metadata: {
          browser: requestInfo.browser,
          operatingSystem: requestInfo.operatingSystem,
          deviceName: deviceName || "Unknown device",
        },
      });

      return res.status(202).json({
        success: true,
        requiresAdminApproval: true,
        message: "New device detected. Your login request has been sent to Admin.",
      });
    }

    // KNOWN DEVICE MUST BE ADMIN APPROVED.
    if (device.status !== "APPROVED" || !device.isActive) {
      return res.status(403).json({
        success: false,
        requiresAdminApproval: true,
        message: "This device is waiting for Admin approval.",
      });
    }

    // CREATE LOGIN REQUEST FOR 2FA.
    const loginRequest = await prisma.loginRequest.create({
      data: {
        customerId: customer.id,
        deviceId: device.id,
        status: "APPROVED",
        reason: "Approved trusted device login",
      },
    });

    const otp = generateOTP();
    const codeHash = await bcrypt.hash(otp, 10);

    await prisma.twoFactorCode.create({
      data: {
        customerId: customer.id,
        loginRequestId: loginRequest.id,
        codeHash,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      },
    });

    await prisma.trustedDevice.update({
      where: { id: device.id },
      data: { lastUsedAt: new Date() },
    });

    await createSecurityLog({
      customerId: customer.id,
      eventType: "TWO_FACTOR_CODE_CREATED",
      severity: "INFO",
      description: "Two-factor authentication code created",
      ipAddress: requestInfo.ipAddress,
    });

    const response = {
      success: true,
      requiresTwoFactor: true,
      loginRequestId: loginRequest.id,
      message: "Password verified. Enter your two-factor authentication code.",
    };

    // Development-only testing. Do not expose OTP in production.
    if (process.env.NODE_ENV !== "production") {
      response.developmentOTP = otp;
    }

    return res.json(response);
  } catch (error) {
    console.error("Customer login error:", error);

    return res.status(500).json({
      success: false,
      message: "Customer login failed",
    });
  }
});

// CUSTOMER TWO-FACTOR VERIFICATION
router.post("/customer/verify-2fa", authLimiter, async (req, res) => {
  try {
    const { loginRequestId, otp } = req.body;

    if (!loginRequestId || !otp) {
      return res.status(400).json({
        success: false,
        message: "Login request ID and OTP are required",
      });
    }

    if (!/^\d{6}$/.test(String(otp))) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid six-digit OTP",
      });
    }

    const loginRequest = await prisma.loginRequest.findUnique({
      where: { id: Number(loginRequestId) },
      include: {
        customer: true,
        device: true,
        twoFactorCodes: {
          where: { consumedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (
      !loginRequest ||
      loginRequest.status !== "APPROVED" ||
      !loginRequest.device ||
      loginRequest.device.status !== "APPROVED" ||
      !loginRequest.device.isActive ||
      loginRequest.device.isLocked ||
      loginRequest.customer.isLocked ||
      !loginRequest.customer.isActive
    ) {
      return res.status(403).json({
        success: false,
        message: "Login request is not approved or account/device is locked",
      });
    }

    const codeRecord = loginRequest.twoFactorCodes[0];

    if (!codeRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please login again.",
      });
    }

    if (codeRecord.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please login again.",
      });
    }

    if (codeRecord.attempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: "Maximum OTP attempts exceeded. Please login again.",
      });
    }

    const otpMatch = await bcrypt.compare(
      String(otp),
      codeRecord.codeHash
    );

    if (!otpMatch) {
      await prisma.twoFactorCode.update({
        where: { id: codeRecord.id },
        data: { attempts: { increment: 1 } },
      });

      return res.status(401).json({
        success: false,
        message: "Incorrect OTP",
      });
    }

    await prisma.twoFactorCode.update({
      where: { id: codeRecord.id },
      data: { consumedAt: new Date() },
    });

    const customer = loginRequest.customer;

    const token = generateToken(customer.id, "CUSTOMER");

    const user = {
      id: customer.id,
      fullName: customer.fullName,
      mobileNumber: customer.mobileNumber,
      role: "CUSTOMER",
    };

    await createSecurityLog({
      customerId: customer.id,
      eventType: "CUSTOMER_LOGIN_SUCCESS",
      severity: "INFO",
      description: "Customer completed password and two-factor verification",
      ipAddress: loginRequest.device.ipAddress,
    });

    return res.json({
      success: true,
      message: "Two-factor verification successful",
      token,
      user,
      customer: user,
    });
  } catch (error) {
    console.error("2FA verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Two-factor verification failed",
    });
  }
});

// ADMIN: VIEW PENDING LOGIN REQUESTS
router.get(
  "/admin/login-requests",
  authenticate,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const requests = await prisma.loginRequest.findMany({
        where: { status: "PENDING" },
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              mobileNumber: true,
              isLocked: true,
            },
          },
          device: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return res.json({
        success: true,
        count: requests.length,
        requests,
      });
    } catch (error) {
      console.error("Pending login requests error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not retrieve login requests",
      });
    }
  }
);

// ADMIN: APPROVE DEVICE / LOGIN REQUEST
router.patch(
  "/admin/login-requests/:id/approve",
  authenticate,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const requestId = Number(req.params.id);

      if (!Number.isInteger(requestId) || requestId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid request ID",
        });
      }

      const loginRequest = await prisma.loginRequest.findUnique({
        where: { id: requestId },
        include: { customer: true, device: true },
      });

      if (!loginRequest || loginRequest.status !== "PENDING") {
        return res.status(404).json({
          success: false,
          message: "Pending login request not found",
        });
      }

      if (!loginRequest.device) {
        return res.status(400).json({
          success: false,
          message: "This request has no associated device",
        });
      }

      if (loginRequest.customer.isLocked) {
        return res.status(423).json({
          success: false,
          message: "Customer account is locked. Unlock the account first.",
        });
      }

      await prisma.$transaction([
        prisma.trustedDevice.update({
          where: { id: loginRequest.device.id },
          data: {
            status: "APPROVED",
            isActive: true,
            isLocked: false,
            failedAttempts: 0,
            lockedAt: null,
          },
        }),
        prisma.loginRequest.update({
          where: { id: requestId },
          data: {
            status: "APPROVED",
            reviewedByAdminId: req.user.id,
            reviewedAt: new Date(),
          },
        }),
        prisma.securityLog.create({
          data: {
            customerId: loginRequest.customerId,
            adminId: req.user.id,
            eventType: "DEVICE_LOGIN_APPROVED",
            severity: "INFO",
            description: "Admin approved customer device login request",
          },
        }),
      ]);

      return res.json({
        success: true,
        message: "Device approved. Customer can login again and complete 2FA.",
      });
    } catch (error) {
      console.error("Approve login request error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not approve login request",
      });
    }
  }
);

// ADMIN: REJECT DEVICE / LOGIN REQUEST
router.patch(
  "/admin/login-requests/:id/reject",
  authenticate,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const requestId = Number(req.params.id);
      const { reason } = req.body;

      if (!Number.isInteger(requestId) || requestId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid request ID",
        });
      }

      const loginRequest = await prisma.loginRequest.findUnique({
        where: { id: requestId },
        include: { device: true },
      });

      if (!loginRequest || loginRequest.status !== "PENDING") {
        return res.status(404).json({
          success: false,
          message: "Pending login request not found",
        });
      }

      await prisma.$transaction([
        prisma.loginRequest.update({
          where: { id: requestId },
          data: {
            status: "REJECTED",
            reason: reason || "Rejected by Admin",
            reviewedByAdminId: req.user.id,
            reviewedAt: new Date(),
          },
        }),
        ...(loginRequest.device
          ? [
              prisma.trustedDevice.update({
                where: { id: loginRequest.device.id },
                data: {
                  status: "REJECTED",
                  isActive: false,
                },
              }),
            ]
          : []),
        prisma.securityLog.create({
          data: {
            customerId: loginRequest.customerId,
            adminId: req.user.id,
            eventType: "DEVICE_LOGIN_REJECTED",
            severity: "WARNING",
            description: reason || "Admin rejected customer device login request",
          },
        }),
      ]);

      return res.json({
        success: true,
        message: "Login request rejected",
      });
    } catch (error) {
      console.error("Reject login request error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not reject login request",
      });
    }
  }
);

// ADMIN: UNLOCK CUSTOMER ACCOUNT
router.patch(
  "/admin/customers/:customerId/unlock",
  authenticate,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const customerId = Number(req.params.customerId);

      if (!Number.isInteger(customerId) || customerId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer ID",
        });
      }

      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      await prisma.$transaction([
        prisma.customer.update({
          where: { id: customerId },
          data: {
            isLocked: false,
            failedLoginAttempts: 0,
            lockedAt: null,
            lockReason: null,
          },
        }),
        prisma.securityLog.create({
          data: {
            customerId,
            adminId: req.user.id,
            eventType: "CUSTOMER_ACCOUNT_UNLOCKED",
            severity: "INFO",
            description: "Admin unlocked customer account",
          },
        }),
      ]);

      return res.json({
        success: true,
        message: "Customer account unlocked",
      });
    } catch (error) {
      console.error("Unlock customer error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not unlock customer account",
      });
    }
  }
);

// ADMIN: UNLOCK DEVICE
router.patch(
  "/admin/devices/:deviceId/unlock",
  authenticate,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  async (req, res) => {
    try {
      const deviceId = Number(req.params.deviceId);

      if (!Number.isInteger(deviceId) || deviceId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid device ID",
        });
      }

      const device = await prisma.trustedDevice.findUnique({
        where: { id: deviceId },
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: "Device not found",
        });
      }

      await prisma.$transaction([
        prisma.trustedDevice.update({
          where: { id: deviceId },
          data: {
            isLocked: false,
            failedAttempts: 0,
            lockedAt: null,
            status: "APPROVED",
            isActive: true,
          },
        }),
        prisma.securityLog.create({
          data: {
            customerId: device.customerId,
            adminId: req.user.id,
            eventType: "DEVICE_UNLOCKED",
            severity: "INFO",
            description: "Admin unlocked customer device",
          },
        }),
      ]);

      return res.json({
        success: true,
        message: "Device unlocked and approved",
      });
    } catch (error) {
      console.error("Unlock device error:", error);

      return res.status(500).json({
        success: false,
        message: "Could not unlock device",
      });
    }
  }
);

// ADMIN LOGIN: USERNAME + PIN + PASSWORD
// Existing Admin Login logic preserved.
router.post("/admin/login", authLimiter, async (req, res) => {
  try {
    const { username, pin, password } = req.body;

    if (!username || !pin || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, PIN and password are required",
      });
    }

    const admin = await prisma.admin.findUnique({
      where: {
        username: username.trim(),
      },
    });

    if (
      !admin ||
      !admin.isActive ||
      !admin.pinHash ||
      !admin.password
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    const pinMatch = await bcrypt.compare(
      pin,
      admin.pinHash
    );

    if (!pinMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    const token = generateToken(admin.id, admin.role);

    const user = {
      id: admin.id,
      fullName: admin.fullName,
      username: admin.username,
      mobileNumber: admin.mobileNumber,
      role: admin.role,
    };

    return res.json({
      success: true,
      message: "Admin login successful",
      token,
      user,
      admin: user,
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      success: false,
      message: "Admin login failed",
    });
  }
});

// VERIFY CURRENT LOGIN
router.get("/me", authenticate, async (req, res) => {
  try {
    if (req.user.role === "CUSTOMER") {
      const customer = await prisma.customer.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          fullName: true,
          mobileNumber: true,
          email: true,
          isActive: true,
          isLocked: true,
        },
      });

      if (!customer || !customer.isActive || customer.isLocked) {
        return res.status(401).json({
          success: false,
          message: "Account is inactive or locked",
        });
      }

      return res.json({
        success: true,
        role: "CUSTOMER",
        user: customer,
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fullName: true,
        username: true,
        mobileNumber: true,
        role: true,
        isActive: true,
      },
    });

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Admin account is inactive",
      });
    }

    return res.json({
      success: true,
      role: admin.role,
      user: admin,
    });
  } catch (error) {
    console.error("Profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not retrieve profile",
    });
  }
});

// ADMIN-ONLY TEST ROUTE
router.get(
  "/admin/dashboard",
  authenticate,
  authorizeRoles("ADMIN", "SUPER_ADMIN"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome to SecureBank Admin Dashboard",
      adminId: req.user.id,
      role: req.user.role,
    });
  }
);

export default router;
