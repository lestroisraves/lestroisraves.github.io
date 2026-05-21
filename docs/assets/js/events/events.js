console.log("executing:", "events.js");

import { openErrorModal, openEventModal } from "../global/modal.js";
import { tagInput, userTags, clearTags } from "../global/tags.js";

/* === VARIABLES === */
const hash = window.location.hash.substring(1);
const params = new URLSearchParams(hash);
let eventId = params.get("id");
history.replaceState(null, "", window.location.pathname + window.location.search);

const loading = document.getElementById("loading-screen");
const container = document.getElementById("events");
const search = document.getElementById("event-search");
const tabs = document.getElementById("event-tabs");
const catTabs = document.getElementById("category-tabs");
const filter = document.getElementById("event-filter");
const emptyState = document.getElementById("empty-state");

const today = startOfDay(new Date());
const tomorrow = addDays(today, 1);
const afterTomorrow = addDays(today, 2);
const thisSunday = getSunday(today);
const nextMonday = addDays(thisSunday, 1);
const nextSunday = getSunday(nextMonday);

const filterToggle = document.getElementById("filter-toggle");
const filterPanel = document.getElementById("filter-panel");
const filterForm = document.getElementById("filter-form");
const filterCatChoices = filterPanel.querySelector("#filter-category");
const filterParentalGuideChoices = filterPanel.querySelector("#filter-parental-guide");

let user_profile = null;
let EVENTS = [];
let filters = APP_CONFIG.DEFAULT_FILTER;

/* === LOCAL FUNCTIONS === */
function groupEvents(events) {
    const groups = {
        today: [],
        tomorrow: [],
        later: []
    };

    events.forEach(event => {
        const eventDate = startOfDay(new Date(event.event_date));

        if (eventDate.getTime() === today.getTime()) {
            groups.today.push(event);
        }
        else if (eventDate == tomorrow) {
            groups.tomorrow.push(event);
        }
        else if (eventDate > tomorrow) {
            groups.later.push(event);
        }
    });

    return groups;
}

