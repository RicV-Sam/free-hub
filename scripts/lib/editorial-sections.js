function createEditorialSectionsRenderer({ escapeHtml, escapeAttribute, isLinkAvailable = () => true }) {
  function renderLink(link, newTab = false) {
    if (!link || !/^(?:https?:\/\/|mailto:|tel:|\/(?!\/)|#)/.test(link.href || "")) {
      throw new Error(`Editorial link has an unsupported destination: ${link?.href || "missing"}`);
    }
    return `<a href="${escapeAttribute(link.href)}"${newTab ? ' target="_blank" rel="noopener noreferrer"' : ""}>${escapeHtml(link.label)}</a>`;
  }

  function renderCell(cell) {
    return cell && typeof cell === "object" ? renderLink(cell) : escapeHtml(String(cell));
  }

  function renderSections(sections = []) {
    return sections.map((section) => `<article class="trust-page__section"${section.id ? ` id="${escapeAttribute(section.id)}"` : ""}>
      <h2>${escapeHtml(section.heading)}</h2>
      ${(section.paragraphs || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n")}
      ${section.table && section.table.rows.length ? `${section.table.headers.length > 2 ? '<p class="table-scroll-hint">Swipe across the table to see all columns.</p>' : ""}<div class="table-scroll" role="region" aria-label="${escapeAttribute(section.table.caption)}" tabindex="0"><table class="guide-table${section.table.headers.length === 2 ? " guide-table--compact" : ""}"><caption>${escapeHtml(section.table.caption)}</caption><thead><tr>${section.table.headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${section.table.rows.map((row) => `<tr>${row.map((cell, index) => index === 0 ? `<th scope="row">${renderCell(cell)}</th>` : `<td>${renderCell(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}
      ${(section.sources || []).map((source) => `<p>${renderLink(source, true)}</p>`).join("\n")}
    </article>`).join("\n");
  }

  function renderListingDetails(details) {
    if (!details) return "";
    const relatedLinks = (details.relatedLinks || []).filter(isLinkAvailable);
    return `<section class="trust-page__content trust-page__content--tables" aria-label="Practical checks and related pages">
      ${renderSections(details.sections)}
      ${relatedLinks.length ? `<nav class="internal-links" aria-label="Related FreeHub pages"><p class="internal-links__title">Keep exploring</p><div class="internal-links__list">${relatedLinks.map((link) => renderLink(link)).join("\n")}</div></nav>` : ""}
    </section>`;
  }

  return { renderSections, renderListingDetails };
}

module.exports = { createEditorialSectionsRenderer };
