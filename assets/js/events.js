console.log("executing:", "events.js");

import { openEventModal } from "./modal.js";
import { tagInput, userTags, clearTags } from "./tags.js";

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

const eventModal = document.getElementById("event-modal");
const eventModalContent = document.getElementById("event-modal-content");

let user_profile = null;
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
    clearTags();

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

function renderEventTile(event) {
    const eventData = renderEventData(event);

    return `
        <div class="event-tile" role="link" tabindex="0" data-event-id="${eventData.id}">
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

function renderSection(sectionId, sectionTitle, subtitle, events) {
    if (events.length === 0) {
        return `
        <div id="event-${sectionId}" class="section-tab empty hidden">
            <div class="section-header">
                <span class="section-title">${sectionTitle}</span>
                <br>
                <span class="section-subtitle">${subtitle}</span>
            </div>
            <div class="event-list">
                <h6>Pas d'évènements</h6>
            </div>
        </div>
        `;
    }

    return `
        <div id="event-${sectionId}" class="section-tab no-empty">
            <div class="section-header">
                <span class="section-title">${sectionTitle}</span>
                <br>
                <span class="section-subtitle">${subtitle}</span>
            </div>
            <div class="event-list">
                ${events.map(renderEventTile).join("")}
            </div>
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
    const tabs = document.getElementById("event-tabs");
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

    if (error) {
        console.log("Error:", error);
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
    tabs.classList.remove("hidden");
    filter.classList.remove("hidden");
    
    container.innerHTML =
        renderSection("today", "Aujourd'hui", formatDateForUI(today), grouped.today) +
        renderSection("this-week", "Cette semaine", formatDateRange(tomorrow, thisSunday), grouped.thisWeek) +
        renderSection("next-week", "Semaine prochaine", formatDateRange(nextMonday, nextSunday), grouped.nextWeek) +
        renderSection("later", "Prochainement", "Après le " + formatDateForUI(nextSunday), grouped.future);
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
    filters = APP_CONFIG.DEFAULT_FILTER;
    clearTags();
    document.getElementById("filter-form").reset();

    /* hide panel abd load events */
    filterToggle.setAttribute("aria-expanded", "false");
    filterPanel.setAttribute("hidden", "");
    loadEvents();
});

document.addEventListener("click", (e) => {
    const tab = e.target.closest(".events-tabs .tab");
    if (!tab) return;

    const wasActive = tab.classList.contains("active");

    // reset everything
    document.querySelectorAll(".events-tabs .tab")
        .forEach(t => t.classList.remove("active"));

    if (wasActive) {
        // No tab active → show ALL sections
        document.querySelectorAll(".section-tab.empty")
        .forEach(section => section.classList.add("hidden"));
        document.querySelectorAll(".section-tab.no-empty")
        .forEach(section => section.classList.remove("hidden"));
        return;
    }

    // Activate clicked tab
    tab.classList.add("active");
 
    // Show only its section
    document.querySelectorAll(".section-tab")
        .forEach(section => section.classList.add("hidden"));

    const target = tab.dataset.target;

    document
        .getElementById(`event-${target}`)
        ?.classList.remove("hidden");

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
    userTags.forEach(tag => {
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
        tags: userTags.length ? userTags : null,
        from: from || null,
        to: to || null
    };

    console.log("filter:", filters);
    
    /* hide panel abd load events */
    filterToggle.setAttribute("aria-expanded", "false");
    filterPanel.setAttribute("hidden", "");
    loadEvents();
});

/* open event modal */
document.addEventListener("click", (e) => {
    const tile = e.target.closest(".event-tile");
    if (!tile) return;

    const id = tile.dataset.eventId;
    const event = EVENTS.find(e => e.id === id);
    if (!event) return;

    renderEventModal(event);
    openEventModal(event);
});

/* === MAIN === */
hideErrorMessages();
initFilters();
loadEvents();
