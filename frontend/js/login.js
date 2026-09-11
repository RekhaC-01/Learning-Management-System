async function handleLogin(e) {
    e.preventDefault();
    console.log("Login form submit intercepted successfully!");

    const errorMessage = document.getElementById("errorMessage");
    if (errorMessage) errorMessage.textContent = "";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    const requestData = { email, password };

    try {
        // 1. Send login request to create the HttpSession
        await apiRequest("/api/auth/login", {
            method: "POST",
            body: JSON.stringify(requestData)
        });

        // 2. Fetch current user role to redirect appropriately
        const user = await apiRequest("/api/auth/me", {
            method: "GET"
        });

        if (user.role === "ADMIN") {
            window.location.href = "admin-dashboard.html";
        } else if (user.role === "INSTRUCTOR") {
            window.location.href = "instructor-dashboard.html";
        } else {
            window.location.href = "student-dashboard.html";
        }

    } catch (error) {
        console.error("Login process failed:", error);
        if (errorMessage) {
            try {
                const errObj = JSON.parse(error.message);
                errorMessage.textContent = errObj.message || errObj.error || "Invalid email or password.";
            } catch (e) {
                errorMessage.textContent = error.message || "Login failed. Please check your credentials.";
            }
        }
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLogin);
} else {
    initLogin();
}

function initLogin() {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
        console.log("Event listener attached to #loginForm");
    } else {
        console.error("Could not find #loginForm in the DOM!");
    }
}