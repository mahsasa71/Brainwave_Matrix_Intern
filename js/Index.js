let editMode = false;
let editCard = null;
let allCards = [];

document.getElementById("submitBtn").addEventListener("click", function () {
  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;
  const status = document.querySelector('input[name="status"]:checked').value;
  const priority = document.getElementById("priority").value;
  const dueDate = document.getElementById("dueDate").value;
  const reminderDate = document.getElementById("reminderDate").value;

  if (title && content) {
    if (title.length > 8) {
      alert("Title should not exceed 8 characters.");
      return;
    }

    const truncatedContent =
      content.length > 10 ? content.substring(0, 10) + "..." : content;

    let backgroundColor;
    switch (priority) {
      case "high":
        backgroundColor = "rgba(235, 77, 75, 0.6)";
        break;
      case "medium":
        backgroundColor = "rgba(240, 147, 43, 0.5)";
        break;
      case "low":
        backgroundColor = "rgba(223, 249, 251, 0.5)";
        break;
    }

    if (editMode) {
      editCard.querySelector("h2").textContent = title;
      editCard.querySelector("p").textContent = truncatedContent;
      editCard.querySelector(".status-icon").className =
        status === "completed"
          ? "fas fa-check-circle status-icon"
          : "fas fa-times-circle status-icon";
      editCard.querySelector(".show-more").style.display =
        content.length > 10 ? "inline" : "none";
      editCard.querySelector(".full-content").textContent =
        formatContent(content);
      editCard.querySelector(".due-date").textContent = `Due Date: ${dueDate}`;
      editCard.querySelector(
        ".reminder-date"
      ).textContent = `Reminder Date: ${reminderDate}`;
      editCard.style.backgroundColor = backgroundColor;
      editMode = false;
      editCard = null;
      document.getElementById("submitBtn").textContent = "Submit";
      document.getElementById("submitBtn").classList.remove("save-changes");
      savePostsToLocalStorage();
    } else {
      const cardContainer = document.getElementById("cardContainer");
      const card = createCard({
        title,
        content,
        backgroundColor,
        status,
        priority,
        dueDate,
        reminderDate,
      });
      cardContainer.appendChild(card);
      allCards.push(card);
      savePostsToLocalStorage();
      checkNoPostsMessage();
      scheduleReminder(title, content, reminderDate);
      updateTaskCount();
    }

    document.getElementById("title").value = "";
    document.getElementById("content").value = "";
    document.getElementById("dueDate").value = "";
    document.getElementById("reminderDate").value = "";
  }
});

document.getElementById("search").addEventListener("input", function () {
  const searchValue = this.value.toLowerCase();
  const cards = document.querySelectorAll(".card");

  cards.forEach((card) => {
    const title = card.querySelector("h2").textContent.toLowerCase();
    card.style.display = title.includes(searchValue) ? "" : "none";
  });
});

function formatContent(content) {
  let formattedContent = "";
  for (let i = 0; i < content.length; i += 20) {
    formattedContent += content.substring(i, i + 20) + "\n";
  }
  return formattedContent;
}

function savePostsToLocalStorage() {
  const cards = document.querySelectorAll(".card");
  const posts = [];

  cards.forEach((card) => {
    const title = card.querySelector("h2").textContent;
    const content = card.querySelector(".full-content").textContent;
    const backgroundColor = card.style.backgroundColor;
    const dueDate = card
      .querySelector(".due-date")
      .textContent.replace("Due Date: ", "");
    const reminderDate = card
      .querySelector(".reminder-date")
      .textContent.replace("Reminder Date: ", "");

    const status = card
      .querySelector(".status-icon")
      .classList.contains("fa-check-circle")
      ? "completed"
      : "notCompleted";
    const priority = getPriorityFromColor(backgroundColor);

    posts.push({
      title,
      content,
      backgroundColor,
      status,
      priority,
      dueDate,
      reminderDate,
    });
  });

  localStorage.setItem("posts", JSON.stringify(posts));
}

function loadPostsFromLocalStorage() {
  const posts = JSON.parse(localStorage.getItem("posts")) || [];
  const cardContainer = document.getElementById("cardContainer");
  cardContainer.innerHTML = "";

  posts.forEach((post) => {
    const card = createCard(post);
    cardContainer.appendChild(card);
    allCards.push(card);
    scheduleReminder(post.title, post.content, post.reminderDate);
  });

  checkNoPostsMessage();
  updateTaskCount();
}

