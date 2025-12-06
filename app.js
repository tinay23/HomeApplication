// ---------------------------------------------------
// BASIC IMPORTS
// ---------------------------------------------------
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const pool = require('./database');

// ---------------------------------------------------
// MYSQL SETUP
// ---------------------------------------------------
const mysql = require('mysql2');

const db = mysql.createPool({
    host: '34.42.140.154',       // your remote MySQL instance
    user: 'Nodeuser',
    password: 'KimJenYan330!',
    database: 'homeapplication'
});

// Test MySQL connection on server start
db.getConnection((err, conn) => {
    if (err) {
        console.error("MYSQL CONNECTION ERROR:", err);
    } else {
        console.log("MYSQL CONNECTED");
        conn.release();
    }
});

// ---------------------------------------------------
// Helper: Send static files
// ---------------------------------------------------
function sendFile(filePath, res) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'content-type': 'text/plain' });
            res.end("File not found");
            return;
        }

        const ext = path.extname(filePath);
        const types = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.json': 'application/json',
            '.txt': 'text/plain'
        };
        const contentType = types[ext] || 'application/octet-stream';

        res.writeHead(200, { 'content-type': contentType });
        res.end(data);
    });
}

// ---------------------------------------------------
// LOGIN ROUTE (returns user_id + role)
// ---------------------------------------------------
function handleLogin(req, res) {
    let body = '';
    req.on('data', chunk => (body += chunk));

    req.on('end', () => {
        const data = JSON.parse(body || '{}');

        const email = data.email;
        const password = data.password;

        if (!email || !password) {
            res.writeHead(400, { 'content-type': 'application/json' });
            return res.end(JSON.stringify({ ok: false, error: "Missing email/password" }));
        }

        // MUST select full_name + user_id
        const sql = "SELECT user_id, role, full_name, is_banned FROM users WHERE email = ? AND password_hash = ?";

        db.query(sql, [email, password], (err, results) => {
            if (err) {
                console.log("DB ERROR:", err);
                res.writeHead(500, { 'content-type': 'application/json' });
                return res.end(JSON.stringify({ ok: false, error: "Database error" }));
            }

            if (results.length === 0) {
                res.writeHead(401, { 'content-type': 'application/json' });
                return res.end(JSON.stringify({ ok: false, error: "Invalid email or password" }));
            }

            // THIS fixes your error
            const user = results[0];

	    if (user.is_banned === 1) {
    res.writeHead(403, { "content-type": "application/json" });
    return res.end(JSON.stringify({
        ok: false,
        error: "Your account has been banned by an administrator."
    }));
}

            const redirectMap = {
                homeowner: '/homeDashboard.html',
                contractor: '/conDashboard.html',
                admin: '/adminDashboard.html'
            };

            const redirect = redirectMap[user.role] || '/login.html';

            // Return full_name + user_id + role
            res.writeHead(200, { 'content-type': 'application/json' });
            res.end(JSON.stringify({
                ok: true,
                redirect,
                user_id: user.user_id,
                full_name: user.full_name,
                role: user.role
            }));
        });
    });
}

// ---------------------------------------------------
// CREATE USER ROUTE
// ---------------------------------------------------
function handleCreateUser(req, res) {
    let body = "";
    req.on("data", chunk => (body += chunk));

    req.on("end", () => {
        let data;

        try {
            data = JSON.parse(body);
        } catch (e) {
            res.writeHead(400, { "content-type": "application/json" });
            return res.end(JSON.stringify({ ok: false, error: "Invalid JSON" }));
        }

        const { full_name, email, password, role } = data;

        if (!full_name || !email || !password || !role) {
            res.writeHead(400, { "content-type": "application/json" });
            return res.end(JSON.stringify({ ok: false, error: "Missing fields" }));
        }

        const sql = `
            INSERT INTO users (role, full_name, email, password_hash, created_at)
            VALUES (?, ?, ?, ?, NOW())
        `;

        db.query(sql, [role, full_name, email, password], (err, result) => {
            if (err) {
                console.error("DB INSERT ERROR:", err);
                res.writeHead(500, { "content-type": "application/json" });
                return res.end(JSON.stringify({ ok: false, error: "Database insert failed" }));
            }

            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify({ ok: true, user_id: result.insertId }));
        });
    });
}

