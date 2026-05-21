console.log("executing:", "events.js");

import { openErrorModal, openEventModal } from "../global/modal.js";

/* === VARIABLES === */
const hash = window.location.hash.substring(1);
const params = new URLSearchParams(hash);
let eventId = params.get("id");
history.replaceState(null, "", window.location.pathname + window.location.search);

const loading = document.getElementById("loading-screen");
const container = document.getElementById("events");
const search = document.getElementById("event-search");
const addFiltersBtn = document.getElementById("add-filter-btn");
const addFilters = document.getElementById("add-filters");
const tabs = document.getElementById("event-tabs");
const pgTabs = document.getElementById("pg-tabs");
const catTabs = document.getElementById("category-tabs");
const emptyState = document.getElementById("empty-state");

const today = startOfDay(new Date());
const tomorrow = addDays(today, 1);
const afterTomorrow = addDays(today, 2);
const thisSunday = getSunday(today);
const nextMonday = addDays(thisSunday, 1);
const nextSunday = getSunday(nextMonday);

let user_profile = null;
let EVENTS = [];
let activeFilters = new Set();

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
    /* init pg tabs */
    Object.keys(APP_CONFIG.PARENTAL_GUIDE).forEach(key => {
        const btn = document.createElement("button");
        btn.id = "pg-tab";
        btn.className = `event-option pg pg-${key}`;
        btn.setAttribute("data-action", "select-option");
        btn.setAttribute("data-target-type", "pg");
        btn.setAttribute("data-target-value", key);
        btn.innerText = APP_CONFIG.PARENTAL_GUIDE[key];
        pgTabs.appendChild(btn); 
    });

    /* init category tabs */
    Object.keys(APP_CONFIG.CATEGORIES).forEach(key => {
        const tab = document.createElement("div");
        tab.className = `option-tab category category-${key}`;
        tab.setAttribute("data-subtitle", APP_CONFIG.CATEGORIES[key]["label"])
        const btn = document.createElement("button");
        btn.id = "category-option";
        btn.className = `option-btn category-${key}`;
        btn.setAttribute("data-action", "select-option");
        btn.setAttribute("data-target-type", "category");
        btn.setAttribute("data-target-value", key);
        btn.innerText = APP_CONFIG.CATEGORIES[key]["icon"];
        tab.appendChild(btn); 
        catTabs.appendChild(tab); 
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
    addFiltersBtn.classList.remove("hidden");
    // pgTabs.classList.remove("hidden");
    search.hidden = false;
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
    const filter = {"type": optionBtn.dataset.targetType, "value": optionBtn.dataset.targetValue};
    const optionTab = document.querySelector(`.option-tab.${filter.type}-${filter.value}`);
    const wasActive = optionBtn.classList.contains("active");

    // reset everything
    document.querySelectorAll(`#${filter.type}-option`)
        .forEach(t => t.classList.remove("active"));
    document.querySelectorAll(`.option-tab.${filter.type}`)
        .forEach(t => t.classList.remove("active"));

    if (wasActive) {
        // /No tab active → show ALL categories
        document.querySelectorAll(`.event-tile`)
            .forEach(tile => tile.classList.remove("hidden"));
        updateEmptyState();
        return;
    }

    // Activate clicked tab
    optionBtn.classList.add("active");
    optionTab?.classList.add("active");
 
    // Show only its section
    document.querySelectorAll(`.event-tile`)
        .forEach(tile => tile.classList.add("hidden"));
    document.querySelectorAll(`.${filter.type}-${filter.value}`)
        .forEach(tile => tile.classList.remove("hidden"));
    updateEmptyState();

    // setTimeout(() => {
    //     optionTab?.classList.remove("active");
    // }, 2000);

}

export function toggleAdditionalFilter(filterBtn) {
    const isOpen = filterBtn.getAttribute("aria-expanded") === "true";
    filterBtn.setAttribute("aria-expanded", String(!isOpen));

    if (isOpen) {
        addFilters.classList.add("hidden");
        filterBtn.querySelector(".text").innerText = "Autres filtres";
        filterBtn.querySelector(".chevron").innerText = "keyboard_arrow_right";
    } else {
        /* open this one */
        addFilters.classList.remove("hidden");
        filterBtn.querySelector(".text").innerText = "Fermer les filtres";
        filterBtn.querySelector(".chevron").innerText = "keyboard_arrow_up";
    }
}

/* === MAIN === */
initHeader();
loadEvents();
