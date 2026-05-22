console.log("executing:", "events.js");

import { openErrorModal, openEventModal } from "../global/modal.js";

/* === VARIABLES === */
const hash = window.location.hash.substring(1);
const params = new URLSearchParams(hash);
let eventId = params.get("id");
history.replaceState(null, "", window.location.pathname + window.location.search);

const loading = document.getElementById("loading-screen");
const eventsContainer = document.getElementById("events");
const search = document.getElementById("event-search");
const addFiltersBtn = document.getElementById("more-filter-btn");
const addFilters = document.getElementById("more-filters");
const tabs = document.getElementById("event-tabs");
const catTabs = document.getElementById("category-tabs");
const pgTabs = document.getElementById("pg-tabs");
const priceTabs = document.getElementById("price-tabs");
const areaTabs = document.getElementById("area-tabs");
const emptyState = document.getElementById("empty-state");

const today = startOfDay(new Date());
const tomorrow = addDays(today, 1);
const afterTomorrow = addDays(today, 2);
const thisSunday = getSunday(today);
const nextMonday = addDays(thisSunday, 1);
const nextSunday = getSunday(nextMonday);

let user_profile = null;
let EVENTS = [];
let activeFilters = {
    category: new Set(),
    pg: new Set(),
    price: new Set(),
    area: new Set()
};

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
    catTabs.innerHTML = ""
    Object.keys(APP_CONFIG.CATEGORIES).forEach(key => {
        catTabs.innerHTML += renderOptionBtn("category", key, APP_CONFIG.CATEGORIES[key]); 
    });

    /* init pg tabs */
    pgTabs.innerHTML = ""
    Object.keys(APP_CONFIG.PARENTAL_GUIDE).forEach(key => {
        pgTabs.innerHTML += renderOptionBtn("pg", key, APP_CONFIG.PARENTAL_GUIDE[key]); 
    });

    /* init pg tabs */
    priceTabs.innerHTML = ""
    Object.keys(APP_CONFIG.PRICE_CHOICES).forEach(key => {
        priceTabs.innerHTML += renderOptionBtn("price", key, APP_CONFIG.PRICE_CHOICES[key]); 
    });

     /* init pg tabs */
    areaTabs.innerHTML = ""
    Object.keys(APP_CONFIG.AREAS).forEach(key => {
        areaTabs.innerHTML += renderOptionBtn("area", key, APP_CONFIG.AREAS[key]); 
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
}

function renderOptionBtn(type, key, config) {
    const label = config["label_short"] ? config["label_short"] : config["label"];
    const icon = config["icon"];
    return `<button id="${type}-${key}-option" class="option-btn ${type} ${type}-${key}" data-action="select-option" data-filter-type="${type}" data-filter-key="${key}">
                <span class="material-symbols-outlined">${icon}</span>
                <span class="text">${label}</span>
            </button>`
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
        <div class="event-tile" style="border-color: ${APP_CONFIG.CATEGORIES[eventData.category]["color"]}" data-action="show-event" role="link" tabindex="0" data-event-id="${eventData.id}" data-category="${eventData.category}" data-pg="${eventData.pg}" data-price="${eventData.price}" data-area="${eventData.area}">
            <div class="event-content" >
                <div class="event-title">${event.title}</div>
                ${eventData.categoryHtml}
                <div class="event-meta place">
                    ${eventData.locationHtml}
                    ${renderMaterialIconText("event", formatEventDateTime(eventData.event_date, eventData.event_start_time))}
                </div>
                <div class="event-meta">
                    ${renderMaterialIconText("sell", eventData.priceLabel)}
                    ${eventData.parentalGuideHtml}
                </div>
                ${eventData.tagsHtml}
            </div>
        </div>
    `;
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

    const { data, error } = await query.order("event_date", { ascending: true });

    if (error) {
        console.log("Error:", error);
        eventsContainer.innerText = "ERREUR survenue durant le chargement des évènements";
        return;
    }
    if (!events || events.length === 0) {
        eventsContainer.innerText = "Pas d'évènements prévus";
        return;
    }

    EVENTS = data;

    const grouped = groupEvents(EVENTS);

    grouped.today = sortByDate(grouped.today);
    grouped.tomorrow = sortByDate(grouped.tomorrow);
    grouped.later = sortByDate(grouped.later);
    
    eventsContainer.innerHTML =
        renderSection("today", "Aujourd'hui", formatEventDate(today), grouped.today) +
        renderSection("tomorrow", "Demain", formatEventDate(tomorrow), grouped.tomorrow) +
        renderSection("later", "Prochainement", "Dès le " + formatEventDate(afterTomorrow), grouped.later);

    updateEmptyState();
    
    tabs.classList.remove("hidden");
    catTabs.classList.remove("hidden");
    addFiltersBtn.classList.remove("hidden");
    // pgTabs.classList.remove("hidden");
    search.hidden = false;
    eventsContainer.hidden = false;
    loading.style.display = "none";

    if (eventId) {
        console.log("show event id:", eventId);
        const el = eventsContainer.querySelector(`[data-event-id="${eventId}"]`);
        if (!el) return;
        el.scrollIntoView();
        el.focus();
        el.click();
        eventId = null;
    }

}

function matchesFilters(tile) {
    // category filter
    if (
        activeFilters.category.size > 0 &&
        !activeFilters.category.has(tile.dataset.category)
    ) {
        return false;
    }

    //  Parental Guidance filter
    if (
        activeFilters.pg.size > 0 &&
        !activeFilters.pg.has(tile.dataset.pg)
    ) {
        return false;
    }

    //  Price filter
    if (
        activeFilters.price.size > 0 &&
        !activeFilters.price.has(tile.dataset.price)
    ) {
        return false;
    }

    //  Area filter
    if (
        activeFilters.area.size > 0 &&
        !activeFilters.area.has(tile.dataset.area)
    ) {
        return false;
    }

    return true;
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
                const section = el.closest(".section-tab.no-empty");
                return (!el.classList.contains("hidden") && !section.hidden);
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

export function selectFilterOption(optionBtn) {
    const type = optionBtn.dataset.filterType;
    const key = optionBtn.dataset.filterKey;

    if (activeFilters[type].has(key)) {
        activeFilters[type].delete(key);
        optionBtn.classList.remove("active");
    } else {
        activeFilters[type].add(key);
        optionBtn.classList.add("active");
    }

    const hasAnyFilter =
        activeFilters.category.size > 0 ||
        activeFilters.pg.size > 0 || 
        activeFilters.price.size > 0 ||
        activeFilters.area.size > 0;

    document.querySelectorAll(`.event-tile`).forEach(tile => {
        if (!hasAnyFilter) {
            tile.classList.remove("hidden");
            return;
        }

        tile.classList.toggle("hidden", !matchesFilters(tile));
    });

    updateEmptyState();
}

export function toggleAdditionalFilter(filterBtn) {
    const isOpen = filterBtn.getAttribute("aria-expanded") === "true";
    filterBtn.setAttribute("aria-expanded", String(!isOpen));

    if (isOpen) {
        addFilters.classList.add("hidden");
        filterBtn.querySelector(".text").innerText = "Plus de filtres";
        filterBtn.querySelector(".chevron").innerText = "keyboard_arrow_down";
    } else {
        /* open this one */
        addFilters.classList.remove("hidden");
        filterBtn.querySelector(".text").innerText = "Moins de filtres";
        filterBtn.querySelector(".chevron").innerText = "keyboard_arrow_up";
    }
}

/* === MAIN === */
initHeader();
loadEvents();
