const navButtons = document.querySelectorAll(".nav-item");
const panelSections = document.querySelectorAll("[data-panel-content]");
const filterChips = document.querySelectorAll(".filter-chip");
const reactionButtons = document.querySelectorAll(".reaction-button");
const composerInput = document.querySelector("#composerInput");
const publishButton = document.querySelector("#publishButton");
const feedList = document.querySelector("#feedList");
const photoInput = document.querySelector("#photoInput");
const photoPreviewContainer = document.querySelector("#photoPreviewContainer");
const photoPreview = document.querySelector("#photoPreview");
const removePhotoBtn = document.querySelector("#removePhotoBtn");

function activatePanel(panelName) {
  navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.panel === panelName);
  });

  panelSections.forEach((section) => {
    const isMatch = section.dataset.panelContent === panelName;
    section.classList.toggle("active", isMatch);

    if (section.classList.contains("feed-panel")) {
      section.style.display = isMatch ? "block" : "none";
    }
  });

  if (panelName === "discover") {
    loadDiscoverPeople();
  } else if (panelName === "profile") {
    loadProfile();
  }
}

async function loadProfile() {
  const profileOverview = document.getElementById("profileOverview");
  if (!profileOverview) return;

  const token = localStorage.getItem("token");
  if (!token) {
    profileOverview.innerHTML = "<p style='color: #6a5666; padding: 1rem;'>Please log in to view your profile.</p>";
    return;
  }

  profileOverview.innerHTML = "<p style='color: #6a5666; padding: 1rem;'>Loading profile...</p>";

  try {
    const res = await fetch("/profile", {
      headers: { "Authorization": "Bearer " + token }
    });
    
    if (res.ok) {
      const user = await res.json();
      const avatarChar = user.name.charAt(0).toUpperCase();
      
      profileOverview.innerHTML = `
        <div class="profile-card large">
          <div class="post-author">
            <div class="avatar gold">${avatarChar}</div>
            <div>
              <strong>${user.name}</strong>
              <span>${user.email}</span>
            </div>
          </div>
          <p>
            Welcome to your Nexora profile! Keep sharing your moments and engaging with the community to grow your circle.
          </p>
        </div>
        <div class="profile-card stat-card" id="followersCard" style="cursor: pointer; transition: background 0.2s;">
          <strong>${user.followers}</strong>
          <span>Followers</span>
        </div>
        <div class="profile-card stat-card" id="followingCard" style="cursor: pointer; transition: background 0.2s;">
          <strong>${user.following}</strong>
          <span>Following</span>
        </div>
      `;

      document.querySelectorAll(".stat-card").forEach(card => {
        card.addEventListener("mouseenter", () => card.style.background = "rgba(255, 255, 255, 0.1)");
        card.addEventListener("mouseleave", () => card.style.background = "rgba(255, 255, 255, 0.05)");
      });

      document.getElementById("followersCard").addEventListener("click", () => fetchAndShowUsers("Followers", "/followers", token));
      document.getElementById("followingCard").addEventListener("click", () => fetchAndShowUsers("Following", "/following", token));
    } else {
      profileOverview.innerHTML = "<p style='color: #ff6b6b; padding: 1rem;'>Failed to load profile data.</p>";
    }
  } catch (err) {
    profileOverview.innerHTML = "<p style='color: #ff6b6b; padding: 1rem;'>Error loading profile.</p>";
  }
}

async function fetchAndShowUsers(title, url, token) {
  try {
    const res = await fetch(url, { headers: { "Authorization": "Bearer " + token } });
    if (res.ok) {
      const users = await res.json();
      showUserListModal(title, users);
    } else {
      alert("Failed to load users");
    }
  } catch(e) {
    console.error(e);
  }
}