// ---------------------------------------------------
// CREATE JOB ROUTE
// ---------------------------------------------------
function handleCreateJob(req, res) {
    let body = "";
    req.on("data", chunk => (body += chunk));

    req.on("end", () => {
        let data;

        try {
            data = JSON.parse(body);
        } catch (err) {
            res.writeHead(400, { "content-type": "application/json" });
            return res.end(JSON.stringify({ ok: false, error: "Invalid JSON" }));
        }

        const { homeowner_id, service_type, description, budget } = data;

        if (!homeowner_id || !service_type || !description || !budget) {
            res.writeHead(400, { "content-type": "application/json" });
            return res.end(JSON.stringify({ ok: false, error: "Missing fields" }));
        }

        const sql = `
            INSERT INTO service_requests (homeowner_id, service_type, description, budget)
            VALUES (?, ?, ?, ?)
        `;

        db.query(sql, [homeowner_id, service_type, description, budget], (err, result) => {
            if (err) {
                console.error("DB INSERT ERROR:", err);
                res.writeHead(500, { "content-type": "application/json" });
                return res.end(JSON.stringify({ ok: false, error: "Database insert failed" }));
            }

            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify({ ok: true, job_id: result.insertId }));
        });
    });
}

// ---------------------------------------------------
// GET JOBS ROUTE
// ---------------------------------------------------
function handleGetJobs(req, res, urlObj) {
    const homeowner_id = urlObj.query.homeowner_id;

    if (!homeowner_id) {
        res.writeHead(400, { "content-type": "application/json" });
        return res.end(JSON.stringify({ ok: false, error: "Missing homeowner_id" }));
    }

    const sql = `
        SELECT job_id, service_type, description, budget, status, created_at, completed_at, contractor_id
        FROM service_requests
        WHERE homeowner_id = ?
        ORDER BY job_id DESC
    `;

    db.query(sql, [homeowner_id], (err, results) => {
        if (err) {
            console.error("DB SELECT ERROR:", err);
            res.writeHead(500, { "content-type": "application/json" });
            return res.end(JSON.stringify({ ok: false, error: "Database read failed" }));
        }

        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true, jobs: results }));
    });
}

// ---------------------------------------------------
// ADD REVIEWS
// ---------------------------------------------------

function handleAddReview(req, res) {
    let body = "";
    req.on("data", chunk => body += chunk);

    req.on("end", () => {
        let data;
        try { data = JSON.parse(body); }
        catch { return error(res, 400, "Invalid JSON"); }

        const { homeowner_id, reviewer_name, review_text } = data;

        if (!homeowner_id || !reviewer_name || !review_text) {
            res.writeHead(400, { 'content-type': 'application/json' });
            return res.end(JSON.stringify({ ok: false, error: "Missing fields" }));
        }

        const sql = `
            INSERT INTO reviews (homeowner_id, reviewer_name, review_text)
            VALUES (?, ?, ?)
        `;

        db.query(sql, [homeowner_id, reviewer_name, review_text], (err) => {
            if (err) {
                console.log("REVIEW INSERT ERROR:", err);
                res.writeHead(500, { 'content-type': 'application/json' });
                return res.end(JSON.stringify({ ok: false, error: "Database error" }));
            }

            res.writeHead(200, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
        });
    });
}

// ---------------------------------------------------
// GET REVIEWS
// ---------------------------------------------------

function handleGetReviews(req, res) {
    const sql = `
        SELECT reviewer_name, review_text, profile_image, created_at
        FROM reviews
        ORDER BY review_id DESC
        LIMIT 20
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.log("REVIEW FETCH ERROR:", err);
            res.writeHead(500, { 'content-type': 'application/json' });
            return res.end(JSON.stringify({ ok: false }));
        }

        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true, reviews: results }));
    });
}

// ---------------------------------------------------
// CONTRACTOR: GET AVAILABLE JOBS
// ---------------------------------------------------
function handleContractorGetAvailable(req, res) {
    const sql = `
        SELECT job_id, service_type, description, budget, status, created_at
        FROM service_requests
        WHERE status = 'open'
        ORDER BY created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.log("DB ERROR:", err);
            res.writeHead(500, { "content-type": "application/json" });
            return res.end(JSON.stringify({ ok: false }));
        }

        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true, jobs: results }));
    });
}



