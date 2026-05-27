console.log("executing:", "events.js");

import { openErrorModal, openEventModal, openSuccessModal } from "../global/modal.js";

/* === VARIABLES === */
const hash = window.location.hash.substring(1);
const params = new URLSearchParams(hash);
let eventId = params.get("id");
history.replaceState(null, "", window.location.pathname + window.location.search);

const loading = document.getElementById("loading-screen");
const tilesView = document.getElementById("tiles-view");
const agendaView = document.getElementById("agenda-view");
const calendarEl = document.getElementById("calendar");
const search = document.getElementById("event-search");
const addFiltersBtn = document.getElementById("more-filter-btn");
const addFilters = document.getElementById("more-filters");
const switchViewBtn = document.getElementById("switch-view-btn");
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
let year = today.getFullYear();
let month = today.getMonth();
const thisMonthStr = String(today.getMonth() + 1).padStart(2, "0");
const calendarTitle = document.getElementById("calendar-title");
const prevMonthBtn = document.getElementById("prev-month");

let touchStartX = 0;
let touchEndX = 0;

let user_profile = null;
let EVENTS = [];
let activeFilters = {
    category: new Set(),
    pg: new Set(),
    price: new Set(),
    area: new Set()
};
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

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
        else if (eventDate.toDateString() == tomorrow.toDateString()) { 
            groups.tomorrow.push(event);
        }
        else if (eventDate > tomorrow) {
            groups.later.push(event);
        }
    });

    return groups;
}

function groupByDate(events) {
    const map = {};

    events.forEach(event => {
        const date = event.event_date; // "YYYY-MM-DD"

        if (!map[date]) map[date] = [];
        map[date].push(event);
    });

    return map;
}

function groupByDateWithCategories(events) {
    const map = {};

    events.forEach(event => {
        const date = event.event_date;

        if (!map[date]) {
            map[date] = new Set(); // ✅ unique types
        }

        map[date].add(event.category); // integer or string
    });

    return map;
}