function createCard(post) {
  const card = document.createElement("div");
  card.className = "card";
  card.style.backgroundColor = post.backgroundColor;

  const cardBody = document.createElement("div");
  cardBody.className = "card-body";

  const cardTitle = document.createElement("div");
  cardTitle.className = "card-title";

  const h2 = document.createElement("h2");
  h2.textContent = post.title;

  const statusIcon = document.createElement("i");
  statusIcon.className =
    post.status === "completed"
      ? "fas fa-check-circle status-icon"
      : "fas fa-times-circle status-icon";

  const buttonContainer = document.createElement("div");
  buttonContainer.className = "button-container";

  const editButton = document.createElement("button");
  editButton.className = "btn btn-outline btn-sm";
  editButton.innerHTML = '<i class="fas fa-edit icon"></i>';
  editButton.addEventListener("click", function () {
    document.getElementById("title").value = post.title;
    document.getElementById("content").value = post.content;
    document.querySelector(
      `input[name="status"][value="${post.status}"]`
    ).checked = true;
    document.getElementById("priority").value = post.priority;
    document.getElementById("dueDate").value = post.dueDate;
    document.getElementById("reminderDate").value = post.reminderDate;
    editMode = true;
    editCard = card;
    document.getElementById("submitBtn").textContent = "Save Changes";
    document.getElementById("submitBtn").classList.add("save-changes");
  });

  const deleteButton = document.createElement("button");
  deleteButton.className = "btn btn-outline btn-sm";
  deleteButton.innerHTML = '<i class="fas fa-trash icon"></i>';
  deleteButton.addEventListener("click", function () {
    cardContainer.removeChild(card);
    allCards = allCards.filter((c) => c !== card);
    savePostsToLocalStorage();
    checkNoPostsMessage();
    updateTaskCount();
  });

  const shareButton = document.createElement("button");
  shareButton.className = "btn btn-outline btn-sm";
  shareButton.innerHTML = '<i class="fas fa-share icon"></i>';
  let shareMenuVisible = false;
  shareButton.addEventListener("click", function () {
    const shareMenu = card.querySelector(".share-menu");
    if (shareMenuVisible) {
      shareMenu.style.display = "none";
      shareButton.innerHTML = '<i class="fas fa-share icon"></i>';
      shareButton.classList.remove("btn-rectangle");
    } else {
      shareMenu.style.display = "flex";
      shareButton.textContent = " cancel sharing";
      shareButton.classList.add("btn-rectangle");
    }
    shareMenuVisible = !shareMenuVisible;
  });

  const shareMenu = document.createElement("div");
  shareMenu.className = "share-menu";
  shareMenu.style.display = "none";

  const whatsappOption = document.createElement("div");
  whatsappOption.className = "share-option";
  whatsappOption.innerHTML = '<i class="fab fa-whatsapp"></i>';
  whatsappOption.addEventListener("click", function () {
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `Title: ${post.title}\nContent: ${post.content}`
    )}`;
    window.open(whatsappUrl, "_blank");
  });

  const telegramOption = document.createElement("div");
  telegramOption.className = "share-option";
  telegramOption.innerHTML = '<i class="fab fa-telegram-plane"></i>';
  telegramOption.addEventListener("click", function () {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
      `Title: ${post.title}\nContent: ${post.content}`
    )}`;
    window.open(telegramUrl, "_blank");
  });

  const emailOption = document.createElement("div");
  emailOption.className = "share-option";
  emailOption.innerHTML = '<i class="fas fa-envelope"></i>';
  emailOption.addEventListener("click", function () {
    const emailUrl = `mailto:?subject=${encodeURIComponent(
      post.title
    )}&body=${encodeURIComponent(post.content)}`;
    window.open(emailUrl, "_blank");
  });

  shareMenu.appendChild(whatsappOption);
  shareMenu.appendChild(telegramOption);
  shareMenu.appendChild(emailOption);

  const showMoreButton = document.createElement("button");
  showMoreButton.className = "show-more";
  showMoreButton.textContent = "Show More";
  showMoreButton.style.display = post.content.length > 10 ? "inline" : "none";
  showMoreButton.addEventListener("click", function () {
    const fullContent = card.querySelector(".full-content");
    const truncatedContent = card.querySelector("p");

    if (fullContent.style.display === "none") {
      fullContent.style.display = "block";
      showMoreButton.textContent = "Show Less";
      truncatedContent.textContent = "";
    } else {
      fullContent.style.display = "none";
      showMoreButton.textContent = "Show More";
      truncatedContent.textContent =
        post.content.length > 20
          ? post.content.substring(0, 20) + "..."
          : post.content;
    }
  });

  buttonContainer.appendChild(deleteButton);
  buttonContainer.appendChild(editButton);
  buttonContainer.appendChild(shareButton);
  buttonContainer.appendChild(statusIcon);
  buttonContainer.appendChild(showMoreButton);

  cardTitle.appendChild(h2);
  cardTitle.appendChild(buttonContainer);

  const p = document.createElement("p");
  p.textContent =
    post.content.length > 10
      ? post.content.substring(0, 10) + "..."
      : post.content;

  const fullContent = document.createElement("p");
  fullContent.className = "full-content";
  fullContent.textContent = formatContent(post.content);
  fullContent.style.display = "none";

  const dueDateElement = document.createElement("p");
  dueDateElement.className = "due-date";
  dueDateElement.textContent = `Due Date: ${post.dueDate}`;

  const reminderDateElement = document.createElement("p");
  reminderDateElement.className = "reminder-date";
  reminderDateElement.textContent = `Reminder Date: ${post.reminderDate}`;

  cardBody.appendChild(cardTitle);
  cardBody.appendChild(p);
  cardBody.appendChild(fullContent);
  cardBody.appendChild(dueDateElement);
  cardBody.appendChild(reminderDateElement);
  cardBody.appendChild(shareMenu);

  card.appendChild(cardBody);

  return card;
}

