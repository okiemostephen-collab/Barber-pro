
"use strict";

// ==========================================
// BARBERPRO - COMPLETE APPLICATION
// ==========================================

// SUPABASE CONNECTION
const SUPABASE_URL = "https://plokfuphzuyqtlbkjchp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_0uV82cRokH-vR61SZWBE1g_ykq8iBCH";
const SUPABASE_FUNCTION_URL = "https://plokfuphzuyqtlbkjchp.supabase.co/functions/v1/barberpro-booking";
const ADMIN_USER_ID = "00969825-e0d5-4a9b-9b83-81ec1bce6063";
const STORAGE_KEY = "barberpro-demo-v1";

if (!window.supabase?.createClient) {
  throw new Error("Supabase library did not load. Check your internet connection and script tags in index.html.");
}

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: "pkce"
    }
  }
);

let currentSession = null;
let databaseBookings = [];
let databaseCustomers = [];
let databaseExpenses = [];
let recoveryMode = false;

// ==========================================
// HELPERS
// ==========================================

const naira = value => new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0
}).format(Number(value) || 0);

const localDate = d => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const addDays = n => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return localDate(d);
};

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function showLoginMessage(message, type = "error") {
  const el = document.querySelector("#loginMessage");
  if (el) {
    el.className = `message ${type}`;
    el.textContent = message;
  }
}

function showDashboardMessage(message, type = "info") {
  const el = document.querySelector("#dashboardMessage");
  if (el) {
    el.className = `message ${type}`;
    el.textContent = message;
  }
}

// ==========================================
// HAIRCUT COLLECTION
// ==========================================

const defaultServices = [
  {
    id: "low-fade",
    name: "Low Fade",
    description: "A clean, subtle fade with a sharp finish.",
    price: 3000,
    image: "https://images.pexels.com/photos/12706272/pexels-photo-12706272.jpeg"
  },
  {
    id: "mid-fade",
    name: "Mid Fade",
    description: "A balanced fade with a clean finish.",
    price: 3500,
    image: "https://images.pexels.com/photos/4625626/pexels-photo-4625626.jpeg"
  },
  {
    id: "burst-fade",
    name: "Burst Fade",
    description: "A stylish curved fade with a textured top.",
    price: 4000,
    image: "https://images.pexels.com/photos/27467943/pexels-photo-27467943.jpeg"
  },
  {
    id: "afro-shape-up",
    name: "Afro Shape-up",
    description: "A neat outline that keeps your natural style.",
    price: 2500,
    image: "https://images.pexels.com/photos/16098668/pexels-photo-16098668.jpeg"
  },
  {
    id: "waves-line-up",
    name: "Waves & Line-up",
    description: "Defined waves with a crisp hairline.",
    price: 3000,
    image: "https://images.pexels.com/photos/7781848/pexels-photo-7781848.jpeg"
  },
  {
    id: "haircut-beard",
    name: "Haircut + Beard",
    description: "A fresh haircut with a neatly shaped beard.",
    price: 5000,
    image: "https://images.pexels.com/photos/12074386/pexels-photo-12074386.jpeg"
  }
];

// ==========================================
// LOCAL SERVICES AND EXPENSES
// ==========================================

function loadLocalState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    return {
      services: defaultServices.map(service => {
        const old = saved?.services?.find(s => s.id === service.id);

        return {
          ...service,
          price: Number(old?.price ?? service.price)
        };
      }),

      expenses: Array.isArray(saved?.expenses)
        ? saved.expenses
        : []
    };
  } catch (error) {
    console.error("Local data could not be loaded:", error);

    return {
      services: defaultServices.map(s => ({ ...s })),
      expenses: []
    };
  }
}

let state = loadLocalState();

function saveLocalState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Could not save local data:", error);
  }
}

function serviceFor(id) {
  return state.services.find(s => String(s.id) === String(id)) || null;
}

function normalizeServiceName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

