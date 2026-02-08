const express = require("express");
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const axios = require('axios');
const public_users = express.Router();

public_users.post("/register", (req, res) => {
  const username = req.body && req.body.username;
  const password = req.body && req.body.password;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  const userExists = users.some((user) => user.username === username);
  if (userExists) {
    return res.status(409).json({ message: "User already exists!" });
  }

  users.push({ username: username, password: password });
  return res.status(201).json({ message: "User successfully registered. Now you can login" });
});

// Get the book list available in the shop
// Using async/await with axios (custom adapter) so no external network call is required.
public_users.get("/", async function (req, res) {
  try {
    const client = axios.create({
      adapter: (config) => {
        return Promise.resolve({
          data: books,
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        });
      }
    });

    const response = await client.get('/books');
    return res.status(200).json(response.data);
  } catch (err) {
    return res.status(500).json({ message: 'Unable to fetch book list.' });
  }
});

// Get book details based on ISBN
public_users.get("/isbn/:isbn", async function (req, res) {
  const isbn = req.params.isbn;
  try {
    const client = axios.create({
      adapter: (config) => {
        const parts = (config.url || "").split('/');
        const id = parts[parts.length - 1];
        return Promise.resolve({
          data: books[id] || null,
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        });
      }
    });

    const response = await client.get(`/books/${isbn}`);
    if (!response.data) {
      return res.status(404).json({ message: "Book not found." });
    }
    return res.status(200).json(response.data);
  } catch (err) {
    return res.status(500).json({ message: 'Unable to fetch book details.' });
  }
});

// Get book details based on author
public_users.get("/author/:author", async function (req, res) {
  const author = req.params.author;
  try {
    const client = axios.create({
      adapter: (config) => {
        const reqAuthor = (config.url || "").split('/').pop();
        const filteredBooks = [];
        for (const isbn in books) {
          if (books[isbn].author === reqAuthor) {
            books[isbn].isbn = isbn;
            filteredBooks.push(books[isbn]);
          }
        }
        return Promise.resolve({
          data: filteredBooks,
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        });
      }
    });

    const response = await client.get(`/author/${author}`);
    if (!response.data || response.data.length === 0) {
      return res.status(404).json({ message: "No books found for this author." });
    }
    return res.status(200).json(response.data);
  } catch (err) {
    return res.status(500).json({ message: 'Unable to fetch books by author.' });
  }
});

// Get all books based on title
public_users.get("/title/:title", async function (req, res) {
  const title = req.params.title;
  try {
    const client = axios.create({
      adapter: (config) => {
        const reqTitle = (config.url || "").split('/').pop();
        const filteredBooks = [];
        for (const isbn in books) {
          if (books[isbn].title === reqTitle) {
            books[isbn].isbn = isbn;
            filteredBooks.push(books[isbn]);
          }
        }
        return Promise.resolve({
          data: filteredBooks,
          status: 200,
          statusText: 'OK',
          headers: {},
          config
        });
      }
    });

    const response = await client.get(`/title/${title}`);
    if (!response.data || response.data.length === 0) {
      return res.status(404).json({ message: "No books found with this title." });
    }
    return res.status(200).json(response.data);
  } catch (err) {
    return res.status(500).json({ message: 'Unable to fetch books by title.' });
  }
});

//  Get book review
public_users.get("/review/:isbn", function (req, res) {
  const isbn = req.params.isbn;
  res.send(books[isbn].reviews);
});

module.exports.general = public_users;
