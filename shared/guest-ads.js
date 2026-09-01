import { getFirebaseClient } from "./firebase-client.js";

const ADSTERRA_NATIVE_BANNER = Object.freeze({
  id: "freehub-adsterra-native-banner",
  format: "native-banner",
  src: "https://pl31128445.profitableratecpmnetwork.com/c58e199012d4b578b7353f3e72a231f7/invoke.js",
  containerId: "container-c58e199012d4b578b7353f3e72a231f7",
});
const ADSTERRA_ARCHIVE_SCRIPTS = Object.freeze([
  Object.freeze({
    id: "freehub-adsterra-archive-popunder",
    format: "archive-popunder",
    src: "https://pl30713595.effectivecpmnetwork.com/51/4f/11/514f11fd1c975eebb82034a3a019787a.js",
  }),
  Object.freeze({
    id: "freehub-adsterra-archive-social-bar",
    format: "archive-social-bar",
    src: "https://pl30713596.effectivecpmnetwork.com/5e/fa/1d/5efa1d12d7d4dfb40f2bf1a6ae3d645f.js",
  }),
]);
const ADSTERRA_SCRIPTS = Object.freeze([
  ADSTERRA_NATIVE_BANNER,
  ...ADSTERRA_ARCHIVE_SCRIPTS,
]);

const state = {
  auth: "pending",
  signInInProgress: false,
  scriptsInjected: false,
  reloadScheduled: false,
};
const requestedSources = new Set();

if (!window.FreeHubGuestAds) {
  window.FreeHubGuestAds = {
    beginSignIn,
    cancelSignIn,
    completeSignIn,
    getState: () => ({ ...state }),
    ready: initialize(),
  };
}

async function initialize() {
  setPublicState("pending");

  let client;
  try {
    client = await getFirebaseClient();
  } catch (error) {
    client = null;
  }

  if (!client) {
    state.auth = "unavailable";
    setPublicState("unavailable");
    return;
  }

  try {
    if (client.isEmailSignInLink?.()) {
      state.signInInProgress = true;
      setPublicState("signing-in");
    }
  } catch (error) {
    state.signInInProgress = true;
    setPublicState("signing-in");
  }

  client.onAuthStateChanged((user) => {
    if (user) {
      state.auth = "member";
      removeProviderScripts();
      if (state.scriptsInjected) {
        setPublicState("reloading-for-member");
        reloadForCleanMemberPage();
      } else {
        setPublicState("member");
      }
      return;
    }

    if (user !== null) {
      state.auth = "unavailable";
      removeProviderScripts();
      setPublicState("unavailable");
      return;
    }

    state.auth = "guest";

    if (state.signInInProgress) {
      setPublicState("signing-in");
      return;
    }

    injectProviderScripts();
    setPublicState("guest");
  });
}

function beginSignIn() {
  state.signInInProgress = true;
  setPublicState("signing-in");
}

function cancelSignIn() {
  state.signInInProgress = false;

  if (state.auth === "guest") {
    injectProviderScripts();
    setPublicState("guest");
  } else if (state.auth === "member" && state.scriptsInjected) {
    setPublicState("reloading-for-member");
    reloadForCleanMemberPage();
  } else {
    setPublicState(state.auth);
  }
}

function completeSignIn() {
  state.signInInProgress = false;
  removeProviderScripts();

  if (state.scriptsInjected) {
    setPublicState("reloading-for-member");
    reloadForCleanMemberPage();
    return true;
  }

  setPublicState("member");
  return false;
}

function injectProviderScripts() {
  const isArchivePage = document.body?.dataset.freehubAdSurface === "archive";

  if (isArchivePage) {
    ADSTERRA_ARCHIVE_SCRIPTS.forEach(injectScriptDefinition);
    state.scriptsInjected = requestedSources.size > 0;
    return;
  }

  const placement = document.querySelector("[data-freehub-ad-slot]");
  const providerContainer = document.getElementById(ADSTERRA_NATIVE_BANNER.containerId);

  if (!placement || !providerContainer) {
    return;
  }

  injectScriptDefinition(ADSTERRA_NATIVE_BANNER);
  state.scriptsInjected = requestedSources.size > 0;
}

function injectScriptDefinition(definition) {
  const parent = document.body || document.head;

  if (requestedSources.has(definition.src)) {
    return;
  }

  const existing = Array.from(document.scripts).find(
    (script) => script.id === definition.id || script.src === definition.src
  );

  if (existing) {
    requestedSources.add(definition.src);
    return;
  }

  const script = document.createElement("script");
  script.id = definition.id;
  script.src = definition.src;
  script.async = true;
  script.dataset.cfasync = "false";
  script.dataset.freehubGuestAd = definition.format;
  requestedSources.add(definition.src);
  parent.appendChild(script);
}

function removeProviderScripts() {
  Array.from(document.scripts).forEach((script) => {
    if (
      ADSTERRA_SCRIPTS.some(
        (definition) => script.id === definition.id || script.src === definition.src
      )
    ) {
      script.remove();
    }
  });
}

function reloadForCleanMemberPage() {
  if (state.reloadScheduled) {
    return true;
  }

  state.reloadScheduled = true;
  window.setTimeout(() => window.location.reload(), 0);
  return true;
}

function setPublicState(value) {
  document.documentElement.dataset.freehubAdState = value;
  window.dispatchEvent(
    new CustomEvent("freehub:guest-ads-state", {
      detail: { state: value },
    })
  );
}
