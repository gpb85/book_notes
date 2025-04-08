import express from "express";
import bodyParser from "body-parser";
import pool from "./db/db.js";

import morgan from "morgan";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(morgan("tiny"));

app.get("/", async (req, res) => {
  try {
    const response = await pool.query(
      "SELECT * FROM books JOIN book_reviews ON books.book_id=book_reviews.book_id"
    );
    const data = response.rows;
    if (data.length === 0) {
      res.render("index.ejs", {
        data: [],
        noBookMessage: "No books here!! Sorry :-(",
      });
    } else {
      res.render("index.ejs", { data: data });
    }
    console.log("books ", data);
  } catch (error) {
    console.error("Error fetching data ", error);
    res.status("500").send("error fetching data");
  }
});

app.get("/book", async (req, res) => {
  const { key, title, author, cover, year } = req.query;
  try {
    const bookCheck = await pool.query(`SELECT * FROM books WHERE key=$1`, [
      key,
    ]);

    if (bookCheck.rows.length > 0) {
      const bookId = bookCheck.rows[0].book_id;
      const reviewCheck = await pool.query(
        `SELECT * FROM book_reviews WHERE book_id=$1`,
        [bookId]
      );
      const review = reviewCheck.rows[0];

      res.render("addBook.ejs", {
        mode: "update",
        bookId,
        key,
        title: bookCheck.rows[0].title,
        author: bookCheck.rows[0].author,
        cover: bookCheck.rows[0].cover_id,
        year: bookCheck.rows[0].year,
        review_text: review?.review_text || "",
        rating: review?.rating || "",
      });
    } else {
      res.render("addBook.ejs", {
        mode: "add",
        bookId: null,
        key,
        title,
        author,
        cover,
        year,
        review_text: "",
        rating: "",
      });
    }
  } catch (error) {
    console.error("Checkbook failed", error);
    res.status(500).send("Failed checkbook");
  }
});

app.post("/sort", async (req, res) => {
  const { sort } = req.body;
  let sortQuery;
  switch (sort) {
    case "title":
      sortQuery = `ORDER BY title ASC`;
      break;
    case "author":
      sortQuery = "ORDER BY author ASC";
      break;
    case "rating":
      sortQuery = "ORDER BY rating DESC";
      break;
  }

  try {
    const response = await pool.query(
      `SELECT * FROM books JOIN book_reviews ON books.book_id=book_reviews.book_id ${sortQuery}`
    );
    const sortedData = response.rows;
    res.render("index.ejs", { data: sortedData });
  } catch (error) {
    console.error("Sort failed ", error);
    res.status(500).send("Sort failed");
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

app.post("/add", async (req, res) => {
  const { key, title, author, cover, year, review, rating } = req.body;
  console.log(req.body);

  try {
    await pool.query("BEGIN");
    const newBook = await pool.query(
      `INSERT INTO books (key,title,author,cover_id,year) VALUES($1,$2,$3,$4) RETURNING book_id`,
      [key, title, author, cover, year]
    );
    console.log("newBook", newBook);

    const newBbookReview = await pool.query(
      `INSERT INTO book_reviews(book_id,review_text,rating) VALUES($1,$2,$3) RETURNING *`,
      [newBook.rows[0].book_id, review, rating]
    );
    await pool.query("COMMIT");
    res.redirect("/");
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Failed newbook add.");
  }
});
