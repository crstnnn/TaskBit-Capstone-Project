(function () {
  // Already logged in -> skip straight to spaces.
  const existing = Session.get();
  if (existing?.token) {
    window.location.href = "/spaces.html";
    return;
  }

  document.getElementById("loginLogoMark").innerHTML = Icon.rocket;

  const tabLogin = document.getElementById("tabLogin");
  const tabRegister = document.getElementById("tabRegister");
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const switchHint = document.getElementById("switchHint");
  const errorBox = document.getElementById("formError");

  function showError(message) {
    errorBox.innerHTML = message ? `<div class="modal-error">${UI.escapeHtml(message)}</div>` : "";
  }

  function setMode(mode) {
    showError("");
    const isLogin = mode === "login";
    tabLogin.classList.toggle("active", isLogin);
    tabRegister.classList.toggle("active", !isLogin);
    loginForm.classList.toggle("hidden", !isLogin);
    registerForm.classList.toggle("hidden", isLogin);
    switchHint.innerHTML = isLogin
      ? `Don't have an account? <a href="#" id="goRegister" style="color:var(--red-accent); font-weight:700;">Sign up</a>`
      : `Already have an account? <a href="#" id="goLogin" style="color:var(--red-accent); font-weight:700;">Log in</a>`;
    document.getElementById(isLogin ? "goRegister" : "goLogin").addEventListener("click", (e) => {
      e.preventDefault();
      setMode(isLogin ? "register" : "login");
    });
  }

  tabLogin.addEventListener("click", () => setMode("login"));
  tabRegister.addEventListener("click", () => setMode("register"));
  setMode("login");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showError("");
    const btn = document.getElementById("loginSubmitBtn");
    btn.disabled = true;
    btn.textContent = "Logging in...";
    try {
      const result = await Api.auth.login({
        email: document.getElementById("loginEmail").value.trim(),
        password: document.getElementById("loginPassword").value,
      });
      Session.save(result);
      window.location.href = "/spaces.html";
    } catch (err) {
      showError(err.message || "Invalid email or password.");
    } finally {
      btn.disabled = false;
      btn.textContent = "Log in";
    }
  });

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showError("");
    const btn = document.getElementById("registerSubmitBtn");
    btn.disabled = true;
    btn.textContent = "Creating account...";
    try {
      const result = await Api.auth.register({
        fullName: document.getElementById("regName").value.trim(),
        email: document.getElementById("regEmail").value.trim(),
        password: document.getElementById("regPassword").value,
        roleId: Number(document.getElementById("regRole").value),
      });
      Session.save(result);
      window.location.href = "/spaces.html";
    } catch (err) {
      showError(err.message || "Could not create account.");
    } finally {
      btn.disabled = false;
      btn.textContent = "Create account";
    }
  });
})();