function showUserListModal(title, users) {
  const existing = document.getElementById("userListModal");
  if (existing) existing.remove();

  const modalOverlay = document.createElement("div");
  modalOverlay.id = "userListModal";
  modalOverlay.style.position = "fixed";
  modalOverlay.style.top = "0";
  modalOverlay.style.left = "0";
  modalOverlay.style.width = "100%";
  modalOverlay.style.height = "100%";
  modalOverlay.style.backgroundColor = "rgba(0,0,0,0.6)";
  modalOverlay.style.backdropFilter = "blur(5px)";
  modalOverlay.style.display = "flex";
  modalOverlay.style.alignItems = "center";
  modalOverlay.style.justifyContent = "center";
  modalOverlay.style.zIndex = "1000";

  let listHtml = "";
  if (users.length === 0) {
    listHtml = `<p style="text-align: center; color: #6a5666; margin: 2rem 0;">No users found.</p>`;
  } else {
    listHtml = `<div style="display: flex; flex-direction: column; gap: 1rem; max-height: 300px; overflow-y: auto; padding-right: 10px;">`;
    users.forEach(user => {
      const avatarChar = user.name.charAt(0).toUpperCase();
      listHtml += `
        <div style="display: flex; align-items: center; gap: 1rem; padding: 0.5rem; border-radius: 8px; background: rgba(255,255,255,0.05);">
          <div class="avatar gold">${avatarChar}</div>
          <strong style="flex: 1;">${user.name}</strong>
        </div>
      `;
    });
    listHtml += `</div>`;
  }

  modalOverlay.innerHTML = `
    <div style="background: #1c151a; color: #fdfafc; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; width: 90%; max-width: 400px; padding: 1.5rem; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h3 style="margin: 0; font-size: 1.2rem; color: #fff;">${title}</h3>
        <button id="closeModalBtn" style="background: none; border: none; color: #a996a6; font-size: 1.5rem; cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#a996a6'">&times;</button>
      </div>
      ${listHtml}
    </div>
  `;

  document.body.appendChild(modalOverlay);

  document.getElementById("closeModalBtn").addEventListener("click", () => modalOverlay.remove());
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) modalOverlay.remove();
  });
}

async function loadDiscoverPeople() {
  const discoverGrid = document.getElementById("discoverGrid");
  if (!discoverGrid) return;
  
  const token = localStorage.getItem("token");
  if (!token) {
    discoverGrid.innerHTML = "<p style='color: #6a5666;'>Please log in to discover creators.</p>";
    return;
  }

  discoverGrid.innerHTML = "<p style='color: #6a5666;'>Finding creators...</p>";

  try {
    const res = await fetch("/discover", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (res.ok) {
      const users = await res.json();
      discoverGrid.innerHTML = "";
      if (users.length === 0) {
        discoverGrid.innerHTML = "<p style='color: #6a5666;'>You are following everyone! Check back later for new creators.</p>";
      } else {
        users.forEach(user => {
          const avatarChar = user.name.charAt(0).toUpperCase();
          const cardHtml = `
            <article class="discover-card" style="display: flex; flex-direction: column; gap: 1rem; align-items: center; text-align: center; padding: 1.5rem;">
              <div class="avatar gold" style="width: 60px; height: 60px; font-size: 1.5rem; line-height: 60px; margin: 0 auto;">${avatarChar}</div>
              <div>
                <strong style="font-size: 1.1rem;">${user.name}</strong>
                <p style="font-size: 0.85rem; color: #6a5666; margin-top: 0.3rem;">Creator</p>
              </div>
              <button class="primary-button follow-btn" data-id="${user.id}" style="width: 100%; justify-content: center; padding: 0.6rem;">Follow</button>
            </article>
          `;
          discoverGrid.insertAdjacentHTML("beforeend", cardHtml);
        });

        document.querySelectorAll(".discover-card .follow-btn").forEach(btn => {
          btn.addEventListener("click", async (e) => {
            const userId = e.target.dataset.id;
            try {
              const followRes = await fetch("/follow/" + userId, {
                method: "POST",
                headers: { "Authorization": "Bearer " + token }
              });
              if (followRes.ok) {
                e.target.textContent = "Following";
                e.target.classList.remove("primary-button");
                e.target.classList.add("ghost-button");
                e.target.disabled = true;
              } else {
                alert("Failed to follow user.");
              }
            } catch (err) {
              console.error(err);
            }
          });
        });
      }
    } else {
      discoverGrid.innerHTML = "<p style='color: #ff6b6b;'>Failed to load suggestions.</p>";
    }
  } catch (err) {
    discoverGrid.innerHTML = "<p style='color: #ff6b6b;'>Error loading discover page.</p>";
  }
}

function applyFeedFilter(filterName) {
  filterChips.forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.filter === filterName);
  });

  document.querySelectorAll(".feed-card").forEach((card) => {
    const category = card.dataset.category || "";
    const matches = filterName === "all" || category.includes(filterName);
    card.classList.toggle("hidden", !matches);
  });
}

