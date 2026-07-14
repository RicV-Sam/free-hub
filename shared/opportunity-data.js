(function (global) {
  /**
   * @typedef {Object} Requirement
   * @property {'account'|'app'|'membership'|'purchase'|'delivery'|'card'|'location'|'age'|'identity'|'questionnaire'|'review'|'social_post'|'other'} kind
   * @property {boolean} required
   * @property {string} label
   * @property {string=} detail
   */

  /**
   * @typedef {Object} FreeResource
   * @property {string} id
   * @property {string} name
   * @property {'programme'|'platform'|'directory'|'public_service'|'guide'} resourceType
   * @property {string} category
   * @property {string} categoryLabel
   * @property {string} officialUrl
   * @property {string} bestFor
   * @property {string} freeDetails
   * @property {string} requirements
   * @property {string} watchOut
   * @property {'active'|'manual_check'|'retired'} availability
   * @property {'verified'|'verification_due'|'source_changed'|'rejected'} verificationStatus
   * @property {string} datePublished
   * @property {string} lastReviewed
   * @property {string} reviewDueAt
   * @property {string} dateModified
   */

  /**
   * @typedef {Object} Opportunity
   * @property {string} id
   * @property {string} slug
   * @property {'free_sample'|'birthday_freebie'|'product_testing'|'free_course'|'free_ticket'|'free_trial'|'free_data_airtime'|'reward'|'cashback'|'other_freebie'} type
   * @property {string} title
   * @property {string} summary
   * @property {string} provider
   * @property {string} sourceUrl
   * @property {string=} termsUrl
   * @property {string=} imageUrl
   * @property {'draft'|'review'|'published'|'held'|'expired'|'rejected'} publicationStatus
   * @property {'unverified'|'source_found'|'requirements_checked'|'verified'|'verification_due'|'source_changed'|'expired'|'rejected'} verificationStatus
   * @property {'ZA'} country
   * @property {string[]} regions
   * @property {string=} startsAt
   * @property {string=} expiresAt
   * @property {string} lastVerifiedAt
   * @property {string} reviewDueAt
   * @property {string=} publishedAt
   * @property {string} updatedAt
   * @property {'fixed_window'|'stock_limited'|'recurring'|'ongoing'} availabilityKind
   * @property {string} costClassification
   * @property {Requirement[]} requirements
   * @property {Object=} eligibility
   * @property {string[]} categories
   * @property {string[]} tags
   * @property {Object} details
   */

  /**
   * @typedef {Object} DiscoverySummary
   * @property {string} id
   * @property {'competition'|'resource'|'opportunity'} entityKind
   * @property {string} contentType
   * @property {string} title
   * @property {string} summary
   * @property {string} path
   * @property {string=} imageUrl
   * @property {string[]} labels
   * @property {string=} expiresAt
   * @property {string=} lastVerifiedAt
   */

  const RESOURCE_TYPES = Object.freeze(["programme", "platform", "directory", "public_service", "guide"]);
  const RESOURCE_AVAILABILITY = Object.freeze(["active", "manual_check", "retired"]);
  const RESOURCE_VERIFICATION_STATUSES = Object.freeze([
    "verified",
    "verification_due",
    "source_changed",
    "rejected",
  ]);
  const OPPORTUNITY_TYPES = Object.freeze([
    "free_sample",
    "birthday_freebie",
    "product_testing",
    "free_course",
    "free_ticket",
    "free_trial",
    "free_data_airtime",
    "reward",
    "cashback",
    "other_freebie",
  ]);
  const SUPPORTED_PUBLIC_OPPORTUNITY_TYPES = Object.freeze([
    "free_sample",
    "product_testing",
    "birthday_freebie",
    "free_course",
  ]);
  const PUBLICATION_STATUSES = Object.freeze(["draft", "review", "published", "held", "expired", "rejected"]);
  const VERIFICATION_STATUSES = Object.freeze([
    "unverified",
    "source_found",
    "requirements_checked",
    "verified",
    "verification_due",
    "source_changed",
    "expired",
    "rejected",
  ]);
  const AVAILABILITY_KINDS = Object.freeze(["fixed_window", "stock_limited", "recurring", "ongoing"]);
  const COST_CLASSIFICATIONS = Object.freeze([
    "completely_free",
    "free_entry",
    "standard_data_may_apply",
    "account_required",
    "membership_required",
    "app_required",
    "purchase_required",
    "delivery_fee",
    "refundable_deposit",
    "paid_trial_after_free_period",
    "card_required",
    "paid_entry",
    "unclear",
  ]);
  const REQUIREMENT_KINDS = Object.freeze([
    "account",
    "app",
    "membership",
    "purchase",
    "delivery",
    "card",
    "location",
    "age",
    "identity",
    "questionnaire",
    "review",
    "social_post",
    "other",
  ]);
  const DISCOVERY_ENTITY_KINDS = Object.freeze(["competition", "resource", "opportunity"]);
  const SHORTENER_HOSTS = new Set(["bit.ly", "goo.gl", "rb.gy", "t.co", "tinyurl.com"]);
  const AFFILIATE_QUERY_KEYS = new Set(["aff", "affiliate", "affiliate_id", "clickid", "referral", "subid"]);
  const CORE_OPPORTUNITY_FIELDS = Object.freeze([
    "availabilityKind",
    "categories",
    "costClassification",
    "country",
    "details",
    "eligibility",
    "expiresAt",
    "id",
    "imageUrl",
    "lastVerifiedAt",
    "provider",
    "publicationStatus",
    "publishedAt",
    "regions",
    "requirements",
    "reviewDueAt",
    "slug",
    "sourceUrl",
    "startsAt",
    "summary",
    "tags",
    "termsUrl",
    "title",
    "type",
    "updatedAt",
    "verificationStatus",
  ]);

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function isIsoDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
      return false;
    }
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  function isHttpUrl(value) {
    try {
      const parsed = new URL(value);
      return ["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password;
    } catch (error) {
      return false;
    }
  }

  function addUnexpectedFieldErrors(value, allowedFields, errors, path) {
    if (!isPlainObject(value)) {
      return;
    }
    const allowed = new Set(allowedFields);
    Object.keys(value)
      .filter((field) => !allowed.has(field))
      .sort()
      .forEach((field) => errors.push(`${path}.${field} is not allowed.`));
  }

  function requireString(value, field, errors) {
    if (!isNonEmptyString(value[field])) {
      errors.push(`${field} must be a non-empty string.`);
    }
  }

  function requireEnum(value, field, allowed, errors) {
    if (!allowed.includes(value[field])) {
      errors.push(`${field} must be one of: ${allowed.join(", ")}.`);
    }
  }

  function requireDate(value, field, errors) {
    if (!isIsoDate(value[field])) {
      errors.push(`${field} must be a valid YYYY-MM-DD date.`);
    }
  }

  function validateStringArray(value, field, errors, options = {}) {
    if (!Array.isArray(value[field])) {
      errors.push(`${field} must be an array.`);
      return;
    }
    if (options.nonEmpty && value[field].length === 0) {
      errors.push(`${field} must contain at least one value.`);
    }
    if (value[field].some((entry) => !isNonEmptyString(entry))) {
      errors.push(`${field} must contain only non-empty strings.`);
    }
  }

  function validationResult(errors, extra = {}) {
    return { valid: errors.length === 0, errors, ...extra };
  }

  function validateRequirement(requirement) {
    const errors = [];
    if (!isPlainObject(requirement)) {
      return validationResult(["requirement must be an object."]);
    }
    addUnexpectedFieldErrors(requirement, ["kind", "required", "label", "detail"], errors, "requirement");
    requireEnum(requirement, "kind", REQUIREMENT_KINDS, errors);
    if (typeof requirement.required !== "boolean") {
      errors.push("required must be a boolean.");
    }
    requireString(requirement, "label", errors);
    if (requirement.detail !== undefined && !isNonEmptyString(requirement.detail)) {
      errors.push("detail must be a non-empty string when present.");
    }
    return validationResult(errors);
  }

  function validateFreeResource(resource, options = {}) {
    const errors = [];
    if (!isPlainObject(resource)) {
      return validationResult(["resource must be an object."]);
    }

    const legacy = options.legacy === true;
    const commonFields = [
      "name",
      "category",
      "categoryLabel",
      "officialUrl",
      "bestFor",
      "freeDetails",
      "requirements",
      "watchOut",
      "datePublished",
      "lastReviewed",
      "dateModified",
    ];
    const strictFields = [
      "id",
      "resourceType",
      ...commonFields,
      "availability",
      "verificationStatus",
      "reviewDueAt",
    ];

    if (!legacy) {
      addUnexpectedFieldErrors(resource, strictFields, errors, "resource");
      requireString(resource, "id", errors);
      requireEnum(resource, "resourceType", RESOURCE_TYPES, errors);
      requireEnum(resource, "availability", RESOURCE_AVAILABILITY, errors);
      requireEnum(resource, "verificationStatus", RESOURCE_VERIFICATION_STATUSES, errors);
      requireDate(resource, "reviewDueAt", errors);
    }

    commonFields.filter((field) => !field.startsWith("date")).forEach((field) => requireString(resource, field, errors));
    ["datePublished", "lastReviewed", "dateModified"].forEach((field) => requireDate(resource, field, errors));
    if (resource.officialUrl && !isHttpUrl(resource.officialUrl)) {
      errors.push("officialUrl must be an HTTP(S) URL without credentials.");
    }
    if (!legacy && isIsoDate(resource.lastReviewed) && isIsoDate(resource.reviewDueAt) && resource.reviewDueAt < resource.lastReviewed) {
      errors.push("reviewDueAt cannot be before lastReviewed.");
    }
    return validationResult(errors);
  }

  function validateFreeResourceRegistry(resources, options = {}) {
    if (!Array.isArray(resources)) {
      return validationResult(["resources must be an array."]);
    }
    const errors = [];
    const seenIds = new Set();
    const seenNames = new Set();
    resources.forEach((resource, index) => {
      const result = validateFreeResource(resource, options);
      result.errors.forEach((error) => errors.push(`resources[${index}].${error}`));
      const id = String(resource && resource.id ? resource.id : "").trim().toLowerCase();
      const name = String(resource && resource.name ? resource.name : "").trim().toLowerCase();
      if (!options.legacy && id) {
        if (seenIds.has(id)) errors.push(`resources[${index}].id is duplicated.`);
        seenIds.add(id);
      }
      if (name) {
        if (seenNames.has(name)) errors.push(`resources[${index}].name is duplicated.`);
        seenNames.add(name);
      }
    });
    return validationResult(errors);
  }

  function validateFreeSampleDetails(details) {
    const errors = [];
    const fields = ["fulfilmentMethod", "deliveryCharge", "stockState", "householdLimit", "selectionRequired"];
    addUnexpectedFieldErrors(details, fields, errors, "details");
    requireEnum(details, "fulfilmentMethod", ["delivery", "collection", "digital"], errors);
    if (typeof details.deliveryCharge !== "number" || !Number.isFinite(details.deliveryCharge) || details.deliveryCharge < 0) {
      errors.push("deliveryCharge must be a non-negative number.");
    }
    requireEnum(details, "stockState", ["available", "limited", "selection_required"], errors);
    if (!(details.householdLimit === null || (Number.isInteger(details.householdLimit) && details.householdLimit > 0))) {
      errors.push("householdLimit must be null or a positive integer.");
    }
    if (typeof details.selectionRequired !== "boolean") {
      errors.push("selectionRequired must be a boolean.");
    }
    if (details.selectionRequired === true && details.stockState !== "selection_required") {
      errors.push("selectionRequired=true requires stockState=selection_required.");
    }
    if (details.selectionRequired === false && details.stockState === "selection_required") {
      errors.push("stockState=selection_required requires selectionRequired=true.");
    }
    return errors;
  }

  function validateProductTestingDetails(details) {
    const errors = [];
    const fields = ["fulfilmentMethod", "selectionMethod", "stockState", "questionnaireRequired", "reviewRequired"];
    addUnexpectedFieldErrors(details, fields, errors, "details");
    requireEnum(details, "fulfilmentMethod", ["delivery", "collection", "digital"], errors);
    requireEnum(details, "selectionMethod", ["application", "questionnaire", "random_draw", "provider_selection"], errors);
    requireEnum(details, "stockState", ["open", "limited", "closed"], errors);
    if (typeof details.questionnaireRequired !== "boolean") errors.push("questionnaireRequired must be a boolean.");
    if (typeof details.reviewRequired !== "boolean") errors.push("reviewRequired must be a boolean.");
    return errors;
  }

  function validateBirthdayDetails(details) {
    const errors = [];
    const fields = [
      "signupLeadDays",
      "birthdayWindow",
      "membershipRequired",
      "appRequired",
      "identityRequired",
      "branchAvailability",
      "recurrence",
      "voucherDelivery",
    ];
    addUnexpectedFieldErrors(details, fields, errors, "details");
    if (!Number.isInteger(details.signupLeadDays) || details.signupLeadDays < 0) {
      errors.push("signupLeadDays must be a non-negative integer.");
    }
    if (!isPlainObject(details.birthdayWindow)) {
      errors.push("birthdayWindow must be an object.");
    } else {
      addUnexpectedFieldErrors(details.birthdayWindow, ["beforeDays", "afterDays"], errors, "details.birthdayWindow");
      ["beforeDays", "afterDays"].forEach((field) => {
        if (!Number.isInteger(details.birthdayWindow[field]) || details.birthdayWindow[field] < 0) {
          errors.push(`birthdayWindow.${field} must be a non-negative integer.`);
        }
      });
    }
    ["membershipRequired", "appRequired", "identityRequired"].forEach((field) => {
      if (typeof details[field] !== "boolean") errors.push(`${field} must be a boolean.`);
    });
    requireEnum(details, "branchAvailability", ["all_branches", "participating_branches", "online_only"], errors);
    requireEnum(details, "recurrence", ["annual", "once"], errors);
    requireEnum(details, "voucherDelivery", ["app", "email", "sms", "account", "in_store", "none"], errors);
    return errors;
  }

  function validateCourseDetails(details) {
    const errors = [];
    const fields = [
      "duration",
      "accessMode",
      "certificateCost",
      "languages",
      "difficulty",
      "schedule",
      "geographicRestrictions",
    ];
    addUnexpectedFieldErrors(details, fields, errors, "details");
    requireString(details, "duration", errors);
    requireEnum(details, "accessMode", ["online", "in_person", "hybrid"], errors);
    requireEnum(details, "certificateCost", ["free", "paid", "none", "unclear"], errors);
    validateStringArray(details, "languages", errors, { nonEmpty: true });
    requireEnum(details, "difficulty", ["beginner", "intermediate", "advanced", "mixed", "not_stated"], errors);
    requireEnum(details, "schedule", ["self_paced", "fixed_dates", "cohort"], errors);
    validateStringArray(details, "geographicRestrictions", errors, { nonEmpty: true });
    return errors;
  }

  const TYPE_DETAIL_VALIDATORS = Object.freeze({
    free_sample: validateFreeSampleDetails,
    product_testing: validateProductTestingDetails,
    birthday_freebie: validateBirthdayDetails,
    free_course: validateCourseDetails,
  });

  function validateOpportunity(opportunity) {
    const errors = [];
    if (!isPlainObject(opportunity)) {
      return validationResult(["opportunity must be an object."], { typeSupported: false });
    }

    addUnexpectedFieldErrors(opportunity, CORE_OPPORTUNITY_FIELDS, errors, "opportunity");
    ["id", "slug", "title", "summary", "provider"].forEach((field) => requireString(opportunity, field, errors));
    if (isNonEmptyString(opportunity.slug) && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(opportunity.slug)) {
      errors.push("slug must contain lowercase letters, numbers, and single hyphens only.");
    }
    requireEnum(opportunity, "type", OPPORTUNITY_TYPES, errors);
    requireEnum(opportunity, "publicationStatus", PUBLICATION_STATUSES, errors);
    requireEnum(opportunity, "verificationStatus", VERIFICATION_STATUSES, errors);
    requireEnum(opportunity, "availabilityKind", AVAILABILITY_KINDS, errors);
    requireEnum(opportunity, "costClassification", COST_CLASSIFICATIONS, errors);
    if (opportunity.country !== "ZA") errors.push("country must be ZA.");
    if (!isHttpUrl(opportunity.sourceUrl)) errors.push("sourceUrl must be an HTTP(S) URL without credentials.");
    if (opportunity.termsUrl !== undefined && !isHttpUrl(opportunity.termsUrl)) errors.push("termsUrl must be an HTTP(S) URL without credentials.");
    if (opportunity.imageUrl !== undefined && !isHttpUrl(opportunity.imageUrl)) errors.push("imageUrl must be an HTTP(S) URL without credentials.");
    validateStringArray(opportunity, "regions", errors);
    validateStringArray(opportunity, "categories", errors, { nonEmpty: true });
    validateStringArray(opportunity, "tags", errors);
    ["lastVerifiedAt", "reviewDueAt", "updatedAt"].forEach((field) => requireDate(opportunity, field, errors));
    ["startsAt", "expiresAt", "publishedAt"].forEach((field) => {
      if (opportunity[field] !== undefined && !isIsoDate(opportunity[field])) {
        errors.push(`${field} must be a valid YYYY-MM-DD date when present.`);
      }
    });
    if (isIsoDate(opportunity.lastVerifiedAt) && isIsoDate(opportunity.reviewDueAt) && opportunity.reviewDueAt < opportunity.lastVerifiedAt) {
      errors.push("reviewDueAt cannot be before lastVerifiedAt.");
    }
    if (isIsoDate(opportunity.lastVerifiedAt) && isIsoDate(opportunity.updatedAt) && opportunity.updatedAt < opportunity.lastVerifiedAt) {
      errors.push("updatedAt cannot be before lastVerifiedAt.");
    }
    if (isIsoDate(opportunity.startsAt) && isIsoDate(opportunity.expiresAt) && opportunity.expiresAt < opportunity.startsAt) {
      errors.push("expiresAt cannot be before startsAt.");
    }
    if (!Array.isArray(opportunity.requirements)) {
      errors.push("requirements must be an array.");
    } else {
      opportunity.requirements.forEach((requirement, index) => {
        validateRequirement(requirement).errors.forEach((error) => errors.push(`requirements[${index}].${error}`));
      });
    }
    if (opportunity.eligibility !== undefined && !isPlainObject(opportunity.eligibility)) {
      errors.push("eligibility must be an object when present.");
    }
    if (!isPlainObject(opportunity.details)) {
      errors.push("details must be an object.");
    }

    const detailValidator = TYPE_DETAIL_VALIDATORS[opportunity.type];
    if (detailValidator && isPlainObject(opportunity.details)) {
      detailValidator(opportunity.details).forEach((error) =>
        errors.push(error.startsWith("details.") ? error : `details.${error}`)
      );
    } else if (!detailValidator && isPlainObject(opportunity.details) && Object.keys(opportunity.details).length > 0) {
      errors.push("details must remain empty until the opportunity type has a dedicated validator.");
    }

    return validationResult(errors, { typeSupported: Boolean(detailValidator) });
  }

  function validateOpportunityRegistry(opportunities) {
    if (!Array.isArray(opportunities)) {
      return validationResult(["opportunities must be an array."]);
    }
    const errors = [];
    const seenIds = new Set();
    const seenSlugs = new Set();
    opportunities.forEach((opportunity, index) => {
      validateOpportunity(opportunity).errors.forEach((error) => errors.push(`opportunities[${index}].${error}`));
      [["id", seenIds], ["slug", seenSlugs]].forEach(([field, seen]) => {
        const value = String(opportunity && opportunity[field] ? opportunity[field] : "").trim().toLowerCase();
        if (!value) return;
        if (seen.has(value)) errors.push(`opportunities[${index}].${field} is duplicated.`);
        seen.add(value);
      });
    });
    return validationResult(errors);
  }

  function normalizeHost(value) {
    return String(value || "").trim().toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  }

  function isAllowedOfficialSource(sourceUrl, allowedSourceHosts) {
    if (!Array.isArray(allowedSourceHosts) || allowedSourceHosts.length === 0) {
      return false;
    }
    try {
      const url = new URL(sourceUrl);
      const host = normalizeHost(url.hostname);
      const allowedHosts = allowedSourceHosts
        .map(normalizeHost)
        .filter((allowed) => allowed.includes(".") && !SHORTENER_HOSTS.has(allowed));
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return false;
      if (
        !host.includes(".") ||
        host === "localhost" ||
        SHORTENER_HOSTS.has(host) ||
        /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) ||
        host.includes(":")
      ) return false;
      if (!allowedHosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) return false;
      if (
        /\/preview(?:\/|$)/i.test(url.pathname) ||
        String(url.searchParams.get("stagemode") || "").toLowerCase() === "true"
      ) return false;
      if (host === "display.wayin.com" && url.pathname.toLowerCase().includes("/preview")) return false;
      if ([...url.searchParams.keys()].some((key) => AFFILIATE_QUERY_KEYS.has(key.toLowerCase()))) return false;
      return true;
    } catch (error) {
      return false;
    }
  }

  function hasRequiredRequirement(opportunity, kind) {
    return Array.isArray(opportunity.requirements) && opportunity.requirements.some(
      (requirement) => requirement.kind === kind && requirement.required === true
    );
  }

  function hasConsistentCostRequirements(opportunity) {
    const requiredKindByCost = {
      account_required: "account",
      app_required: "app",
      membership_required: "membership",
      purchase_required: "purchase",
      delivery_fee: "delivery",
      card_required: "card",
    };
    const requiredKind = requiredKindByCost[opportunity.costClassification];
    if (requiredKind && !hasRequiredRequirement(opportunity, requiredKind)) {
      return false;
    }
    if (opportunity.costClassification === "completely_free") {
      const blockedKinds = ["purchase", "delivery", "card", "membership"];
      if (blockedKinds.some((kind) => hasRequiredRequirement(opportunity, kind))) return false;
      if (opportunity.type === "free_sample" && opportunity.details.deliveryCharge !== 0) return false;
    }
    if (opportunity.costClassification === "delivery_fee") {
      if (opportunity.type !== "free_sample" || !(opportunity.details.deliveryCharge > 0)) return false;
    }
    if (opportunity.type === "free_course" && opportunity.details.certificateCost === "unclear") return false;
    if (opportunity.type === "product_testing") {
      if (opportunity.details.questionnaireRequired !== hasRequiredRequirement(opportunity, "questionnaire")) return false;
      if (opportunity.details.reviewRequired !== hasRequiredRequirement(opportunity, "review")) return false;
    }
    if (opportunity.type === "birthday_freebie") {
      const requirementFlags = {
        membershipRequired: "membership",
        appRequired: "app",
        identityRequired: "identity",
      };
      if (
        Object.entries(requirementFlags).some(
          ([flag, kind]) => opportunity.details[flag] !== hasRequiredRequirement(opportunity, kind)
        )
      ) return false;
    }
    return true;
  }

  function isPublicOpportunity(opportunity, options = {}) {
    const validation = validateOpportunity(opportunity);
    const asOfDate = options.asOfDate;
    const strictFreeOnly = options.strictFreeOnly === true;
    if (!validation.valid || !validation.typeSupported || !isIsoDate(asOfDate)) return false;
    if (opportunity.publicationStatus !== "published" || opportunity.verificationStatus !== "verified") return false;
    if (!isIsoDate(opportunity.publishedAt) || opportunity.publishedAt > asOfDate) return false;
    if (opportunity.lastVerifiedAt > asOfDate || opportunity.reviewDueAt < asOfDate) return false;
    if (opportunity.startsAt && opportunity.startsAt > asOfDate) return false;
    if (!isAllowedOfficialSource(opportunity.sourceUrl, options.allowedSourceHosts)) return false;
    if (["unclear", "free_entry"].includes(opportunity.costClassification)) return false;
    if (strictFreeOnly && opportunity.costClassification !== "completely_free") return false;
    if (!hasConsistentCostRequirements(opportunity)) return false;

    if (opportunity.availabilityKind === "fixed_window") {
      if (!isIsoDate(opportunity.startsAt) || !isIsoDate(opportunity.expiresAt)) return false;
      if (opportunity.expiresAt < asOfDate) return false;
    }
    if (opportunity.availabilityKind === "stock_limited") {
      if (opportunity.expiresAt && opportunity.expiresAt < asOfDate) return false;
      if (opportunity.details.stockState === "closed") return false;
    }
    return true;
  }

  function validateDiscoverySummary(summary) {
    const errors = [];
    if (!isPlainObject(summary)) {
      return validationResult(["summary must be an object."]);
    }
    const fields = ["id", "entityKind", "contentType", "title", "summary", "path", "imageUrl", "labels", "expiresAt", "lastVerifiedAt"];
    addUnexpectedFieldErrors(summary, fields, errors, "summary");
    ["id", "contentType", "title", "summary", "path"].forEach((field) => requireString(summary, field, errors));
    requireEnum(summary, "entityKind", DISCOVERY_ENTITY_KINDS, errors);
    validateStringArray(summary, "labels", errors);
    const summaryPath = String(summary.path || "");
    if (!summaryPath.startsWith("/") || summaryPath.startsWith("//")) {
      errors.push("path must be a root-relative Freehub path.");
    }
    if (summary.imageUrl !== undefined && !isHttpUrl(summary.imageUrl)) errors.push("imageUrl must be an HTTP(S) URL without credentials.");
    ["expiresAt", "lastVerifiedAt"].forEach((field) => {
      if (summary[field] !== undefined && !isIsoDate(summary[field])) errors.push(`${field} must be a valid YYYY-MM-DD date when present.`);
    });
    return validationResult(errors);
  }

  function createDiscoverySummary(input) {
    const fields = ["id", "entityKind", "contentType", "title", "summary", "path", "imageUrl", "labels", "expiresAt", "lastVerifiedAt"];
    const inputErrors = [];
    if (!isPlainObject(input)) {
      throw new Error("Invalid DiscoverySummary: input must be an object.");
    }
    addUnexpectedFieldErrors(input, fields, inputErrors, "summary");
    if (inputErrors.length > 0) {
      throw new Error(`Invalid DiscoverySummary: ${inputErrors.join(" ")}`);
    }
    const summary = {
      id: input && input.id,
      entityKind: input && input.entityKind,
      contentType: input && input.contentType,
      title: input && input.title,
      summary: input && input.summary,
      path: input && input.path,
      labels: input && Array.isArray(input.labels) ? input.labels.slice() : input && input.labels,
    };
    ["imageUrl", "expiresAt", "lastVerifiedAt"].forEach((field) => {
      if (input && input[field] !== undefined && input[field] !== "") summary[field] = input[field];
    });
    const validation = validateDiscoverySummary(summary);
    if (!validation.valid) {
      throw new Error(`Invalid DiscoverySummary: ${validation.errors.join(" ")}`);
    }
    return summary;
  }

  function isOpportunityFeatureEnabled(rawValue) {
    return rawValue === "true";
  }

  const api = {
    RESOURCE_TYPES,
    RESOURCE_AVAILABILITY,
    RESOURCE_VERIFICATION_STATUSES,
    OPPORTUNITY_TYPES,
    SUPPORTED_PUBLIC_OPPORTUNITY_TYPES,
    PUBLICATION_STATUSES,
    VERIFICATION_STATUSES,
    AVAILABILITY_KINDS,
    COST_CLASSIFICATIONS,
    REQUIREMENT_KINDS,
    DISCOVERY_ENTITY_KINDS,
    createDiscoverySummary,
    isAllowedOfficialSource,
    isOpportunityFeatureEnabled,
    isPublicOpportunity,
    validateDiscoverySummary,
    validateFreeResource,
    validateFreeResourceRegistry,
    validateOpportunity,
    validateOpportunityRegistry,
    validateRequirement,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  global.FreeHubOpportunityData = api;
})(typeof window !== "undefined" ? window : globalThis);