// Match a Supabase service name to the correct local haircut picture.
function getServiceImage(serviceName) {
  const normalizedName = normalizeServiceName(serviceName);

  const matchingDefault = defaultServices.find(service =>
    normalizeServiceName(service.name) === normalizedName
  );

  if (matchingDefault) {
    return matchingDefault.image;
  }

  // Extra name matching for common service-name variations.
  const aliases = {
    "low taper": "Low Fade",
    "low taper fade": "Low Fade",
    "low fade haircut": "Low Fade",
    "mid taper": "Mid Fade",
    "mid taper fade": "Mid Fade",
    "mid fade haircut": "Mid Fade",
    "burst mid fade": "Burst Fade",
    "burst fade haircut": "Burst Fade",
    "afro shape up": "Afro Shape-up",
    "afro": "Afro Shape-up",
    "waves and line up": "Waves & Line-up",
    "waves line up": "Waves & Line-up",
    "haircut beard": "Haircut + Beard",
    "fade cut beard": "Haircut + Beard"
  };

  const aliasName = aliases[normalizedName];

  if (aliasName) {
    const aliasMatch = defaultServices.find(service =>
      normalizeServiceName(service.name) === normalizeServiceName(aliasName)
    );

    if (aliasMatch) {
      return aliasMatch.image;
    }
  }

  return defaultServices[0].image;
}

async function loadServicesFromSupabase() {
  const { data, error } = await db
    .from("services")
    .select("id, name, description, price");

  if (error) throw error;

  const savedServices = Array.isArray(data) ? data : [];

  if (savedServices.length) {
    state.services = savedServices.map(row => {
      const matchingDefault = defaultServices.find(
        item => normalizeServiceName(item.name) === normalizeServiceName(row.name)
      );

      return {
        id: String(row.id),
        databaseId: row.id,
        name: row.name,
        description: row.description || matchingDefault?.description || "",
        price: Number(row.price) || 0,
        image: getServiceImage(row.name)
      };
    });
  } else {
    state.services = defaultServices.map(service => ({
      ...service,
      databaseId: null
    }));
  }

  renderServices();
}

// ==========================================
// HAIRCUT GALLERY
// ==========================================

function renderServices() {
  const grid = document.querySelector("#serviceGrid");
  const select = document.querySelector("#serviceSelect");

  if (grid) {
    grid.innerHTML = state.services.map(s => `
      <article class="service-card">
        <div class="service-image-wrap">
          <img
            class="service-image"
            src="${esc(s.image)}"
            alt="${esc(s.name)} haircut example"
            loading="lazy"
            onerror="this.style.display='none'; this.parentElement.classList.add('image-failed');"
          >
          <span class="image-label">BARBERPRO STYLE</span>
        </div>

        <div class="service-content">
          <div class="service-title-row">
            <h3>${esc(s.name)}</h3>
            <span class="price">${naira(s.price)}</span>
          </div>

          <p>${esc(s.description)}</p>

          <button
            type="button"
            class="choose-btn"
            data-pick="${esc(s.id)}"
          >
            BOOK THIS CUT
          </button>
        </div>
      </article>
    `).join("");
  }

  if (!select) return;

  const previousValue = select.value;

  select.innerHTML =
    '<option value="">Choose a haircut</option>' +
    state.services.map(s => `
      <option value="${esc(s.id)}">
        ${esc(s.name)} — ${naira(s.price)}
      </option>
    `).join("");

  if (state.services.some(s => s.id === previousValue)) {
    select.value = previousValue;
  }

  updateSelectedPrice();
}

function updateSelectedPrice() {
  const select = document.querySelector("#serviceSelect");
  const price = document.querySelector("#selectedPrice");

  if (!price) return;

  const service = select ? serviceFor(select.value) : null;

  price.textContent = service
    ? naira(service.price)
    : naira(0);
}

// ==========================================
// PAGE NAVIGATION
// ==========================================

function showView(view) {
  const customerView = document.querySelector("#customerView");
  const adminView = document.querySelector("#adminView");

  if (!customerView || !adminView) return;

  customerView.classList.toggle("hidden", view !== "customer");
  adminView.classList.toggle("hidden", view !== "admin");

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.view === view
    );
  });

  if (view === "admin") {
    showAdminScreen();
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click", () => {
    showView(button.dataset.view);
  });
});

// ==========================================
// PASSWORD RECOVERY INTERFACE
// ==========================================