// ---------------------------------------------------
// CONTRACTOR: GET IN-PROGRESS JOBS
// ---------------------------------------------------
function handleContractorGetInProgress(req, res, urlObj) {
    const contractor_id = urlObj.query.contractor_id;

    const sql = `
        SELECT job_id, service_type, description, budget, status, created_at, homeowner_id
        FROM service_requests
        WHERE status = 'in_progress' AND contractor_id = ?
        ORDER BY created_at DESC
    `;

    db.query(sql, [contractor_id], (err, results) => {
        if (err) {
            console.log("DB ERROR:", err);
            res.writeHead(500, { "content-type": "application/json" });
            return res.end(JSON.stringify({ ok: false }));
        }

        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true, jobs: results }));
    });
}



// ---------------------------------------------------
// CONTRACTOR: GET COMPLETED JOBS
// ---------------------------------------------------
function handleContractorGetCompleted(req, res, urlObj) {
    const contractor_id = urlObj.query.contractor_id;

    const sql = `
        SELECT job_id, service_type, description, budget, status, created_at, completed_at, homeowner_id
        FROM service_requests
        WHERE status = 'completed' AND contractor_id = ?
        ORDER BY created_at DESC
    `;

    db.query(sql, [contractor_id], (err, results) => {
        if (err) {
            console.log("DB ERROR:", err);
            res.writeHead(500, { "content-type": "application/json" });
            return res.end(JSON.stringify({ ok: false }));
        }

        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true, jobs: results }));
    });
}



// ---------------------------------------------------
// CONTRACTOR: ACCEPT A JOB
// ---------------------------------------------------
function handleContractorAcceptJob(req, res) {
    let body = "";
    req.on("data", chunk => body += chunk);

    req.on("end", () => {
        const data = JSON.parse(body);
        const { job_id, contractor_id } = data;

        const sql = `
            UPDATE service_requests
            SET status = 'in_progress', contractor_id = ?
            WHERE job_id = ?
        `;

        db.query(sql, [contractor_id, job_id], (err) => {
            if (err) {
                console.log("DB ERROR:", err);
                res.writeHead(500, { "content-type": "application/json" });
                return res.end(JSON.stringify({ ok: false }));
            }

            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify({ ok: true }));
        });
    });
}



// ---------------------------------------------------
// CONTRACTOR: COMPLETE A JOB
// ---------------------------------------------------
function handleContractorCompleteJob(req, res) {
    let body = "";
    req.on("data", chunk => body += chunk);

    req.on("end", () => {
        const data = JSON.parse(body);
        const { job_id, contractor_id } = data;

        const sql = `
            UPDATE service_requests
            SET status = 'completed', completed_at = NOW()
            WHERE job_id = ? AND contractor_id = ?
        `;

        db.query(sql, [job_id, contractor_id], (err) => {
            if (err) {
                console.log("DB ERROR:", err);
                res.writeHead(500, { "content-type": "application/json" });
                return res.end(JSON.stringify({ ok: false }));
            }

            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify({ ok: true }));
        });
    });
}

// ---------------------------------------------------
// GET MESSAGES
// ---------------------------------------------------
function handleGetMessages(req, res, urlObj) {
    const { job_id } = urlObj.query;

    if (!job_id) {
        res.writeHead(400, { "content-type": "application/json" });
        return res.end(JSON.stringify({ ok: false, error: "Missing job_id" }));
    }

    db.query(
        "SELECT sender_id, sender_label, message, sent_at AS created_at FROM messages WHERE job_id = ? ORDER BY sent_at ASC",
        [job_id],
        (err, results) => {
            if (err) {
                console.error("GET MESSAGES ERROR:", err);
                res.writeHead(500, { "content-type": "application/json" });
                return res.end(JSON.stringify({ ok: false, error: "Database error" }));
            }
            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify({ ok: true, messages: results }));
        }
    );
}

// ---------------------------------------------------
// ADMIN VIEW REPORTS
// ---------------------------------------------------
function handleAdminGetReports(req, res) {
    db.query(`
        SELECT r.*, u.full_name AS reporter_name
        FROM reports r
        JOIN users u ON r.reporter_id = u.user_id
        ORDER BY r.created_at DESC
    `, (err, results) => {
        if (err) {
            console.error("ADMIN REPORT FETCH ERROR:", err);
            res.writeHead(500, { 'content-type': 'application/json' });
            return res.end(JSON.stringify({ ok: false }));
        }

        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true, reports: results }));
    });
}

