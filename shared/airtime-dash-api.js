import { getFirebaseClient } from "./firebase-client.js?v=20260917-account-save-v2";
let promise;
export function getDashClient() { return promise ||= createClient(); }
async function createClient() {
  const preview = window.FREEHUB_DASH_PREVIEW === true && ["127.0.0.1", "localhost"].includes(location.hostname);
  if (preview) return {
    preview: true, available: true, user: { uid: "preview-player" },
    onAuth: callback => { callback({ uid: "preview-player" }); return () => {}; },
    async call(action, data = {}) {
      const response = await fetch("/__dashapi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, data }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Local game service unavailable.");
      return result;
    },
  };
  const settings = await fetch("/data/airtime-dash.json", { cache: "no-store" }).then(r => r.ok ? r.json() : null).catch(() => null);
  if (!settings?.apiUrl || !settings.turnstileSiteKey || !settings.projectId) return { preview: false, available: false, user: null,
    onAuth: callback => { callback(null); return () => {}; }, call: async () => { throw new Error("Prize entry is not open yet. You can play practice now."); } };
  const firebase = await getFirebaseClient();
  if (!firebase) return { available: false, user: null, onAuth: cb => cb(null), call: async () => { throw new Error("FreeHub sign-in is temporarily unavailable."); } };
  if (firebase.app.options.projectId !== settings.projectId) return { available: false, user: null, onAuth: cb => cb(null), call: async () => { throw new Error("Ranked play is held while its account configuration is checked. Practice remains open."); } };
  const endpoint = new URL(settings.apiUrl);
  if (endpoint.protocol !== "https:" || !endpoint.hostname.endsWith(".workers.dev")) throw new Error("Ranked play is held while its service configuration is checked.");
  return { preview: false, available: true, get user() { return firebase.auth.currentUser; }, onAuth: firebase.onAuthStateChanged,
    async call(action, data = {}) {
      const user = firebase.auth.currentUser, headers = { "Content-Type": "application/json" };
      if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
      const input = { action, data };
      if (action === "session.start" || action === "admin.securityCheck") input.turnstileToken = await securityCheck(settings.turnstileSiteKey);
      const response = await fetch(endpoint.href, { method: "POST", headers, body: JSON.stringify(input), signal: AbortSignal.timeout(12000) });
      let result; try { result = await response.json(); } catch { throw new Error("The game service is unavailable. Your last verified score is saved."); }
      if (!response.ok || result.error) throw new Error(result.error?.message || "The game service is unavailable. Your last verified score is saved.");
      return result.result;
    } };
}
let turnstileLoad;
function securityCheck(sitekey) {
  turnstileLoad ||= new Promise((resolve, reject) => {
    const script = document.createElement("script"); script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true; script.onload = resolve; script.onerror = () => { turnstileLoad = null; reject(new Error("The security check could not load. Please retry.")); }; document.head.append(script);
  });
  return turnstileLoad.then(() => new Promise((resolve, reject) => {
    const container = document.getElementById("dash-security");
    if (!container || !window.turnstile) { reject(new Error("The security check is unavailable.")); return; }
    container.replaceChildren(); let widget;
    const cleanup = () => { clearTimeout(timeout); if (widget !== undefined) window.turnstile.remove(widget); };
    const timeout = setTimeout(() => { cleanup(); reject(new Error("The security check expired. Please start again.")); }, 120000);
    widget = window.turnstile.render(container, { sitekey, action: "dash-start", theme: "auto",
      callback: token => { cleanup(); resolve(token); }, "error-callback": () => { cleanup(); reject(new Error("The security check failed. Please retry.")); },
      "expired-callback": () => { cleanup(); reject(new Error("The security check expired. Please retry.")); } });
  }));
}
