
const API_URL = "http://localhost:5000/api/posts";
const AUTH_URL = "http://localhost:5000/api/auth";

const usernameInput = document.getElementById("username");
const postContentInput = document.getElementById("postContent");
const postButton = document.getElementById("postButton");
const postsContainer = document.getElementById("postsContainer");

const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const authMessage = document.getElementById("authMessage");

const showLoginButton = document.getElementById("showLogin");
const showRegisterButton = document.getElementById("showRegister");

// Get JWT authorization header
function getAuthHeaders() {
    return {
        "Authorization": `Bearer ${localStorage.getItem("chatterboxToken")}`
    };
}

// Switch to Login
showLoginButton.addEventListener("click", () => {
    loginForm.hidden = false;
    registerForm.hidden = true;
    authMessage.textContent = "";
});

// Switch to Register
showRegisterButton.addEventListener("click", () => {
    loginForm.hidden = true;
    registerForm.hidden = false;
    authMessage.textContent = "";
});

// Show the app after successful authentication
function showApp(user) {
    authSection.hidden = true;
    appSection.hidden = false;

    usernameInput.value = user.username;
    usernameInput.readOnly = true;

    loadPosts();
}

// Register
registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("registerUsername").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    try {
        const response = await fetch(`${AUTH_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        localStorage.setItem("chatterboxToken", data.token);
        localStorage.setItem("chatterboxUser", JSON.stringify(data.user));

        showApp(data.user);

    } catch (error) {
        authMessage.textContent = error.message;
    }
});

// Login
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
        const response = await fetch(`${AUTH_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        localStorage.setItem("chatterboxToken", data.token);
        localStorage.setItem("chatterboxUser", JSON.stringify(data.user));

        showApp(data.user);

    } catch (error) {
        authMessage.textContent = error.message;
    }
});

// Restore the saved login after refreshing
const savedUser = localStorage.getItem("chatterboxUser");
const savedToken = localStorage.getItem("chatterboxToken");

if (savedUser && savedToken) {
    showApp(JSON.parse(savedUser));
}

// Logout
const logoutButton = document.getElementById("logoutButton");

logoutButton.addEventListener("click", () => {
    localStorage.removeItem("chatterboxToken");
    localStorage.removeItem("chatterboxUser");

    window.location.reload();
});

// Load all posts
async function loadPosts() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Could not load posts");
        }

        const posts = await response.json();
        postsContainer.innerHTML = "";

        if (posts.length === 0) {
            postsContainer.innerHTML =
                "<p>No posts yet. Be the first to share! 💜";
            return;
        }

        posts.forEach((post) => {
            const card = document.createElement("div");
            card.className = "post-card";

            // Profile initials
            const initial = post.username.charAt(0).toUpperCase();

            const profile = document.createElement("div");
            profile.className = "post-profile";

            const avatar = document.createElement("div");
            avatar.className = "avatar";
            avatar.textContent = initial;

            const details = document.createElement("div");

            const username = document.createElement("h3");
            username.textContent = post.username;

            const date = document.createElement("small");
            date.textContent = new Date(post.createdAt).toLocaleString();

            details.appendChild(username);
            details.appendChild(date);
            profile.appendChild(avatar);
            profile.appendChild(details);

            // Post content
            const content = document.createElement("p");
            content.className = "post-content";
            content.textContent = post.content;

            // Like button
            const likeButton = document.createElement("button");
            likeButton.className = "like-button";

            let likes = post.likes || 0;

            likeButton.textContent = `♡ Like ${likes}`;

            likeButton.addEventListener("click", async () => {
                try {
                    const response = await fetch(
                        `${API_URL}/${post._id}/like`,
                        {
                            method: "PATCH",
                            headers: getAuthHeaders()
                        }
                    );

                    if (!response.ok) {
                        throw new Error("Could not like post");
                    }

                    const updatedPost = await response.json();

                    likes = updatedPost.likes;
                    likeButton.textContent = `♥ Liked ${likes}`;
                    likeButton.classList.add("liked");
                    likeButton.disabled = true;

                } catch (error) {
                    alert("Could not like this post. Please try again.");
                    console.error(error);
                }
            });

            // Delete button
            const deleteButton = document.createElement("button");
            deleteButton.className = "delete-button";
            deleteButton.textContent = "Delete";

            deleteButton.addEventListener("click", () => {
                deletePost(post._id);
            });

            const actions = document.createElement("div");
            actions.className = "post-actions";
            actions.appendChild(likeButton);
            actions.appendChild(deleteButton);

            // Comment section
            const commentInput = document.createElement("input");
            commentInput.type = "text";
            commentInput.placeholder = "Write a comment...";

            const commentButton = document.createElement("button");
            commentButton.textContent = "Comment";
            commentButton.className = "comment-button";

            const commentsContainer = document.createElement("div");
            commentsContainer.className = "comments-container";

            // Load existing comments
            async function loadComments() {
                const response = await fetch(
                    `${API_URL}/${post._id}/comments`,
                    {
                        headers: getAuthHeaders()
                    }
                );

                if (!response.ok) {
                    throw new Error("Could not load comments");
                }

                const comments = await response.json();

                commentsContainer.innerHTML = "";

                comments.forEach((comment) => {
                    const commentItem = document.createElement("p");

                    commentItem.textContent =
                        `${comment.username}: ${comment.text}`;

                    commentsContainer.appendChild(commentItem);
                });
            }

            // Add a comment
            commentButton.addEventListener("click", async () => {
                const text = commentInput.value.trim();

                if (!text) {
                    alert("Please write a comment!");
                    return;
                }

                try {
                    const response = await fetch(
                        `${API_URL}/${post._id}/comments`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                ...getAuthHeaders()
                            },
                            body: JSON.stringify({
                                text: text
                            })
                        }
                    );

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message);
                    }

                    commentInput.value = "";
                    await loadComments();

                } catch (error) {
                    alert("Comment error: " + error.message);
                    console.error(error);
                }
            });

            const commentSection = document.createElement("div");
            commentSection.className = "comment-section";

            commentSection.appendChild(commentInput);
            commentSection.appendChild(commentButton);
            commentSection.appendChild(commentsContainer);

            loadComments().catch(console.error);

            // Add elements to post card
            card.appendChild(profile);
            card.appendChild(content);
            card.appendChild(actions);
            card.appendChild(commentSection);

            postsContainer.appendChild(card);
        });

    } catch (error) {
        postsContainer.textContent = "Unable to load posts.";
        console.error(error);
    }
}

// Create a post
async function createPost() {
    const username = usernameInput.value.trim();
    const content = postContentInput.value.trim();

    if (!username || !content) {
        alert("Please enter your name and write a post!");
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders()
            },
            body: JSON.stringify({ username, content })
        });

        if (!response.ok) {
            throw new Error("Failed to create post");
        }

        // Clear only the post content.
        // Keep the logged-in username available for comments.
        postContentInput.value = "";

        await loadPosts();

    } catch (error) {
        alert("Could not create post. Please try again.");
        console.error(error);
    }
}

// Delete a post
async function deletePost(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error("Failed to delete post");
        }

        await loadPosts();

    } catch (error) {
        alert("Could not delete post.");
        console.error(error);
    }
}

// Create post button
postButton.addEventListener("click", createPost);