function checkNoPostsMessage() {
  const cardContainer = document.getElementById("cardContainer");
  const noPostsMessage = document.getElementById("noPostsMessage");

  if (cardContainer.children.length === 0) {
    noPostsMessage.style.display = "block";
  } else {
    noPostsMessage.style.display = "none";
  }
}

function getPriorityFromColor(color) {
  switch (color) {
    case "rgba(235, 77, 75, 0.6)":
      return "high";
    case "rgba(240, 147, 43, 0.5)":
      return "medium";
    case "rgba(223, 249, 251, 0.5)":
      return "low";
    default:
      return "low";
  }
}

window.onload = function () {
  loadPostsFromLocalStorage();
  checkNoPostsMessage();
  enableDragAndDrop();
};

function enableDragAndDrop() {
  const cardContainer = document.getElementById("cardContainer");
  Sortable.create(cardContainer, {
    animation: 150,
    onEnd: function () {
      savePostsToLocalStorage();
    },
  });
}

document
  .getElementById("priorityFilter")
  .addEventListener("change", function () {
    filterAndSortCards();
  });

document.getElementById("dueDateSort").addEventListener("change", function () {
  filterAndSortCards();
});

document.getElementById("statusFilter").addEventListener("change", function () {
  filterAndSortCards();
});

function filterAndSortCards() {
  const priorityFilter = document.getElementById("priorityFilter").value;
  const dueDateSort = document.getElementById("dueDateSort").value;
  const statusFilter = document.getElementById("statusFilter").value;

  const filteredCards = allCards.filter((card) => {
    const priority = getPriorityFromColor(card.style.backgroundColor);
    const status = card
      .querySelector(".status-icon")
      .classList.contains("fa-check-circle")
      ? "completed"
      : "notCompleted";
    return (
      (priorityFilter === "all" || priority === priorityFilter) &&
      (statusFilter === "all" || status === statusFilter)
    );
  });

  if (dueDateSort !== "none") {
    filteredCards.sort((a, b) => {
      const dueDateA = new Date(
        a.querySelector(".due-date").textContent.replace("Due Date: ", "")
      );
      const dueDateB = new Date(
        b.querySelector(".due-date").textContent.replace("Due Date: ", "")
      );
      return dueDateSort === "asc" ? dueDateA - dueDateB : dueDateB - dueDateA;
    });
  }

  const cardContainer = document.getElementById("cardContainer");
  cardContainer.innerHTML = "";
  filteredCards.forEach((card) => {
    cardContainer.appendChild(card);
  });
}

function scheduleReminder(title, content, reminderDate) {
  const reminderTime = new Date(reminderDate).getTime();
  const currentTime = new Date().getTime();
  const timeDifference = reminderTime - currentTime;

  if (timeDifference <= 0 && timeDifference > -86400000) {
    alert(`Reminder\nTitle: ${title}\nContent: ${content}`);
  } else if (timeDifference > 0) {
    setTimeout(() => {
      alert(`Reminder\nTitle: ${title}\nContent: ${content}`);
    }, timeDifference);
  }
}

function updateTaskCount() {
  const totalTasks = allCards.length;
  const completedTasks = allCards.filter((card) =>
    card.querySelector(".status-icon").classList.contains("fa-check-circle")
  ).length;
  const notCompletedTasks = totalTasks - completedTasks;

  document.getElementById("totalTasks").textContent = totalTasks;
  document.getElementById("completedTasks").textContent = completedTasks;
  document.getElementById("notCompletedTasks").textContent = notCompletedTasks;
}
