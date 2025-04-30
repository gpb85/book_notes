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
        review_text: reviewCheck.rows[0].review_text,
        rating: reviewCheck.rows[0].rating,
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

app.post('/addBook', async (req, res) => {
  const { key, title, author, cover, year, review_text, rating } = req.body;
  
  try {
    // Ελέγχουμε αν το βιβλίο υπάρχει ήδη στη βάση
    const bookCheck = await pool.query('SELECT * FROM books WHERE key=$1', [key]);
    
    if (bookCheck.rows.length > 0) {
      // Αν το βιβλίο υπάρχει, ενημερώνουμε τη βιβλιοκριτική (ή δημιουργούμε νέα αν δεν υπάρχει)
      const bookId = bookCheck.rows[0].book_id;
      
      // Ελέγχουμε αν η βιβλιοκριτική υπάρχει ήδη για το βιβλίο
      const reviewCheck = await pool.query('SELECT * FROM book_reviews WHERE book_id=$1', [bookId]);

      if (reviewCheck.rows.length > 0) {
        // Αν υπάρχει, κάνουμε update
        await pool.query(
          'UPDATE book_reviews SET review_text=$1, rating=$2 WHERE book_id=$3',
          [review_text, rating, bookId]
        );
      } else {
        // Αν δεν υπάρχει, προσθέτουμε νέα κριτική
        await pool.query(
          'INSERT INTO book_reviews (book_id, review_text, rating) VALUES ($1, $2, $3)',
          [bookId, review_text, rating]
        );
      }

      // Επιστρέφουμε στην ίδια σελίδα με τα δεδομένα του βιβλίου
      res.redirect(`/`);
    } else {
      // Αν το βιβλίο δεν υπάρχει, το προσθέτουμε στη βάση
      
      const insertBookResult = await pool.query(
        'INSERT INTO books (key, title, author, cover_id, year) VALUES ($1, $2, $3, $4, $5) RETURNING book_id',
        [key, title, author, cover, year]
      );
      const newBookId = insertBookResult.rows[0].book_id;
      
      // Προσθέτουμε την κριτική του βιβλίου
      await pool.query(
        'INSERT INTO book_reviews (book_id, review_text, rating) VALUES ($1, $2, $3)',
        [newBookId, review_text, rating]
      );

      // Επιστρέφουμε στην ίδια σελίδα με τα δεδομένα του βιβλίου
      res.redirect(`/`);
    }
  } catch (error) {
    console.error('Error in /addBook', error);
    res.status(500).send('Failed to add or update book and review');
  }
});


app.post('/deleteReview', async (req, res) => {
  let { bookId } = req.body;

  console.log("Delete request received with bookId:", bookId);

  // Αν το bookId είναι πίνακας, πάρε την πρώτη τιμή του πίνακα
  if (Array.isArray(bookId)) {
    bookId = bookId[0];
  }

  console.log("Final bookId:", bookId);

  if (!bookId) {
    return res.status(400).send("Book ID is required.");
  }

  try {
    // Ελέγχουμε αν η κριτική υπάρχει πρώτα
    const reviewCheck = await pool.query('SELECT * FROM book_reviews WHERE book_id=$1', [bookId]);

    if (reviewCheck.rows.length === 0) {
      return res.status(404).send("Review not found for this book.");
    }

    // Διαγραφή της κριτικής
    await pool.query('DELETE FROM book_reviews WHERE book_id=$1', [bookId]);

    // Επιστροφή στην αρχική σελίδα
    res.redirect('/');
  } catch (error) {
    console.error('Error deleting review', error);
    res.status(500).send('Failed to delete review');
  }
});




app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


