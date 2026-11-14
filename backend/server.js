const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Welcome to ChatterBox API!");
});

const postRoutes = require("./routes/postRoutes");
app.use("/api/posts", postRoutes);

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`ChatterBox server running on port ${PORT}`);
        });
    } catch (error) {
        console.log("Server startup failed:", error.message);
    }
};

startServer();