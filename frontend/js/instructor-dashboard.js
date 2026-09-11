document.addEventListener("DOMContentLoaded", async () => {
    const HOST_URL = "http://127.0.0.1:8080";
    const welcomeTitle = document.getElementById("welcomeTitle");
    const mainContentArea = document.getElementById("mainContentArea");
    const logoutBtn = document.getElementById("logoutBtn");
    const menuItems = document.querySelectorAll(".sidebar-menu li");

    let currentUser = null;

    try {
        const userRes = await fetch(`${HOST_URL}/api/auth/me`, { credentials: "include" });
        if (!userRes.ok) {
            window.location.href = "login.html";
            return;
        }
        currentUser = await userRes.json();
        if (currentUser.role !== "INSTRUCTOR") {
            alert("Unauthorized access. Instructors only.");
            window.location.href = "login.html";
            return;
        }
        if (welcomeTitle) {
            welcomeTitle.textContent = `Welcome back, ${currentUser.name || "Instructor"}`;
        }
    } catch (error) {
        console.error("Session check failed:", error);
        window.location.href = "login.html";
        return;
    }

    function isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === "http:" || url.protocol === "https:";
        } catch (_) {
            return false;
        }
    }

    async function renderCoursesView() {
        mainContentArea.innerHTML = `
            <h2>Course Management</h2>
            <div style="margin: 20px 0; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <h3>Create & Purchase Course Listing</h3>
                <form id="courseForm" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                    <input type="text" id="courseTitle" placeholder="Course Title" required style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px;">
                    <textarea id="courseDesc" placeholder="Course Description (Required)" required style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; resize: vertical;"></textarea>
                    <input type="number" id="coursePrice" placeholder="Price (₹)" step="0.01" min="0" required style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px;">
                    <input type="url" id="courseUrl" placeholder="Course Video/Resource URL (e.g., https://www.youtube.com/...)" required style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px;">
                    <select id="courseCategory" required style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px;">
                        <option value="" disabled selected>Select Category</option>
                    </select>
                    <button type="submit" style="padding: 12px; background: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Pay & Publish Course</button>
                </form>
            </div>
            <h3>My Published Courses</h3>
            <div id="instructorCourseList" style="margin-top: 10px; display: flex; flex-direction: column; gap: 10px;">
                <p>Loading courses...</p>
            </div>
        `;

        await loadCategoriesDropdown();
        await fetchInstructorCourses();

        document.getElementById("courseForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            const title = document.getElementById("courseTitle").value.trim();
            const description = document.getElementById("courseDesc").value.trim();
            const price = parseFloat(document.getElementById("coursePrice").value);
            const courseUrl = document.getElementById("courseUrl").value.trim();
            const categoryId = parseInt(document.getElementById("courseCategory").value);

            if (!title || !description || isNaN(price) || !courseUrl || !categoryId) {
                alert("Please fill out all mandatory fields correctly.");
                return;
            }

            if (!isValidUrl(courseUrl)) {
                alert("Please enter a valid URL format for the course resource (must start with http:// or https://).");
                document.getElementById("courseUrl").focus();
                return;
            }

            const confirmPayment = confirm(`Complete Course Listing Fee Payment\n\nYou are about to pay the listing fee to publish "${title}". Click OK to confirm payment.`);
            if (!confirmPayment) return;

            try {
                const userId = currentUser.userId || currentUser.id;
                let paymentTransactionId = null;

                const paymentRes = await fetch(`${HOST_URL}/api/payments?role=INSTRUCTOR`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId, amount: price }),
                    credentials: "include"
                });

                if (paymentRes.ok) {
                    const paymentData = await paymentRes.json();
                    paymentTransactionId = paymentData.transactionId || paymentData.paymentId;
                } else {
                    const paymentErrText = await paymentRes.text();
                    console.warn("Payment response error or already paid:", paymentErrText);

                    try {
                        const existingPaymentsRes = await fetch(`${HOST_URL}/api/payments/user/${userId}`, { credentials: "include" });
                        if (existingPaymentsRes.ok) {
                            const payments = await existingPaymentsRes.json();
                            if (payments && payments.length > 0) {
                                const latestPayment = payments[payments.length - 1];
                                paymentTransactionId = latestPayment.transactionId || latestPayment.paymentId;
                            }
                        }
                    } catch (lookupErr) {
                        console.error("Could not fetch user payments fallback:", lookupErr);
                    }

                    if (!paymentTransactionId) {
                        throw new Error(paymentErrText || "Payment processing failed and no valid transaction ID could be retrieved.");
                    }
                }

                if (!paymentTransactionId) {
                    throw new Error("Payment transaction ID is missing.");
                }

                const res = await fetch(`${HOST_URL}/api/courses?role=INSTRUCTOR`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        title, 
                        description, 
                        price, 
                        courseUrl, 
                        categoryId,
                        paymentTransactionId 
                    }),
                    credentials: "include"
                });

                if (res.ok) {
                    alert("Course successfully published!");
                    fetchInstructorCourses();
                    e.target.reset();
                } else {
                    const errText = await res.text();
                    throw new Error(errText || "Failed to create course.");
                }
            } catch (err) {
                console.error("Error during payment/course creation:", err);
                alert(err.message || "An error occurred during publishing.");
            }
        });
    }

    async function loadCategoriesDropdown() {
        try {
            const res = await fetch(`${HOST_URL}/api/categories`);
            const categories = await res.json();
            const dropdown = document.getElementById("courseCategory");
            if (dropdown && categories && Array.isArray(categories)) {
                categories.forEach(c => {
                    const opt = document.createElement("option");
                    opt.value = c.categoryId;
                    opt.textContent = c.categoryName;
                    dropdown.appendChild(opt);
                });
            }
        } catch (err) {
            console.error("Failed to load categories:", err);
        }
    }

    async function fetchInstructorCourses() {
        try {
            const res = await fetch(`${HOST_URL}/api/courses`);
            const courses = await res.json();
            const container = document.getElementById("instructorCourseList");
            if (container) {
                container.innerHTML = courses.length > 0 
                    ? courses.map(c => `
                        <div style="background: #fff; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>📚 ${c.title}</strong>
                                <p style="color: #64748b; font-size: 0.9rem; margin-top: 4px;">Category: ${c.categoryName || 'None'} | Price: ₹${c.price}</p>
                            </div>
                            <button onclick="deleteInstructorCourse(${c.courseId})" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Delete</button>
                        </div>
                    `).join("")
                    : "<p style='color: #64748b;'>No courses created yet.</p>";
            }
        } catch (err) {
            console.error("Failed to fetch courses:", err);
        }
    }

    window.deleteInstructorCourse = async function(id) {
        if (!confirm("Are you sure you want to delete this course?")) return;
        try {
            const res = await fetch(`${HOST_URL}/api/courses/${id}?role=INSTRUCTOR`, {
                method: "DELETE",
                credentials: "include"
            });
            if (res.ok) {
                fetchInstructorCourses();
            } else {
                const errText = await res.text();
                alert(errText || "Failed to delete course.");
            }
        } catch (err) {
            console.error("Error deleting course:", err);
        }
    };

    async function renderAnalyticsView() {
        mainContentArea.innerHTML = `
            <h2>Student Enrollments & Statistics</h2>
            <div style="margin-top: 20px; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 2px solid #e2e8f0; color: #64748b;">
                            <th style="padding: 10px;">Enrollment ID</th>
                            <th style="padding: 10px;">Course Title</th>
                            <th style="padding: 10px;">Student Name</th>
                            <th style="padding: 10px;">Status</th>
                            <th style="padding: 10px;">Enrollment Date</th>
                        </tr>
                    </thead>
                    <tbody id="instructorAnalyticsBody">
                        <tr><td colspan="5" style="padding: 15px; text-align: center;">Loading student statistics...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        try {
            const instructorId = currentUser.userId || currentUser.id;
            if (!instructorId) {
                throw new Error("Instructor ID could not be determined from session.");
            }

            const url = `${HOST_URL}/api/enrollments/instructor/${instructorId}?role=INSTRUCTOR`;
            const res = await fetch(url, { credentials: "include" });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || "Failed to load analytics from server");
            }
            
            const enrollments = await res.json();
            const tbody = document.getElementById("instructorAnalyticsBody");

            tbody.innerHTML = enrollments && enrollments.length > 0
                ? enrollments.map(e => {
                    const statusVal = e.status || 'ACTIVE';
                    const isCompleted = statusVal === 'COMPLETED';
                    return `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 10px;">${e.enrollmentId || e.id || 'N/A'}</td>
                            <td style="padding: 10px;"><strong>${e.courseTitle || 'N/A'}</strong></td>
                            <td style="padding: 10px;">${e.userName || e.studentName || 'N/A'}</td>
                            <td style="padding: 10px;">
                                <span style="padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; background: ${isCompleted ? '#e2e8f0' : '#dcfce7'}; color: ${isCompleted ? '#475569' : '#166534'};">
                                    ${statusVal}
                                </span>
                            </td>
                            <td style="padding: 10px;">${e.enrolledAt ? new Date(e.enrolledAt).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                    `;
                }).join("")
                : `<tr><td colspan="5" style="padding: 15px; text-align: center; color: #64748b;">No students have enrolled in your courses yet.</td></tr>`;
        } catch (err) {
            console.error("Analytics fetch error:", err);
            document.getElementById("instructorAnalyticsBody").innerHTML = `<tr><td colspan="5" style="color: red; padding: 10px; text-align: center;">Error: ${err.message}</td></tr>`;
        }
    }

    menuItems.forEach(item => {
        item.addEventListener("click", () => {
            menuItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");

            const view = item.getAttribute("data-view");
            if (view === "courses") {
                renderCoursesView();
            } else if (view === "analytics") {
                renderAnalyticsView();
            } else if (view === "profile") {
                mainContentArea.innerHTML = `
                    <h2>Instructor Profile Details</h2>
                    <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 20px;">
                        <p><strong>Full Name:</strong> ${currentUser.name}</p>
                        <p><strong>Email Address:</strong> ${currentUser.email}</p>
                        <p><strong>System Role:</strong> ${currentUser.role}</p>
                    </div>
                `;
            }
        });
    });

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                await fetch(`${HOST_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
            } catch (e) {
                console.error("Logout error:", e);
            }
            window.location.href = "login.html";
        });
    }

    renderCoursesView();
});