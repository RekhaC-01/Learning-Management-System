document.addEventListener("DOMContentLoaded", async () => {
    const HOST_URL = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : "http://127.0.0.1:8080";
    const welcomeTitle = document.getElementById("welcomeTitle");
    const mainContentArea = document.getElementById("mainContentArea");
    const logoutBtn = document.getElementById("logoutBtn");
    const menuItems = document.querySelectorAll(".sidebar-menu li");

    let currentUser = null;
    let allCourses = [];
    let myEnrolledCourses = [];
    let categories = [];
    let currentSelectedCategory = "";

    // 1. Fetch user session and verify student role
    try {
        const userRes = await fetch(`${HOST_URL}/api/auth/me`, { credentials: "include" });
        if (!userRes.ok) {
            window.location.href = "login.html";
            return;
        }
        currentUser = await userRes.json();
        if (currentUser.role !== "STUDENT") {
            alert("Unauthorized access. Students only.");
            window.location.href = "login.html";
            return;
        }
        if (welcomeTitle) {
            welcomeTitle.textContent = `Welcome back, ${currentUser.name || "Student"}`;
        }
    } catch (error) {
        console.error("Session check failed:", error);
        window.location.href = "login.html";
        return;
    }

    // Load and normalize global categories, courses, and enrollments upfront
    async function fetchMetaData() {
        try {
            const catRes = await fetch(`${HOST_URL}/api/categories`);
            if (catRes.ok) {
                const rawCategories = await catRes.json();
                categories = rawCategories.map(cat => ({
                    categoryId: String(cat.categoryId ?? cat.id ?? cat.name ?? "").trim(),
                    categoryName: String(cat.categoryName ?? cat.name ?? cat.title ?? "General").trim()
                }));
            }

            const courseRes = await fetch(`${HOST_URL}/api/courses`);
            if (courseRes.ok) {
                const rawCourses = await courseRes.json();
                allCourses = rawCourses.map(c => {
                    const catObj = c.category || {};
                    const catId = String(c.categoryId ?? catObj.categoryId ?? catObj.id ?? "").trim();
                    const catName = String(c.categoryName ?? catObj.categoryName ?? catObj.name ?? c.categoryId ?? "").trim();
                    return {
                        ...c,
                        courseId: c.courseId ?? c.id,
                        title: c.title ?? c.courseTitle ?? "Untitled Course",
                        description: c.description ?? "",
                        price: c.price ?? 0,
                        courseUrl: c.courseUrl ?? "#",
                        averageRating: c.averageRating ?? c.rating ?? 0.0,
                        totalReviews: c.totalReviews ?? c.reviewCount ?? 0,
                        categoryId: catId,
                        categoryName: catName || "General"
                    };
                });
            }

            const currentUserId = currentUser?.userId ?? currentUser?.id;
            if (currentUserId) {
                const enrollRes = await fetch(`${HOST_URL}/api/enrollments/user/${currentUserId}`, { credentials: "include" });
                if (enrollRes.ok) {
                    const rawEnrollments = await enrollRes.json();
                    myEnrolledCourses = rawEnrollments.map(e => {
                        const courseObj = e.course || {};
                        return {
                            enrollmentId: e.enrollmentId ?? e.id,
                            courseId: e.courseId ?? courseObj.courseId ?? courseObj.id,
                            courseTitle: e.courseTitle ?? e.title ?? courseObj.title ?? "Untitled Course",
                            description: e.description ?? courseObj.description ?? "",
                            price: e.price ?? courseObj.price ?? 0,
                            courseUrl: e.courseUrl ?? courseObj.courseUrl ?? "#",
                            enrolledAt: e.enrolledAt ?? e.createdAt ?? new Date(),
                            status: e.status ?? "ACTIVE"
                        };
                    });
                }
            }
        } catch (err) {
            console.error("Failed to fetch metadata:", err);
        }
    }

    function isCoursePurchased(courseId) {
        return myEnrolledCourses.some(e => Number(e.courseId) === Number(courseId));
    }

    function getEnrollmentByCourseId(courseId) {
        return myEnrolledCourses.find(e => Number(e.courseId) === Number(courseId));
    }

    // Toggle Course Status function for students
    window.toggleCourseStatus = async function(enrollmentId, currentStatus) {
        const newStatus = currentStatus === 'COMPLETED' ? 'ACTIVE' : 'COMPLETED';
        try {
            const res = await fetch(`${HOST_URL}/api/enrollments/${enrollmentId}/status?status=${newStatus}`, {
                method: "PUT",
                credentials: "include"
            });
            if (res.ok) {
                alert(`Course marked as ${newStatus}!`);
                await fetchMetaData();
                const activeView = document.querySelector(".sidebar-menu li.active")?.getAttribute("data-view");
                if (activeView === "my-courses") {
                    renderMyCoursesView();
                } else {
                    renderOverviewView(currentSelectedCategory);
                }
            } else {
                const errText = await res.text();
                alert(errText || "Failed to update status.");
            }
        } catch (err) {
            console.error("Error updating status:", err);
            alert("An error occurred while updating status.");
        }
    };

    // 2. Render Overview View with fixed category filtering
    async function renderOverviewView(selectedCategory = "") {
        currentSelectedCategory = selectedCategory;
        await fetchMetaData();

        const activeCategory = String(currentSelectedCategory).trim();

        const filteredCourses = activeCategory !== "" 
            ? allCourses.filter(c => {
                const matchId = String(c.categoryId).toLowerCase() === activeCategory.toLowerCase();
                const matchName = String(c.categoryName).toLowerCase() === activeCategory.toLowerCase();
                return matchId || matchName;
              })
            : allCourses;

        mainContentArea.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0;">Explore All Courses</h2>
                <div>
                    <label for="categoryFilter" style="font-weight: 500; margin-right: 10px; color: #475569;">Filter Category:</label>
                    <select id="categoryFilter" style="padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff;">
                        <option value="">All Categories</option>
                        ${categories.map(cat => `
                            <option value="${cat.categoryName}" ${activeCategory.toLowerCase() === cat.categoryName.toLowerCase() || activeCategory === cat.categoryId ? 'selected' : ''}>
                                ${cat.categoryName}
                            </option>
                        `).join("")}
                    </select>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;" id="overviewCoursesGrid">
                ${filteredCourses.length > 0 ? filteredCourses.map(c => {
                    const purchased = isCoursePurchased(c.courseId);
                    const avgRating = Number(c.averageRating || 0);
                    const reviewCount = Number(c.totalReviews || 0);
                    return `
                        <div class="course-card" onclick="viewCourseDetail(${c.courseId})" style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between;">
                            <div>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <span style="background: #e0f2fe; color: #0369a1; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">${c.categoryName}</span>
                                    ${purchased ? '<span style="background: #dcfce7; color: #166534; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">Purchased</span>' : ''}
                                </div>
                                <h3 style="margin: 6px 0; color: #1e293b;">${c.title}</h3>
                                <p style="color: #64748b; font-size: 0.9rem; margin: 0 0 10px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${c.description}</p>
                                <div style="font-size: 0.85rem; color: #d97706; font-weight: 600; margin-bottom: 10px;">
                                    ⭐ ${avgRating.toFixed(1)} <span style="color: #64748b; font-weight: normal;">(${reviewCount} reviews)</span>
                                </div>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 12px; margin-top: 10px;">
                                <span style="font-weight: 700; color: #0f172a; font-size: 1.1rem;">₹${c.price}</span>
                                <span style="color: #2563eb; font-size: 0.9rem; font-weight: 600;">${purchased ? 'View Material &rarr;' : 'View Details &rarr;'}</span>
                            </div>
                        </div>
                    `;
                }).join("") : `<p style="color: #64748b; grid-column: span 3;">No courses found in this category.</p>`}
            </div>
        `;

        document.getElementById("categoryFilter").addEventListener("change", (e) => {
            renderOverviewView(e.target.value);
        });
    }

    // 3. Render Detailed Course Info, Purchase Gateway, & Reviews
    window.viewCourseDetail = async function(courseId) {
        await fetchMetaData();
        const course = allCourses.find(c => Number(c.courseId) === Number(courseId));
        if (!course) return;

        const isPurchased = isCoursePurchased(courseId);
        const enrollment = getEnrollmentByCourseId(courseId);
        const userId = currentUser?.userId ?? currentUser?.id;

        let reviews = [];
        try {
            if (typeof window.apiRequest === 'function') {
                reviews = await window.apiRequest(`/api/reviews/course/${courseId}`);
            } else {
                const revRes = await fetch(`${HOST_URL}/api/reviews/course/${courseId}`);
                if (revRes.ok) reviews = await revRes.json();
            }
        } catch (err) {
            console.error("Failed to fetch reviews:", err);
        }

        const userExistingReview = reviews.find(r => r.user && Number(r.user.userId ?? r.user.id) === Number(userId));
        const avgRating = Number(course.averageRating || 0);
        const reviewCount = Number(course.totalReviews || 0);

        mainContentArea.innerHTML = `
            <button onclick="renderOverviewView(currentSelectedCategory)" style="background: none; border: none; color: #2563eb; cursor: pointer; font-weight: 600; margin-bottom: 20px; padding: 0; font-size: 0.95rem;">&larr; Back to Overview</button>
            <div style="background: #fff; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0; max-width: 800px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">${course.categoryName}</span>
                    ${isPurchased ? `<span style="background: ${enrollment?.status === 'COMPLETED' ? '#e2e8f0' : '#dcfce7'}; color: ${enrollment?.status === 'COMPLETED' ? '#475569' : '#166534'}; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">${enrollment?.status === 'COMPLETED' ? 'Completed' : 'Already Purchased'}</span>` : ''}
                </div>
                <h1 style="margin: 10px 0; color: #1e293b;">${course.title}</h1>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                    <span style="font-size: 1.25rem; font-weight: 700; color: #0f172a;">₹${course.price}</span>
                    <span style="background: #fef3c7; color: #92400e; padding: 3px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 600;">⭐ ${avgRating.toFixed(1)} (${reviewCount} reviews)</span>
                </div>
                
                <h3 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; color: #334155;">Course Description</h3>
                <p style="color: #475569; line-height: 1.6; margin-bottom: 25px; white-space: pre-line;">${course.description}</p>

                ${isPurchased ? `
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 6px; margin-top: 20px;">
                        <h3 style="color: #166534; margin: 0 0 10px 0;">✅ You Own This Course</h3>
                        <p style="margin: 0 0 10px 0; color: #15803d;">Course Video / Resource Link provided by Instructor:</p>
                        <a href="${course.courseUrl}" target="_blank" style="color: #2563eb; font-weight: 600; word-break: break-all;">${course.courseUrl}</a>
                        
                        <div style="margin-top: 20px; border-top: 1px solid #bbf7d0; padding-top: 15px;">
                            <button onclick="toggleCourseStatus(${enrollment.enrollmentId}, '${enrollment.status || 'ACTIVE'}')" 
                                style="padding: 10px 18px; background: ${enrollment.status === 'COMPLETED' ? '#64748b' : '#10b981'}; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.95rem;">
                                ${enrollment.status === 'COMPLETED' ? 'Mark as Active' : 'Mark as Complete'}
                            </button>
                        </div>
                    </div>

                    <!-- Review & Rating Section -->
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 6px; margin-top: 25px;">
                        <h3 style="margin-top: 0; color: #1e293b;">${userExistingReview ? 'Update Your Review' : 'Rate & Review This Course'}</h3>
                        <div id="reviewForm">
                            <div style="margin-bottom: 12px;">
                                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 5px;">Rating (1 to 5 Stars)</label>
                                <select id="reviewRating" style="padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; width: 150px; background: #fff;">
                                    <option value="5" ${userExistingReview?.rating === 5 ? 'selected' : ''}>⭐⭐⭐⭐⭐ (5)</option>
                                    <option value="4" ${userExistingReview?.rating === 4 ? 'selected' : ''}>⭐⭐⭐⭐ (4)</option>
                                    <option value="3" ${userExistingReview?.rating === 3 ? 'selected' : ''}>⭐⭐⭐ (3)</option>
                                    <option value="2" ${userExistingReview?.rating === 2 ? 'selected' : ''}>⭐⭐ (2)</option>
                                    <option value="1" ${userExistingReview?.rating === 1 ? 'selected' : ''}>⭐ (1)</option>
                                </select>
                            </div>
                            <div style="margin-bottom: 12px;">
                                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 5px;">Comment</label>
                                <textarea id="reviewComment" rows="3" placeholder="Share your experience with this course..." style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; background: #fff;">${userExistingReview?.comment || ''}</textarea>
                            </div>
                            <button type="button" id="submitReviewBtn" style="background: #2563eb; color: #fff; border: none; padding: 10px 18px; border-radius: 6px; font-weight: 600; cursor: pointer;">Submit Review</button>
                        </div>
                    </div>
                ` : `
                    <button onclick="openCheckoutModal(${course.courseId}, '${course.title.replace(/'/g, "\\'")}', ${course.price})" style="background: #16a34a; color: #fff; border: none; padding: 12px 24px; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer;">Purchase Course</button>
                `}

                <!-- Display All Student Reviews -->
                <div style="margin-top: 30px;">
                    <h3 style="color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Student Reviews</h3>
                    ${reviews.length > 0 ? reviews.map(r => `
                        <div style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <strong style="color: #334155; font-size: 0.95rem;">${r.user?.name || 'Student'}</strong>
                                <span style="color: #d97706; font-size: 0.85rem;">${'⭐'.repeat(r.rating)}</span>
                            </div>
                            <p style="margin: 0; color: #64748b; font-size: 0.9rem;">${r.comment || 'No comment provided.'}</p>
                        </div>
                    `).join("") : `<p style="color: #64748b; font-size: 0.9rem;">No reviews yet. Be the first to review this course after purchasing!</p>`}
                </div>
            </div>
        `;

        if (isPurchased) {
            const submitReviewBtn = document.getElementById("submitReviewBtn");
            if (submitReviewBtn) {
                submitReviewBtn.addEventListener("click", async () => {
                    const rating = parseInt(document.getElementById("reviewRating").value);
                    const comment = document.getElementById("reviewComment").value;
                    const finalUserId = currentUser?.userId ?? currentUser?.id;

                    try {
                        if (typeof window.apiRequest === 'function') {
                            await window.apiRequest("/api/reviews/submit", {
                                method: "POST",
                                body: JSON.stringify({ userId: finalUserId, courseId: Number(courseId), rating, comment })
                            });
                        } else {
                            const res = await fetch(`${HOST_URL}/api/reviews/submit`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ userId: finalUserId, courseId: Number(courseId), rating, comment }),
                                credentials: "include"
                            });
                            if (!res.ok) {
                                const errText = await res.text();
                                throw new Error(errText || "Failed to submit review.");
                            }
                        }

                        alert("Review submitted successfully!");
                        await fetchMetaData();
                        viewCourseDetail(courseId);
                    } catch (err) {
                        console.error("Review submission error:", err);
                        let cleanMsg = err.message;
                        try {
                            const parsed = JSON.parse(err.message);
                            if (parsed.message) cleanMsg = parsed.message;
                        } catch (e) {}
                        alert(cleanMsg || "An error occurred while submitting your review.");
                    }
                });
            }
        }
    };

    // Simulated Checkout & Payment Modal Flow
    window.openCheckoutModal = function(courseId, courseTitle, price) {
        if (!courseId) {
            alert("Invalid course ID.");
            return;
        }
        if (isCoursePurchased(courseId)) {
            alert("You have already purchased this course!");
            viewCourseDetail(courseId);
            return;
        }

        const modalBg = document.createElement("div");
        modalBg.id = "checkoutModal";
        modalBg.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;";
        
        modalBg.innerHTML = `
            <div style="background: #fff; padding: 30px; border-radius: 8px; width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                <h3 style="margin-top: 0; color: #1e293b;">Complete Payment</h3>
                <p style="color: #64748b; font-size: 0.9rem;">Course: <strong>${courseTitle}</strong></p>
                <p style="font-size: 1.2rem; font-weight: 700; color: #0f172a; margin-bottom: 20px;">Total Amount: ₹${price}</p>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 5px;">Cardholder Name</label>
                    <input type="text" value="${currentUser.name || ''}" disabled style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; background: #f8fafc; box-sizing: border-box;" />
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 5px;">Simulated Card Number</label>
                    <input type="text" value="•••• •••• •••• 4242" disabled style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; background: #f8fafc; box-sizing: border-box;" />
                </div>

                <div style="display: flex; gap: 10px;">
                    <button id="confirmPayBtn" style="flex: 1; background: #2563eb; color: #fff; border: none; padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer;">Pay ₹${price}</button>
                    <button onclick="document.getElementById('checkoutModal').remove()" style="background: #e2e8f0; color: #334155; border: none; padding: 10px 15px; border-radius: 6px; font-weight: 600; cursor: pointer;">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalBg);

        document.getElementById("confirmPayBtn").addEventListener("click", async () => {
            const payBtn = document.getElementById("confirmPayBtn");
            payBtn.textContent = "Processing Payment...";
            payBtn.disabled = true;

            try {
                const userId = currentUser?.userId ?? currentUser?.id;
                const res = await fetch(`${HOST_URL}/api/enrollments?userId=${userId}&courseId=${courseId}`, {
                    method: "POST",
                    credentials: "include"
                });

                if (res.ok) {
                    setTimeout(async () => {
                        modalBg.remove();
                        alert("Payment Successful! Course added to your My Courses list.");
                        await fetchMetaData();
                        viewCourseDetail(courseId);
                    }, 800);
                } else {
                    const errText = await res.text();
                    alert(errText || "Enrollment failed.");
                    modalBg.remove();
                    viewCourseDetail(courseId);
                }
            } catch (err) {
                console.error("Payment enrollment error:", err);
                alert("Payment simulation network error.");
                modalBg.remove();
            }
        });
    };

    // 4. Render My Courses View
    async function renderMyCoursesView() {
        await fetchMetaData();

        mainContentArea.innerHTML = `
            <h2>My Purchased Courses</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 20px;">
                ${myEnrolledCourses.length > 0 ? myEnrolledCourses.map(e => `
                    <div class="course-card" style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="background: ${e.status === 'COMPLETED' ? '#e2e8f0' : '#dcfce7'}; color: ${e.status === 'COMPLETED' ? '#475569' : '#166534'}; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">${e.status === 'COMPLETED' ? 'Completed' : 'Purchased'}</span>
                            </div>
                            <h3 style="margin: 10px 0 6px 0; color: #1e293b; cursor: pointer;" onclick="viewCourseDetail(${e.courseId})">${e.courseTitle}</h3>
                            <p style="color: #64748b; font-size: 0.9rem; margin: 0 0 15px 0;">Enrolled on: ${new Date(e.enrolledAt).toLocaleDateString()}</p>
                        </div>
                        <div style="border-top: 1px solid #f1f5f9; padding-top: 12px; margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #2563eb; font-size: 0.9rem; font-weight: 600; cursor: pointer;" onclick="viewCourseDetail(${e.courseId})">Access Material &rarr;</span>
                            <button onclick="toggleCourseStatus(${e.enrollmentId}, '${e.status || 'ACTIVE'}')" 
                                style="padding: 6px 12px; background: ${e.status === 'COMPLETED' ? '#64748b' : '#10b981'}; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">
                                ${e.status === 'COMPLETED' ? 'Mark Active' : 'Mark Complete'}
                            </button>
                        </div>
                    </div>
                `).join("") : `<p style="color: #64748b; grid-column: span 3;">You haven't purchased any courses yet. Check the Overview tab to explore and enroll!</p>`}
            </div>
        `;
    }

    // 5. Sidebar Navigation Handling
    menuItems.forEach(item => {
        item.addEventListener("click", () => {
            menuItems.forEach(i => {
                i.classList.remove("active");
                i.style.background = "transparent";
                i.style.color = "#94a3b8";
                i.style.fontWeight = "500";
            });
            
            item.classList.add("active");
            item.style.background = "#2563eb";
            item.style.color = "#ffffff";
            item.style.fontWeight = "600";

            const view = item.getAttribute("data-view");
            if (view === "overview") {
                renderOverviewView("");
            } else if (view === "my-courses") {
                renderMyCoursesView();
            } else if (view === "profile") {
                mainContentArea.innerHTML = `
                    <h2>Student Profile Details</h2>
                    <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 20px; max-width: 600px;">
                        <p><strong>Full Name:</strong> ${currentUser.name}</p>
                        <p><strong>Email Address:</strong> ${currentUser.email}</p>
                        <p><strong>System Role:</strong> ${currentUser.role}</p>
                    </div>
                `;
            }
        });
    });

    // 6. Logout Handler
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            try {
                if (typeof window.apiRequest === 'function') {
                    await window.apiRequest("/api/auth/logout", { method: "POST" });
                } else {
                    await fetch(`${HOST_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
                }
            } catch (e) {
                console.error("Logout error:", e);
            }
            window.location.href = "login.html";
        });
    }

    renderOverviewView();
});