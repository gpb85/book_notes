import express from "express";
import bodyParser from "body-parser";
import pool from "./db/db.js";
import dotenv from "dotenv";
import morgan from "morgan";

dotenv.config();

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(morgan("tiny"));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
