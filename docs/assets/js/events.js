console.log("executing:", "events.js");

import { openEventModal } from "./modal.js";

/* === VARIABLES === */
const today = startOfDay(new Date());
const tomorrow = addDays(today, 1);
const thisSunday = getSunday(today);
const nextMonday = addDays(thisSunday, 1);
const nextSunday = getSunday(nextMonday);

const filterNoticeError = document.getElementById("filter-error");
const filterNoticeErrorText = filterNoticeError.querySelector("#text");
const filterToggle = document.getElementById("filter-toggle");
const filterPanel = document.getElementById("filter-panel");
const filterCatChoices = filterPanel.querySelector("#filter-category");
const filterParentalGuideChoices = filterPanel.querySelector("#filter-parental-guide");
const tagContainer = document.getElementById("tag-container");
const tagInput = document.getElementById("tag-input");

const eventModal = document.getElementById("event-modal");
const eventModalContent = document.getElementById("event-modal-content");

let user_profile = null;
let tags = [];
let EVENTS = [];
let filters = APP_CONFIG.DEFAULT_FILTER;

/* === FUNCTIONS === */
function groupEvents(events) {
    const groups = {
        today: [],
        thisWeek: [],
        nextWeek: [],
        future: []
    };

    events.forEach(event => {
        const eventDate = startOfDay(new Date(event.event_date));

        if (eventDate.getTime() === today.getTime()) {
            groups.today.push(event);
        }
        else if (eventDate > today && eventDate <= thisSunday) {
            groups.thisWeek.push(event);
        }
        else if (eventDate >= nextMonday && eventDate <= nextSunday) {
            groups.nextWeek.push(event);
        }
        else if (eventDate > nextSunday) {
            groups.future.push(event);
        }
    });

    return groups;
}

function hideErrorMessages() {
    filterNoticeError.classList.add("hidden");
}

function showFilterError(message) {
    filterNoticeError.classList.remove("hidden");
    filterNoticeErrorText.innerText = message;
    filterNoticeError.focus();
}

function initFilters() {
    tags = [];
    renderTags();

    /* Configure categories */
    Object.keys(APP_CONFIG.CATEGORIES).forEach(key => {
        const category = APP_CONFIG.CATEGORIES[key];

        const label = document.createElement("label");
        label.className = "category-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = category;
        checkbox.name = "categories";

        label.appendChild(checkbox);
        label.append(" " + category);

        filterCatChoices.appendChild(label); 
    });

    /* Configure parental guide */
    Object.keys(APP_CONFIG.PARENTAL_GUIDE).forEach(key => {
        const pg = APP_CONFIG.PARENTAL_GUIDE[key];

        const label = document.createElement("label");
        label.className = "pg-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = pg;
        checkbox.name = "pg";

        label.appendChild(checkbox);
        label.append(" " + pg);

        filterParentalGuideChoices.appendChild(label); 
    });

}

function addTag(value) {
    const tag = value.trim().toLowerCase();

    if (!tag || tags.includes(tag)) {
        return;
    }

    tags.push(tag);
    renderTags();
}

function removeTag(tagToRemove) {
    tags = tags.filter(tag => tag !== tagToRemove);
    renderTags();
}

function renderTags() {
    // Remove existing chips
    tagContainer
        .querySelectorAll(".tag-chip")
        .forEach(el => el.remove());

    // Add chips before the input
    tags.forEach(tag => {
        const chip = document.createElement("span");
        chip.className = "tag-chip";
        chip.textContent = tag;

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.innerHTML = "&times;";
        removeBtn.addEventListener("click", () => {
            removeTag(tag);
        });

        chip.appendChild(removeBtn);
        tagContainer.insertBefore(chip, tagInput);
    });

    tagInput.value = "";
    
}

