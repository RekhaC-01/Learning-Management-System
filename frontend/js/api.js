const API_BASE_URL = typeof CONFIG !== 'undefined' ? CONFIG.BASE_URL : "http://127.0.0.1:8080";

async function apiRequest(endpoint, options = {}) {
    const defaultHeaders = {
        "Content-Type": "application/json"
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        },
        credentials: "include"
    };

    try {
        const baseUrl = typeof CONFIG !== 'undefined' ? CONFIG.BASE_URL : "http://127.0.0.1:8080";
        const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`;
        const response = await fetch(url, config);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (Object.keys(errorData).length > 0) {
                throw new Error(JSON.stringify(errorData));
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error("API Request Failed:", error);
        throw error;
    }
}

// Attach to window so it's globally accessible across your app scripts
window.apiRequest = apiRequest;
window.API_BASE_URL = API_BASE_URL;