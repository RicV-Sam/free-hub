const FIREBASE_CONFIG_PATH = "/firebase-config.json";
const FIREBASE_SDK_VERSION = "10.12.5";
const REQUIRED_CONFIG_KEYS = ["apiKey", "authDomain", "projectId", "appId"];
const DEFAULT_AUTH_PROVIDERS = ["google", "facebook", "emailLink"];

let firebasePromise;

export async function getFirebaseClient() {
  if (!firebasePromise) {
    firebasePromise = createFirebaseClient().catch((error) => {
      console.warn("Freehub Firebase is unavailable:", error.message);
      return null;
    });
  }

  return firebasePromise;
}

export async function isFirebaseAvailable() {
  return Boolean(await getFirebaseClient());
}

async function createFirebaseClient() {
  const config = await loadFirebaseConfig();

  if (!config) {
    return null;
  }

  const [{ initializeApp, getApps }, authModule, firestoreModule] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore.js`),
  ]);

  const app = getApps().length ? getApps()[0] : initializeApp(config);
  const auth = authModule.getAuth(app);
  const db = firestoreModule.getFirestore(app);

  return {
    app,
    auth,
    db,
    modules: {
      auth: authModule,
      firestore: firestoreModule,
    },
    enabledAuthProviders: getEnabledAuthProviders(config),
    signInWithGoogle: () => signInWithProvider(auth, authModule, "google"),
    signInWithFacebook: () => signInWithProvider(auth, authModule, "facebook"),
    sendEmailSignInLink: (email) => sendEmailSignInLink(auth, authModule, email),
    completeEmailSignIn: (email, href = window.location.href) =>
      authModule.signInWithEmailLink(auth, email, href),
    isEmailSignInLink: (href = window.location.href) => authModule.isSignInWithEmailLink(auth, href),
    signOut: () => authModule.signOut(auth),
    onAuthStateChanged: (callback) => authModule.onAuthStateChanged(auth, callback),
    helpers: buildFirestoreHelpers(db, firestoreModule),
  };
}

async function loadFirebaseConfig() {
  if (window.FREEHUB_FIREBASE_CONFIG && hasRequiredConfig(window.FREEHUB_FIREBASE_CONFIG)) {
    return window.FREEHUB_FIREBASE_CONFIG;
  }

  try {
    const response = await fetch(FIREBASE_CONFIG_PATH, { cache: "no-store" });

    if (!response.ok) {
      return null;
    }

    const config = await response.json();
    return hasRequiredConfig(config) ? config : null;
  } catch (error) {
    return null;
  }
}

function hasRequiredConfig(config) {
  return Boolean(
    config &&
      REQUIRED_CONFIG_KEYS.every((key) => typeof config[key] === "string" && config[key].trim())
  );
}

function getEnabledAuthProviders(config) {
  if (!Array.isArray(config.enabledAuthProviders)) {
    return DEFAULT_AUTH_PROVIDERS;
  }

  return config.enabledAuthProviders
    .map((provider) => String(provider).trim())
    .filter((provider) => DEFAULT_AUTH_PROVIDERS.includes(provider));
}

async function signInWithProvider(auth, authModule, providerName) {
  const provider =
    providerName === "facebook"
      ? new authModule.FacebookAuthProvider()
      : new authModule.GoogleAuthProvider();

  if (providerName === "facebook") {
    provider.addScope("email");
  }

  return authModule.signInWithPopup(auth, provider);
}

function sendEmailSignInLink(auth, authModule, email) {
  const actionCodeSettings = {
    url: window.location.href,
    handleCodeInApp: true,
  };

  return authModule.sendSignInLinkToEmail(auth, email, actionCodeSettings);
}

function buildFirestoreHelpers(db, firestore) {
  const {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    serverTimestamp,
    setDoc,
  } = firestore;

  return {
    async upsertUserProfile(user, consent = {}) {
      const userRef = doc(db, "users", user.uid);
      const existing = await getDoc(userRef);
      const providerIds = user.providerData.map((provider) => provider.providerId);
      const profile = {
        userId: user.uid,
        email: user.email || null,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        providerIds,
        acceptedPrivacyPolicy: consent.acceptedPrivacyPolicy === true,
        alertsMarketingConsent: consent.alertsMarketingConsent === true,
        updatedAt: serverTimestamp(),
      };

      if (!existing.exists()) {
        profile.createdAt = serverTimestamp();
      }

      await setDoc(userRef, profile, { merge: true });
    },

    async saveCompetition(userId, competition) {
      const savedRef = doc(db, "users", userId, "savedCompetitions", competition.id);
      await setDoc(
        savedRef,
        {
          competitionId: competition.id,
          title: competition.title,
          category: competition.category || null,
          path: competition.path,
          savedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    },

    async unsaveCompetition(userId, competitionId) {
      await deleteDoc(doc(db, "users", userId, "savedCompetitions", competitionId));
    },

    async getSavedCompetition(userId, competitionId) {
      const savedRef = doc(db, "users", userId, "savedCompetitions", competitionId);
      const snapshot = await getDoc(savedRef);
      return snapshot.exists() ? snapshot.data() : null;
    },

    async ignoreCompetition(userId, competition) {
      const ignoredRef = doc(db, "users", userId, "ignoredCompetitions", competition.id);
      await setDoc(
        ignoredRef,
        {
          competitionId: competition.id,
          title: competition.title,
          category: competition.category || null,
          path: competition.path,
          ignoredAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    },

    async unignoreCompetition(userId, competitionId) {
      await deleteDoc(doc(db, "users", userId, "ignoredCompetitions", competitionId));
    },

    async getIgnoredCompetition(userId, competitionId) {
      const ignoredRef = doc(db, "users", userId, "ignoredCompetitions", competitionId);
      const snapshot = await getDoc(ignoredRef);
      return snapshot.exists() ? snapshot.data() : null;
    },

    async getIgnoredCompetitions(userId) {
      const snapshot = await getDocs(collection(db, "users", userId, "ignoredCompetitions"));
      return snapshot.docs.map((docSnapshot) => docSnapshot.data());
    },

    async setAlertPreferences(userId, preferences = {}) {
      const preferenceRef = doc(db, "users", userId, "alertPreferences", "main");
      await setDoc(
        preferenceRef,
        {
          competitionAlerts: preferences.competitionAlerts === true,
          marketingOptIn: preferences.marketingOptIn === true,
          source: "competition-detail",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    },

    async getAlertPreferences(userId) {
      const preferenceRef = doc(db, "users", userId, "alertPreferences", "main");
      const snapshot = await getDoc(preferenceRef);
      return snapshot.exists() ? snapshot.data() : null;
    },

    async recordSignupEvent(user, event = {}) {
      const eventRef = doc(collection(db, "signupEvents"));
      await setDoc(eventRef, {
        eventId: eventRef.id,
        userId: user.uid,
        provider: event.provider || "unknown",
        competitionId: event.competitionId || null,
        alertsOptIn: event.alertsOptIn === true,
        pagePath: window.location.pathname,
        createdAt: serverTimestamp(),
      });
    },
  };
}
