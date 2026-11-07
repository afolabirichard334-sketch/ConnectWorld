const API = "/api";
const token = () => localStorage.getItem("cw_token");
const currentUser = () => JSON.parse(localStorage.getItem("cw_user") || "null");
const messageBox = () => document.getElementById("formMessage") || document.getElementById("pageMessage");
function showMessage(text, isError = false) {
  const box = messageBox();
  if (box) { box.textContent = text; box.className = "form-message " + (isError ? "error" : ""); }
}
async function api(url, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token()) headers.Authorization = `Bearer ${token()}`;
  const response = await fetch(API + url, { ...options, headers, credentials: "same-origin" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}
function requireLogin() {
  if (!token()) location.href = "login.html";
}
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function saveSession(data) {
  localStorage.setItem("cw_token", data.token);
  localStorage.setItem("cw_user", JSON.stringify(data.user));
}
document.getElementById("registerForm")?.addEventListener("submit", async e => {
  e.preventDefault(); const form = new FormData(e.currentTarget); const body = Object.fromEntries(form.entries());
  try {
    const data = await api("/auth/register", { method: "POST", body: JSON.stringify(body) });
    saveSession(data); location.href = "dashboard.html";
  } catch (err) { showMessage(err.message, true); }
});
document.getElementById("loginForm")?.addEventListener("submit", async e => {
  e.preventDefault(); const body = Object.fromEntries(new FormData(e.currentTarget).entries());
  try {
    const data = await api("/auth/login", { method: "POST", body: JSON.stringify(body) });
    saveSession(data); location.href = "dashboard.html";
  } catch (err) { showMessage(err.message, true); }
});
document.getElementById("logoutButton")?.addEventListener("click", async () => {
  try { await api("/auth/logout", { method: "POST" }); } catch {}
  localStorage.removeItem("cw_token"); localStorage.removeItem("cw_user"); location.href = "/";
});

async function loadPeople() {
  requireLogin();
  const grid = document.getElementById("peopleGrid"); if (!grid) return;
  const params = new URLSearchParams(new FormData(document.getElementById("filterForm") || undefined));
  try {
    const { users } = await api("/users/discover?" + params.toString());
    grid.innerHTML = users.length ? users.map(user => `
      <article class="person-card">
        <div class="avatar">${escapeHtml(user.username.slice(0,1).toUpperCase())}</div>
        <div><h3>${escapeHtml(user.username)}</h3><p class="muted">🌐 ${escapeHtml(user.country)} · Age ${user.age}</p></div>
        <p>${escapeHtml(user.bio || "Still writing my introduction.")}</p>
        <p class="tag-line">${escapeHtml(user.interests || "Interests not added yet")}</p>
        <div class="card-actions">${user.friendshipStatus === "none" ? `<button class="button primary" data-friend="${user.id}">Add friend</button>` : `<span class="status">${user.friendshipStatus.replace("_"," ")}</span>`}
        <button class="button quiet" data-report="${user.id}">Report</button><button class="button quiet" data-block="${user.id}">Block</button></div>
      </article>`).join("") : "<p>No profiles found. Try another search.";
    grid.querySelectorAll("[data-friend]").forEach(b => b.addEventListener("click", async () => {
      try { await api(`/friendships/request/${b.dataset.friend}`, { method: "POST" }); b.textContent = "Request sent"; b.disabled = true; }
      catch (err) { showMessage(err.message, true); }
    }));
    grid.querySelectorAll("[data-block]").forEach(b => b.addEventListener("click", async () => {
      if (!confirm("Block this user? They will no longer be able to connect or chat with you.")) return;
      try { await api(`/safety/block/${b.dataset.block}`, { method: "POST" }); b.closest(".person-card").remove(); }
      catch (err) { showMessage(err.message, true); }
    }));
    grid.querySelectorAll("[data-report]").forEach(b => b.addEventListener("click", async () => {
      const reason = prompt("Report reason: harassment, spam, inappropriate, impersonation or other");
      if (!reason) return;
      const details = prompt("Optional details (do not include private information):") || "";
      try { await api(`/safety/report/${b.dataset.report}`, { method: "POST", body: JSON.stringify({ reason: reason.toLowerCase(), details }) }); showMessage("Report submitted for review."); }
      catch (err) { showMessage(err.message, true); }
    }));
  } catch (err) { showMessage(err.message, true); }
}
document.getElementById("filterForm")?.addEventListener("submit", e => { e.preventDefault(); loadPeople(); });
document.getElementById("filterForm")?.addEventListener("reset", () => setTimeout(loadPeople, 0));
if (document.getElementById("peopleGrid")) loadPeople();

async function loadFriends() {
  requireLogin();
  const list = document.getElementById("friendsList"); if (!list) return;
  try {
    const { friendships } = await api("/friendships");
    if (!friendships.length) { list.textContent = "No friend requests yet. Visit Discover to meet people."; return; }
    list.innerHTML = friendships.map(f => {
      const incoming = f.addresseeId === currentUser()?.id && f.status === "pending";
      const other = incoming ? f.requester : (f.requesterId === currentUser()?.id ? f.addressee : f.requester);
      return `<article class="friend-row"><div><b>${escapeHtml(other?.username || "ConnectWorld user")}</b><p class="muted">${escapeHtml(other?.country || "")} · ${escapeHtml(f.status)}</p></div>
      ${incoming ? `<button class="button primary" data-accept="${f.id}">Accept</button><button class="button secondary" data-decline="${f.id}">Decline</button>` : ""}
      ${f.status === "accepted" ? `<a class="button primary" href="chat.html?user=${other.id}">Message</a>` : ""}</article>`;
    }).join("");
    list.querySelectorAll("[data-accept]").forEach(b => b.addEventListener("click", async () => { await api(`/friendships/${b.dataset.accept}/respond`, { method: "PATCH", body: JSON.stringify({ status: "accepted" }) }); loadFriends(); }));
    list.querySelectorAll("[data-decline]").forEach(b => b.addEventListener("click", async () => { await api(`/friendships/${b.dataset.decline}/respond`, { method: "PATCH", body: JSON.stringify({ status: "declined" }) }); loadFriends(); }));
  } catch (err) { showMessage(err.message, true); }
}
if (document.getElementById("friendsList")) loadFriends();

async function loadProfile() {
  requireLogin();
  const form = document.getElementById("profileForm"); if (!form) return;
  try {
    const { user } = await api("/users/profile");
    ["country", "interests", "bio"].forEach(k => form.elements[k].value = user[k] || "");
  } catch (err) { showMessage(err.message, true); }
}
document.getElementById("profileForm")?.addEventListener("submit", async e => {
  e.preventDefault(); const body = Object.fromEntries(new FormData(e.currentTarget).entries());
  try { await api("/users/profile", { method: "PUT", body: JSON.stringify(body) }); showMessage("Profile saved."); }
  catch (err) { showMessage(err.message, true); }
});
if (document.getElementById("profileForm")) loadProfile();

async function loadChat() {
  requireLogin();
  const params = new URLSearchParams(location.search); const otherId = params.get("user");
  if (!otherId) { showMessage("Choose a friend first.", true); return; }
  const messagesEl = document.getElementById("chatMessages");
  try {
    const { messages } = await api(`/messages/${otherId}`);
    messagesEl.innerHTML = messages.map(m => `<div class="bubble ${m.senderId === currentUser()?.id ? "mine" : ""}">${escapeHtml(m.content)}<small>${new Date(m.createdAt).toLocaleString()}</small></div>`).join("");
    messagesEl.scrollTop = messagesEl.scrollHeight;
    const socket = window.io ? io({ auth: { token: token() } }) : null;
    socket?.on("new_message", m => {
      if (Number(m.senderId) === Number(otherId)) {
        const bubble = document.createElement("div"); bubble.className = "bubble";
        bubble.textContent = m.content; messagesEl.appendChild(bubble); messagesEl.scrollTop = messagesEl.scrollHeight;
      }
    });
    document.getElementById("chatForm")?.addEventListener("submit", async e => {
      e.preventDefault(); const input = e.currentTarget.elements.content; const content = input.value.trim(); if (!content) return;
      try {
        const data = await api(`/messages/${otherId}`, { method: "POST", body: JSON.stringify({ content }) });
        const bubble = document.createElement("div"); bubble.className = "bubble mine"; bubble.textContent = data.message.content;
        messagesEl.appendChild(bubble); messagesEl.scrollTop = messagesEl.scrollHeight; input.value = "";
      } catch (err) { showMessage(err.message, true); }
    });
  } catch (err) { showMessage(err.message, true); }
}
if (document.getElementById("chatMessages")) loadChat();