function attachReaction(button) {
  button.addEventListener("click", () => {
    const baseCount = Number(button.dataset.count || "0");
    const isActive = button.classList.toggle("active");
    const nextCount = isActive ? baseCount + 1 : baseCount;
    button.textContent = `${button.textContent.split(" ")[0]} ${nextCount}`;
  });

  button.textContent = `${button.textContent} ${button.dataset.count}`;
}

function timeAgo(timestamp) {
  if (!timestamp) return "Just now";
  const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
}

function createPostCard(post) {
  const article = document.createElement("article");
  article.className = "feed-card";
  article.dataset.category = "creators";
  if (post.id) article.dataset.id = post.id;
  
  let deleteBtnHtml = "";
  if (post.isAuthor) {
    deleteBtnHtml = `<button class="reaction-button delete-btn" type="button" style="color: #ff6b6b; border-color: rgba(255,107,107,0.3);">Delete</button>`;
  }

  const authorName = post.authorName || `User ${post.userId || "Unknown"}`;
  const avatarChar = authorName.charAt(0).toUpperCase();
  const timeString = timeAgo(post.createdAt);

  let imageHtml = "";
  if (post.imageUrl) {
    imageHtml = `<img src="${post.imageUrl}" style="max-width: 100%; border-radius: 8px; margin-top: 0.5rem;" />`;
  }

  article.innerHTML = `
    <div class="feed-top">
      <div class="post-author">
        <div class="avatar gold">${avatarChar}</div>
        <div>
          <strong>${authorName}</strong>
          <span>${timeString}</span>
        </div>
      </div>
      <span class="tiny-pill">Post</span>
    </div>
    <h3></h3>
    ${imageHtml}
    <div class="feed-actions">
      <button class="reaction-button like-btn ${post.hasLiked ? 'active' : ''}" type="button" data-count="${post.likes || 0}">❤️ Like ${post.likes || 0}</button>
      <button class="reaction-button comment-btn" type="button" data-count="${post.comments || 0}">Comment ${post.comments || 0}</button>
      ${deleteBtnHtml}
    </div>
    <div class="comments-container" style="display: none; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 1rem; padding-top: 1rem;">
      <div class="comments-list" style="margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem;"></div>
      <div class="comment-input-area" style="display: flex; gap: 0.5rem;">
        <input type="text" class="comment-input" placeholder="Write a comment..." style="flex: 1; padding: 0.5rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: inherit;">
        <button class="primary-button submit-comment-btn" style="padding: 0.5rem 1rem;">Reply</button>
      </div>
    </div>
  `;

  article.querySelector("h3").textContent = post.content !== undefined ? post.content : post;

  const newButtons = article.querySelectorAll(".reaction-button:not(.delete-btn):not(.like-btn):not(.comment-btn)");
  newButtons.forEach(attachReaction);

  const likeBtn = article.querySelector(".like-btn");
  if (likeBtn && post.id) {
    likeBtn.addEventListener("click", async () => {
      // Optimistic UI update
      const wasActive = likeBtn.classList.contains("active");
      likeBtn.classList.toggle("active");
      const currentCount = parseInt(likeBtn.dataset.count) || 0;
      const nextCount = wasActive ? currentCount - 1 : currentCount + 1;
      likeBtn.dataset.count = nextCount;
      likeBtn.textContent = `❤️ Like ${nextCount}`;

      const token = localStorage.getItem("token");
      try {
        const res = await fetch("/posts/" + post.id + "/like/toggle", {
          method: "POST",
          headers: { "Authorization": "Bearer " + token }
        });
        if (!res.ok) {
          // Revert optimistic update on failure
          likeBtn.classList.toggle("active");
          likeBtn.dataset.count = currentCount;
          likeBtn.textContent = `❤️ Like ${currentCount}`;
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  const commentBtn = article.querySelector(".comment-btn");
  const commentsContainer = article.querySelector(".comments-container");
  const commentsList = article.querySelector(".comments-list");
  const commentInput = article.querySelector(".comment-input");
  const submitCommentBtn = article.querySelector(".submit-comment-btn");

  let commentsLoaded = false;

  if (commentBtn && post.id) {
    commentBtn.addEventListener("click", async () => {
      const isHidden = commentsContainer.style.display === "none";
      commentsContainer.style.display = isHidden ? "block" : "none";

      if (isHidden && !commentsLoaded) {
        commentsList.innerHTML = "<p style='font-size: 0.8rem; opacity: 0.7;'>Loading comments...</p>";
        try {
          const res = await fetch("/posts/" + post.id + "/comments");
          if (res.ok) {
            const data = await res.json();
            commentsList.innerHTML = "";
            if (data.length === 0) {
              commentsList.innerHTML = "<p style='font-size: 0.8rem; opacity: 0.7;'>No comments yet.</p>";
            } else {
              data.forEach(c => {
                const cTime = timeAgo(c.createdAt);
                const cName = c.authorName || `User ${c.userId}`;
                const cChar = cName.charAt(0).toUpperCase();
                commentsList.innerHTML += `
                  <div style="display: flex; gap: 0.5rem; font-size: 0.9rem;">
                    <div class="avatar gold" style="width: 24px; height: 24px; font-size: 0.7rem; line-height: 24px;">${cChar}</div>
                    <div style="background: rgba(255,255,255,0.05); padding: 0.5rem 0.75rem; border-radius: 8px; flex: 1;">
                      <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                        <strong style="color: white;">${cName}</strong>
                        <span style="opacity: 0.5; font-size: 0.75rem;">${cTime}</span>
                      </div>
                      <p style="margin:0; opacity: 0.9;">${c.comment}</p>
                    </div>
                  </div>
                `;
              });
            }
            commentsLoaded = true;
          }
        } catch (e) {
          commentsList.innerHTML = "<p style='font-size: 0.8rem; color: #ff6b6b;'>Failed to load comments.</p>";
        }
      }
    });

    submitCommentBtn.addEventListener("click", async () => {
      const text = commentInput.value.trim();
      if (!text) return;

      const token = localStorage.getItem("token");
      try {
        const res = await fetch("/posts/" + post.id + "/comment", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
          body: JSON.stringify({ comment: text })
        });
        if (res.ok) {
          const data = await res.json();
          commentInput.value = "";
          
          // Optimistic update of count
          const currentCount = parseInt(commentBtn.dataset.count) || 0;
          commentBtn.dataset.count = currentCount + 1;
          commentBtn.textContent = `Comment ${currentCount + 1}`;

          // Append to list
          if (commentsList.innerHTML.includes("No comments yet")) commentsList.innerHTML = "";
          
          const cName = data.authorName || "You";
          const cChar = cName.charAt(0).toUpperCase();
          const cTime = timeAgo(data.createdAt);

          commentsList.innerHTML += `
            <div style="display: flex; gap: 0.5rem; font-size: 0.9rem;">
              <div class="avatar gold" style="width: 24px; height: 24px; font-size: 0.7rem; line-height: 24px;">${cChar}</div>
              <div style="background: rgba(255,255,255,0.05); padding: 0.5rem 0.75rem; border-radius: 8px; flex: 1;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                  <strong style="color: white;">${cName}</strong>
                  <span style="opacity: 0.5; font-size: 0.75rem;">${cTime}</span>
                </div>
                <p style="margin:0; opacity: 0.9;">${text}</p>
              </div>
            </div>
          `;
        } else {
          alert("Failed to post comment.");
        }
      } catch (e) {
        console.error(e);
      }
    });
    
    // Add enter key support for comment input
    commentInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        submitCommentBtn.click();
      }
    });
  }

  const deleteBtn = article.querySelector(".delete-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to delete this post?")) return;
      
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("/posts/" + post.id, {
          method: "DELETE",
          headers: { "Authorization": "Bearer " + token }
        });
        if (res.ok) {
          article.remove();
        } else {
          alert("Failed to delete post.");
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  return article;
}

if (navButtons.length > 0) {
  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activatePanel(button.dataset.panel);
    });
  });
}

