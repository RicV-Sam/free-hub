import { getFirebaseClient } from "./firebase-client.js";

const form = document.querySelector("[data-competition-submission-form]");
const statusElement = document.querySelector("[data-submission-status]");

if (form) {
  initSubmissionForm();
}

async function initSubmissionForm() {
  const client = await getFirebaseClient();

  if (!client) {
    setStatus("Submission is temporarily unavailable. Please try again later.", true);
    setFormDisabled(true);
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      trackSubmissionEvent("competition_submission_invalid", { reason: "browser_validation" });
      return;
    }

    const submission = getSubmissionPayload();
    trackSubmissionEvent("competition_submission_start", getSubmissionEventParams(submission));

    if (
      !isValidHttpUrl(submission.officialUrl) ||
      (submission.termsUrl && !isValidHttpUrl(submission.termsUrl)) ||
      (submission.campaignImageUrl && !isValidHttpUrl(submission.campaignImageUrl))
    ) {
      setStatus("Please use valid http or https URLs for the competition, terms and image links.", true);
      trackSubmissionEvent("competition_submission_invalid", {
        reason: "invalid_url",
        ...getSubmissionEventParams(submission),
      });
      return;
    }

    setFormDisabled(true);
    setStatus("Saving your submission for review...", false);

    try {
      const submissionId = await client.helpers.submitCompetitionForReview(submission);
      form.reset();
      setStatus(`Submitted for review. Reference: ${submissionId}`, false);
      trackSubmissionEvent("competition_submission_created", { submission_id: submissionId });
    } catch (error) {
      console.warn("Freehub competition submission failed:", error.message);
      setStatus("We could not save the submission right now. Please try again later.", true);
      trackSubmissionEvent("competition_submission_failed", getSubmissionEventParams(submission));
    } finally {
      setFormDisabled(false);
    }
  });
}

function getSubmissionPayload() {
  const formData = new FormData(form);
  const getValue = (name) => String(formData.get(name) || "").trim();

  return {
    companyName: getValue("companyName"),
    contactName: getValue("contactName"),
    contactEmail: getValue("contactEmail"),
    competitionTitle: getValue("competitionTitle"),
    officialUrl: getValue("officialUrl"),
    termsUrl: getValue("termsUrl"),
    campaignImageUrl: getValue("campaignImageUrl"),
    closingDate: getValue("closingDate"),
    prizeDetails: getValue("prizeDetails"),
    entryMethod: getValue("entryMethod"),
    requirements: getValue("requirements"),
    notes: getValue("notes"),
  };
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (error) {
    return false;
  }
}

function setFormDisabled(disabled) {
  Array.from(form.elements).forEach((element) => {
    element.disabled = disabled;
  });
}

function setStatus(message, isError) {
  if (!statusElement) {
    return;
  }

  statusElement.textContent = message;
  statusElement.dataset.status = isError ? "error" : "ok";
}

function getSubmissionEventParams(submission) {
  return {
    has_terms_url: Boolean(submission.termsUrl),
    has_campaign_image_url: Boolean(submission.campaignImageUrl),
    has_closing_date: Boolean(submission.closingDate),
  };
}

function trackSubmissionEvent(eventName, params) {
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...(params || {}),
  });
}