function installPasswordRecoveryUI() {
  const loginForm = document.querySelector("#adminLoginForm");

  if (!loginForm || document.querySelector("#forgotPasswordButton")) {
    return;
  }

  const forgotButton = document.createElement("button");

  forgotButton.type = "button";
  forgotButton.id = "forgotPasswordButton";
  forgotButton.textContent = "Forgot password?";
  forgotButton.className = "text-button";

  forgotButton.style.cssText =
    "display:block;margin-top:12px;background:none;border:0;padding:8px 0;color:inherit;text-decoration:underline;cursor:pointer;";

  loginForm.appendChild(forgotButton);

  const recoveryForm = document.createElement("form");

  recoveryForm.id = "passwordRecoveryForm";
  recoveryForm.className = loginForm.className;
  recoveryForm.style.display = "none";

  recoveryForm.innerHTML = `
    <h3 id="recoveryHeading">Reset your password</h3>

    <p class="section-intro" id="recoveryInstructions">
      Enter your admin email. Supabase will send a one-time code.
    </p>

    <label for="recoveryEmail">Admin email</label>
    <input
      id="recoveryEmail"
      type="email"
      autocomplete="email"
      required
    >

    <div id="recoveryOtpFields" style="display:none">
      <label for="recoveryToken">Email verification code</label>
      <input
        id="recoveryToken"
        type="text"
        inputmode="numeric"
        autocomplete="one-time-code"
        maxlength="8"
        placeholder="Enter the code from your email"
      >
    </div>

    <div id="newPasswordFields" style="display:none">
      <label for="newAdminPassword">New password</label>
      <input
        id="newAdminPassword"
        type="password"
        minlength="8"
        autocomplete="new-password"
      >

      <label for="confirmAdminPassword">Confirm new password</label>
      <input
        id="confirmAdminPassword"
        type="password"
        minlength="8"
        autocomplete="new-password"
      >
    </div>

    <button
      class="primary-btn"
      id="recoverySubmitButton"
      type="submit"
    >
      SEND VERIFICATION CODE
    </button>

    <button
      type="button"
      id="backToLoginButton"
      class="text-button"
      style="display:block;margin-top:12px;background:none;border:0;padding:8px 0;color:inherit;text-decoration:underline;cursor:pointer"
    >
      Back to login
    </button>

    <p
      id="recoveryMessage"
      class="message"
      role="status"
      aria-live="polite"
    ></p>
  `;

  loginForm.insertAdjacentElement("afterend", recoveryForm);

  forgotButton.addEventListener("click", () => {
    loginForm.style.display = "none";
    recoveryForm.style.display = "block";
    recoveryForm.dataset.mode = "request";

    const emailInput = document.querySelector("#recoveryEmail");

    emailInput.style.display = "";
    emailInput.required = true;
    emailInput.readOnly = false;

    emailInput.value =
      document.querySelector("#adminEmail")?.value.trim() || "";

    document.querySelector(
      'label[for="recoveryEmail"]'
    ).style.display = "";

    document.querySelector("#recoveryOtpFields").style.display = "none";
    document.querySelector("#recoveryToken").required = false;
    document.querySelector("#recoveryToken").value = "";

    document.querySelector("#newPasswordFields").style.display = "none";

    document.querySelector("#recoveryHeading").textContent =
      "Reset your password";

    document.querySelector("#recoveryInstructions").textContent =
      "Enter your admin email. Supabase will send a one-time verification code.";

    document.querySelector("#recoverySubmitButton").textContent =
      "SEND VERIFICATION CODE";

    setRecoveryMessage("", "info");
  });

  document.querySelector("#backToLoginButton").addEventListener("click", () => {
    recoveryMode = false;
    recoveryForm.style.display = "none";
    loginForm.style.display = "";
    setRecoveryMessage("", "info");
  });

  recoveryForm.addEventListener(
    "submit",
    handlePasswordRecoverySubmit
  );
}

function setRecoveryMessage(message, type = "error") {
  const el = document.querySelector("#recoveryMessage");

  if (el) {
    el.className = `message ${type}`;
    el.textContent = message;
  }
}

// ==========================================
// PASSWORD RECOVERY SUBMISSION
// ==========================================

