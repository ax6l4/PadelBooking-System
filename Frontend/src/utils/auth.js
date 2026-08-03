export function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
  window.dispatchEvent(new Event("padel-auth-change"));
}

export function logoutUser() {
  localStorage.removeItem("user");
  window.dispatchEvent(new Event("padel-auth-change"));
}
