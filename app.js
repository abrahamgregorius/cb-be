import express from "express";

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to log each request
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Import routes
import allRouter from "./routes/route.js";


// Routes
app.get("/", (req, res) => {
    res.json({ message: "EaseBuy REST API Server" });
});

// Use user routes
app.use("/api/", allRouter);

// Error handling middleware
// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(500).json({ error: "Something went wrong!" });
// });

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "404 Not Found" });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
