const STORAGE_KEY = "website-collection-language";
const config = window.SUPABASE_CONFIG || {};
const hasSupabaseConfig = Boolean(
  window.supabase
  && /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.url || "")
  && config.anonKey
  && config.anonKey !== "******",
);
const supabaseClient = hasSupabaseConfig
  ? window.supabase.createClient(config.url, config.anonKey)
  : null;
const authCard = document.querySelector("#auth-card");
const authForm = document.querySelector("#auth-form");
const authSubmit = document.querySelector("#auth-submit");
const authModeToggle = document.querySelector("#auth-mode-toggle");
const authMessage = document.querySelector("#auth-message");
const userBar = document.querySelector("#user-bar");
const userEmail = document.querySelector("#user-email");
const signOut = document.querySelector("#sign-out");
const appContent = document.querySelector("#app-content");
const form = document.querySelector("#add-form");
const input = document.querySelector("#url-input");
const message = document.querySelector("#form-message");
const collection = document.querySelector("#collection");
const emptyState = document.querySelector("#empty-state");
const count = document.querySelector("#count");
const searchInput = document.querySelector("#search-input");
const toast = document.querySelector("#toast");
const languageToggle = document.querySelector("#language-toggle");
const themeToggle = document.querySelector("#theme-toggle");
const THEME_STORAGE_KEY = "website-collection-theme";

const translations = {
  zh: {
    pageTitle: "我的网站收藏", description: "一个简洁的个人网站收藏夹", eyebrow: "PERSONAL COLLECTION",
    account: "ACCOUNT", authTitle: "登录你的收藏", emailLabel: "邮箱", passwordLabel: "密码",
    login: "登录", signUp: "注册新账号", signOut: "退出登录",
    heroStart: "把喜欢的网站，", heroEnd: "收集起来。", subtitle: "保存灵感、工具和每天都会用到的网站。",
    newLink: "NEW LINK", addTitle: "添加一个网站", urlLabel: "网站地址", placeholder: "粘贴网址，例如 apple.com",
    addButton: "添加收藏", library: "YOUR LIBRARY", myCollection: "我的收藏", searchLabel: "搜索收藏",
    searchPlaceholder: "搜索", emptyTitle: "这里还没有收藏", emptyText: "从上方添加第一个网站，开始建立你的网络书签。",
    noResults: "没有找到匹配的网站", noResultsText: "试试其他关键词。", open: "打开网站 ↗",
    copy: "复制网址", delete: "删除", invalid: "请输入正确的网址，例如 https://apple.com",
    duplicate: "这个网站已经在你的收藏里了。", added: "已添加到收藏", copied: "网址已复制", copyFailed: "复制失败，请手动复制网址", deleted: "已删除收藏",
    themeLabel: "切换深色模式",
  },
  en: {
    pageTitle: "My Website Collection", description: "A simple personal website collection", eyebrow: "PERSONAL COLLECTION",
    account: "ACCOUNT", authTitle: "Sign in to your collection", emailLabel: "Email", passwordLabel: "Password",
    login: "Sign in", signUp: "Create an account", signOut: "Sign out",
    heroStart: "Collect the websites ", heroEnd: "you love.", subtitle: "Save inspiration, tools, and the websites you use every day.",
    newLink: "NEW LINK", addTitle: "Add a website", urlLabel: "Website URL", placeholder: "Paste a URL, e.g. apple.com",
    addButton: "Add bookmark", library: "YOUR LIBRARY", myCollection: "My collection", searchLabel: "Search bookmarks",
    searchPlaceholder: "Search", emptyTitle: "No bookmarks yet", emptyText: "Add your first website above to start building your collection.",
    noResults: "No matching websites", noResultsText: "Try another search term.", open: "Open website ↗",
    copy: "Copy URL", delete: "Delete", invalid: "Please enter a valid URL, e.g. https://apple.com",
    duplicate: "This website is already in your collection.", added: "Added to your collection", copied: "URL copied", copyFailed: "Copy failed. Please copy the URL manually.", deleted: "Bookmark deleted",
    themeLabel: "Toggle dark mode",
  },
};

let language = readStorage(STORAGE_KEY)
  || (navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en");
const t = (key) => translations[language][key];

let sites = [];
let currentUser = null;
let isSignUp = false;
function readStorage(key, fallback = "") {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private browsing and file URLs may not allow persistent storage.
  }
}

function normalizeUrl(value) {
  const cleaned = value.trim();
  const withProtocol = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
  const url = new URL(withProtocol);
  if (!["http:", "https:"].includes(url.protocol) || !url.hostname) throw new Error("invalid");
  return url;
}


async function loadSites() {
  const { data, error } = await supabaseClient.from("sites").select("id, name, url").order("created_at", { ascending: false });
  if (error) throw error;
  sites = data || [];
  render();
}

function displayName(url) {
  return url.hostname.replace(/^www\./, "");
}

function faviconUrl(siteUrl) {
  try {
    return `${new URL(siteUrl).origin}/favicon.ico`;
  } catch {
    return "";
  }
}