if (filterChips.length > 0) {
  filterChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      activatePanel("feed");
      applyFeedFilter(chip.dataset.filter);
    });
  });
}

if (reactionButtons.length > 0) {
  reactionButtons.forEach(attachReaction);
}

if (photoInput) {
  photoInput.addEventListener("change", () => {
    const file = photoInput.files[0];
    if (file) {
      photoPreview.src = URL.createObjectURL(file);
      photoPreviewContainer.style.display = "block";
    }
  });

  removePhotoBtn.addEventListener("click", () => {
    photoInput.value = "";
    photoPreview.src = "";
    photoPreviewContainer.style.display = "none";
  });
}

if (publishButton) {
  publishButton.addEventListener("click", async () => {
    const message = composerInput.value.trim();
    const hasPhoto = photoInput && photoInput.files[0];
    
    if (!message && !hasPhoto) {
      composerInput.focus();
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to publish a post!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("content", message);
      if (photoInput && photoInput.files[0]) {
        formData.append("photo", photoInput.files[0]);
      }

      const res = await fetch("/posts/create", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + token
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        // Success! Prepend it to the feed visually.
        feedList.prepend(createPostCard({ 
          id: data.id, 
          content: message, 
          userId: "You", 
          likes: 0, 
          comments: 0, 
          isAuthor: true,
          authorName: data.authorName,
          createdAt: data.createdAt,
          imageUrl: data.imageUrl
        }));
        composerInput.value = "";
        if (photoInput) {
          photoInput.value = "";
          photoPreview.src = "";
          photoPreviewContainer.style.display = "none";
        }
        activatePanel("feed");
        applyFeedFilter("all");
      } else {
        const data = await res.json();
        alert("Failed to publish: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      alert("An error occurred while publishing.");
    }
  });
}

if (composerInput) {
  composerInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      publishButton.click();
    }
  });
}