async function handlePasswordRecoverySubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const mode = form.dataset.mode || "request";

  const email =
    document.querySelector("#recoveryEmail").value.trim();

  const button =
    document.querySelector("#recoverySubmitButton");

  button.disabled = true;

  setRecoveryMessage(
    mode === "request"
      ? "Requesting a verification code..."
      : mode === "verify"
        ? "Verifying your code..."
        : "Updating your password...",
    "info"
  );

  try {

    if (mode === "request") {

      if (!email) {
        throw new Error("Enter your admin email address.");
      }

      const { error } = await db.auth.resetPasswordForEmail(email);

      if (error) throw error;

      form.dataset.mode = "verify";

      document.querySelector("#recoveryEmail").readOnly = true;
      document.querySelector("#recoveryOtpFields").style.display = "block";
      document.querySelector("#recoveryToken").required = true;

      document.querySelector("#recoveryHeading").textContent =
        "Enter your verification code";

      document.querySelector("#recoveryInstructions").textContent =
        "Check your email for the one-time code, then enter it below. Do not click an old reset link.";

      button.textContent = "VERIFY CODE";

      setRecoveryMessage(
        "If this email belongs to an account, Supabase will send a verification code. Check your inbox and spam folder.",
        "success"
      );

    } else if (mode === "verify") {

      const token =
        document.querySelector("#recoveryToken").value.trim();

      if (!token) {
        throw new Error("Enter the verification code from your email.");
      }

      recoveryMode = true;

      const { data, error } = await db.auth.verifyOtp({
        email,
        token,
        type: "recovery"
      });

      if (error) {
        recoveryMode = false;
        throw error;
      }

      currentSession = data.session;

      if (!currentSession) {
        recoveryMode = false;
        throw new Error(
          "The code was accepted but no recovery session was returned. Please try again."
        );
      }

      activatePasswordUpdateMode();

      setRecoveryMessage(
        "Code verified. You can now choose a new password.",
        "success"
      );

    } else if (mode === "update") {

      const password =
        document.querySelector("#newAdminPassword").value;

      const confirm =
        document.querySelector("#confirmAdminPassword").value;

      if (password.length < 8) {
        throw new Error("Use a password with at least 8 characters.");
      }

      if (password !== confirm) {
        throw new Error("The two passwords do not match.");
      }

      const { error } = await db.auth.updateUser({
        password
      });

      if (error) throw error;

      setRecoveryMessage(
        "Your password has been changed. You can now sign in using your new password.",
        "success"
      );

      document.querySelector("#newAdminPassword").value = "";
      document.querySelector("#confirmAdminPassword").value = "";

      recoveryMode = false;

      await db.auth.signOut();

      currentSession = null;

      setTimeout(() => {
        form.style.display = "none";

        const login = document.querySelector("#adminLoginForm");

        if (login) {
          login.style.display = "";
        }

        showAdminScreen();
      }, 1800);
    }

  } catch (error) {

    console.error("Password recovery error:", error);

    if (mode === "verify") {
      recoveryMode = false;
    }

    setRecoveryMessage(
      error.message || "Password recovery failed. Please try again."
    );

  } finally {

    button.disabled = false;

  }
}

// ==========================================
// ACTIVATE NEW PASSWORD FORM
// ==========================================

function activatePasswordUpdateMode() {

  recoveryMode = true;

  const loginForm =
    document.querySelector("#adminLoginForm");

  const recoveryForm =
    document.querySelector("#passwordRecoveryForm");

  if (!loginForm || !recoveryForm) return;

  loginForm.style.display = "none";
  recoveryForm.style.display = "block";
  recoveryForm.dataset.mode = "update";

  const emailInput =
    document.querySelector("#recoveryEmail");

  emailInput.required = false;
  emailInput.style.display = "none";

  document.querySelector(
    'label[for="recoveryEmail"]'
  ).style.display = "none";

  document.querySelector("#recoveryOtpFields").style.display = "none";
  document.querySelector("#recoveryToken").required = false;
  document.querySelector("#newPasswordFields").style.display = "block";

  document.querySelector("#recoveryHeading").textContent =
    "Choose a new password";

  document.querySelector("#recoveryInstructions").textContent =
    "Your email code is verified. Enter and confirm your new password.";

  document.querySelector("#recoverySubmitButton").textContent =
    "SAVE NEW PASSWORD";

  setRecoveryMessage("", "info");
}

