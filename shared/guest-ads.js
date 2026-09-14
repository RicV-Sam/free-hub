import { getFirebaseClient } from "./firebase-client.js";

const state = {
  auth: "pending",
  signInInProgress: false,
  scriptsInjected: false,
  reloadScheduled: false,
};


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

// Retained auth hooks support existing account and outbound handoff callers.
// Advertising is now installed directly in the page head by Mediavine.
function injectProviderScripts() {}
function removeProviderScripts() {}

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
