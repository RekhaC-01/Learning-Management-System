document.addEventListener("DOMContentLoaded", async () => {
    // Fallback-safe base URL definition supporting both API_BASE_URL and BASE_URL configs
    const HOST_URL = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : (typeof BASE_URL !== 'undefined' ? BASE_URL : "http://127.0.0.1:8080");

    const menuItems = document.querySelectorAll(".sidebar-menu li");
    const logoutBtn = document.getElementById("logoutBtn");
    const contentArea = document.getElementById("adminMainContentArea");
    const welcomeTitle = document.getElementById("adminWelcomeTitle");

    let currentUser = null;

    // Secure authentication check via session
    try {
        const userRes = await fetch(`${HOST_URL}/api/auth/me`, { credentials: "include" });
        if (!userRes.ok) {
            window.location.href = "login.html";
            return;
        }
        currentUser = await userRes.json();
        if (currentUser.role !== "ADMIN") {
            alert("Unauthorized access. Admins only.");
            window.location.href = "login.html";
            return;
        }
        if (welcomeTitle) {
            welcomeTitle.textContent = `Welcome back, ${currentUser.name || "Administrator"}`;
        }
    } catch (err) {
        window.location.href = "login.html";
        return;
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await fetch(`${HOST_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
            window.location.href = "login.html";
        });
    }

    menuItems.forEach(item => {
        item.addEventListener("click", () => {
            menuItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            const view = item.getAttribute("data-view");
            loadView(view);
        });
    });

    function loadView(view) {
        if (!contentArea) return;
        contentArea.innerHTML = "<p>Loading...</p>";
        if (view === "overview") {
            renderOverview();
        } else if (view === "categories") {
            renderCategoriesView();
        } else if (view === "users") {
            renderUsersView();
        } else if (view === "courses") {
            renderCoursesView();
        } else if (view === "profile") {
            renderProfileView();
        }
    }

    async function renderOverview() {
        if (!contentArea) return;
        try {
            const [usersRes, categoriesRes, coursesRes] = await Promise.all([
                fetch(`${HOST_URL}/api/auth/users?role=ADMIN`, { credentials: "include" }),
                fetch(`${HOST_URL}/api/categories`),
                fetch(`${HOST_URL}/api/courses`)
            ]);

            const users = usersRes.ok ? await usersRes.json() : [];
            const categories = categoriesRes.ok ? await categoriesRes.json() : [];
            const courses = coursesRes.ok ? await coursesRes.json() : [];

            // Filter out admins to count only non-admin users (students/instructors)
            const nonAdminUsers = users.filter(u => u.role !== "ADMIN");

            contentArea.innerHTML = `
                <h2>Platform Overview</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px;">
                    <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <h3>Total Users</h3>
                        <p style="font-size: 2rem; font-weight: bold; color: #2563eb; margin-top: 10px;">${nonAdminUsers.length}</p>
                    </div>
                    <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <h3>Categories</h3>
                        <p style="font-size: 2rem; font-weight: bold; color: #9333ea; margin-top: 10px;">${categories.length}</p>
                    </div>
                    <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <h3>Active Courses</h3>
                        <p style="font-size: 2rem; font-weight: bold; color: #16a34a; margin-top: 10px;">${courses.length}</p>
                    </div>
                </div>
            `;
        } catch (err) {
            contentArea.innerHTML = `<p style="color: red;">Failed to load overview data.</p>`;
        }
    }

    async function renderCategoriesView() {
        if (!contentArea) return;
        contentArea.innerHTML = `
            <h2>Category Management</h2>
            <div style="margin: 20px 0; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <h3>Add New Category</h3>
                <form id="categoryForm" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                    <input type="text" id="categoryName" placeholder="Category Name" required style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px;">
                    <textarea id="categoryDesc" placeholder="Description" style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; resize: vertical;"></textarea>
                    <button type="submit" style="padding: 10px; background: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Create Category</button>
                </form>
            </div>
            <h3>Existing Categories</h3>
            <div id="categoryList" style="margin-top: 10px; display: flex; flex-direction: column; gap: 10px;"></div>
        `;

        fetchCategories();

        document.getElementById("categoryForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            const categoryName = document.getElementById("categoryName").value.trim();
            const description = document.getElementById("categoryDesc").value.trim();
            try {
                const res = await fetch(`${HOST_URL}/api/categories?role=ADMIN`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ categoryName, description }),
                    credentials: "include"
                });
                if (res.ok) {
                    alert("Category created successfully!");
                    fetchCategories();
                    e.target.reset();
                } else {
                    const errText = await res.text();
                    alert(errText || "Failed to create category.");
                }
            } catch (err) {
                console.error(err);
                alert("Network error while creating category.");
            }
        });
    }

    async function fetchCategories() {
        try {
            const res = await fetch(`${HOST_URL}/api/categories`);
            const categories = await res.json();
            const list = document.getElementById("categoryList");
            if (list) {
                list.innerHTML = categories.length > 0 
                    ? categories.map(c => `
                        <div style="background: #fff; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>📂 ${c.categoryName}</strong>
                                <p style="color: #64748b; font-size: 0.9rem; margin-top: 4px;">${c.description || 'No description'}</p>
                            </div>
                            <button onclick="deleteCategory(${c.categoryId})" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Delete</button>
                        </div>
                    `).join("")
                    : "<p style='color: #64748b;'>No categories found.</p>";
            }
        } catch (err) {
            console.error(err);
        }
    }

    window.deleteCategory = async function(id) {
        if (!confirm("Are you sure you want to delete this category?")) return;
        try {
            const res = await fetch(`${HOST_URL}/api/categories/${id}?role=ADMIN`, {
                method: "DELETE",
                credentials: "include"
            });
            if (res.ok) {
                alert("Category deleted successfully.");
                fetchCategories();
            } else {
                const errText = await res.text();
                alert(errText || "Failed to delete category.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    async function renderUsersView() {
        if (!contentArea) return;
        contentArea.innerHTML = `
            <h2>User Management</h2>
            <div style="margin-top: 20px; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 2px solid #e2e8f0; color: #64748b;">
                            <th style="padding: 10px;">ID</th>
                            <th style="padding: 10px;">Name</th>
                            <th style="padding: 10px;">Email</th>
                            <th style="padding: 10px;">Role</th>
                            <th style="padding: 10px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="userTableBody">
                        <tr><td colspan="5" style="padding: 15px; text-align: center;">Loading users...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        try {
            const res = await fetch(`${HOST_URL}/api/auth/users?role=ADMIN`, { credentials: "include" });
            const users = await res.json();
            const tbody = document.getElementById("userTableBody");

            tbody.innerHTML = users.map(u => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px;">${u.userId}</td>
                    <td style="padding: 10px;">${u.name}</td>
                    <td style="padding: 10px;">${u.email}</td>
                    <td style="padding: 10px;"><span style="background:#e0f2fe; color:#0369a1; padding: 2px 8px; border-radius: 4px; font-size: 0.85rem;">${u.role}</span></td>
                    <td style="padding: 10px;">
                        ${u.userId !== currentUser.userId ? `<button onclick="deleteUser(${u.userId})" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Delete</button>` : '<span style="color: #94a3b8; font-size: 0.85rem;">Current Admin</span>'}
                    </td>
                </tr>
            `).join("");
        } catch (err) {
            document.getElementById("userTableBody").innerHTML = `<tr><td colspan="5" style="color: red; padding: 10px; text-align: center;">Failed to load users.</td></tr>`;
        }
    }

    window.deleteUser = async function(userId) {
        if (!confirm("Are you sure you want to delete this user?")) return;
        try {
            const res = await fetch(`${HOST_URL}/api/auth/${userId}?role=ADMIN`, {
                method: "DELETE",
                credentials: "include"
            });
            if (res.ok) {
                alert("User deleted successfully.");
                renderUsersView();
            } else {
                const errText = await res.text();
                alert(errText || "Failed to delete user.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    async function renderCoursesView() {
        if (!contentArea) return;
        contentArea.innerHTML = `
            <h2>Course Oversight</h2>
            <div id="adminCourseList" style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;"></div>
        `;

        try {
            const res = await fetch(`${HOST_URL}/api/courses`);
            const courses = await res.json();
            const container = document.getElementById("adminCourseList");

            container.innerHTML = courses.length > 0 
                ? courses.map(c => `
                    <div style="background: #fff; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>📚 ${c.title}</strong>
                            <p style="color: #64748b; font-size: 0.9rem; margin-top: 4px;">Category: ${c.categoryName || 'None'} | Price: ₹${c.price}</p>
                        </div>
                        <button onclick="deleteCourseAdmin(${c.courseId})" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Delete Course</button>
                    </div>
                `).join("")
                : "<p style='color: #64748b;'>No courses available on the platform.</p>";
        } catch (err) {
            document.getElementById("adminCourseList").innerHTML = `<p style="color: red;">Failed to load courses.</p>`;
        }
    }

    window.deleteCourseAdmin = async function(courseId) {
        if (!confirm("Are you sure you want to delete this course?")) return;
        try {
            const res = await fetch(`${HOST_URL}/api/courses/${courseId}?role=ADMIN`, {
                method: "DELETE",
                credentials: "include"
            });
            if (res.ok) {
                alert("Course deleted successfully.");
                renderCoursesView();
            } else {
                const errText = await res.text();
                alert(errText || "Failed to delete course.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    function renderProfileView() {
        if (!contentArea) return;
        contentArea.innerHTML = `
            <h2>Admin Profile Details</h2>
            <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 20px; max-width: 600px;">
                <p><strong>Full Name:</strong> ${currentUser.name}</p>
                <p><strong>Email Address:</strong> ${currentUser.email}</p>
                <p><strong>System Role:</strong> ${currentUser.role}</p>
            </div>
        `;
    }

    // Load default view
    renderOverview();
});