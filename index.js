import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";

env.config();

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let quiz = [];
let currentQuestion = {};
let totalCorrect = 0;

async function loadDataAndStartServer() {
  try {
    await db.connect();
    const result = await db.query("SELECT * FROM capitals");
    quiz = result.rows;

    if (quiz.length === 0) {
      console.error("No data loaded from DB.");
      process.exit(1);
    }

    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

loadDataAndStartServer();


// GET home page
app.get("/", async (req, res) => {
  totalCorrect = 0;
  await nextQuestion();

  if (!currentQuestion) {
    return res.send("No questions loaded. Try again later.");
  }

  res.render("index.ejs", { question: currentQuestion });
});


// POST answer
app.post("/submit", async (req, res) => {
  let answer = req.body.answer.trim();
  let isCorrect = false;

  if (currentQuestion.capital.toLowerCase() === answer.toLowerCase()) {
    totalCorrect++;
    isCorrect = true;
  }

  await nextQuestion();

  res.render("index.ejs", {
    question: currentQuestion,
    wasCorrect: isCorrect,
    totalScore: totalCorrect,
  });
});

// Randomly pick next question
async function nextQuestion() {
  if (quiz.length === 0) {
    console.log("Quiz data not loaded yet.");
    currentQuestion = null;
    return;
  }
  const randomIndex = Math.floor(Math.random() * quiz.length);
  currentQuestion = quiz[randomIndex];
}


// Start the app only after loading data
loadDataAndStartServer();


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});