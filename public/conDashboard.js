// Redirect if not contractor
if (localStorage.getItem("role") !== "contractor") {
    window.location.replace("/login.html");
}

const contractor_id = localStorage.getItem("user_id");

// Show contractor's first name
document.addEventListener("DOMContentLoaded", () => {
    const fullName = localStorage.getItem("full_name") || "";
    const firstName = fullName.split(" ")[0];

    const title = document.getElementById("welcomeTitle");
    if (title) {
        title.textContent = `Welcome, ${firstName}`;
    }

    loadAvailableJobs();
    setupTabs();
    setupSorting();
});

// Store available jobs for sorting
let availableJobsCache = [];

// Setup tabs
function setupTabs() {
    document.getElementById("tab-available").onclick = () => {
        setActive("tab-available");
        loadAvailableJobs();
    };

    document.getElementById("tab-progress").onclick = () => {
        setActive("tab-progress");
        loadInProgressJobs();
    };

    document.getElementById("tab-completed").onclick = () => {
        setActive("tab-completed");
        loadCompletedJobs();
    };
}

function setActive(id) {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.getElementById(id).classList.add("active");

    const sortContainer = document.getElementById("sortContainer");
    if (id === "tab-available") {
        sortContainer.style.display = "block";
    } else {
        sortContainer.style.display = "none";
    }
}

// -----------------------
// LOAD Available Jobs (no chat here)
// -----------------------
async function loadAvailableJobs() {
    const res = await fetch("/contractor_get_jobs");
    const data = await res.json();
    availableJobsCache = data.jobs || [];
    applySorting();
}

// -----------------------
async function loadInProgressJobs() {
    const res = await fetch(`/contractor_get_inprogress_jobs?contractor_id=${contractor_id}`);
    const data = await res.json();
    displayJobs(data.jobs || [], "in_progress");
}

// -----------------------
async function loadCompletedJobs() {
    const res = await fetch(`/contractor_get_completed_jobs?contractor_id=${contractor_id}`);
    const data = await res.json();
    displayJobs(data.jobs || [], "completed");
}

// -----------------------
// SORTING LOGIC
// -----------------------
function setupSorting() {
    const select = document.getElementById("sortSelect");
    if (select) {
        select.addEventListener("change", applySorting);
    }
}

function applySorting() {
    if (!availableJobsCache || availableJobsCache.length === 0) {
        displayJobs([], "available");
        return;
    }

    const sortValue = document.getElementById("sortSelect").value;
    let sortedJobs = [...availableJobsCache];

    if (sortValue === "budget_low") {
        sortedJobs.sort((a, b) => a.budget - b.budget);
    } else if (sortValue === "budget_high") {
        sortedJobs.sort((a, b) => b.budget - a.budget);
    } else if (sortValue === "service_az") {
        sortedJobs.sort((a, b) => a.service_type.localeCompare(b.service_type));
    } else if (sortValue === "service_za") {
        sortedJobs.sort((a, b) => b.service_type.localeCompare(a.service_type));
    }

    displayJobs(sortedJobs, "available");
}

// -----------------------
// DISPLAY JOB CARDS
// Chat ONLY for type === "in_progress"
// -----------------------
function displayJobs(jobs, type) {
    const container = document.getElementById("contentContainer");
    container.innerHTML = "";

    if (!jobs || jobs.length === 0) {
        container.innerHTML = "<p>No jobs found.</p>";
        return;
    }

    jobs.forEach(job => {
        let card = `
            <div class="job-card">
                <h3>${job.service_type}</h3>
                <p>${job.description}</p>
                <small>Budget: $${job.budget}</small><br>
                <small>Posted: ${new Date(job.created_at).toLocaleDateString()}</small>
        `;

        if (type === "available") {
            // Accept only, no chat
            card += `<button class="btn-accept" onclick="acceptJob(${job.job_id})">Accept Job</button>
	    <button class="btn-accept" onclick="reportJob(${job.job_id})">🚩 Report Job</button>
`;
        }

        if (type === "in_progress") {
            // Chat + Mark completed
            card += `
                <button class="btn-chat" onclick="openChat(${job.job_id})">Open Chat</button>
                <button class="btn-complete" onclick="completeJob(${job.job_id})">Mark Completed</button>
		<button class="btn-accept" onclick="reportUser(${job.homeowner_id}, 'homeowner')">Report Homeowner</button>

            `;
        }

        if (type === "completed") {
            let completedDate = "Unknown";

            if (job.completed_at && job.completed_at !== "0000-00-00 00:00:00") {
                const d = new Date(job.completed_at);
                completedDate = isNaN(d.getTime()) ? "Unknown" : d.toLocaleDateString();
            }

            card += `<br><small>Completed: ${completedDate}</small>`;
        }

        card += `</div>`;
        container.innerHTML += card;
    });
}

// -----------------------
// ACCEPT JOB (status -> in_progress)
// -----------------------
async function acceptJob(job_id) {
    await fetch("/contractor_accept_job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id, contractor_id })
    });

    // Refresh lists
    loadAvailableJobs();
    // Optionally, auto switch to in-progress:
    // setActive("tab-progress");
    // loadInProgressJobs();
}

// -----------------------
// COMPLETE JOB (status -> completed)
// -----------------------
async function completeJob(job_id) {
    await fetch("/contractor_complete_job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id, contractor_id })
    });

    loadInProgressJobs();
}

// -----------------------
// SOCKET.IO CHAT (CONTRACTOR)
// -----------------------
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

async function reportJob(job_id) {
    const reason = prompt("Describe the issue with this job (spam, scam, inappropriate behavior, etc.):");
    if (!reason) return;

    const reporter_id = localStorage.getItem("user_id");

    try {
        const res = await fetch("/create_report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                reporter_id,
                target_type: "job",
                target_id: job_id,
                reason
            })
        });

        const data = await res.json();
        if (data.ok) {
            alert("Thank you. Your report has been submitted to the admin.");
        } else {
            alert("Could not submit report: " + (data.error || "Unknown error"));
        }
    } catch (err) {
        console.error("REPORT ERROR:", err);
        alert("Error sending report.");
    }
}

let pendingReportUserId = null;
let pendingReportType = null;

function reportUser(target_id, type) {
    pendingReportUserId = target_id;
    pendingReportType = type;
    document.getElementById("reportReason").value = "";
    document.getElementById("reportModal").classList.remove("hidden");
}

async function submitUserReport() {
    const reason = document.getElementById("reportReason").value.trim();
    if (!reason) return alert("Enter a reason before submitting.");

    const reporter_id = localStorage.getItem("user_id");

    const res = await fetch("/create_report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            reporter_id,
            target_type: pendingReportType, // 'homeowner'
            target_id: pendingReportUserId,
            reason
        })
    });

    const data = await res.json();
    if (data.ok) {
        alert("Report submitted.");
        closeReportModal();
    } else {
        alert("Failed to submit report.");
    }
}

function closeReportModal() {
    document.getElementById("reportModal").classList.add("hidden");
}


// -----------------------
// LOGOUT
// -----------------------
document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("role");
    localStorage.removeItem("full_name");
    window.location.href = "/login.html";
});
