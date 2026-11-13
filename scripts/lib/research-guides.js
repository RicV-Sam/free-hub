const guides = require("../../data/research-guides.json");

function getReviewedGuides(asOfDate) {
  return guides.map((guide) => {
    const expired = guide.expiresAt && guide.expiresAt < asOfDate;
    const sections = guide.sections.map((section) => {
      if (!section.table?.endsAt) return section;
      const table = { ...section.table, rows: section.table.rows.filter((row, index) => section.table.endsAt[index] >= asOfDate) };
      return { ...section, table, paragraphs: table.rows.length ? section.paragraphs : [`No upcoming dates remain from the programme reviewed on ${guide.lastReviewed}. Check the official provider for new dates.`] };
    });
    return {
      ...guide,
      sections,
      noindex: Boolean(expired),
      actions: expired ? [] : guide.actions,
      eyebrow: expired ? "Closed period reference" : "FreeHub practical guide",
      intro: expired ? "The application, offer or event period covered by this page has ended. This page is kept for reference. Check the official provider for a new announcement before acting on these details." : guide.intro,
      trustItems: [`Sources checked ${guide.lastReviewed}`, "Costs and conditions explained", expired ? "Dates have ended" : "Official routes linked"],
    };
  });
}

module.exports = { getReviewedGuides };
