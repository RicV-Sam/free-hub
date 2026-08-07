const FREEHUB_REVIEW_EMAIL = "hello@freehub.co.za";
const FEEDBACK_RESULTS = new Set(["worked", "changed"]);

document.querySelectorAll("[data-offer-feedback]").forEach(initOfferFeedback);

const offerSubmissionForm = document.querySelector("[data-offer-submission-form]");
if (offerSubmissionForm) {
  initOfferSubmissionForm(offerSubmissionForm);
}

document.querySelectorAll("[data-copy-contribution]").forEach((button) => {
  button.addEventListener("click", () => copyPreparedContribution(button));
});

function initOfferFeedback(container) {
  const offerId = String(container.dataset.offerId || "").trim();
  const offerType = String(container.dataset.offerType || "").trim();
  const buttons = Array.from(container.querySelectorAll("[data-offer-feedback-result]"));
  const status = container.querySelector("[data-offer-feedback-status]");
  const reportDetails = container.querySelector("[data-offer-report]");
  const reportForm = container.querySelector("[data-offer-report-form]");
  const savedResult = readFeedbackResult(offerId);

  if (savedResult) {
    updateFeedbackButtons(buttons, savedResult);
    setStatus(status, savedResult === "worked" ? "You marked this offer as working on this device." : "You marked this offer as changed on this device.", false);
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const result = String(button.dataset.offerFeedbackResult || "");
      if (!FEEDBACK_RESULTS.has(result)) return;

      writeFeedbackResult(offerId, result);
      updateFeedbackButtons(buttons, result);
      setStatus(
        status,
        result === "worked"
          ? "Thanks — your feedback is saved on this device."
          : "Thanks. If you can, tell us what changed below.",
        false
      );
      trackContributionEvent("offer_feedback_submitted", {
        offer_id: offerId,
        offer_type: offerType,
        feedback_result: result,
      });

      if (result === "changed" && reportDetails) {
        reportDetails.open = true;
        reportDetails.querySelector("select")?.focus();
      }
    });
  });

  if (reportForm) {
    reportForm.addEventListener("submit", (event) => prepareOfferReport(event, container));
  }
}

function initOfferSubmissionForm(form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      trackContributionEvent("offer_submission_invalid", { reason: "browser_validation" });
      return;
    }

    const values = getFormValues(form);
    const status = form.querySelector("[data-contribution-status]");
    if (!isValidHttpUrl(values.officialUrl) || (values.termsUrl && !isValidHttpUrl(values.termsUrl))) {
      setStatus(status, "Use a valid http or https URL for the official offer and terms links.", true);
      trackContributionEvent("offer_submission_invalid", { reason: "invalid_url" });
      return;
    }

    const subject = `Offer submission: ${values.brand} - ${values.offerTitle}`;
    const body = [
      "COUPON OR DEAL FOR FREEHUB REVIEW",
      "",
      `Relationship to offer: ${values.submitterRole}`,
      `Offer type: ${values.offerType}`,
      `Brand or programme: ${values.brand}`,
      `Offer title: ${values.offerTitle}`,
      `Coupon code: ${values.couponCode || "No code supplied"}`,
      `Category: ${values.category}`,
      `Official offer URL: ${values.officialUrl}`,
      `Terms URL: ${values.termsUrl || "Not supplied"}`,
      `Expiry date: ${values.expiryDate || "Not supplied"}`,
      "",
      "How the saving works:",
      values.offerDetails,
      "",
      "Extra source or review notes:",
      values.notes || "None supplied",
      "",
      "I understand that this is a private review tip and does not guarantee publication.",
    ].join("\n");
    const actions = form.closest(".submission-panel")?.querySelector("[data-email-actions]");

    prepareEmailActions(actions, subject, body);
    setStatus(status, "Your offer email is ready. Review it before choosing Send in your email app.", false);
    trackContributionEvent("offer_submission_prepared", {
      offer_type: values.offerType,
      offer_category: values.category,
      submitter_role: values.submitterRole,
      has_coupon_code: Boolean(values.couponCode),
      has_terms_url: Boolean(values.termsUrl),
      has_expiry_date: Boolean(values.expiryDate),
    });
  });
}

function prepareOfferReport(event, container) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const values = getFormValues(form);
  const offerId = String(container.dataset.offerId || "").trim();
  const offerType = String(container.dataset.offerType || "").trim();
  const brand = String(container.dataset.offerBrand || "").trim();
  const title = String(container.dataset.offerTitle || "").trim();
  const pageUrl = `${window.location.origin}${window.location.pathname}`;
  const subject = `Offer report: ${brand} - ${title}`;
  const body = [
    "PROBLEM WITH A FREEHUB OFFER",
    "",
    `Offer: ${title}`,
    `Brand: ${brand}`,
    `Freehub page: ${pageUrl}`,
    `Issue type: ${values.issueType}`,
    "",
    "What I noticed:",
    values.details || "No extra details supplied",
    "",
    "Please recheck this report against the official source before changing the listing.",
  ].join("\n");
  const actions = form.closest("[data-offer-report]")?.querySelector("[data-email-actions]");
  const status = form.querySelector("[data-contribution-status]");

  prepareEmailActions(actions, subject, body);
  setStatus(status, "Your report is ready. Review it before choosing Send in your email app.", false);
  trackContributionEvent("offer_report_prepared", {
    offer_id: offerId,
    offer_type: offerType,
    issue_type: values.issueType,
    has_details: Boolean(values.details),
  });
}

function prepareEmailActions(container, subject, body) {
  if (!container) return;

  const emailLink = container.querySelector("[data-email-draft]");
  const copyText = container.querySelector("[data-copy-text]");
  if (emailLink) emailLink.href = buildMailtoHref(subject, body);
  if (copyText) copyText.value = `${subject}\n\n${body}`;
  container.hidden = false;
  emailLink?.focus();
}

async function copyPreparedContribution(button) {
  const actions = button.closest("[data-email-actions]");
  const copyText = actions?.querySelector("[data-copy-text]");
  const fallback = actions?.querySelector("[data-copy-fallback]");
  if (!copyText?.value) return;

  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(copyText.value);
    button.textContent = "Copied";
  } catch (error) {
    if (fallback) fallback.hidden = false;
    copyText.focus();
    copyText.select();
  }
}

function getFormValues(form) {
  const formData = new FormData(form);
  const values = {};
  for (const [name, value] of formData.entries()) {
    values[name] = String(value || "").trim();
  }
  return values;
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (error) {
    return false;
  }
}

function buildMailtoHref(subject, body) {
  return `mailto:${FREEHUB_REVIEW_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function feedbackStorageKey(offerId) {
  return `freehub:offer-feedback:${offerId}`;
}

function readFeedbackResult(offerId) {
  if (!offerId) return "";
  try {
    const value = JSON.parse(localStorage.getItem(feedbackStorageKey(offerId)) || "null");
    return FEEDBACK_RESULTS.has(value?.result) ? value.result : "";
  } catch (error) {
    return "";
  }
}

function writeFeedbackResult(offerId, result) {
  if (!offerId) return;
  try {
    localStorage.setItem(feedbackStorageKey(offerId), JSON.stringify({ result, recordedAt: new Date().toISOString() }));
  } catch (error) {
    // Feedback still reaches analytics when browser storage is unavailable.
  }
}

function updateFeedbackButtons(buttons, result) {
  buttons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.offerFeedbackResult === result));
  });
}

function setStatus(element, message, isError) {
  if (!element) return;
  element.textContent = message;
  element.dataset.status = isError ? "error" : "ok";
}

function trackContributionEvent(eventName, params = {}) {
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...params });
}
