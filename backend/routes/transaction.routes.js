
import express from "express";
import { randomUUID } from "node:crypto";

import { prisma } from "../lib/prisma.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.use(
  authenticate,
  authorizeRoles("ADMIN", "SUPER_ADMIN")
);

const MAX_AMOUNT = 1000000000;

function validateAmount(value) {
  const amount = Number(value);

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > MAX_AMOUNT ||
    !/^\d+(\.\d{1,2})?$/.test(String(value))
  ) {
    return null;
  }

  return amount;
}

function generateTransactionId() {
  return `SB-TXN-${randomUUID()}`;
}

// 1. ADD MONEY (SIMULATED DEPOSIT)
router.post("/accounts/:accountNumber/deposit", async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const { amount, description } = req.body;

    const validAmount = validateAmount(amount);

    if (validAmount === null) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid positive amount with up to 2 decimals.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { accountNumber },
      });

      if (!account) {
        const error = new Error("ACCOUNT_NOT_FOUND");
        throw error;
      }

      if (account.status !== "ACTIVE") {
        const error = new Error("ACCOUNT_NOT_ACTIVE");
        throw error;
      }

      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: {
          balance: {
            increment: validAmount,
          },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          transactionId: generateTransactionId(),
          type: "DEPOSIT",
          amount: validAmount,
          description: description
            ? String(description).trim().slice(0, 255)
            : "Admin simulated deposit",
          status: "SUCCESS",
          accountId: account.id,
        },
      });

      await tx.securityLog.create({
        data: {
          adminId: req.user.id,
          customerId: account.customerId,
          eventType: "ADMIN_DEPOSIT",
          severity: "INFO",
          description: `Admin added simulated money to account ${accountNumber}.`,
          metadata: {
            transactionId: transaction.transactionId,
            amount: String(validAmount),
          },
        },
      });

      return { updatedAccount, transaction };
    });

    return res.status(201).json({
      success: true,
      message: "Simulated money added successfully.",
      data: result,
    });
  } catch (error) {
    if (error.message === "ACCOUNT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    if (error.message === "ACCOUNT_NOT_ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "This account is not active.",
      });
    }

    console.error("Deposit error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete simulated deposit.",
    });
  }
});

// 2. WITHDRAW MONEY (SIMULATED)
router.post("/accounts/:accountNumber/withdraw", async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const { amount, description } = req.body;

    const validAmount = validateAmount(amount);

    if (validAmount === null) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid positive amount with up to 2 decimals.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { accountNumber },
      });

      if (!account) {
        const error = new Error("ACCOUNT_NOT_FOUND");
        throw error;
      }

      if (account.status !== "ACTIVE") {
        const error = new Error("ACCOUNT_NOT_ACTIVE");
        throw error;
      }

      // Atomic balance check and deduction
      const updateResult = await tx.account.updateMany({
        where: {
          id: account.id,
          status: "ACTIVE",
          balance: {
            gte: validAmount,
          },
        },
        data: {
          balance: {
            decrement: validAmount,
          },
        },
      });

      if (updateResult.count === 0) {
        const error = new Error("INSUFFICIENT_BALANCE");
        throw error;
      }

      const updatedAccount = await tx.account.findUnique({
        where: { id: account.id },
      });

      const transaction = await tx.transaction.create({
        data: {
          transactionId: generateTransactionId(),
          type: "WITHDRAW",
          amount: validAmount,
          description: description
            ? String(description).trim().slice(0, 255)
            : "Admin simulated withdrawal",
          status: "SUCCESS",
          accountId: account.id,
        },
      });

      await tx.securityLog.create({
        data: {
          adminId: req.user.id,
          customerId: account.customerId,
          eventType: "ADMIN_WITHDRAWAL",
          severity: "INFO",
          description: `Admin processed simulated withdrawal from account ${accountNumber}.`,
          metadata: {
            transactionId: transaction.transactionId,
            amount: String(validAmount),
          },
        },
      });

      return { updatedAccount, transaction };
    });

    return res.json({
      success: true,
      message: "Simulated withdrawal completed successfully.",
      data: result,
    });
  } catch (error) {
    if (error.message === "ACCOUNT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    if (error.message === "ACCOUNT_NOT_ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "This account is not active.",
      });
    }

    if (error.message === "INSUFFICIENT_BALANCE") {
      return res.status(400).json({
        success: false,
        message: "Insufficient account balance.",
      });
    }

    console.error("Withdrawal error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete simulated withdrawal.",
    });
  }
});

// 3. VIEW ALL TRANSACTIONS
router.get("/transactions", async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    const skip = (page - 1) * limit;

    const [transactions, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          account: {
            select: {
              accountNumber: true,
              customer: {
                select: {
                  id: true,
                  fullName: true,
                  mobileNumber: true,
                },
              },
            },
          },
        },
      }),
      prisma.transaction.count(),
    ]);

    return res.json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: transactions,
    });
  } catch (error) {
    console.error("Transaction history error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve transaction history.",
    });
  }
});

// 4. VIEW TRANSACTIONS FOR ONE ACCOUNT
router.get("/accounts/:accountNumber/transactions", async (req, res) => {
  try {
    const { accountNumber } = req.params;

    const account = await prisma.account.findUnique({
      where: { accountNumber },
      select: { id: true, accountNumber: true },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    const transactions = await prisma.transaction.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      accountNumber: account.accountNumber,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error("Account transactions error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve account transactions.",
    });
  }
});

// 5. BLOCK OR UNBLOCK ACCOUNT
router.patch("/accounts/:accountNumber/status", async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "BLOCKED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be ACTIVE or BLOCKED.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { accountNumber },
      });

      if (!account) {
        const error = new Error("ACCOUNT_NOT_FOUND");
        throw error;
      }

      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: { status },
      });

      await tx.securityLog.create({
        data: {
          adminId: req.user.id,
          customerId: account.customerId,
          eventType:
            status === "BLOCKED" ? "ACCOUNT_BLOCKED" : "ACCOUNT_UNBLOCKED",
          severity: status === "BLOCKED" ? "WARNING" : "INFO",
          description: `Admin changed account ${accountNumber} status to ${status}.`,
        },
      });

      return updatedAccount;
    });

    return res.json({
      success: true,
      message: `Account ${status.toLowerCase()} successfully.`,
      data: result,
    });
  } catch (error) {
    if (error.message === "ACCOUNT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    console.error("Account status update error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update account status.",
    });
  }
});

export default router;