// ==========================================
// ADMIN LOGIN
// ==========================================

document.querySelector("#adminLoginForm")?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    const email =
      document.querySelector("#adminEmail").value.trim();

    const password =
      document.querySelector("#adminPassword").value;

    const button =
      event.target.querySelector('[type="submit"]');

    button.disabled = true;

    showLoginMessage("Signing in securely...", "info");

    try {

      const { data, error } = await db.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user?.id !== ADMIN_USER_ID) {
        await db.auth.signOut();
        throw new Error("This account does not have BarberPro administrator access.");
      }

      currentSession = data.session;
      recoveryMode = false;

      document.querySelector("#adminPassword").value = "";

      showLoginMessage("", "success");
      showAdminScreen();

    } catch (error) {

      console.error("Login error:", error);

      showLoginMessage(
        error.message || "Login failed. Check your email and password."
      );

    } finally {

      button.disabled = false;

    }

  }
);

// ==========================================
// ADMIN SCREEN DISPLAY
// ==========================================

function showAdminScreen() {

  const login =
    document.querySelector("#adminLogin");

  const dashboard =
    document.querySelector("#dashboardContent");

  if (!login || !dashboard) return;

  if (recoveryMode) {
    login.classList.remove("hidden");
    dashboard.classList.add("hidden");
    return;
  }

  const signedIn = Boolean(currentSession);

  login.classList.toggle("hidden", signedIn);
  dashboard.classList.toggle("hidden", !signedIn);

  if (signedIn) {
    loadDashboardData();
  }
}

// ==========================================
// AUTHENTICATION STATE CHANGES
// ==========================================

function registerAuthStateListener() {

  db.auth.onAuthStateChange((event, session) => {

    if (event === "PASSWORD_RECOVERY") {
      currentSession = session;
      recoveryMode = true;
      activatePasswordUpdateMode();
      showView("admin");
      return;
    }

    if (session && session.user?.id !== ADMIN_USER_ID) {
      currentSession = null;
      recoveryMode = false;
      showAdminScreen();
      showLoginMessage(
        "This account does not have BarberPro administrator access.",
        "error"
      );
      window.setTimeout(() => {
        db.auth.signOut().catch(error => console.error("Sign-out error:", error));
      }, 0);
      return;
    }

    currentSession = session;

    if (event === "SIGNED_OUT") {
      recoveryMode = false;
    }

    const adminView =
      document.querySelector("#adminView");

    if (
      adminView &&
      !adminView.classList.contains("hidden") &&
      !recoveryMode
    ) {
      showAdminScreen();
    }

  });

}

// ==========================================
// LOGOUT
// ==========================================

document.querySelector("#logoutButton")?.addEventListener(
  "click",
  async () => {

    const { error } = await db.auth.signOut();

    if (error) {
      showDashboardMessage(error.message, "error");
      return;
    }

    currentSession = null;
    databaseBookings = [];
    databaseCustomers = [];
    databaseExpenses = [];
    recoveryMode = false;

    showAdminScreen();

    showDashboardMessage(
      "You have signed out.",
      "success"
    );

  }
);

// ==========================================
// LOAD REAL SUPABASE DASHBOARD DATA
// ==========================================

async function loadDashboardData() {

  if (!currentSession || recoveryMode) return;

  showDashboardMessage(
    "Loading dashboard records from Supabase...",
    "info"
  );

  try {

    const {
      data: appointments,
      error: appointmentError
    } = await db
      .from("appointments")
      .select(
        "id, customer_id, service_name, appointment_date, appointment_time, price, status, created_at"
      )
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (appointmentError) throw appointmentError;

    databaseBookings = appointments || [];

    const customerIds = [
      ...new Set(
        databaseBookings
          .map(b => b.customer_id)
          .filter(Boolean)
      )
    ];

    if (customerIds.length) {

      const {
        data: customers,
        error: customerError
      } = await db
        .from("customers")
        .select("id, full_name, phone, created_at")
        .in("id", customerIds);

      if (customerError) throw customerError;

      databaseCustomers = customers || [];

    } else {

      databaseCustomers = [];

    }

    const {
      data: expenses,
      error: expenseError
    } = await db
      .from("expenses")
      .select("id, description, amount, expense_date, created_at")
      .order("expense_date", { ascending: false });

    if (expenseError) throw expenseError;

    databaseExpenses = expenses || [];

    await loadServicesFromSupabase();

    showDashboardMessage(
      "Dashboard connected. Your records are up to date.",
      "success"
    );

    renderDashboard();

  } catch (error) {

    console.error("Dashboard loading error:", error);

    showDashboardMessage(
      error.message || "Could not load dashboard records.",
      "error"
    );

  }

}