// ---------------------------------------------------
// ADMIN RESOLVE REPORT
// ---------------------------------------------------
function handleAdminResolveReport(req, res, urlObj) {
    const report_id = urlObj.query.report_id;

    db.query(`
        UPDATE reports SET status = 'resolved'
        WHERE report_id = ?
    `, [report_id], (err) => {
        if (err) {
            console.error("RESOLVE REPORT ERROR:", err);
            res.writeHead(500, { 'content-type': 'application/json' });
            return res.end(JSON.stringify({ ok: false }));
        }

        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
    });
}


// ---------------------------------------------------
// ADMIN DELETE REVIEW
// ---------------------------------------------------
function handleAdminDeleteReview(req, res, urlObj) {
    const review_id = urlObj.query.review_id;

    db.query("DELETE FROM reviews WHERE review_id = ?", [review_id], (err) => {
        if (err) {
            console.error("DELETE REVIEW ERROR:", err);
            res.writeHead(500, { 'content-type': 'application/json' });
            return res.end(JSON.stringify({ ok: false }));
        }

        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
    });
}

// ---------------------------------------------------
// ADMIN DELETE JOB
// ---------------------------------------------------
function handleAdminDeleteJob(req, res, urlObj) {
    const job_id = urlObj.query.job_id;

    db.query("DELETE FROM service_requests WHERE job_id = ?", [job_id], (err) => {
        if (err) {
            console.error("DELETE JOB ERROR:", err);
            res.writeHead(500, { 'content-type': 'application/json' });
            return res.end(JSON.stringify({ ok: false }));
        }

        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
    });
}

// ---------------------------------------------------
// ADMIN BAN USER
// ---------------------------------------------------
function handleAdminBanUser(req, res, urlObj) {
    const user_id = urlObj.query.user_id;

    // STEP 1 — Mark user as banned
    const banSQL = "UPDATE users SET is_banned = 1 WHERE user_id = ?";

    db.query(banSQL, [user_id], (err) => {
        if (err) {
            console.error("BAN USER ERROR:", err);
            res.writeHead(500, { 'content-type': 'application/json' });
            return res.end(JSON.stringify({ ok: false }));
        }

        // STEP 2 — Get all in-progress or open jobs linked to this contractor
        const findJobsSQL = `
            SELECT job_id FROM service_requests
            WHERE contractor_id = ?
        `;

        db.query(findJobsSQL, [user_id], (err, jobs) => {
            if (err) {
                console.error("BAN: FIND JOB ERROR:", err);
                res.writeHead(500, { 'content-type': 'application/json' });
                return res.end(JSON.stringify({ ok: false }));
            }

            if (jobs.length === 0) {
                // No jobs to delete — just return success
                res.writeHead(200, { 'content-type': 'application/json' });
                return res.end(JSON.stringify({ ok: true }));
            }

            const jobIds = jobs.map(j => j.job_id);

            // STEP 3 — Delete chat messages for those jobs
            const deleteMessagesSQL = `
                DELETE FROM messages WHERE job_id IN (${jobIds.join(",")})
            `;

            db.query(deleteMessagesSQL, () => {
                // Ignore message errors (not critical)

                // STEP 4 — Delete the jobs themselves
                const deleteJobsSQL = `
                    DELETE FROM service_requests WHERE job_id IN (${jobIds.join(",")})
                `;

                db.query(deleteJobsSQL, (err2) => {
                    if (err2) {
                        console.error("BAN: DELETE JOB ERROR:", err2);
                        res.writeHead(500, { 'content-type': 'application/json' });
                        return res.end(JSON.stringify({ ok: false }));
                    }

                    // Final success
                    res.writeHead(200, { 'content-type': 'application/json' });
                    return res.end(JSON.stringify({ ok: true }));
                });
            });
        });
    });
}

// ---------------------------------------------------
// CREATE REPORT (homeowners + contractors)
// ---------------------------------------------------
function handleCreateReport(req, res) {
    let body = "";
    req.on("data", chunk => body += chunk);

    req.on("end", () => {
        let data;
        try {
            data = JSON.parse(body);
        } catch (e) {
            res.writeHead(400, { "content-type": "application/json" });
            return res.end(JSON.stringify({ ok: false, error: "Invalid JSON" }));
        }

        const { reporter_id, target_type, target_id, reason } = data;

        if (!reporter_id || !target_type || !target_id || !reason) {
            res.writeHead(400, { "content-type": "application/json" });
            return res.end(JSON.stringify({ ok: false, error: "Missing fields" }));
        }

        const sql = `
            INSERT INTO reports (reporter_id, target_type, target_id, reason)
            VALUES (?, ?, ?, ?)
        `;

        db.query(sql, [reporter_id, target_type, target_id, reason], (err, result) => {
            if (err) {
                console.error("CREATE REPORT ERROR:", err);
                res.writeHead(500, { "content-type": "application/json" });
                return res.end(JSON.stringify({ ok: false, error: "Database error" }));
            }

            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify({ ok: true, report_id: result.insertId }));
        });
    });
}

