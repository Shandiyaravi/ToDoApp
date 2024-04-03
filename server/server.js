const pool = require('./db');
const PORT = process.env.PORT ?? 8000;
const express = require('express');
const app = express();
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;
app.use(cors());
app.use(express.json());

// Middleware function to validate JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  console.log('Token:', token);

  jwt.verify(token, secretKey, (err, decoded) => {
    console.log('ERROR:', err);

    if (err)
      return res
        .status(403)
        .send({ detail: 'Failed to authenticate token' });

    req.userEmail = decoded.email;
    next();
  });
};

//get all todos
app.get('/todos', async (req, res) => {
  const userEmail = req.userEmail;

  if (!userEmail)
    return res.status(401).send({ detail: 'Token not provided' });

  console.log('User Email:', userEmail);

  try {
    const todos = await pool.query(
      'SELECT * FROM todos WHERE user_email = $1',
      [userEmail]
    );
    res.json(todos.rows);
  } catch (err) {
    console.log(err);
    res.status(500).send({ detail: 'Internal server error' });
  }
});

// create a new todo
app.post('/todos', verifyToken, async (req, res) => {
  const { user_email, title, progress, date } = req.body;
  const id = uuidv4();
  try {
    const newToDo = await pool.query(
      `INSERT INTO todos(id, user_email, title, progress, date) VALUES($1, $2, $3, $4, $5)`,
      [id, user_email, title, progress, date]
    );
    res.json(newToDo);
  } catch (err) {
    console.log(err);
    res.status(500).send({ detail: 'Internal server error' });
  }
});

// edit a new todo
app.put('/todos/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { user_email, title, progress, date } = req.body;
  try {
    const editToDo = await pool.query(
      'UPDATE todos SET user_email = $1, title = $2, progress = $3, date = $4 WHERE id = $5;',
      [user_email, title, progress, date, id]
    );
    res.json(editToDo);
  } catch (err) {
    console.error(err);
    res.status(500).send({ detail: 'Internal server error' });
  }
});

// delete a todo
app.delete('/todos/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const deleteToDo = await pool.query(
      'DELETE FROM todos WHERE id = $1;',
      [id]
    );
    res.json(deleteToDo);
  } catch (err) {
    console.error(err);
    res.status(500).send({ detail: 'Internal server error' });
  }
});

// login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const users = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    if (!users.rows.length)
      return res.json({ detail: 'User does not exist!' });
    const success = await bcrypt.compare(
      password,
      users.rows[0].hashed_password
    );
    const token = jwt.sign({ email }, secretKey, {
      expiresIn: '1hr',
    });
    if (success) {
      res.json({ email: users.rows[0].email, token });
    } else {
      res.json({ detail: 'Login failed' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ detail: 'Internal server error' });
  }
});

// signup
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  try {
    const signUp = await pool.query(
      `INSERT INTO users (email, hashed_password) VALUES($1, $2)`,
      [email, hashedPassword]
    );

    const token = jwt.sign({ email }, secretKey, {
      expiresIn: '1hr',
    });

    res.json({ email, token });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      res.json({ detail: 'This email already exists' });
    } else {
      res.status(500).send({ detail: 'Internal server error' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});