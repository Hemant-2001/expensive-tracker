const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// GET /api/transactions  - get all for logged-in user
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort({
      date: -1,
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/transactions  - add new
router.post('/', async (req, res) => {
  try {
    const { type, description, amount, category } = req.body;

    if (!type || !description || !amount) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (!['Income', 'Expense'].includes(type)) {
      return res.status(400).json({ message: 'Type must be Income or Expense.' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0.' });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      description,
      amount,
      category: category || 'Other',
    });

    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/transactions/:id - update
router.put('/:id', async (req, res) => {
  try {
    const { type, description, amount, category } = req.body;

    if (!type || !description || !amount) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { type, description, amount, category },
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }

    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }

    res.json({ message: 'Transaction deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/transactions/ai-advice - Simple AI-like advice logic
router.get('/ai-advice', async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id });
    const expenses = transactions.filter(t => t.type === 'Expense');
    const totalExpense = expenses.reduce((acc, t) => acc + t.amount, 0);
    
    if (expenses.length === 0) {
      return res.json({ advice: "You haven't recorded any expenses yet. Start tracking to get personalized advice!" });
    }

    // Category-wise analysis
    const categories = {};
    expenses.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    let advice = "Based on your spending patterns: ";
    const sortedCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    const topCategory = sortedCategories[0];
    const topPercent = ((topCategory[1] / totalExpense) * 100).toFixed(0);

    if (topCategory[0] === 'Food' && topPercent > 30) {
      advice += `You've spent ${topPercent}% of your total expenses on Food. Consider cooking at home more often to save!`;
    } else if (topCategory[0] === 'Shopping' && topPercent > 20) {
      advice += `Shopping accounts for ${topPercent}% of your spending. Try the '30-day rule' before making non-essential purchases.`;
    } else if (topCategory[0] === 'Entertainment' && topPercent > 15) {
      advice += `You're spending a significant amount on Entertainment (${topPercent}%). Look for free local events to balance your budget.`;
    } else if (totalExpense > 0) {
      advice += `Your top spending category is ${topCategory[0]} (${topPercent}%). Keeping an eye on this will help you save more this month.`;
    }

    // General tips
    const tips = [
      "Try to save at least 20% of your income every month.",
      "Always check for subscriptions you no longer use.",
      "Small daily expenses like coffee can add up to a lot by the end of the month.",
      "Consider setting a stricter budget for your top spending categories."
    ];
    advice += " " + tips[Math.floor(Math.random() * tips.length)];

    res.json({ advice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