// ==========================================
// DASHBOARD DISPLAY
// ==========================================

function getCustomer(booking) {

  return databaseCustomers.find(
    c => c.id === booking.customer_id
  ) || {
    full_name: "Customer",
    phone: "Not available"
  };

}

function renderDashboard() {

  if (!currentSession || recoveryMode) return;

  const dateInput =
    document.querySelector("#dashboardDate");

  const date =
    dateInput?.value || localDate(new Date());

  const dayBookings = databaseBookings.filter(
    b => b.appointment_date === date
  );

  const dayExpenses = databaseExpenses.filter(
    expense => expense.expense_date === date
  );

  const sales = dayBookings
    .filter(
      b => String(b.status).toLowerCase() === "completed"
    )
    .reduce(
      (sum, b) => sum + Number(b.price || 0),
      0
    );

  const expenses = dayExpenses.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  );

  const setText = (selector, value) => {
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  };

  setText("#statBookings", dayBookings.length);
  setText("#statSales", naira(sales));
  setText("#statExpenses", naira(expenses));
  setText("#statNet", naira(sales - expenses));

  const tbody =
    document.querySelector("#appointmentsBody");

  if (tbody) {

    tbody.innerHTML = dayBookings.length

      ? dayBookings.map(booking => {

          const customer = getCustomer(booking);

          const status = String(
            booking.status || "pending"
          ).toLowerCase();

          return `
            <tr>
              <td>
                <strong>${esc(customer.full_name)}</strong>
                <br>
                <small class="muted">${esc(customer.phone)}</small>
              </td>

              <td>${esc(booking.service_name)}</td>
              <td>${esc(booking.appointment_time)}</td>
              <td>${naira(booking.price)}</td>

              <td>
                <select
                  class="status-select"
                  data-status="${esc(booking.id)}"
                  aria-label="Appointment status"
                >
                  ${
                    [
                      ["pending", "Pending"],
                      ["confirmed", "Confirmed"],
                      ["in_progress", "In Progress"],
                      ["completed", "Completed"],
                      ["cancelled", "Cancelled"]
                    ].map(([value, label]) => `
                      <option
                        value="${value}"
                        ${status === value ? "selected" : ""}
                      >
                        ${label}
                      </option>
                    `).join("")
                  }
                </select>
              </td>
            </tr>
          `;

        }).join("")

      : `
        <tr>
          <td colspan="5" class="empty">
            No appointments for this date.
          </td>
        </tr>
      `;

  }

  const adminServices =
    document.querySelector("#adminServices");

  if (adminServices) {

    adminServices.innerHTML = state.services.map(service => `
      <div class="admin-service-row">
        <div>
          <strong>${esc(service.name)}</strong>
          <small>${esc(service.description)}</small>
        </div>

        <label>
          <span class="muted">Price ₦</span>

          <input
            type="number"
            min="0"
            step="100"
            value="${Number(service.price)}"
            data-price="${esc(service.id)}"
            aria-label="Price for ${esc(service.name)}"
          >
        </label>
      </div>
    `).join("");

  }

  const expenseList =
    document.querySelector("#expenseList");

  if (expenseList) {

    expenseList.innerHTML = dayExpenses.length

      ? dayExpenses.map(expense => `
          <div class="expense-row">
            <span>${esc(expense.description)}</span>
            <strong>${naira(expense.amount)}</strong>
          </div>
        `).join("")

      : `
        <p class="form-note">
          No expenses recorded for this day.
        </p>
      `;

  }

  setText(
    "#customerCount",
    `${databaseCustomers.length} customer${databaseCustomers.length === 1 ? "" : "s"}`
  );

  const customerList =
    document.querySelector("#customerList");

  if (customerList) {

    customerList.innerHTML = databaseCustomers.length

      ? databaseCustomers.map(customer => {

          const visits = databaseBookings.filter(
            b => b.customer_id === customer.id
          ).length;

          return `
            <div class="customer-item">
              <div>
                <strong>${esc(customer.full_name)}</strong>
                <small>${esc(customer.phone)}</small>
              </div>

              <span class="count">
                ${visits} visit${visits === 1 ? "" : "s"}
              </span>
            </div>
          `;

        }).join("")

      : `
        <p class="empty">
          No customers found.
        </p>
      `;

  }

}