function groupByDateWithCounts(events) {
    const map = {};

    events.forEach(event => {
        const date = event.event_date;

        if (!map[date]) {
            map[date] = {};
        }

        const type = event.category;

        if (!map[date][type]) {
            map[date][type] = 0;
        }

        map[date][type]++;
    });

    return map;
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

function showHeader() {
    tabs.classList.remove("hidden");
    catTabs.classList.remove("hidden");
    addFiltersBtn.classList.remove("hidden");
    search.hidden = false;
    switchViewBtn.classList.remove("hidden");
}

function applyFilter() {
    const hasAnyFilter =
    activeFilters.category.size > 0 ||
    activeFilters.pg.size > 0 || 
    activeFilters.price.size > 0 ||
    activeFilters.area.size > 0;

    if (!tilesView.hidden) {
        /* apply filters on tiles */
        document.querySelectorAll(`.event-tile`).forEach(tile => {
            if (!hasAnyFilter) {
                tile.classList.remove("hidden");
                return;
            }

            tile.classList.toggle("hidden", !matchesFilters(tile.dataset.category, tile.dataset.pg, tile.dataset.price, tile.dataset.area));
        });
        updateEmptyState();

    } else  {
        /* apply filters on agenda */
        var filteredEvents;
        if (!hasAnyFilter) {
            filteredEvents = EVENTS;
        } else {
            filteredEvents = EVENTS.filter(event => matchesFilters(String(event.category), String(event.pg), String(event.price), String(event.area)));
        }
        renderCalendar(filteredEvents);
    }

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
        <div class="event-tile" style="border-color: ${APP_CONFIG.CATEGORIES[eventData.category]["color"]}"
                data-action="show-event" role="link" tabindex="0"
                data-event-id="${eventData.id}"
                data-category="${eventData.category}"
                data-pg="${eventData.pg}"
                data-price="${eventData.price}"
                data-area="${eventData.area}"
                data-date="${eventData.event_date}">
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

function renderDots(dayMap) {
    if (!dayMap) return "";

    return Object.entries(dayMap).map(([category, count]) => {
        const color = APP_CONFIG.CATEGORIES[category]["color"] || "#999";

        const label = count > 1 ? count : "";

        return `
            <span
                class="calendar-dot"
                style="background:${color}"
            >
                ${label}
            </span>
        `;
    }).join("");
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

function renderTiles() {
    const grouped = groupEvents(EVENTS);

    grouped.today = sortByDate(grouped.today);
    grouped.tomorrow = sortByDate(grouped.tomorrow);
    grouped.later = sortByDate(grouped.later);

    tilesView.innerHTML =
        renderSection("today", "Aujourd'hui", formatEventDate(today), grouped.today) +
        renderSection("tomorrow", "Demain", formatEventDate(tomorrow), grouped.tomorrow) +
        renderSection("later", "Prochainement", "Dès le " + formatEventDate(afterTomorrow), grouped.later);

    tilesView.hidden = false;
    agendaView.hidden = true;
    switchViewBtn.querySelector('[data-view="tiles"]').classList.add("active");
    switchViewBtn.querySelector('[data-view="agenda"]').classList.remove("active");
    loading.style.display = "none";

    if (eventId) {
        console.log("show event id:", eventId);
        const el = tilesView.querySelector(`[data-event-id="${eventId}"]`);
        if (!el) return;
        el.scrollIntoView();
        el.focus();
        el.click();
        eventId = null;
    }
}

function updateCalendarTitle() {
    const date = new Date(year, month);
    const formatted = date.toLocaleString('fr-FR', {
        month: "long",
        year: "numeric"
    });
    calendarTitle.textContent = formatted;
}


function renderCalendar(events=EVENTS) {
    updateCalendarTitle();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = (firstDay.getDay() + 6) % 7; 
    // converts Sunday=0 → Sunday=6 (Monday-first calendar)
    const totalDays = lastDay.getDate();
    const monthStr = String(month + 1).padStart(2, "0");
    const grouped = groupByDateWithCounts(events);
    var html = '';

    // Loop 35 cells (5 weeks)
    for (let i = 0; i < 35; i++) {
        const dayNumber = i - startDay + 1;

        let date;
        let isOtherMonth = false;

        if (dayNumber < 1) {
            // previous month
            date = new Date(year, month, dayNumber);
            isOtherMonth = true;
        } else if (dayNumber > totalDays) {
            // next month
            date = new Date(year, month, dayNumber);
            isOtherMonth = true;
        } else {
            // current month
            date = new Date(year, month, dayNumber);
        }
        const dateStr = formatDateStr(date);

        const dayMap = grouped[dateStr];

        const weekdayLetter = WEEKDAYS[i % 7];

        const clickable = (!dayMap || (dayMap.length == 0) || (startOfDay(date) < today)) ? false : true;

        html += `
            <div class="calendar-day ${isOtherMonth ? "other-month" : ""}
                        ${dateStr === formatDateStr(today) ? "today" : ""}
                        ${startOfDay(date) < today ? "past-day" : ""} 
                        ${clickable ? "clickable" : ""}" 
                 ${clickable ? 'data-action="calendar-select-day"' : ""} data-date="${dateStr}">
                <div class="calendar-header">
                    <span class="day-number">${date.getDate()}</span>
                    <span class="day-letter">${weekdayLetter}</span>
                </div>

                <div class="calendar-dots">
                    ${renderDots(dayMap)}
                </div>
            </div>
        `;
    }

    calendarEl.innerHTML = html;

    if (thisMonthStr == monthStr) {
        prevMonthBtn.style.opacity = 0;
        prevMonthBtn.style.cursor = "auto";
    } else {
        prevMonthBtn.style.opacity = 1;
        prevMonthBtn.style.cursor = "pointer";
    }

    tilesView.hidden = true;
    agendaView.hidden = false;
    switchViewBtn.querySelector('[data-view="tiles"]').classList.remove("active");
    switchViewBtn.querySelector('[data-view="agenda"]').classList.add("active");
    loading.style.display = "none";
}

function animateSwipe(direction) {
    calendarEl.style.transform = `translateX(${direction * 30}px)`;
    calendarEl.style.opacity = 0;

    setTimeout(() => {
        calendarEl.style.transform = "translateX(0)";
        calendarEl.style.opacity = 1;
    }, 150);
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
        tilesView.innerText = "ERREUR survenue durant le chargement des évènements";
        return;
    }
    if (!data || data.length === 0) {
        return;
    }

    EVENTS = data;

    renderTiles();
    showHeader();
}

function matchesFilters(category, pg, price, area) {
    if (
        activeFilters.category.size > 0 &&
        !activeFilters.category.has(category)
    ) return false;

    if (
        activeFilters.pg.size > 0 &&
        !activeFilters.pg.has(pg)
    ) return false;

    if (
        activeFilters.price.size > 0 &&
        !activeFilters.price.has(price)
    ) return false;

    if (
        activeFilters.area.size > 0 &&
        !activeFilters.area.has(area)
    ) return false;

    return true;
}

function copyToClipboard(url) {
    navigator.clipboard.writeText(url);
    openSuccessModal("Lien vers l'évènement copié!");
}

/* === EXPORTED FUNCTIONS === */
export function switchView(view) {
    if (view === "tiles") {
        tilesView.hidden = false;
        document.querySelectorAll("#group-tab").forEach(t => t.disabled = false);
        renderTiles();
    } else {
        tilesView.hidden = true;
        document.querySelectorAll("#group-tab").forEach(t => t.disabled = true);
        // for calendar view, applyFilter function will call renderCalendar
    }
    applyFilter();
}

export function openEvent(eventId) {
    const event = EVENTS.find(e => e.id === eventId);
    if (!event) return;
    openEventModal(event, "classic", user_profile);
}

export async function shareEvent(eventId) {
    const event = EVENTS.find(e => e.id === eventId);
    if (!event) return;
    const event_title = APP_CONFIG.CATEGORIES[event.category]["label"];
    const event_url = `${window.location.href}#id=${eventId}&type=myevent`;
    const event_desc = `Titre: ${event.title}
Type: ${event_url}
Lieu: ${event.location_name}
Data: ${formatDateForUI(event.event_date)}
`;
    if (navigator.share) {
        try {
            const response = await fetch(event.image_url);
            const blob = await response.blob();

            const file = new File([blob], "event-image.jpg", {
                type: blob.type
            });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: event_title,
                    text: event_desc,
                    url: event_url,
                    files: [file]
                });
            } else {
                // fallback: share link
                await navigator.share({
                    title: event.title,
                    text: "Regarde cet évènement !\n",
                    url: event_url
                });
            }

        } catch (err) {
            if (err.name === "AbortError") {
                // user closed share → do nothing
                return;
            }
            console.error("Share failed:", err);
            copyToClipboard(event_url);
        }
    } else {
        console.error("Share failed:", err);
        copyToClipboard(event_url);
    }
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