function render() {
  const keyword = searchInput.value.trim().toLowerCase();
  const visibleSites = sites.filter((site) =>
    `${site.name} ${site.url}`.toLowerCase().includes(keyword),
  );
  count.textContent = sites.length;
  collection.innerHTML = visibleSites
    .map(
      (site) => `
        <article class="site-card">
          <div class="site-top">
            <div class="site-icon">
              <img src="${escapeHtml(faviconUrl(site.url))}" alt="" loading="lazy" />
              <span>${escapeHtml(site.name.charAt(0).toUpperCase())}</span>
            </div>
            <div>
              <h3 class="site-name" title="${escapeHtml(site.name)}">${escapeHtml(site.name)}</h3>
              <p class="site-url" title="${escapeHtml(site.url)}">${escapeHtml(site.url)}</p>
            </div>
          </div>
          <div class="site-actions">
            <a href="${escapeHtml(site.url)}" target="_blank" rel="noopener noreferrer">${t("open")}</a>
            <button type="button" data-copy="${escapeHtml(site.url)}">${t("copy")}</button>
            <button type="button" class="delete" data-delete="${site.id}">${t("delete")}</button>
          </div>
        </article>`,
    )
    .join("");
  emptyState.hidden = visibleSites.length !== 0;
  if (sites.length && !visibleSites.length) {
    emptyState.hidden = false;
    emptyState.querySelector("h3").textContent = t("noResults");
    emptyState.querySelector("p").textContent = t("noResultsText");
  } else {
    emptyState.querySelector("h3").textContent = t("emptyTitle");
    emptyState.querySelector("p").textContent = t("emptyText");
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[character]));
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function applyLanguage() {
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  document.title = t("pageTitle");
  document.querySelector('meta[name="description"]').content = t("description");
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  input.placeholder = t("placeholder");
  searchInput.placeholder = t("searchPlaceholder");
  document.querySelector("#email-input").placeholder = t("emailLabel");
  document.querySelector("#password-input").placeholder = language === "zh" ? "密码（至少 6 位）" : "Password (6+ characters)";
  authSubmit.textContent = isSignUp ? t("signUp") : t("login");
  authModeToggle.textContent = isSignUp
    ? (language === "zh" ? "已有账号？登录" : "Already have an account? Sign in")
    : t("signUp");
  languageToggle.textContent = language === "zh" ? "EN" : "中文";
  themeToggle.setAttribute("aria-label", t("themeLabel"));
  render();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";
  const value = input.value.trim();
  if (!value) return;
  let url;
  try {
    url = normalizeUrl(value);
  } catch {
    message.textContent = t("invalid");
    return;
  }
  const normalized = url.href.replace(/\/$/, "");
  if (sites.some((site) => site.url === normalized)) {
    message.textContent = t("duplicate");
    return;
  }
  const { data, error } = await supabaseClient.from("sites")
    .insert({ user_id: currentUser.id, name: displayName(url), url: normalized })
    .select("id, name, url")
    .single();
  if (error) {
    message.textContent = error.code === "23505" ? t("duplicate") : error.message;
    return;
  }
  sites.unshift(data);
  form.reset();
  render();
  showToast(t("added"));
});

collection.addEventListener("click", async (event) => {
  const copyButton = event.target.closest("[data-copy]");
  const deleteButton = event.target.closest("[data-delete]");
  if (copyButton) {
    try {
      await navigator.clipboard.writeText(copyButton.dataset.copy);
      showToast(t("copied"));
    } catch {
      message.textContent = t("copyFailed");
    }
  }
  if (deleteButton) {
    const { error } = await supabaseClient.from("sites").delete().eq("id", deleteButton.dataset.delete);
    if (error) {
      showToast(error.message);
      return;
    }
    sites = sites.filter((site) => site.id !== deleteButton.dataset.delete);
    render();
    showToast(t("deleted"));
  }
});

collection.addEventListener("error", (event) => {
  if (event.target instanceof HTMLImageElement && event.target.closest(".site-icon")) {
    event.target.hidden = true;
    event.target.nextElementSibling.hidden = false;
  }
}, true);

searchInput.addEventListener("input", render);
languageToggle.addEventListener("click", () => {
  language = language === "zh" ? "en" : "zh";
  writeStorage(STORAGE_KEY, language);
  applyLanguage();
});

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  writeStorage(THEME_STORAGE_KEY, theme);
}

themeToggle.addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

authModeToggle.addEventListener("click", () => {
  isSignUp = !isSignUp;
  applyLanguage();
  applyTheme(readStorage(THEME_STORAGE_KEY, "system"));
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  authMessage.textContent = "";
  if (!supabaseClient) {
    authMessage.textContent = "请先在 config/config.js 中配置 Supabase 项目。";
    return;
  }
  const email = document.querySelector("#email-input").value.trim();
  const password = document.querySelector("#password-input").value;
  const result = isSignUp
    ? await supabaseClient.auth.signUp({ email, password })
    : await supabaseClient.auth.signInWithPassword({ email, password });
  if (result.error) {
    authMessage.textContent = result.error.message;
    return;
  }
  if (isSignUp && !result.data.session) {
    authMessage.textContent = "注册成功，请检查邮箱并完成验证后登录。";
  }
});

signOut.addEventListener("click", () => supabaseClient?.auth.signOut());

async function updateSession(session) {
  currentUser = session?.user || null;
  authCard.hidden = Boolean(currentUser);
  userBar.hidden = !currentUser;
  appContent.hidden = !currentUser;
  if (currentUser) {
    userEmail.textContent = currentUser.email;
    try {
      await loadSites();
    } catch (error) {
      authMessage.textContent = error.message;
    }
  } else {
    sites = [];
    render();
  }
}

if (supabaseClient) {
  supabaseClient.auth.onAuthStateChange((_event, session) => updateSession(session));
  supabaseClient.auth.getSession().then(({ data }) => updateSession(data.session));
} else {
  authMessage.textContent = "请先在 config/config.js 中配置 Supabase 项目。";
}

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") form.requestSubmit();
});
applyLanguage();
