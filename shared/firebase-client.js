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
    limit,
    query,
    runTransaction,
    serverTimestamp,
    setDoc,
    where,
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
        marketingConsent: consent.alertsMarketingConsent === true,
        marketingConsentUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (!existing.exists()) {
        profile.createdAt = serverTimestamp();
      }

      await setDoc(userRef, profile, { merge: true });
    },

    async getUserProfile(userId) {
      const userRef = doc(db, "users", userId);
      const snapshot = await getDoc(userRef);
      return snapshot.exists() ? snapshot.data() : null;
    },

    async getAdminProfile(userId) {
      const adminRef = doc(db, "admins", userId);
      const snapshot = await getDoc(adminRef);
      return snapshot.exists() ? snapshot.data() : null;
    },

    async ensureClubProfile(user, consent = {}) {
      const userRef = doc(db, "users", user.uid);
      const existing = await getDoc(userRef);
      let profile = existing.exists() ? existing.data() : {};

      if (!existing.exists()) {
        await this.upsertUserProfile(user, {
          acceptedPrivacyPolicy: consent.acceptedPrivacyPolicy !== false,
          alertsMarketingConsent: consent.alertsMarketingConsent === true,
        });
      } else {
        await setDoc(
          userRef,
          {
            email: user.email || profile.email || null,
            displayName: user.displayName || profile.displayName || null,
            photoURL: user.photoURL || profile.photoURL || null,
            providerIds: user.providerData.map((provider) => provider.providerId),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      if (!profile.referralCode) {
        const referralCode = await createReferralCode(db, firestore, user.uid);
        await setDoc(
          userRef,
          {
            referralCode,
            clubTermsAccepted: true,
            clubTermsAcceptedAt: profile.clubTermsAcceptedAt || serverTimestamp(),
            referWinTermsAccepted: false,
            referWinTermsAcceptedAt: null,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        profile = {
          ...profile,
          referralCode,
          clubTermsAccepted: true,
          referWinTermsAccepted: false,
        };
      } else if (profile.clubTermsAccepted !== true) {
        await setDoc(
          userRef,
          {
            clubTermsAccepted: true,
            clubTermsAcceptedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        profile = {
          ...profile,
          clubTermsAccepted: true,
        };
      }

      return {
        ...profile,
        userId: user.uid,
        email: user.email || profile.email || null,
        displayName: user.displayName || profile.displayName || null,
        photoURL: user.photoURL || profile.photoURL || null,
      };
    },

    async saveCompetition(userId, competition) {
      const savedRef = doc(db, "users", userId, "savedCompetitions", competition.id);
      await setDoc(
        savedRef,
        {
          competitionId: competition.id,
          slug: competition.slug || competition.id,
          title: competition.title,
          brand: competition.brand || null,
          category: competition.category || null,
          closingDate: competition.closingDate || null,
          path: competition.path,
          status: normalizeSavedStatus(competition.status),
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

    async getSavedCompetitions(userId) {
      const snapshot = await getDocs(collection(db, "users", userId, "savedCompetitions"));
      return snapshot.docs.map((docSnapshot) => docSnapshot.data());
    },

    async updateSavedCompetitionStatus(userId, competitionId, status) {
      const savedRef = doc(db, "users", userId, "savedCompetitions", competitionId);
      await setDoc(
        savedRef,
        {
          competitionId,
          status: normalizeSavedStatus(status),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
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

    async submitCompetitionForReview(submission = {}) {
      const submissionRef = doc(collection(db, "competitionSubmissions"));
      const trim = (value) => String(value || "").trim();

      await setDoc(submissionRef, {
        submissionId: submissionRef.id,
        companyName: trim(submission.companyName),
        contactName: trim(submission.contactName),
        contactEmail: trim(submission.contactEmail).toLowerCase(),
        competitionTitle: trim(submission.competitionTitle),
        officialUrl: trim(submission.officialUrl),
        termsUrl: trim(submission.termsUrl),
        campaignImageUrl: trim(submission.campaignImageUrl),
        closingDate: trim(submission.closingDate),
        prizeDetails: trim(submission.prizeDetails),
        entryMethod: trim(submission.entryMethod),
        requirements: trim(submission.requirements),
        notes: trim(submission.notes),
        reviewStatus: "pending-review",
        source: "submit-a-competition-page",
        pagePath: window.location.pathname,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return submissionRef.id;
    },

    async createPendingReferralAttribution(user, attribution = {}) {
      const referralCode = normalizeReferralCode(attribution.referralCode);

      if (!referralCode) {
        return null;
      }

      const codeRef = doc(db, "referralCodes", referralCode);
      const codeSnapshot = await getDoc(codeRef);

      if (!codeSnapshot.exists()) {
        return null;
      }

      const referrerUid = codeSnapshot.data().userId || null;

      if (!referrerUid || referrerUid === user.uid) {
        return null;
      }

      const attributionId = `${user.uid}_${referralCode}`;
      const attributionRef = doc(db, "referralAttribution", attributionId);
      const existing = await getDoc(attributionRef);

      if (existing.exists()) {
        return attributionId;
      }

      await setDoc(attributionRef, {
        attributionId,
        referredUid: user.uid,
        referrerUid,
        referralCode,
        landingPath: String(attribution.landingPath || window.location.pathname).slice(0, 500),
        capturedAt: attribution.capturedAt || null,
        registeredAt: serverTimestamp(),
        campaignMonth: getCampaignMonth(),
        status: "pending_verification",
        verifiedAt: null,
        rejectionReason: null,
      });

      return attributionId;
    },

    async getReferralAttributions(options = {}) {
      const constraints = [];
      const status = normalizeReferralReviewStatus(options.status);
      const campaignMonth = String(options.campaignMonth || "").trim();

      if (status !== "all") {
        constraints.push(where("status", "==", status));
      }

      if (/^\d{4}-\d{2}$/.test(campaignMonth)) {
        constraints.push(where("campaignMonth", "==", campaignMonth));
      }

      constraints.push(limit(Number.isFinite(options.limit) ? options.limit : 100));

      const snapshot = await getDocs(query(collection(db, "referralAttribution"), ...constraints));
      return snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      }));
    },

    async updateReferralReview(attributionId, review = {}, reviewer) {
      const status = normalizeReferralReviewStatus(review.status);

      if (!["approved", "rejected"].includes(status)) {
        throw new Error("Invalid referral review status.");
      }

      const attributionRef = doc(db, "referralAttribution", attributionId);
      const payload = {
        status,
        reviewedAt: serverTimestamp(),
        reviewedBy: reviewer?.uid || null,
        rejectionReason: status === "rejected" ? String(review.rejectionReason || "").trim().slice(0, 500) : null,
        verifiedAt: status === "approved" ? serverTimestamp() : null,
      };

      await setDoc(attributionRef, payload, { merge: true });
    },
  };
}

async function createReferralCode(db, firestore, userId) {
  const { doc, serverTimestamp, runTransaction } = firestore;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateReferralCode();
    const codeRef = doc(db, "referralCodes", code);

    try {
      await runTransaction(db, async (transaction) => {
        const existing = await transaction.get(codeRef);

        if (existing.exists()) {
          throw new Error("referral-code-collision");
        }

        transaction.set(codeRef, {
          code,
          userId,
          createdAt: serverTimestamp(),
        });
      });

      return code;
    } catch (error) {
      if (error.message !== "referral-code-collision") {
        throw error;
      }
    }
  }

  throw new Error("Could not create a unique Freehub Club referral code.");
}

function generateReferralCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  window.crypto.getRandomValues(bytes);
  return `FH${Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("")}`;
}

function normalizeReferralCode(value) {
  const code = String(value || "").trim().toUpperCase();
  return /^FH[A-Z0-9]{5,6}$/.test(code) ? code : "";
}

function normalizeSavedStatus(value) {
  const status = typeof value === "string" ? value.trim().toLowerCase() : "";
  return ["interested", "entered", "skipped"].includes(status) ? status : "interested";
}

function normalizeReferralReviewStatus(value) {
  const status = typeof value === "string" ? value.trim().toLowerCase() : "";
  return ["pending_verification", "approved", "rejected", "all"].includes(status) ? status : "pending_verification";
}

function getCampaignMonth() {
  return new Date().toISOString().slice(0, 7);
}
