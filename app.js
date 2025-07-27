const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Routes
const expensesRoutes = require('./routes/expenses');
const budgetRoutes = require('./routes/budget');
const authRoutes = require('./routes/auth');

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'budget-secret',
  resave: false,
  saveUninitialized: false
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Flash message middleware
app.use((req, res, next) => {
  res.locals.message = req.session.message || '';
  delete req.session.message;
  next();
});

// Routes
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/index', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('index');
});

app.get('/add', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('add');
});

app.get('/budget', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('budget');
});

app.get('/summary', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const db = require('./db');
  const userId = req.session.user.id;
  const fromDate = req.query.from || '';
  const toDate = req.query.to || '';
  const filterCategory = req.query.category || '';

  try {
    let summaryQuery = `
      SELECT category, SUM(amount) AS total
      FROM expenses
      WHERE user_id = ?`;
    const summaryParams = [userId];

    if (fromDate && toDate) {
      summaryQuery += ` AND date BETWEEN ? AND ?`;
      summaryParams.push(fromDate, toDate);
    }
    if (filterCategory) {
      summaryQuery += ` AND category = ?`;
      summaryParams.push(filterCategory);
    }
    summaryQuery += ` GROUP BY category`;

    const [summaryResults] = await db.promise().query(summaryQuery, summaryParams);

    let detailQuery = `
      SELECT id, category, amount, DATE_FORMAT(date, '%Y-%m-%d') AS date
      FROM expenses
      WHERE user_id = ?`;
    const detailParams = [userId];

    if (fromDate && toDate) {
      detailQuery += ` AND date BETWEEN ? AND ?`;
      detailParams.push(fromDate, toDate);
    }
    if (filterCategory) {
      detailQuery += ` AND category = ?`;
      detailParams.push(filterCategory);
    }
    detailQuery += ` ORDER BY date DESC`;

    const [detailedExpenses] = await db.promise().query(detailQuery, detailParams);

    const [budgets] = await db.promise().query(
      `SELECT month, amount FROM budget WHERE user_id = ?`, [userId]
    );

    let selectedBudgetAmount = 0;
    if (fromDate) {
      const fromMonth = fromDate.slice(0, 7); 
      const match = budgets.find(b => b.month === fromMonth);
      if (match) {
        selectedBudgetAmount = match.amount;
      }
    }

    const totalExpense = detailedExpenses.reduce((acc, exp) => acc + parseFloat(exp.amount), 0);

    const [monthlyExpenses] = await db.promise().query(
      `SELECT DATE_FORMAT(date, '%Y-%m') AS month, SUM(amount) AS total
       FROM expenses
       WHERE user_id = ?
       GROUP BY month
       ORDER BY month DESC`, [userId]
    );

    const monthPercentages = monthlyExpenses.map(exp => {
      const matchedBudget = budgets.find(b => b.month === exp.month);
      const budget = matchedBudget?.amount || 0;
      const percentage = budget ? ((exp.total / budget) * 100).toFixed(1) : 0;
      return { ...exp, budget, percentage };
    });

    res.render('summary', {
      summary: summaryResults,
      budgets,
      totalExpense,
      monthlyExpenses: monthPercentages,
      filterFrom: fromDate,
      filterTo: toDate,
      filterCategory,
      selectedBudgetAmount,
      detailedExpenses
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Error loading summary');
  }
});

// Route handlers
app.use('/expenses', expensesRoutes);
app.use('/budget', budgetRoutes);
app.use('/', authRoutes);

// ✅ Export the app for server.js and testing
module.exports = app;
