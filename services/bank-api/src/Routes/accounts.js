import express from "express";
import bodyParser from "body-parser";
import data from "../Data/data.js"; // Assumed to be bank data

const bankRouter = express.Router();

bankRouter.use(bodyParser.json());

// --- Helper Function ---
const findAccount = (accountNumber) => data.find(acc => acc.accountNumber === accountNumber);

/**
 * @swagger
 * components:
 *   schemas:
 *     BankAccount:
 *       type: object
 *       required:
 *         - accountNumber
 *         - accountHolder
 *         - balance
 *       properties:
 *         accountNumber:
 *           type: string
 *           description: The bank account number
 *         accountHolder:
 *           type: string
 *           description: Name of the account holder
 *         accountType:
 *           type: string
 *           description: Type of the account (e.g., Savings, Checking)
 *         balance:
 *           type: number
 *           description: Current account balance
 *         currency:
 *           type: string
 *           description: Currency type (e.g., USD, INR)
 *         branch:
 *           type: string
 *           description: Branch name
 *         ifscCode:
 *           type: string
 *           description: IFSC or routing code
 *         createdDate:
 *           type: string
 *           format: date
 *           description: Date when the account was created
 *         status:
 *           type: string
 *           description: Account status (Active/Inactive/Frozen)
 *       example:
 *         accountNumber: "0123456789"
 *         accountHolder: "John Doe"
 *         accountType: "Savings"
 *         balance: 15230.75
 *         currency: "USD"
 *         branch: "New York Main"
 *         ifscCode: "NYMB0000123"
 *         createdDate: "2020-05-12"
 *         status: "Active"
 */

/**
 * @swagger
 * tags:
 *   name: BankAccounts
 *   description: Bank account management
 */

/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: Returns all bank accounts
 *     tags: [BankAccounts]
 *     responses:
 *       200:
 *         description: List of all accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BankAccount'
 */
bankRouter.get("/", (req, res) => {
  console.log("Fetched all bank accounts");
  res.send(data);
});

/**
 * @swagger
 * /accounts/search:
 *   get:
 *     summary: Search/filter bank accounts by query parameters
 *     tags: [BankAccounts]
 *     parameters:
 *       - in: query
 *         name: accountType
 *         schema:
 *           type: string
 *       - in: query
 *         name: branch
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of matching accounts
 */
bankRouter.get("/search", (req, res) => {
  let results = data;
  Object.entries(req.query).forEach(([key, val]) => {
    results = results.filter(acc => acc[key] == val);
  });
  res.send(results);
});

/**
 * @swagger
 * /accounts/recent:
 *   get:
 *     summary: Get recently created accounts
 *     tags: [BankAccounts]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *         description: Number of recent days to filter
 *     responses:
 *       200:
 *         description: List of recent accounts
 */
bankRouter.get("/recent", (req, res) => {
  const days = parseInt(req.query.days || "30");
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const recent = data.filter(acc => new Date(acc.createdDate) >= cutoff);
  res.send(recent);
});

/**
 * @swagger
 * /accounts/summary:
 *   get:
 *     summary: Get account summary statistics
 *     tags: [BankAccounts]
 *     responses:
 *       200:
 *         description: Summary of account data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalAccounts:
 *                   type: integer
 *                   description: Total number of bank accounts
 *                 totalBalanceByCurrency:
 *                   type: object
 *                   additionalProperties:
 *                     type: number
 *                   description: Total balance grouped by currency
 *                 byType:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *                   description: Number of accounts grouped by account type
 *               example:
 *                 totalAccounts: 5
 *                 totalBalanceByCurrency:
 *                   USD: 10300.50
 *                   INR: 750000.00
 *                 byType:
 *                   Savings: 3
 *                   Checking: 2
 */
bankRouter.get("/summary", (req, res) => {
  const totalAccounts = data.length;

  const totalBalanceByCurrency = data.reduce((acc, account) => {
    const currency = account.currency || "UNKNOWN";
    acc[currency] = (acc[currency] || 0) + account.balance;
    return acc;
  }, {});

  const byType = data.reduce((acc, cur) => {
    acc[cur.accountType] = (acc[cur.accountType] || 0) + 1;
    return acc;
  }, {});

  res.send({
    totalAccounts,
    totalBalanceByCurrency,
    byType
  });
});

/**
 * @swagger
 * /accounts/{accountNumber}:
 *   get:
 *     summary: Get a specific bank account by account number
 *     tags: [BankAccounts]
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Bank account number
 *     responses:
 *       200:
 *         description: Bank account data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BankAccount'
 *       404:
 *         description: Account not found
 */
