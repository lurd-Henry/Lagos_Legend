// ==========================================
// LAGOS LEGENDS AUTHENTICATION
// ==========================================

const API = "/api";

const authScreen = document.getElementById("auth-screen");

const authForm = document.getElementById("auth-form");

const loginTab = document.getElementById("login-tab");
const registerTab = document.getElementById("register-tab");

const authTitle = document.getElementById("auth-title");
const authDescription = document.getElementById("auth-description");

const usernameField = document.getElementById("username-field");
const confirmField = document.getElementById("confirm-password-field");

const usernameInput = document.getElementById("auth-username");
const emailInput = document.getElementById("auth-email");
const passwordInput = document.getElementById("auth-password");
const confirmInput = document.getElementById("auth-confirm-password");

const submitButton = document.getElementById("auth-submit");
const submitText = document.getElementById("auth-submit-text");

const messageBox = document.getElementById("auth-message");

const togglePassword = document.getElementById("toggle-password");

let currentMode = "login";
let authenticated = false;


// ==========================================
// SESSION STORAGE
// ==========================================

const SESSION_KEY = "lagos_legends_session";

function saveSession(session) {

    localStorage.setItem(
        SESSION_KEY,
        JSON.stringify(session)
    );

}

function getSession() {

    try {

        return JSON.parse(
            localStorage.getItem(SESSION_KEY)
        );

    } catch {

        return null;

    }

}

function clearSession() {

    localStorage.removeItem(SESSION_KEY);

}


// ==========================================
// AUTH MESSAGES
// ==========================================

function showMessage(message, type = "error") {

    messageBox.textContent = message;

    messageBox.className = `show ${type}`;

}

function clearMessage() {

    messageBox.textContent = "";

    messageBox.className = "";

}


// ==========================================
// SWITCH AUTH MODE
// ==========================================

function setMode(mode) {

    currentMode = mode;

    clearMessage();

    const registering = mode === "register";

    loginTab.classList.toggle("active", !registering);

    registerTab.classList.toggle("active", registering);

    usernameField.hidden = !registering;

    confirmField.hidden = !registering;

    usernameInput.required = registering;

    confirmInput.required = registering;

    passwordInput.autocomplete = registering
        ? "new-password"
        : "current-password";

    authTitle.textContent = registering
        ? "Create Your Story."
        : "Welcome Back.";

    authDescription.textContent = registering
        ? "Create your identity and claim your place in Lagos."
        : "Your city is waiting. Pick up where you left off.";

    submitText.textContent = registering
        ? "CREATE ACCOUNT"
        : "ENTER THE CITY";

}

loginTab.addEventListener("click", () => {
    setMode("login");
});

registerTab.addEventListener("click", () => {
    setMode("register");
});


// ==========================================
// PASSWORD VISIBILITY
// ==========================================

togglePassword.addEventListener("click", () => {

    const hidden = passwordInput.type === "password";

    passwordInput.type = hidden
        ? "text"
        : "password";

    togglePassword.textContent = hidden
        ? "HIDE"
        : "SHOW";

});


// ==========================================
// API REQUEST
// ==========================================

async function apiRequest(endpoint, options = {}) {

    const response = await fetch(
        `${API}${endpoint}`,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        }
    );

    const data = await response.json();

    if (!response.ok) {

        throw new Error(
            data.message || "Something went wrong."
        );

    }

    return data;

}


// ==========================================
// LOGIN
// ==========================================

async function login(email, password) {

    const data = await apiRequest(
        "/auth/login",
        {
            method: "POST",

            body: JSON.stringify({
                email,
                password
            })
        }
    );

    saveSession(data.session);

    return data;

}


// ==========================================
// REGISTER
// ==========================================

async function register(username, email, password) {

    const data = await apiRequest(
        "/auth/register",
        {
            method: "POST",

            body: JSON.stringify({
                username,
                email,
                password
            })
        }
    );

    return data;

}


// ==========================================
// LOAD PLAYER PROFILE
// ==========================================

async function loadPlayerProfile() {

    const session = getSession();

    if (!session?.access_token) {

        throw new Error("No active session.");

    }

    return await apiRequest(
        "/player/me",
        {
            headers: {
                Authorization: `Bearer ${session.access_token}`
            }
        }
    );

}


// ==========================================
// ENTER GAME
// ==========================================

async function enterGame() {

    const profile = await loadPlayerProfile();

    authenticated = true;

    authScreen.style.display = "none";

    document.body.classList.remove("auth-locked");

    console.log(
        "Welcome to Lagos Legends:",
        profile.player
    );

    if (!profile.player.character_created) {

        console.log(
            "New player detected. Character creation is next."
        );

    }

    window.dispatchEvent(
        new CustomEvent("lagos:authenticated", {
            detail: profile.player
        })
    );

}


// ==========================================
// FORM SUBMISSION
// ==========================================

authForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    clearMessage();

    const email = emailInput.value.trim();

    const password = passwordInput.value;

    const username = usernameInput.value.trim();

    submitButton.disabled = true;

    submitText.textContent = "PLEASE WAIT...";

    try {

        if (currentMode === "register") {

            if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {

                throw new Error(
                    "Username must be 3–24 characters and contain only letters, numbers or underscores."
                );

            }

            if (password.length < 8) {

                throw new Error(
                    "Password must contain at least 8 characters."
                );

            }

            if (password !== confirmInput.value) {

                throw new Error(
                    "Your passwords do not match."
                );

            }

            const result = await register(
                username,
                email,
                password
            );

            if (result.requiresEmailVerification) {

                showMessage(
                    "Account created successfully! Check your email and verify your address. Once verified, return here and log in.",
                    "success"
                );

                authForm.reset();

                setMode("login");

                return;

            }

            if (result.session) {

                saveSession(result.session);

                await enterGame();

                return;

            }

        } else {

            await login(email, password);

            await enterGame();

        }

    } catch (error) {

        showMessage(error.message);

        console.error("Authentication error:", error);

    } finally {

        submitButton.disabled = false;

        submitText.textContent = currentMode === "register"
            ? "CREATE ACCOUNT"
            : "ENTER THE CITY";

    }

});


// ==========================================
// RESTORE EXISTING SESSION
// ==========================================

async function initialiseAuth() {

    document.body.classList.add("auth-locked");

    const session = getSession();

    if (session?.access_token) {

        try {

            await enterGame();

            return;

        } catch (error) {

            console.log(
                "Session expired. Please log in again."
            );

            clearSession();

        }

    }

    authScreen.style.display = "flex";

}


// ==========================================
// PREVENT GAME INPUT BEFORE LOGIN
// ==========================================

window.addEventListener("keydown", (event) => {

    if (!authenticated) {

        event.preventDefault();

        event.stopImmediatePropagation();

    }

}, true);


//window.addEventListener("pointerdown", (event) => {

    //if (!authenticated && !authScreen.contains(event.target)) {

        //event.preventDefault();

        //event.stopImmediatePropagation();

   // }

//}, true);


// ==========================================
// START
// ==========================================

initialiseAuth();
