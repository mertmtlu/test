import { validateUser } from "./database.js"

const user = await validateUser(sessionStorage.getItem("username"), sessionStorage.getItem("password"), 'check');
if (!user) {
    window.location.href = "login.html"; // Redirect to the desired page
}