function renderEventData(event, details = false) {
    const eventData = event;

    eventData.timeHtml = event.event_start_time
        ? renderMaterialIconText("schedule", formatTimeForUI(event.event_start_time))
        : "";

    eventData.tagsHtml = event.tags && event.tags.length
        ? `
            <div class="event-tags">
                ${event.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}
            </div>
        `
        : "";

    eventData.imageHtml = event.image_url
        ? ` <div class="event-image-wrapper"><img src="${event.image_url}" class="event-thumbnail" loading="lazy" alt="Event image"></div>`
        : "";

    eventData.price = "Gratuit";
    if (event.is_free_price) {
        eventData.price = "Participation libre";
    } else if (event.min_price && event.max_price) {
        eventData.price = event.min_price + " à " + event.max_price + " €";
    } else if (event.max_price) {
        eventData.price = event.max_price + " €";
    }

    switch (event.parental_guide)
    {
        case 1:
            eventData.parentalGuideHtml = renderMaterialIconText("child_friendly", APP_CONFIG.PARENTAL_GUIDE[1]);
            break;
        case 2:
            eventData.parentalGuideHtml = renderMaterialIconText("no_stroller", APP_CONFIG.PARENTAL_GUIDE[2]);
            break;
        default:
            eventData.parentalGuideHtml = renderMaterialIconText("child_hat", APP_CONFIG.PARENTAL_GUIDE[0]);
    }

    eventData.categoryLabel = APP_CONFIG.CATEGORIES[event.category]

    eventData.date = formatDateForUI(event.event_date);

    if (details) {
        // render extra information for event modal
        eventData.addressHtml = event.location_address
            ? renderMaterialIconText("distance", event.location_address)
            : "";

        eventData.phoneHtml = event.phone
            ? renderMaterialIconText("call", event.phone)
            : "";

        eventData.siteUrlHtml = event.site_url
            ? renderMaterialIconText("language", linkify(event.site_url))
            : "";

        eventData.eatHtml = event.to_eat
            ? renderMaterialIconText("fork_spoon", "À manger sur place")
            : "";

        eventData.descriptionHtml = event.long_description
            ? `
            <hr>
            <p id="modal-description" class="modal-description">${linkify(eventData.long_description)}</p>
            `
            : "";
    }

    return eventData;
}

function renderEventTile(event) {
    const eventData = renderEventData(event);

    return `
        <div class="event-tile" role="link" tabindex="0" data-event-id="${eventData.id}">
            ${eventData.imageHtml}
            <div class="event-content" >
                <div class="event-title">${event.title}</div>
                <div class="event-meta">
                    ${renderMaterialIconText("stars", eventData.categoryLabel)}
                    ${eventData.parentalGuideHtml}
                </div>
                <div class="event-meta">
                    ${renderMaterialIconText("event", eventData.date)}
                    ${eventData.timeHtml}
                    ${renderMaterialIconText("sell", eventData.price)}
                </div>
                <div class="event-meta">
                    ${renderMaterialIconText("place", event.location_name)}
                </div>
                ${eventData.tagsHtml}
            </div>
        </div>
    `;
}

function renderEventModal(event) {
    const eventData = renderEventData(event, true);

    if (user_profile && user_profile.id && ( (user_profile.id === eventData.created_by) || (user_profile.role === 2)))
    {
        eventModal.querySelector("#modal-actions").classList.remove("hidden");
    }
    else
    {
        eventModal.querySelector("#modal-actions").classList.add("hidden");
    }

    eventModalContent.innerHTML = `
        ${eventData.imageHtml}
        <div id="modal-title" class="event-title">${event.title}</div>
        <div class="event-meta">
            ${renderMaterialIconText("stars", eventData.categoryLabel)}
            ${eventData.parentalGuideHtml}
        </div>
        <div class="event-meta">
            ${renderMaterialIconText("event", eventData.date)}
            ${eventData.timeHtml}
            ${renderMaterialIconText("sell", eventData.price)}
            ${eventData.eatHtml}
        </div>
        <div class="event-meta">
            ${renderMaterialIconText("place", event.location_name)}
            ${eventData.addressHtml}
        </div>
        <div class="event-meta">
            ${eventData.siteUrlHtml}
            ${eventData.phoneHtml}
        </div>
        ${eventData.tagsHtml}
        ${eventData.descriptionHtml}
        
    `;
}

function renderSection(sectionTitle, subtitle, events) {
    if (events.length === 0) {
        return "";
    }

    return `
        
        <div class="section-header">
            <span class="section-title">${sectionTitle}</span>
            <br>
            <span class="section-subtitle">${subtitle}</span>
        </div>
        <div class="event-list">
            ${events.map(renderEventTile).join("")}
        </div>
    `;
}

