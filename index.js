require('dotenv').config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const pool = require("./job_appsDB");

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

/* ---------- Routes ---------- */
const path = require('path');

// Serve React static files
app.use(express.static(path.join(__dirname, 'build')));

// For any other requests, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Create
app.post("/job", async (req, res) => {
  try {
    const { company_name, job_role, job_link, job_salary, date_applied, app_status } = req.body;
    const q = `INSERT INTO companies (company_name, job_role, job_link, job_salary, date_applied, app_status)
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    const vals = [company_name, job_role, job_link, job_salary, date_applied, app_status];
    const result = await pool.query(q, vals);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /job error:", err);
    res.status(500).send("Server error");
  }
});

// Get All
app.get("/job", async (req, res) => {
  try {
    const allJobs = await pool.query("SELECT * FROM companies ORDER BY id DESC");
    res.json(allJobs.rows);
  } catch (err) {
    console.error("GET /job error:", err);
    res.status(500).send("Server error");
  }
});

// Get a single job app
app.get("/job/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const jobApp = await pool.query("SELECT * FROM companies WHERE id = $1", [id]);
    if (!jobApp.rows[0]) return res.status(404).json({ error: "Not found" });
    res.json(jobApp.rows[0]);
  } catch (err) {
    console.error("GET /job/:id error:", err);
    res.status(500).send("Server error");
  }
});

// Update
app.put("/job/:id", async (req, res) => {
  try {
    const jobId = req.params.id;
    const updateJob = `
      UPDATE companies SET 
        company_name = $1, 
        job_role = $2, 
        date_applied = $3, 
        app_status = $4, 
        status_rejected = $5,
        status_interviewed = $6,
        status_technical = $7,
        status_offer = $8,
        job_link = $9,
        job_salary = $10
      WHERE id = $11
      RETURNING *`;
    const values = [
      req.body.company_name,
      req.body.job_role,
      req.body.date_applied,
      req.body.app_status,
      req.body.status_rejected || false,
      req.body.status_interviewed || false,
      req.body.status_technical || false,
      req.body.status_offer || false,
      req.body.job_link,
      req.body.job_salary,
      jobId
    ];
    const result = await pool.query(updateJob, values);
    if (!result.rows[0]) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /job/:id error:", err);
    res.status(500).send("Server error");
  }
});

// Delete
app.delete("/job/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const del = await pool.query("DELETE FROM companies WHERE id = $1 RETURNING *", [id]);
    if (!del.rows[0]) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Job has been deleted.", deleted: del.rows[0] });
  } catch (err) {
    console.error("DELETE /job/:id error:", err);
    res.status(500).send("Server error");
  }
});

// Health
app.get("/", (req, res) => res.send("Server running"));

// Start server using PORT from .env
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
