import { addUser, checkUsernameExists } from "./database.js";

function showToast(message) {
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toastMessage");

    toastMessage.textContent = message;
    toast.classList.remove("hidden");
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.classList.add("hidden"), 3000);
    }, 3000);
}

function showSuccess(message) {
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toastMessage");

    toastMessage.textContent = message;
    toast.classList.remove("hidden");
    toast.classList.add("show");
    toast.style.backgroundColor = "green";

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.classList.add("hidden"), 3000);
    }, 3000);
}

document.getElementById("registerForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");
    const email = document.getElementById("email");

    const usernameError = document.getElementById("usernameError");
    const passwordError = document.getElementById("passwordError");
    const confirmPasswordError = document.getElementById("confirmPasswordError");
    const emailError = document.getElementById("emailError");

    usernameError.style.display = "none";
    passwordError.style.display = "none";
    confirmPasswordError.style.display = "none";
    emailError.style.display = "none";

    let isValid = true;

    if (!username.value.trim()) {
        usernameError.style.display = "block";
        username.focus();
        isValid = false;
    }

    if (!email.value.trim()) {
        emailError.style.display = "block";
        if (isValid) email.focus();
        isValid = false;
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailPattern.test(email.value)) {
        emailError.style.display = "block";
        emailError.textContent = "Lütfen geçerli bir e-posta adresi girin.";
        if (isValid) email.focus();
        isValid = false;
    }

    if (!password.value.trim()) {
        passwordError.style.display = "block";
        if (isValid) password.focus();
        isValid = false;
    }

    if (password.value !== confirmPassword.value) {
        confirmPasswordError.style.display = "block";
        if (isValid) confirmPassword.focus();
        isValid = false;
    }

    if (!isValid) return;

    const usernameExists = await checkUsernameExists(username.value);
    if (usernameExists) {
        showToast("Bu kullanıcı adı zaten alınmış.");
        username.focus();
        return;
    }

    await addUser(username.value, password.value, email.value);
    showSuccess("Kayıt başvurusu alındı. Lütfen yönetici onayını bekleyin.");
});
