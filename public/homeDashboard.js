// Hide review form initially
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("reviewForm");
    if (form) form.classList.add("hidden");
});

// Block access if not logged in
if (!localStorage.getItem("user_id")) {
    window.location.replace("/login.html");
}

// Load jobs + welcome message
document.addEventListener("DOMContentLoaded", () => {
    loadJobs();

    const fullName = localStorage.getItem("full_name") || "Homeowner";
    const firstName = fullName.split(" ")[0];
    document.getElementById("welcomeTitle").textContent = `Welcome, ${firstName}!`;
});

/* ================================
   LOAD HOMEOWNER JOBS
================================ */
async function loadJobs() {
    const openContainer = document.getElementById("openJobsContainer");
    const progressContainer = document.getElementById("inProgressJobsContainer");
    const completedContainer = document.getElementById("completedJobsContainer");

    const user_id = localStorage.getItem("user_id");
    const role = localStorage.getItem("role");

    // security check
    if (!user_id || role !== "homeowner") {
        openContainer.innerHTML = "<p style='color:red;'>You must be logged in as a homeowner.</p>";
        progressContainer.innerHTML = "";
        completedContainer.innerHTML = "";
        return;
    }

    try {
        const res = await fetch(`/get_jobs?homeowner_id=${user_id}`);
        const data = await res.json();

        if (!data.ok) {
            openContainer.innerHTML = "<p style='color:red;'>Failed to load jobs.</p>";
            progressContainer.innerHTML = "";
            completedContainer.innerHTML = "";
            return;
        }

        const jobs = data.jobs;

        const openJobs = jobs.filter(j => j.status === "open");
        const inProgressJobs = jobs.filter(j => j.status === "in_progress");
        const completedJobs = jobs.filter(j => j.status === "completed");

        // OPEN JOBS (no chat here)
        openContainer.innerHTML = openJobs.length ? "" : "<p>No open jobs.</p>";
        openJobs.forEach(job => openContainer.innerHTML += jobCard(job));

        // IN-PROGRESS JOBS (chat allowed)
        progressContainer.innerHTML = inProgressJobs.length ? "" : "<p>No jobs in progress.</p>";
        inProgressJobs.forEach(job => progressContainer.innerHTML += jobCard(job));

        // COMPLETED JOBS (no chat)
        completedContainer.innerHTML = completedJobs.length ? "" : "<p>No completed jobs.</p>";
        completedJobs.forEach(job => completedContainer.innerHTML += jobCard(job, true));

    } catch (err) {
        console.error(err);
        openContainer.innerHTML = "<p style='color:red;'>Error fetching jobs.</p>";
        progressContainer.innerHTML = "";
        completedContainer.innerHTML = "";
    }
}

/* ================================
   JOB CARD TEMPLATE
   Chat ONLY for in_progress jobs
================================ */
function jobCard(job, isCompleted = false) {
    const isInProgress = job.status === "in_progress";

    return `
        <div class="card">
            <h3>${job.service_type}</h3>
            <small>Status: ${job.status}</small><br>
            <small>Budget: $${job.budget}</small>
            <p>${job.description}</p>
            <small>Posted: ${new Date(job.created_at).toLocaleDateString()}</small>
            ${
                isCompleted
                ? `<br><small>Completed: ${
                        job.completed_at
                        ? new Date(job.completed_at).toLocaleDateString()
                        : "Unknown"
                    }</small>`
                : ""
            }
            ${isInProgress ? `<button class="btn-chat" onclick="openChat(${job.job_id})">Open Chat</button>` : ""}
        </div>
    `;
}

/* ================================
   REVIEW FORM HANDLERS
================================ */
function openReviewForm() {
    document.getElementById("reviewForm").classList.remove("hidden");
}

function cancelReview() {
    const form = document.getElementById("reviewForm");
    form.classList.add("hidden");
    document.getElementById("reviewText").value = "";
    document.getElementById("reviewMessage").textContent = "";
}

async function submitReview() {
    const text = document.getElementById("reviewText").value.trim();
    const msg = document.getElementById("reviewMessage");

    if (!text) {
        msg.textContent = "Please enter a review.";
        msg.style.color = "red";
        return;
    }

    const user_id = localStorage.getItem("user_id");
    const full_name = localStorage.getItem("full_name");

    const res = await fetch("/add_review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            homeowner_id: user_id,
            reviewer_name: full_name,
            review_text: text
        })
    });

    const data = await res.json();
    if (data.ok) {
        msg.textContent = "Review submitted!";
        msg.style.color = "green";
        document.getElementById("reviewText").value = "";
    } else {
        msg.textContent = data.error || "Error submitting review.";
        msg.style.color = "red";
    }
}

/* ================================
   SOCKET.IO CHAT (HOMEOWNER)
================================ */
const socket = io();
let activeJobId = null;

function openChat(job_id) {
    activeJobId = job_id;

    document.getElementById("chatPanel").classList.remove("hidden");
    document.getElementById("chatJobTitle").textContent = "Job #" + job_id;

    // Join socket room
    socket.emit("join_room", job_id);

    // Load previous messages
    loadChatMessages(job_id);
}

function closeChat() {
    document.getElementById("chatPanel").classList.add("hidden");
    activeJobId = null;
}

async function loadChatMessages(job_id) {
    const res = await fetch(`/get_messages?job_id=${job_id}`);
    const data = await res.json();

    const box = document.getElementById("chatMessages");
    box.innerHTML = "";

    if (!data.ok || !data.messages) return;

    data.messages.forEach(m => {
        const div = document.createElement("div");
	const name = m.sender_label || `User ${m.sender_id}`;
	div.innerHTML = `<strong>${name}</strong>: ${m.message}`;

        box.appendChild(div);
    });

    box.scrollTop = box.scrollHeight;
}

function sendChatMessage() {
    const input = document.getElementById("chatInput");
    const msg = input.value.trim();
    if (!msg || !activeJobId) return;

    const sender_id = localStorage.getItem("user_id");

    socket.emit("send_message", {
        job_id: activeJobId,
        sender_id,
	sender_label: getSenderLabel(),
        message: msg
    });

    input.value = "";
}

function getSenderLabel() {
    const role = localStorage.getItem("role");
    const first = localStorage.getItem("first_name");

    if (role === "homeowner") return first;
    if (role === "contractor") return `Contractor (${first})`;

    return first;
}


socket.on("receive_message", (data) => {
    if (data.job_id !== activeJobId) return;

    const box = document.getElementById("chatMessages");
    const div = document.createElement("div");
    const name = data.sender_label || `User ${data.sender_id}`;
    div.innerHTML = `<strong>${name}</strong>: ${data.message}`;

    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
});

/* ================================
   LOGOUT
================================ */
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("role");
    localStorage.removeItem("full_name");
    window.location.href = "/login.html";
});