if (panelSections.length > 0) {
  activatePanel("feed");
  applyFeedFilter("all");
}


// --- AUTH LOGIC ---

const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const errorEl = document.getElementById("signupError");

    try {
      const res = await fetch("/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        // Redirect to login page on success
        window.location.href = "/login";
      } else {
        errorEl.textContent = data.message || "Signup failed.";
        errorEl.style.display = "block";
      }
    } catch (err) {
      errorEl.textContent = "An error occurred during signup.";
      errorEl.style.display = "block";
    }
  });
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const errorEl = document.getElementById("loginError");

    try {
      const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        // Save token and redirect to dashboard/feed
        localStorage.setItem("token", data.token);
        window.location.href = "/#app";
      } else {
        errorEl.textContent = data.message || "Login failed.";
        errorEl.style.display = "block";
      }
    } catch (err) {
      errorEl.textContent = "An error occurred during login.";
      errorEl.style.display = "block";
    }
  });
}

// --- AUTH STATE CHECK & DYNAMIC FEED ---
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const topbarActions = document.querySelector(".topbar-actions");
  
  if (token && topbarActions) {
    // Replace Log In / Sign Up with Dashboard / Log Out
    topbarActions.innerHTML = `
      <a href="#app" class="ghost-button" style="text-decoration: none;">Dashboard</a>
      <button id="logoutBtn" class="primary-button" style="border: none;">Log Out</button>
    `;
    
    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "/";
    });

    // Load dynamic feed
    loadFeed(token);
  }
});

async function loadFeed(token) {
  if (!feedList) return;
  
  try {
    const res = await fetch("/posts/feed", {
      headers: { "Authorization": "Bearer " + token }
    });
    if (res.ok) {
      const posts = await res.json();
      feedList.innerHTML = ""; // Clear existing fake posts
      posts.forEach(post => {
        feedList.appendChild(createPostCard(post));
      });
    }
  } catch (err) {
    console.error("Failed to load dynamic feed", err);
  }
}