bankRouter.get("/:accountNumber", (req, res) => {
  const account = findAccount(req.params.accountNumber);
  if (!account) return res.sendStatus(404);
  res.send(account);
});

/**
 * @swagger
 * /accounts:
 *   post:
 *     summary: Create a new bank account
 *     tags: [BankAccounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BankAccount'
 *     responses:
 *       200:
 *         description: New account created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BankAccount'
 */
bankRouter.post("/", (req, res) => {
  const account = {
    ...req.body,
    createdDate: new Date().toISOString().split("T")[0],
    status: "Active",
  };
  data.push(account);
  res.send(account);
});

/**
 * @swagger
 * /accounts/{accountNumber}:
 *   put:
 *     summary: Update a bank account
 *     tags: [BankAccounts]
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Bank account number to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BankAccount'
 *     responses:
 *       200:
 *         description: Account updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BankAccount'
 *       404:
 *         description: Account not found
 */
bankRouter.put("/:accountNumber", (req, res) => {
  const index = data.findIndex(acc => acc.accountNumber === req.params.accountNumber);
  if (index === -1) return res.sendStatus(404);

  data[index] = {
    ...data[index],
    ...req.body,
    accountNumber: req.params.accountNumber, // keep accountNumber immutable
  };
  res.send(data[index]);
});

/**
 * @swagger
 * /accounts/{accountNumber}:
 *   delete:
 *     summary: Delete a bank account
 *     tags: [BankAccounts]
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Bank account number
 *     responses:
 *       200:
 *         description: Account deleted
 *       404:
 *         description: Account not found
 */
bankRouter.delete("/:accountNumber", (req, res) => {
  const index = data.findIndex(acc => acc.accountNumber === req.params.accountNumber);
  if (index === -1) return res.sendStatus(404);

  data.splice(index, 1);
  res.sendStatus(200);
});

/**
 * @swagger
 * /accounts/transfer:
 *   post:
 *     summary: Transfer funds between accounts
 *     tags: [BankAccounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fromAccountNumber:
 *                 type: string
 *               toAccountNumber:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Transfer completed
 *       400:
 *         description: Insufficient funds or invalid accounts or currency mismatch
 */
bankRouter.post("/transfer", (req, res) => {
  const { fromAccountNumber, toAccountNumber, amount } = req.body;
  const from = findAccount(fromAccountNumber);
  const to = findAccount(toAccountNumber);

  if (!from || !to || amount <= 0) 
    return res.status(400).send({ error: "Invalid accounts or amount" });

  if (from.currency !== to.currency) 
    return res.status(400).send({ error: "Currency mismatch: Transfer only allowed between same currency accounts" });

  if (from.balance < amount) 
    return res.status(400).send({ error: "Insufficient funds" });

  from.balance -= amount;
  to.balance += amount;

  res.send({ message: "Transfer successful", from, to });
});

/**
 * @swagger
 * /accounts/{accountNumber}/deposit:
 *   post:
 *     summary: Deposit funds into an account
 *     tags: [BankAccounts]
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Deposit successful
 *       400:
 *         description: Invalid input
 */
bankRouter.post("/:accountNumber/deposit", (req, res) => {
  const amount = parseFloat(req.body.amount);
  const account = findAccount(req.params.accountNumber);

  if (!account || isNaN(amount) || amount <= 0) {
    return res.status(400).send({ error: "Invalid account or amount" });
  }

  account.balance = parseFloat(account.balance); // Ensure balance is a number
  account.balance += amount;

  res.send(account);
});


/**
 * @swagger
 * /accounts/{accountNumber}/withdraw:
 *   post:
 *     summary: Withdraw funds from an account
 *     tags: [BankAccounts]
 *     parameters:
 *       - in: path
 *         name: accountNumber
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BankAccount'
 *       400:
 *         description: Invalid input or insufficient funds
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
bankRouter.post("/:accountNumber/withdraw", (req, res) => {
  const { amount } = req.body;
  const accountNumber = req.params.accountNumber;
  const account = findAccount(accountNumber);

  if (!account) {
    return res.status(404).json({ error: "Account not found" });
  }

  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "Invalid withdrawal amount" });
  }

  if (account.balance < amount) {
    return res.status(400).json({ error: "Insufficient funds" });
  }

  account.balance -= amount;
  res.status(200).json(account);
});

export default bankRouter;
