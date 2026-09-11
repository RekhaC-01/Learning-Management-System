document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    const errorMessage = document.getElementById("errorMessage");
    const successMessage = document.getElementById("successMessage");

    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            // Clear previous messages
            if (errorMessage) errorMessage.textContent = "";
            if (successMessage) successMessage.textContent = "";

            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const phoneNumber = document.getElementById("phoneNumber").value.trim();
            const password = document.getElementById("password").value.trim();
            const role = document.getElementById("role").value;

            const requestData = {
                name,
                email,
                phoneNumber,
                password,
                role
            };

            try {
                await apiRequest("/api/auth/register", {
                    method: "POST",
                    body: JSON.stringify(requestData)
                });

                if (successMessage) {
                    successMessage.textContent = "Registration successful! Redirecting to login...";
                }

                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1500);

            } catch (error) {
                if (errorMessage) {
                    errorMessage.textContent = error.message;
                }
            }
        });
    }
});