// ---------------------------------------------------
// ADMIN VIEW CHATS (SINGLE JOB)
// ---------------------------------------------------
function handleAdminGetChat(req, res, urlObj) {
    const job_id = urlObj.query.job_id;

    if (!job_id) {
        res.writeHead(400, { "content-type": "application/json" });
        return res.end(JSON.stringify({ ok: false, error: "Missing job_id" }));
    }

    const sql = `
        SELECT sender_id, sender_label, message, sent_at
        FROM messages
        WHERE job_id = ?
        ORDER BY sent_at ASC
    `;

    db.query(sql, [job_id], (err, results) => {
        if (err) {
            console.error("ADMIN GET CHAT ERROR:", err);
            res.writeHead(500, { "content-type": "application/json" });
            return res.end(JSON.stringify({ ok: false, error: "Database error" }));
        }

        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true, messages: results }));
    });
}

// ---------------------------------------------------
// ADMIN VIEW CHATS (USER REPORTS)
// ---------------------------------------------------
function handleAdminGetUserChat(req, res, urlObj) {
    const user_id = urlObj.query.user_id;
    const user_type = urlObj.query.user_type; // "homeowner" or "contractor"

    if (!user_id || !user_type) {
        res.writeHead(400, { "content-type": "application/json" });
        return res.end(JSON.stringify({ ok: false, error: "Missing user_id or user_type" }));
    }

    // Determine which column to check
    const column = user_type === "homeowner" ? "homeowner_id" : "contractor_id";

    // Step 1: Get all jobs involving this user
    const jobSQL = `
        SELECT job_id
        FROM service_requests
        WHERE ${column} = ?
    `;

    db.query(jobSQL, [user_id], (err, jobs) => {
        if (err) {
            console.error("ADMIN USER CHAT — JOB FETCH ERROR:", err);
            res.writeHead(500, { "content-type": "application/json" });
            return res.end(JSON.stringify({ ok: false }));
        }

        if (jobs.length === 0) {
            res.writeHead(200, { "content-type": "application/json" });
            return res.end(JSON.stringify({ ok: true, jobs: [] }));
        }

        const jobIds = jobs.map(j => j.job_id);

        // Step 2: Fetch messages for all these jobs
        const msgSQL = `
            SELECT job_id, sender_label, message, sent_at
            FROM messages
            WHERE job_id IN (?)
            ORDER BY job_id, sent_at ASC
        `;

        db.query(msgSQL, [jobIds], (err, msgResults) => {
            if (err) {
                console.error("ADMIN USER CHAT — MESSAGE FETCH ERROR:", err);
                res.writeHead(500, { "content-type": "application/json" });
                return res.end(JSON.stringify({ ok: false }));
            }

            // Group messages by job_id
            const grouped = {};
            jobIds.forEach(id => grouped[id] = []);

            msgResults.forEach(m => {
                grouped[m.job_id].push(m);
            });

            const result = jobIds.map(id => ({
                job_id: id,
                messages: grouped[id]
            }));

            res.writeHead(200, { "content-type": "application/json" });
            res.end(JSON.stringify({ ok: true, jobs: result }));
        });
    });
}

