const express = require('express');
const router = express.Router();
const db = require('../db');

// ✅ Basic POST / route for automated testing only
router.post('/', (req, res) => {
  const { month, amount } = req.body;
  const userId = req.session?.user?.id;

  if (!userId) return res.status(401).send('Not logged in');

  const validMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
  const parsedAmount = parseFloat(amount);

  if (!validMonth || isNaN(parsedAmount) || parsedAmount < 0) {
    return res.status(400).send('Invalid data');
  }

  const query = `INSERT INTO budget (month, amount, user_id) VALUES (?, ?, ?)`;
  db.query(query, [month, parsedAmount, userId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Failed to insert budget');
    }
    res.status(200).send('Budget inserted');
  });
});

// ✅ Existing: Set budget for selected month via browser form
router.post('/set', (req, res) => {
  let { month, amount } = req.body;
  const userId = req.session?.user?.id;

  if (!userId) {
    req.session.message = '❌ Please log in first.';
    return res.redirect('/login');
  }

  const validMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
  if (!validMonth) {
    req.session.message = '❌ Invalid month format.';
    return res.redirect('/budget');
  }

  amount = parseFloat(amount);
  if (isNaN(amount) || amount < 0) {
    req.session.message = '❌ Invalid amount.';
    return res.redirect('/budget');
  }

  const checkQuery = `SELECT * FROM budget WHERE month = ? AND user_id = ?`;
  db.query(checkQuery, [month, userId], (err, results) => {
    if (err) {
      console.error(err);
      req.session.message = '❌ Database error while checking for existing budget.';
      return res.redirect('/budget');
    }

    if (results.length > 0) {
      req.session.message = '⚠️ A budget already exists for this month. Please update it from the summary page.';
      return res.redirect('/budget');
    }

    const insertQuery = `INSERT INTO budget (month, amount, user_id) VALUES (?, ?, ?)`;
    db.query(insertQuery, [month, amount, userId], (insertErr) => {
      if (insertErr) {
        console.error(insertErr);
        req.session.message = '❌ Failed to insert new budget.';
      } else {
        req.session.message = '✅ Budget saved successfully!';
      }
      res.redirect('/budget');
    });
  });
});

// ✅ View budget amount for a specific month
router.get('/view', (req, res) => {
  const { month } = req.query;
  const userId = req.session?.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  const query = `SELECT amount FROM budget WHERE month = ? AND user_id = ?`;
  db.query(query, [month, userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error retrieving budget');
    }
    res.json(results[0] || { amount: 0 });
  });
});

// ✅ Update budget for a month
router.post('/update', (req, res) => {
  const { month, amount } = req.body;
  const userId = req.session?.user?.id;

  if (!userId) return res.status(401).send('Not logged in');

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount < 0) {
    req.session.message = '❌ Invalid budget amount.';
    return res.redirect('/summary');
  }

  const query = `UPDATE budget SET amount = ? WHERE month = ? AND user_id = ?`;
  db.query(query, [parsedAmount, month, userId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Failed to update budget.');
    }
    req.session.message = '✅ Budget updated successfully!';
    res.redirect('/summary');
  });
});

// ✅ Delete a budget for a month
router.post('/delete/:month', (req, res) => {
  const userId = req.session?.user?.id;
  const month = req.params.month;

  if (!userId) {
    req.session.message = '❌ Please log in first.';
    return res.redirect('/login');
  }

  const query = `DELETE FROM budget WHERE month = ? AND user_id = ?`;
  db.query(query, [month, userId], (err) => {
    if (err) {
      console.error(err);
      req.session.message = '❌ Failed to delete budget.';
    } else {
      req.session.message = '✅ Budget deleted successfully!';
    }
    res.redirect('/summary');
  });
});

module.exports = router;