document.querySelector("#dashboardDate")?.addEventListener(
  "change",
  renderDashboard
);

// ==========================================
// UPDATE APPOINTMENT STATUS IN SUPABASE
// ==========================================

document.querySelector("#appointmentsBody")?.addEventListener(
  "change",
  async event => {

    const id = event.target.dataset.status;

    if (!id || !currentSession) return;

    const newStatus = event.target.value;

    const booking = databaseBookings.find(
      b => b.id === id
    );

    if (!booking) return;

    const oldStatus = booking.status;

    event.target.disabled = true;

    showDashboardMessage(
      "Updating appointment...",
      "info"
    );

    try {

      const { error } = await db
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      booking.status = newStatus;

      showDashboardMessage(
        "Appointment status updated successfully.",
        "success"
      );

      renderDashboard();

    } catch (error) {

      console.error("Status update error:", error);

      booking.status = oldStatus;

      showDashboardMessage(
        error.message || "Could not update appointment status.",
        "error"
      );

      renderDashboard();

    }

  }
);

// ==========================================
// HAIRCUT CARD SELECTION
// ==========================================

document.addEventListener("click", event => {

  const button = event.target.closest("[data-pick]");

  if (!button) return;

  const select =
    document.querySelector("#serviceSelect");

  const service =
    serviceFor(button.dataset.pick);

  if (select && service) {

    select.value = service.id;

    updateSelectedPrice();

    document.querySelector("#bookingForm")?.scrollIntoView({
      behavior: "smooth"
    });

  }

});

document.querySelector("#serviceSelect")?.addEventListener(
  "change",
  updateSelectedPrice
);

// ==========================================
// BOOKING DATE SETUP
// ==========================================

const bookingDateInput =
  document.querySelector("#bookingDate");

if (bookingDateInput) {
  bookingDateInput.min = localDate(new Date());
  bookingDateInput.value = addDays(1);
}

const dashboardDateInput =
  document.querySelector("#dashboardDate");

if (dashboardDateInput) {
  dashboardDateInput.value = localDate(new Date());
}

// ==========================================
// CUSTOMER BOOKING SUBMISSION
// ==========================================

document.querySelector("#bookingForm")?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    const form = event.target;

    const name =
      document.querySelector("#customerName").value.trim();

    const phone =
      document.querySelector("#customerPhone").value.trim();

    const date =
      document.querySelector("#bookingDate").value;

    const time =
      document.querySelector("#bookingTime").value;

    const notes =
      document.querySelector("#bookingNotes").value.trim();

    const service = serviceFor(
      document.querySelector("#serviceSelect").value
    );

    const message =
      document.querySelector("#bookingMessage");

    const button =
      form.querySelector('[type="submit"]');

    const showMessage = (type, text) => {
      if (!message) return;
      message.className = `message ${type}`;
      message.textContent = text;
    };

    if (!name || !phone || !date || !time || !service) {
      showMessage(
        "error",
        "Please complete all required fields."
      );
      return;
    }

    if (date < localDate(new Date())) {
      showMessage(
        "error",
        "Please choose today or a future date."
      );
      return;
    }

    button.disabled = true;

    showMessage(
      "info",
      "Submitting your booking securely..."
    );

    try {

      const response = await fetch(SUPABASE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          phone,
          service_name: service.name,
          date,
          time,
          price: Number(service.price),
          notes
        })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
          result.message ||
          "Booking could not be submitted."
        );
      }

      showMessage(
        "success",
        `Your ${service.name} booking for ${date} at ${time} has been submitted.`
      );

      form.reset();

      if (bookingDateInput) {
        bookingDateInput.min = localDate(new Date());
        bookingDateInput.value = addDays(1);
      }

      updateSelectedPrice();

      if (currentSession) {
        await loadDashboardData();
      }

    } catch (error) {

      console.error("Booking error:", error);

      showMessage(
        "error",
        error.message || "Booking failed. Please try again."
      );

    } finally {

      button.disabled = false;

    }

  }
);