// ---------------------------------------------------
// MAIN SERVER ROUTER
// ---------------------------------------------------
const serverObj = http.createServer((req, res) => {
    console.log("Request URL:", req.url);

    const urlObj = url.parse(req.url, true);

    // LOGIN (POST)
    if (urlObj.pathname === '/login' && req.method === 'POST') {
        return handleLogin(req, res);
    }

    // CREATE USER (POST)
    if (urlObj.pathname === '/create_user' && req.method === 'POST') {
        return handleCreateUser(req, res);
    }

    // CREATE JOB (POST)
    if (urlObj.pathname === '/create_job' && req.method === 'POST') {
        return handleCreateJob(req, res);
    }

    // GET JOBS (GET)
    if (urlObj.pathname === '/get_jobs' && req.method === 'GET') {
        return handleGetJobs(req, res, urlObj);
    }

    // ADD  REVIEWS
    if (urlObj.pathname === "/add_review" && req.method === "POST") {
        return handleAddReview(req, res);
    }

    // GET REVIEWS
    if (urlObj.pathname === "/get_reviews" && req.method === "GET") {
        return handleGetReviews(req, res);
    }

    // GET MESSAGES
    if (urlObj.pathname === "/get_messages" && req.method === "GET") {
        return handleGetMessages(req, res, urlObj);
    }
    // ADMIN VIEW REPORTS
    if (urlObj.pathname === "/admin_get_reports" && req.method === "GET") {
    return handleAdminGetReports(req, res);
    }
 
    // ADMIN RESOLVE REPORT
    if (urlObj.pathname === "/admin_resolve_report" && req.method === "GET") {
    return handleAdminResolveReport(req, res, urlObj);
    }

    // ADMIN DELETE REVIEW
    if (urlObj.pathname === "/admin_delete_review" && req.method === "GET") {
    return handleAdminDeleteReview(req, res, urlObj);
    }

    // ADMIN DELETE JOB
    if (urlObj.pathname === "/admin_delete_job" && req.method === "GET") {
    return handleAdminDeleteJob(req, res, urlObj);
    }

    // ADMIN BAN USER
    if (urlObj.pathname === "/admin_ban_user" && req.method === "GET") {
    return handleAdminBanUser(req, res, urlObj);
    }
    
    // CREATE REPORT
    if (urlObj.pathname === "/create_report" && req.method === "POST") {
    return handleCreateReport(req, res);
    }

    // ADMIN VIEW CHATS
    if (urlObj.pathname === "/admin_get_chat" && req.method === "GET") {
    return handleAdminGetChat(req, res, urlObj);
    }

    if (urlObj.pathname === "/admin_get_user_chat" && req.method === "GET") {
    return handleAdminGetUserChat(req, res, urlObj);
    }

// ---------------------------------------------------
// CONTRACTOR ROUTES — MATCHING YOUR FRONTEND
// ---------------------------------------------------

// AVAILABLE JOBS
if (urlObj.pathname === "/contractor_get_jobs" && req.method === "GET") {
    return handleContractorGetAvailable(req, res);
}

// IN-PROGRESS JOBS
if (urlObj.pathname === "/contractor_get_inprogress_jobs" && req.method === "GET") {
    return handleContractorGetInProgress(req, res, urlObj);
}

// COMPLETED JOBS
if (urlObj.pathname === "/contractor_get_completed_jobs" && req.method === "GET") {
    return handleContractorGetCompleted(req, res, urlObj);
}

// ACCEPT JOB
if (urlObj.pathname === "/contractor_accept_job" && req.method === "POST") {
    return handleContractorAcceptJob(req, res);
}

// COMPLETE JOB
if (urlObj.pathname === "/contractor_complete_job" && req.method === "POST") {
    return handleContractorCompleteJob(req, res);
}


    // STATIC FILE HANDLER
    let filePath = path.join(__dirname, "public", urlObj.pathname);

    if (urlObj.pathname === "/") {
        filePath = path.join(__dirname, "public", "index.html");
    }

    sendFile(filePath, res);
});

// ---------------------------------------------------
// SOCKET.IO SETUP
// ---------------------------------------------------
const { Server } = require("socket.io");
const io = new Server(serverObj, {
    cors: { origin: "*" },
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join a specific job room
    socket.on("join_room", (job_id) => {
        socket.join("job_" + job_id);
    });

    // When a message is sent
    socket.on("send_message", (data) => {
        const { job_id, sender_id, sender_label, message } = data;

        // Save to database (recommended)
        db.query(
            "INSERT INTO messages (job_id, sender_id, sender_label, message) VALUES (?, ?, ?, ?)",
            [job_id, sender_id, sender_label, message],
            (err) => {
                if (err) console.error("DB insert error:", err);
            }
        );

        // Broadcast message to others in the room
        io.to("job_" + job_id).emit("receive_message", {
            job_id,
            sender_id,
            sender_label,
            message
        });
    });
});
// ---------------------------------------------------
// START SERVER
// ---------------------------------------------------
serverObj.listen(80, () => {
    console.log("Server is listening on port 80");
});