export function selectTab(tab) {
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
    document.querySelectorAll(`.section-${tab.dataset.target}.no-empty`)
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

    applyFilter();
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

export function navPrevMonth() {
    const monthStr = String(month + 1).padStart(2, "0");
    if (monthStr == thisMonthStr) return;
    month--;
    if (month < 0) {
        month = 11;
        year--;
    }
    updateCalendarTitle();
    applyFilter(); // will render calendar
}

export function navNextMonth() {
    month++;
    if (month > 11) {
        month = 0;
        year++;
    }
    updateCalendarTitle();
    applyFilter(); // will render calendar
}

export function navToday() {
    year = today.getFullYear();
    month = today.getMonth();
    updateCalendarTitle();
    applyFilter(); // will render calendar
}

export function calendarSelectDay(dateStr) {
    switchView("tiles");

    // Wait for DOM update (important)
    requestAnimationFrame(() => {
        // scrool to first event with date
        const selector = `.event-tile[data-date="${dateStr}"]:not(.hidden)`;
        const firstTile = document.querySelector(selector);
        if (!firstTile) return;
        firstTile.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    });
}

export function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const MIN_SWIPE_DISTANCE = 50; // threshold

    if (Math.abs(deltaX) < MIN_SWIPE_DISTANCE) return;

    if (deltaX < 0) {
        // Swipe left → next month
        animateSwipe(-1);
        navNextMonth();
    } else {
        // Swipe right → previous month
        animateSwipe(1);
        navPrevMonth();
    }

}

/* === LISTENER === */
calendarEl?.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

calendarEl?.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});


calendarEl?.addEventListener("touchmove", (e) => {
    const deltaX = e.touches[0].clientX - touchStartX;

    if (Math.abs(deltaX) > 10) {
        e.preventDefault(); // prevent vertical scroll while swiping
    }
}, { passive: false });


/* === MAIN === */
initHeader();
loadEvents();
