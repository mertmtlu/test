import { checkUsernameExists, requestNewPassword } from "./database.js";
// import { showAlert } from "./utilities.js";

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

document.getElementById("resetForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username");
    const usernameError = document.getElementById("usernameError");

    usernameError.style.display = "none";

    if (!username.value.trim()) {
        usernameError.style.display = "block";
        username.focus();
        return;
    }

    const userExists = await checkUsernameExists(username.value);
    if (userExists) {
        showSuccess("Şifre sıfırlama bağlantısı gönderildi.");
        // Logic to send the reset link (placeholder for backend integration)
        requestNewPassword(username.value);
    } else {
        showToast("Kullanıcı adı bulunamadı.");
    }
});
