import { validateUser, addUser } from "./database.js"
import { showAlert } from './utilities.js';

function showToast(message) {
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toastMessage");

    toastMessage.textContent = message;
    toast.classList.remove("hidden");
    toast.classList.add("show");

    // Hide the toast automatically after 3 seconds
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.classList.add("hidden"), 3000); // Add the hidden class after animation
    }, 3000);
}

document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent default form submission

    const username = document.getElementById("username");
    const password = document.getElementById("password");
    const usernameError = document.getElementById("usernameError");
    const passwordError = document.getElementById("passwordError");

    usernameError.style.display = "none";
    passwordError.style.display = "none";

    let isValid = true;

    if (!username.value.trim()) {
        usernameError.style.display = "block";
        username.focus();
        isValid = false;
    }

    if (!password.value.trim()) {
        passwordError.style.display = "block";
        if (isValid) password.focus();
        isValid = false;
    }

    if (!isValid) return;

    sessionStorage.setItem("username", username.value); // Store the user object in session storage
    sessionStorage.setItem("password", password.value); // Store the user object in session storage

    const user = await validateUser(username.value, password.value);
    if (user) {
        sessionStorage.setItem("user", "validated"); // Store the user object in session storage
        window.location.href = "_Layout.html"; // Redirect to the desired page
    } else {
        showToast("Invalid username or password");
    }
});