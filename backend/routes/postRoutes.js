const User = require("../models/User");
const express = require("express");
const Post = require("../models/Post");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get all posts
router.get("/", async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a post
router.post("/", authMiddleware, async (req, res) => {
    try {
        const newPost = new Post({
            username: req.body.username,
            userId: req.user.userId,
            content: req.body.content
        });

        const savedPost = await newPost.save();
        res.status(201).json(savedPost);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Like a post
router.patch("/:id/like", authMiddleware, async (req, res) => {
    try {
        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            { $inc: { likes: 1 } },
            { new: true }
        );

        if (!updatedPost) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        res.json(updatedPost);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

    
        // Add a comment to a post
router.post("/:id/comments", authMiddleware, async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                message: "Comment is required"
            });
        }
        const post = await Post.findById(req.params.id);

if (!post) {
    return res.status(404).json({
        message: "Post not found"
    });
}
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        post.comments.push({
            username: user.username,
            text
        });

        await post.save();

        res.status(201).json({
            message: "Comment added successfully!",
            comments: post.comments
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// Get comments for a post
router.get("/:id/comments", authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        res.json(post.comments);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// Delete a post
router.delete("/:id", authMiddleware, async (req, res) => {
try {
    const post = await Post.findById(req.params.id);

    if (!post) {
        return res.status(404).json({
            message: "Post not found"
        });
    }

    // Check post ownership
    if (post.userId.toString() !== req.user.userId) {
        return res.status(403).json({
            message: "You can only delete your own posts"
        });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({
        message: "Post deleted successfully!"
    });

} catch (error) {
    res.status(500).json({
        message: error.message
    });
}
});

module.exports = router;