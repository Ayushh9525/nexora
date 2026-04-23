const navButtons = document.querySelectorAll(".nav-item");
const panelSections = document.querySelectorAll("[data-panel-content]");
const filterChips = document.querySelectorAll(".filter-chip");
const reactionButtons = document.querySelectorAll(".reaction-button");
const composerInput = document.querySelector("#composerInput");
const publishButton = document.querySelector("#publishButton");
const feedList = document.querySelector("#feedList");

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

function createPostCard(message) {
  const article = document.createElement("article");
  article.className = "feed-card";
  article.dataset.category = "creators";
  article.innerHTML = `
    <div class="feed-top">
      <div class="post-author">
        <div class="avatar gold">Y</div>
        <div>
          <strong>You</strong>
          <span>Just now</span>
        </div>
      </div>
      <span class="tiny-pill">New post</span>
    </div>
    <h3></h3>
    <p>
      Freshly published from the prototype composer. This is where your Play
      backend can later save and render dynamic feed content.
    </p>
    <div class="feed-actions">
      <button class="reaction-button" type="button" data-count="1">Like</button>
      <button class="reaction-button" type="button" data-count="0">Comment</button>
      <button class="reaction-button" type="button" data-count="0">Share</button>
    </div>
  `;

  article.querySelector("h3").textContent = message;

  const newButtons = article.querySelectorAll(".reaction-button");
  newButtons.forEach(attachReaction);
  return article;
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activatePanel(button.dataset.panel);
  });
});

filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    activatePanel("feed");
    applyFeedFilter(chip.dataset.filter);
  });
});

reactionButtons.forEach(attachReaction);

publishButton.addEventListener("click", () => {
  const message = composerInput.value.trim();
  if (!message) {
    composerInput.focus();
    return;
  }

  feedList.prepend(createPostCard(message));
  composerInput.value = "";
  activatePanel("feed");
  applyFeedFilter("all");
});

composerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    publishButton.click();
  }
});

activatePanel("feed");
applyFeedFilter("all");