async function loadEvents() {
    if (!window.supabaseClient) {
        console.error("Supabase not initialized");
        return;
    }

    /* get session info */
    const session = await getSessionUserProfile();
    if (session?.profile) {
        user_profile = session.profile;
    }

    const container = document.getElementById("events");
    const header = document.getElementById("event-list-header");
    const filter = document.getElementById("event-filter");

    EVENTS = [];

    let query = window.supabaseClient
        .from("future_events")
        .select("*")
        .eq("pending", false)

    if (filters.from) {
        query = query.gte("event_date", filters.from);
    }

    if (filters.to) {
        query = query.lte("event_date", filters.to);
    }

    if (filters.categories) {
        query = query.in("category", filters.categories);
    }

    if (filters.pg) {
        query = query.in("parental_guide", filters.pg);
    }

    if (filters.tags) {
        query = query.overlaps("tags", filters.tags);
    }

    const { data, error } = await query.order("event_date", { ascending: true });

    console.log("Data:", events);
    console.log("Error:", error);

    if (error) {
        container.innerText = "ERREUR survenue durant le chargement des évènements";
        return;
    }
    if (!events || events.length === 0) {
        container.innerText = "Pas d'évènements prévus";
        return;
    }

    EVENTS = data;

    const grouped = groupEvents(EVENTS);

    grouped.today = sortByDate(grouped.today);
    grouped.thisWeek = sortByDate(grouped.thisWeek);
    grouped.nextWeek = sortByDate(grouped.nextWeek);
    grouped.future = sortByDate(grouped.future);

    header.classList.remove("hidden");
    filter.classList.remove("hidden");
    
    container.innerHTML =
        renderSection("Aujourd'hui", formatDateForUI(today), grouped.today) +
        renderSection("Cette semaine", formatDateRange(tomorrow, thisSunday), grouped.thisWeek) +
        renderSection("Semaine prochaine", formatDateRange(nextMonday, nextSunday), grouped.nextWeek) +
        renderSection("Prochainement", "Après le " + formatDateForUI(nextSunday), grouped.future);
}

/* === LISTENERS === */

/* FILTERS */
filterToggle.addEventListener("click", (event) => {
    event.preventDefault();
    const isOpen = filterToggle.getAttribute("aria-expanded") === "true";

    filterToggle.setAttribute("aria-expanded", String(!isOpen));

    if (isOpen) {
        filterPanel.setAttribute("hidden", "");
    } else {
        filterPanel.removeAttribute("hidden");
    }
});

document.getElementById("reset-filters").addEventListener("click", (event) => {
    event.preventDefault();
    const form = event.target;

    hideErrorMessages();

    /* remove all filters */
    tags = [];
    filters = APP_CONFIG.DEFAULT_FILTER;
    renderTags();
    document.getElementById("filter-form").reset();

    /* hide panel abd load events */
    filterToggle.setAttribute("aria-expanded", "false");
    filterPanel.setAttribute("hidden", "");
    loadEvents();
});

document.getElementById("filter-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.target;

    hideErrorMessages();

    const selectedCategories = Array.from(
        form.querySelectorAll('input[name="categories"]:checked')
    ).map(cb => getCategoryId(cb.value));

    const selectedPg = Array.from(
        form.querySelectorAll('input[name="pg"]:checked')
    ).map(cb => getPgId(cb.value));

    const from = form.from.value;
    const to = form.to.value;

    // checks tags
    tags.forEach(tag => {
        // if (!/^[a-z0-9-_]+$/.test(tag)) {
        //     showFilterError("Mauvais format pour les tags")
        // }
        // return;
    });

    // check dates
    if (from) {
        if (new Date(from) < today) {
            showFilterError("La date de début doit être supérieure aujourd'hui");
            return;
        }
    }if (to) {
        if (new Date(from) < today) {
            showFilterError("La date de fin doit être supérieure aujourd'hui");
            return;
        }
    }
    if (from && to) {
        if (new Date(to) < new Date(from)) {
            showFilterError("La date de fin doit être supérieure ou égale à la date de début");
            return;
        }
    }

    filters = {
        categories: selectedCategories.length ? selectedCategories : null,
        pg: selectedPg.length ? selectedPg : null,
        tags: tags.length ? tags : null,
        from: from || null,
        to: to || null
    };

    console.log("filter:", filters);
    
    /* hide panel abd load events */
    filterToggle.setAttribute("aria-expanded", "false");
    filterPanel.setAttribute("hidden", "");
    loadEvents();
});

/* HANDLE TAGS */
/* Handle typing */
tagInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag(tagInput.value);
    }

    if (e.key === "Backspace" && tagInput.value === "" && tags.length) {
        removeTag(tags[tags.length - 1]);
    }
});

/* Handle blur (optional) */
tagInput.addEventListener("blur", () => {
    addTag(tagInput.value);
});

/* Focus input when clicking container */
tagContainer.addEventListener("click", () => {
    tagInput.focus();
});

/* open event modal */
document.addEventListener("click", (e) => {
    const tile = e.target.closest(".event-tile");
    if (!tile) return;

    const id = tile.dataset.eventId;
    const event = EVENTS.find(e => e.id === id);
    if (!event) return;

    console.log("EVENT:", event);
    renderEventModal(event, true);    
    openEventModal(event);
});

/* === MAIN === */
hideErrorMessages();
initFilters();
loadEvents();
