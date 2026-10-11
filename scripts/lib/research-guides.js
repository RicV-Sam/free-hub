const guides = require("../../data/research-guides.json");

function getReviewedGuides(asOfDate) {
  return guides.map((guide) => {
    const expired = guide.expiresAt && guide.expiresAt < asOfDate;
    const sections = guide.sections.map((section) => {
      if (!section.table?.endsAt) return section;
      const table = { ...section.table, rows: section.table.rows.filter((row, index) => section.table.endsAt[index] >= asOfDate) };
      return { ...section, table, paragraphs: table.rows.length ? section.paragraphs : ["No upcoming dates remain from the programme reviewed on 11 October 2026. Check the official provider for any new programme."] };
    });
    return {
      ...guide,
      sections,
      noindex: Boolean(expired),
      actions: expired ? [] : guide.actions,
      eyebrow: expired ? "Past event reference" : "FreeHub practical guide",
      intro: expired ? "The dates covered by this page have ended. Use it as a past-event reference and check the provider for a new programme." : guide.intro,
      trustItems: [`Sources checked ${guide.lastReviewed}`, "Costs and conditions explained", expired ? "Dates have ended" : "Official routes linked"],
    };
  });
}

module.exports = { getReviewedGuides };
