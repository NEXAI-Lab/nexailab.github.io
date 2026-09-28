(() => {
  const currentYear = new Date().getFullYear();
  document.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = String(currentYear);
  });

  const navToggle = document.querySelector(".nav-toggle");
  const mainNav = document.querySelector("#main-nav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
      const open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!open));
      mainNav.classList.toggle("is-open", !open);
    });
    mainNav.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        navToggle.setAttribute("aria-expanded", "false");
        mainNav.classList.remove("is-open");
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        navToggle.setAttribute("aria-expanded", "false");
        mainNav.classList.remove("is-open");
      }
    });
  }

  const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

  const safeHttpUrl = (value) => {
    if (!value) return null;
    try {
      const url = new URL(value, window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  };

  const fetchJSON = async (path) => {
    const response = await fetch(path);
    if (!response.ok) throw new Error("Data request failed");
    return response.json();
  };

  const showLoadError = (selector, message) => {
    document.querySelectorAll(selector).forEach((node) => {
      node.innerHTML = '<p class="empty-state">' + escapeHTML(message) + "</p>";
    });
  };

  const renderProject = (project, heading = "h3") =>
    '<article class="project-card"><' + heading + '>' + escapeHTML(project.title) +
    "</" + heading + "><p>" + escapeHTML(project.description) + "</p></article>";

  const projectPromise = document.querySelector("[data-projects-list], [data-projects-preview]")
    ? fetchJSON("/data/projects.json")
    : Promise.resolve(null);
  projectPromise.then((projects) => {
    if (!projects) return;
    document.querySelectorAll("[data-projects-list]").forEach((node) => {
      node.innerHTML = projects.map((project) => renderProject(project, "h2")).join("");
    });
    document.querySelectorAll("[data-projects-preview]").forEach((node) => {
      node.innerHTML = projects.slice(0, 3).map((project) => renderProject(project, "h3")).join("");
    });
  }).catch(() => {
    showLoadError("[data-projects-list], [data-projects-preview]", "Project information could not be loaded.");
  });

  const initials = (name) => {
    const clean = name.replace(/^(Prof\.|Dr\.|MSc\.)\s*/i, "").trim();
    return clean.split(/[\s-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  };

  const profileLabels = {
    website: "Website",
    orcid: "ORCID",
    linkedin: "LinkedIn",
    github: "GitHub"
  };

  const renderPerson = (person, heading = "h2") => {
    const photo = safeHttpUrl(person.photo);
    const avatar = photo
      ? '<img class="person-avatar person-photo" src="' + escapeHTML(photo) + '" alt="' + escapeHTML(person.name) + '">'
      : '<span class="person-avatar" aria-hidden="true">' + escapeHTML(initials(person.name)) + "</span>";
    const scholarUrl = safeHttpUrl(person.links?.googleScholar);
    const links = Object.entries(person.links || {}).filter(([key]) => key !== "googleScholar").map(([key, value]) => {
      const url = safeHttpUrl(value);
      return url
        ? '<a href="' + escapeHTML(url) + '" target="_blank" rel="noopener noreferrer">' + escapeHTML(profileLabels[key] || key) + "</a>"
        : "";
    }).join("");
    const subheading = heading === "h2" ? "h3" : "h4";
    const responsibilities = person.responsibilities?.length
      ? '<ul class="person-responsibilities">' + person.responsibilities.map((item) => "<li>" + escapeHTML(item) + "</li>").join("") + "</ul>"
      : "";
    return '<article class="person-card"><div class="person-top">' + avatar +
      '<div><' + heading + ">" + (scholarUrl
        ? '<a href="' + escapeHTML(scholarUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHTML(person.name) + "</a>"
        : escapeHTML(person.name)) + "</" + heading + ">" +
      '<p class="person-affiliation">' + escapeHTML(person.affiliation) + "</p>" +
      (person.role ? '<p class="person-role">' + escapeHTML(person.role) + "</p>" : "") +
      "</div></div><" + subheading + ' class="person-section-heading">Research interests</' +
      subheading + '><ul class="topic-list">' +
      (person.interests || []).map((interest) => "<li>" + escapeHTML(interest) + "</li>").join("") +
      "</ul>" + responsibilities + (links ? '<div class="person-links">' + links + "</div>" : "") + "</article>";
  };

  const peoplePromise = document.querySelector("[data-people-list], [data-people-preview], [data-publications-all], [data-publications-preview]")
    ? fetchJSON("/data/people.json")
    : Promise.resolve(null);
  peoplePromise.then((people) => {
    if (!people) return;
    document.querySelectorAll("[data-people-list]").forEach((node) => {
      node.innerHTML = people.map((person) => renderPerson(person, "h2")).join("");
    });
    document.querySelectorAll("[data-people-preview]").forEach((node) => {
      const head = people.find((person) => person.role === "Head of NEXAI Lab");
      const preview = [head, ...people.filter((person) => person !== head)].filter(Boolean).slice(0, 3);
      node.innerHTML = preview.map((person) => renderPerson(person, "h3")).join("");
    });
  }).catch(() => {
    showLoadError("[data-people-list], [data-people-preview]", "People information could not be loaded.");
  });

  const sortPublications = (items) => [...items].sort((a, b) => (b.year || 0) - (a.year || 0));
  const normalizeName = (name) => name
    .replace(/^(Prof\.|Dr\.|MSc\.)\s*/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  const authorMarkup = (authors, people) => {
    if (!authors?.length) return "Authors not provided";
    const labNames = new Set(people.map((person) => normalizeName(person.name)));
    return authors.map((author) => labNames.has(normalizeName(author))
      ? "<strong>" + escapeHTML(author) + "</strong>"
      : escapeHTML(author)).join(", ");
  };

  const doiUrl = (doi) => "https://doi.org/" + String(doi).replace(/%2F/gi, "/");

  const renderPublication = (publication, people, heading = "h3") => {
    const areas = publication.researchAreas || [];
    const topics = publication.topics || [];
    const links = [];
    if (safeHttpUrl(publication.paper)) {
      links.push('<a href="' + escapeHTML(safeHttpUrl(publication.paper)) + '" target="_blank" rel="noopener noreferrer">Paper</a>');
    }
    for (const [key, label] of [["code", "Code"], ["project", "Project page"]]) {
      const url = safeHttpUrl(publication[key]);
      if (url) links.push('<a href="' + escapeHTML(url) + '" target="_blank" rel="noopener noreferrer">' + label + "</a>");
    }
    const metadata = [
      ...areas.map((area) => '<span class="tag">' + escapeHTML(area) + "</span>"),
      ...(publication.type ? ['<span class="tag">' + escapeHTML(publication.type) + "</span>"] : []),
      ...topics.map((topic) => '<span class="tag">' + escapeHTML(topic) + "</span>")
    ].join("");
    const venue = publication.venue
      ? '<p class="publication-venue">' + escapeHTML(publication.venue) + "</p>"
      : "";
    const doi = publication.doi
      ? '<p class="publication-doi"><a href="' + escapeHTML(doiUrl(publication.doi)) + '" target="_blank" rel="noopener noreferrer">DOI: ' + escapeHTML(publication.doi) + "</a></p>"
      : "";
    return '<article class="publication-card"><div class="publication-year">' +
      escapeHTML(publication.year ?? "n.d.") + '</div><div>' + venue + '<' + heading + ">" +
      escapeHTML(publication.title) + "</" + heading + '><p class="publication-authors">' +
      authorMarkup(publication.authors, people) + "</p>" + doi +
      (metadata ? '<div class="publication-meta">' + metadata + "</div>" : "") +
      (links.length ? '<div class="publication-links">' + links.join("") + "</div>" : "") +
      "</div></article>";
  };

  const publicationPromise = document.querySelector("[data-publications-all], [data-publications-preview]")
    ? Promise.all([fetchJSON("/data/publications.json"), peoplePromise])
    : Promise.resolve(null);

  publicationPromise.then((result) => {
    if (!result) return;
    const [publications, people] = result;
    const sorted = sortPublications(publications);

    document.querySelectorAll("[data-publications-preview]").forEach((node) => {
      node.innerHTML = sorted.slice(0, 4).map((publication) => renderPublication(publication, people, "h3")).join("");
    });

    const list = document.querySelector("[data-publications-all]");
    if (!list) return;
    const search = document.querySelector("[data-publication-search]");
    const yearFilter = document.querySelector("[data-filter-year]");
    const areaFilter = document.querySelector("[data-filter-area]");
    const typeFilter = document.querySelector("[data-filter-type]");
    const count = document.querySelector("[data-publication-count]");

    const addOptions = (select, values) => {
      const unique = [...new Set(values)].sort((a, b) => String(b).localeCompare(String(a), undefined, { numeric: true }));
      for (const value of unique) {
        const option = document.createElement("option");
        option.value = value === null ? "__none" : String(value);
        option.textContent = value === null ? "Not specified" : String(value);
        select.append(option);
      }
    };
    addOptions(yearFilter, sorted.map((publication) => publication.year ?? null));
    addOptions(areaFilter, sorted.flatMap((publication) => publication.researchAreas || []));
    addOptions(typeFilter, sorted.map((publication) => publication.type ?? null));

    const update = () => {
      const query = search.value.trim().toLowerCase();
      const year = yearFilter.value;
      const area = areaFilter.value;
      const type = typeFilter.value;
      const visible = sorted.filter((publication) => {
        const searchText = [publication.title, ...(publication.authors || [])].join(" ").toLowerCase();
        const matchesSearch = !query || searchText.includes(query);
        const matchesYear = !year || (year === "__none" ? publication.year == null : String(publication.year) === year);
        const matchesArea = !area || (publication.researchAreas || []).includes(area);
        const matchesType = !type || (type === "__none" ? publication.type == null : publication.type === type);
        return matchesSearch && matchesYear && matchesArea && matchesType;
      });
      list.innerHTML = visible.length
        ? visible.map((publication) => renderPublication(publication, people, "h2")).join("")
        : '<p class="empty-state">No publications match these filters.</p>';
      count.textContent = visible.length + (visible.length === 1 ? " publication" : " publications");
    };
    search.addEventListener("input", update);
    [yearFilter, areaFilter, typeFilter].forEach((control) => control.addEventListener("change", update));
    update();
  }).catch(() => {
    showLoadError("[data-publications-all], [data-publications-preview]", "Publication information could not be loaded.");
    const count = document.querySelector("[data-publication-count]");
    if (count) count.textContent = "Publication data could not be loaded.";
  });
})();
