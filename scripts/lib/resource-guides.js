const definitions = require("../../data/resource-guides.json");
const { isPublishedFreeResource } = require("./free-resource-publication.js");

function getResourceDetailPath(resource) {
  if (!resource?.detailSlug) return "";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(resource.detailSlug)) throw new Error("Invalid resource detail slug");
  return `/resources/${resource.detailSlug}/`;
}

function getResourceExitPath(resource) {
  const detail = getResourceDetailPath(resource);
  return detail ? `/out${detail}` : "";
}

function getPublicResourceGuides(resources, guides = definitions) {
  const ids = new Set();
  const slugs = new Set();
  for (const guide of guides) {
    const resource = resources.find(item => item.id === guide.resourceId);
    if (!resource || !resource.detailSlug) throw new Error(`Resource guide has no matching detailed resource: ${guide.resourceId}`);
    getResourceDetailPath(resource);
    if (ids.has(guide.resourceId) || slugs.has(resource.detailSlug)) throw new Error("Duplicate resource guide");
    ids.add(guide.resourceId);
    slugs.add(resource.detailSlug);
    for (const key of ["provider", "title", "description", "intro", "accessNote"]) {
      if (typeof guide[key] !== "string" || !guide[key].trim()) throw new Error(`Resource guide missing ${key}: ${guide.resourceId}`);
    }
    if (!Array.isArray(guide.steps) || !guide.steps.length || guide.steps.some(step => typeof step !== "string" || !step.trim())) throw new Error("Resource guide needs practical steps");
    if (!Array.isArray(guide.sections) || !guide.sections.length || guide.sections.some(section => !section.heading || !Array.isArray(section.paragraphs) || !section.paragraphs.length || section.paragraphs.some(text => typeof text !== "string" || !text.trim()))) throw new Error("Resource guide needs complete sections");
    if (!Array.isArray(guide.faq) || guide.faq.some(item => !item.question || !item.answer)) throw new Error("Invalid resource guide FAQs");
  }
  for (const resource of resources.filter(item => item.detailSlug)) {
    if (!ids.has(resource.id)) throw new Error(`Detailed resource has no guide: ${resource.id}`);
  }
  return guides.flatMap(guide => {
    const resource = resources.find(item => item.id === guide.resourceId);
    return isPublishedFreeResource(resource) ? [{ ...guide, resource }] : [];
  });
}

module.exports = { getResourceDetailPath, getResourceExitPath, getPublicResourceGuides };