function initHeader() {
    /* init category tabs */
    Object.keys(APP_CONFIG.CATEGORIES).forEach(key => {
        const catTab = document.createElement("div");
        catTab.className = `catTab cat-${key}`;
        catTab.setAttribute("data-subtitle", APP_CONFIG.CATEGORIES[key]["label"])
        const btn = document.createElement("button");
        btn.id = "cat-tab";
        btn.className = `tab category cat-${key}`;
        btn.setAttribute("data-action", "select-cat-tab");
        btn.setAttribute("data-target", key);
        btn.innerText = APP_CONFIG.CATEGORIES[key]["icon"];
        catTab.appendChild(btn); 
        catTabs.appendChild(catTab); 
    });

    /* init Filter */
    clearTags();

    /* Configure categories */
    Object.keys(APP_CONFIG.CATEGORIES).forEach(key => {
        const category = APP_CONFIG.CATEGORIES[key]["label"];

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

function updateEmptyState() {
    document.querySelectorAll(".section-tab.no-empty.selected").forEach( section => {
        const sectionHasVisibleTile = [...section.querySelectorAll(".event-tile")]
            .some(tile => !tile.classList.contains("hidden"))
        section.hidden = !sectionHasVisibleTile;
    });

    const hasAnyVisibleTile = [...document.querySelectorAll(".section-tab.no-empty")]
        .filter(section => !section.hidden)
        .some(section => 
            [...section.querySelectorAll(".event-tile")]
                .some(tile => !tile.classList.contains("hidden"))
        );
    if (hasAnyVisibleTile) {
        emptyState.classList.add("hidden");
    } else {
        emptyState.classList.remove("hidden");
    }
    // document.getElementById("empty-state").hidden = hasAnyVisibleTile;
}

function renderSection(sectionId, sectionTitle, subtitle, events) {
    if (events.length === 0) {
        return `
        <div class="section-tab empty selected" data-id="${sectionId}">
            <div class="section-header">
                <span class="section-title">${sectionTitle}</span>
                <br>
                <span class="section-subtitle">${subtitle}</span>
            </div>
            <div class="event-list"></div>
        </div>
        `;
    }

    return `
        <div class="section-tab section-${sectionId} no-empty selected" data-id="${sectionId}">
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

function renderEventTile(event) {
    const eventData = renderEventData(event);

    return `
        <div class="event-tile category-${eventData.category}" style="border-color: ${APP_CONFIG.CATEGORIES[eventData.category]["color"]}" data-action="show-event" role="link" tabindex="0" data-event-id="${eventData.id}">
            <div class="event-content" >
                <div class="event-title">${event.title}</div>
                ${eventData.categoryHtml}
                <div class="event-meta place">
                    ${eventData.locationHtml}
                    ${renderMaterialIconText("event", formatEventDateTime(eventData.event_date, eventData.event_start_time))}
                </div>
                <div class="event-meta">
                    ${renderMaterialIconText("sell", eventData.price)}
                    ${eventData.parentalGuideHtml}
                </div>
                ${eventData.tagsHtml}
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
    grouped.tomorrow = sortByDate(grouped.tomorrow);
    grouped.later = sortByDate(grouped.later);
    
    container.innerHTML =
        renderSection("today", "Aujourd'hui", formatEventDate(today), grouped.today) +
        renderSection("tomorrow", "Demain", formatEventDate(tomorrow), grouped.tomorrow) +
        renderSection("later", "Prochainement", "Dès le " + formatEventDate(afterTomorrow), grouped.later);

    updateEmptyState();
    
    tabs.classList.remove("hidden");
    catTabs.classList.remove("hidden");
    search.hidden = false;
    // filter.hidden = false;
    container.hidden = false;
    loading.style.display = "none";

    if (eventId) {
        console.log("show event id:", eventId);
        const el = container.querySelector(`[data-event-id="${eventId}"]`);
        if (!el) return;
        el.scrollIntoView();
        el.focus();
        el.click();
        eventId = null;
    }

}

function renderEventSuggestion(event) {
    const eventData = renderEventData(event);
    const html = `
        <div class="event-suggestion-title non-wrap">${event.title}</div>
        <div class="event-suggestion-meta non-wrap">
            <div style="color: ${APP_CONFIG.CATEGORIES[eventData.category]["color"]};">${APP_CONFIG.CATEGORIES[eventData.category]["label"]}</div>
            .
            <div>${formatEventDateTime(eventData.event_date)}</div>
            .
            <div class>${eventData.location_name}</div>
        </div>
    `
    return html;
}

/* === EXPORTED FUNCTIONS === */
export function openEvent(eventId) {
    const event = EVENTS.find(e => e.id === eventId);
    if (!event) return;
    openEventModal(event, "classic", user_profile);
}

export function searchInput(input) {
    const container = input.closest(".autocomplete");
    const suggestions = container.querySelector(".suggestions");
    const searchValue = input.value.toLowerCase().trim();
    suggestions.innerHTML = "";

    if (searchValue.length < 2) {
        input.classList.remove("looking");
        suggestions.classList.add("hidden");
        return;
    }

    /* serach matches */
    const matches = EVENTS.filter(event => {
            const v = searchValue.toLowerCase();
            const found =  (
                !event.pending &&
                (event.title.toLowerCase().includes(v) ||
                event.location_name.toLowerCase().includes(v) ||
                event.tags.some(tag => tag.toLowerCase().includes(v))))
            
            if (found) {
                const el = document.querySelector(`[data-event-id="${event.id}"]`);
                if (!el) return false;
                return !el.classList.contains("hidden");
            }
            return false;

        }
    ).slice(0, 5); // limit results

    if (matches.length === 0) {
        input.classList.remove("looking");
        suggestions.classList.add("hidden");
        return;
    }

    for (const item of matches) {
        const div = document.createElement("div");
        div.className = "event-suggestion"
        div.dataset.id = item.id;
        div.innerHTML = renderEventSuggestion(item)

        div.addEventListener("click", () => {
            input.classList.remove("looking");
            suggestions.classList.add("hidden");
            input.value = "";
            console.log("select event", item.title, item.event_date);
            const el = document.querySelector(`[data-event-id="${item.id}"]`);
            if (!el) return;
            el.scrollIntoView();
            el.focus();
            el.click();
            return;
        });

        suggestions.appendChild(div);
    }

    input.classList.add("looking");
    suggestions.classList.remove("hidden");
}

export function resetFilter() {
    filters = APP_CONFIG.DEFAULT_FILTER;
    clearTags();
    filterForm.reset();
    filterToggle.click();
    loadEvents();
}

export function applyFilter() {
    const selectedCategories = Array.from(
        filterForm.querySelectorAll('input[name="categories"]:checked')
    ).map(cb => getCategoryId(cb.value));

    const selectedPg = Array.from(
        filterForm.querySelectorAll('input[name="pg"]:checked')
    ).map(cb => getPgId(cb.value));

    const from = filterForm.from.value;
    const to = filterForm.to.value;

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
            openErrorModal("La date de début doit être supérieure aujourd'hui");
            return;
        }
    }if (to) {
        if (new Date(from) < today) {
            openErrorModal("La date de fin doit être supérieure aujourd'hui");
            return;
        }
    }
    if (from && to) {
        if (new Date(to) < new Date(from)) {
            openErrorModal("La date de fin doit être supérieure ou égale à la date de début");
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
    
    /* hide panel abd load events */
    filterToggle.click();
    loadEvents();
}

export function selectTab(tab, sectionId) {
    const wasActive = tab.classList.contains("active");

    // reset everything
    document.querySelectorAll("#group-tab")
        .forEach(t => t.classList.remove("active"));

    if (wasActive) {
        // No tab active → show ALL sections
        document.querySelectorAll(".section-tab.no-empty")
            .forEach(section => {
                section.hidden = false;
                section.classList.add("selected");
            });
        updateEmptyState();
        return;
    }

    // Activate clicked tab
    tab.classList.add("active");
    
    
    // Show only its section
    document.querySelectorAll(".section-tab.no-empty")
        .forEach(section => {
            section.hidden = true;
            section.classList.remove("selected");
        });
    document.querySelectorAll(`.section-${sectionId}.no-empty`)
        .forEach(section => {
            section.hidden = false;
            section.classList.add("selected");
        });
    updateEmptyState();
}

export function selectCategory(tab, categoryId) {
    console.log("click", categoryId);
    const wasActive = tab.classList.contains("active");

    // reset everything
    document.querySelectorAll("#cat-tab")
        .forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".catTab")
        .forEach(t => t.classList.remove("active"));

    if (wasActive) {
        // No tab active → show ALL categories
        document.querySelectorAll(`.event-tile`)
            .forEach(tile => tile.classList.remove("hidden"));
        updateEmptyState();
        return;
    }

    // Activate clicked tab
    tab.classList.add("active");
    document.querySelector(`.catTab.cat-${categoryId}`)?.classList.add("active");
 
    // Show only its section
    document.querySelectorAll(`.event-tile`)
        .forEach(tile => tile.classList.add("hidden"));
    document.querySelectorAll(`.category-${categoryId}`)
        .forEach(tile => tile.classList.remove("hidden"));
    updateEmptyState();
}

/* === MAIN === */
initHeader();
loadEvents();