// ==========================================
// EDIT SERVICE PRICES (SAVED IN SUPABASE)
// ==========================================

document.querySelector("#adminServices")?.addEventListener(
  "change",
  async event => {

    const id = event.target.dataset.price;

    if (!id || !currentSession) return;

    const service = serviceFor(id);

    if (!service) return;

    const newPrice = Number(event.target.value);

    if (!Number.isFinite(newPrice) || newPrice < 0) {
      showDashboardMessage("Enter a valid service price.", "error");
      renderDashboard();
      return;
    }

    const input = event.target;
    input.disabled = true;

    showDashboardMessage("Saving service price...", "info");

    try {

      let saveResult;

      if (service.databaseId) {

        saveResult = await db
          .from("services")
          .update({
            price: newPrice,
            description: service.description
          })
          .eq("id", service.databaseId)
          .select("id")
          .single();

      } else {

        saveResult = await db
          .from("services")
          .insert({
            name: service.name,
            description: service.description,
            price: newPrice
          })
          .select("id")
          .single();

      }

      if (saveResult.error) throw saveResult.error;

      service.price = newPrice;
      service.databaseId = saveResult.data.id;

      showDashboardMessage(
        "Service price saved successfully.",
        "success"
      );

      await loadServicesFromSupabase();
      await loadDashboardData();

    } catch (error) {

      console.error("Service price save error:", error);

      showDashboardMessage(
        error.message || "Could not save the service price.",
        "error"
      );

      await loadDashboardData();

    } finally {

      input.disabled = false;

    }

  }
);

// ==========================================
// RECORD EXPENSES (SAVED IN SUPABASE)
// ==========================================

document.querySelector("#expenseForm")?.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    if (!currentSession) {
      showDashboardMessage(
        "Please sign in before recording an expense.",
        "error"
      );
      return;
    }

    const form = event.currentTarget;

    const name =
      document.querySelector("#expenseName").value.trim();

    const amount =
      Number(document.querySelector("#expenseAmount").value);

    const date =
      document.querySelector("#dashboardDate").value ||
      localDate(new Date());

    const button = form.querySelector('[type="submit"]');

    if (!name || !Number.isFinite(amount) || amount <= 0) {
      showDashboardMessage(
        "Enter an expense description and a valid amount.",
        "error"
      );
      return;
    }

    if (button) button.disabled = true;

    showDashboardMessage("Saving expense...", "info");

    try {

      const { data, error } = await db
        .from("expenses")
        .insert({
          description: name,
          amount,
          expense_date: date
        })
        .select("id, description, amount, expense_date, created_at")
        .single();

      if (error) throw error;

      databaseExpenses.unshift(data);

      form.reset();

      showDashboardMessage(
        "Expense saved successfully.",
        "success"
      );

      renderDashboard();

    } catch (error) {

      console.error("Expense save error:", error);

      showDashboardMessage(
        error.message || "Could not save the expense.",
        "error"
      );

    } finally {

      if (button) button.disabled = false;

    }

  }
);

// ==========================================
// START BARBERPRO
// ==========================================

async function startBarberPro() {

  try {
    await loadServicesFromSupabase();
  } catch (error) {
    console.error("Public service loading error:", error);
    renderServices();
  }

  installPasswordRecoveryUI();

  registerAuthStateListener();

  try {

    const { data, error } = await db.auth.getSession();

    if (error) throw error;

    if (data.session && data.session.user?.id !== ADMIN_USER_ID) {
      await db.auth.signOut();
      currentSession = null;
      showLoginMessage(
        "This account does not have BarberPro administrator access.",
        "error"
      );
    } else {
      currentSession = data.session;
    }

    recoveryMode = false;
    showAdminScreen();

  } catch (error) {

    console.error("BarberPro startup error:", error);

    showLoginMessage(
      "Could not verify your login session. Please refresh the page.",
      "error"
    );

  }

}

startBarberPro();
