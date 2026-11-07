
import express from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

// Customer-only access
router.use((req, res, next) => {
  if (req.user.role !== "CUSTOMER") {
    return res.status(403).json({
      success: false,
      message: "Customer access required.",
    });
  }

  next();
});

// 1. CUSTOMER DASHBOARD
router.get("/dashboard", async (req, res) => {
  try {
    const customerId = req.user.id;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        mobileNumber: true,
        email: true,
        isActive: true,
        accounts: {
          select: {
            id: true,
            accountNumber: true,
            accountType: true,
            balance: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (!customer.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your customer account is inactive.",
      });
    }

    const accountIds = customer.accounts.map((account) => account.id);

    const [transactionCount, recentTransactions] =
      accountIds.length > 0
        ? await Promise.all([
            prisma.transaction.count({
              where: { accountId: { in: accountIds } },
            }),
            prisma.transaction.findMany({
              where: { accountId: { in: accountIds } },
              orderBy: { createdAt: "desc" },
              take: 5,
              select: {
                transactionId: true,
                type: true,
                amount: true,
                description: true,
                status: true,
                createdAt: true,
                account: {
                  select: {
                    accountNumber: true,
                  },
                },
              },
            }),
          ])
        : [0, []];

    const totalBalance = customer.accounts
      .filter((account) => account.status === "ACTIVE")
      .reduce((total, account) => total + Number(account.balance), 0);

    return res.json({
      success: true,
      message: "Customer dashboard loaded successfully.",
      data: {
        customer: {
          id: customer.id,
          fullName: customer.fullName,
          mobileNumber: customer.mobileNumber,
          email: customer.email,
        },
        accounts: customer.accounts,
        summary: {
          totalBalance: totalBalance.toFixed(2),
          totalAccounts: customer.accounts.length,
          totalTransactions: transactionCount,
        },
        recentTransactions,
      },
    });
  } catch (error) {
    console.error("Customer dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load customer dashboard.",
    });
  }
});

// 2. CUSTOMER PROFILE
router.get("/profile", async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        mobileNumber: true,
        email: true,
        isRegistered: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    return res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Customer profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve profile.",
    });
  }
});

// 3. CUSTOMER ACCOUNT INFORMATION
router.get("/accounts", async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      where: {
        customerId: req.user.id,
      },
      select: {
        id: true,
        accountNumber: true,
        accountType: true,
        balance: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      count: accounts.length,
      data: accounts,
    });
  } catch (error) {
    console.error("Customer accounts error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve accounts.",
    });
  }
});

// 4. CUSTOMER ACCOUNT BALANCE
router.get("/accounts/:accountNumber/balance", async (req, res) => {
  try {
    const account = await prisma.account.findFirst({
      where: {
        accountNumber: req.params.accountNumber,
        customerId: req.user.id,
      },
      select: {
        accountNumber: true,
        accountType: true,
        balance: true,
        status: true,
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    return res.json({
      success: true,
      data: account,
    });
  } catch (error) {
    console.error("Account balance error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve account balance.",
    });
  }
});

// 5. CUSTOMER TRANSACTION HISTORY
router.get("/transactions", async (req, res) => {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    const skip = (page - 1) * limit;

    const accountIds = await prisma.account.findMany({
      where: {
        customerId: req.user.id,
      },
      select: {
        id: true,
      },
    });

    const ids = accountIds.map((account) => account.id);

    const [transactions, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where: {
          accountId: { in: ids },
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          transactionId: true,
          type: true,
          amount: true,
          description: true,
          recipientAccount: true,
          status: true,
          createdAt: true,
          account: {
            select: {
              accountNumber: true,
            },
          },
        },
      }),
      prisma.transaction.count({
        where: {
          accountId: { in: ids },
        },
      }),
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
    console.error("Customer transaction history error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve transaction history.",
    });
  }
});

export default router;
