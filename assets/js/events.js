console.log("executing:", document.currentScript?.src);

const today = startOfDay(new Date());
const tomorrow = addDays(today, 1);
const thisSunday = getSunday(today);
const nextMonday = addDays(thisSunday, 1);
const nextSunday = getSunday(nextMonday);

const filterNoticeError = document.getElementById("filter-error");
const filterNoticeErrorText = filterNoticeError.querySelector("#text");
const filterToggle = document.getElementById("filter-toggle");
const filterPanel = document.getElementById("filter-panel");
const filterCatChoices = filterPanel.querySelector("#category");
const tagContainer = document.getElementById("tag-container");
const tagInput = document.getElementById("tag-input");

let tags = [];
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

function renderEventTile(event) {
      const timeHtml = event.event_start_time
        ? renderMaterialIconText("schedule", formatTimeForUI(event.event_start_time))
        : "";

    const tagsHtml = event.tags && event.tags.length
        ? `
            <div class="event-tags">
                ${event.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}
            </div>
        `
        : "";

    const imageHtml = event.image_url
        ? ` <div class="event-image-wrapper"><img src="${event.image_url}" class="event-thumbnail" loading="lazy" alt="Event image"></div>`
        : "";

    if (event.image_url) {
        console.log("image_url:", event.image_url)
    }

    var priceText = "Gratuit";
    if (event.is_free_price) {
        priceText = "Participation libre";
    } else if (event.min_price && event.max_price) {
        priceText = event.min_price + " à " + event.max_price + " €";
    } else if (event.max_price) {
        priceText = event.max_price + " €";
    }
    
    return `
        <div class="event-tile">
            ${imageHtml}
            <div class="event-content">
                <div class="event-title">${event.title}</div>
                <div class="event-meta">
                    ${renderMaterialIconText("stars", APP_CONFIG.CATEGORIES[event.category]["label"])}
                    ${renderMaterialIconText("place", event.location_name)}
                </div>
                <div class="event-meta">
                    ${renderMaterialIconText("event", formatDateForUI(event.event_date))}
                    ${timeHtml}
                    ${renderMaterialIconText("sell", priceText)}
                </div>
                ${tagsHtml}
            </div>
        </div>
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

function initFilters() {
    tags = [];
    renderTags();

    /* Configure Catgeories */
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

}

async function loadEvents() {
    if (!window.supabaseClient) {
        console.error("Supabase not initialized");
        return;
    }

    const container = document.getElementById("events");
    const header = document.getElementById("event-list-header");
    const filter = document.getElementById("event-filter");

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

    if (filters.tags) {
        query = query.overlaps("tags", filters.tags);
    }

    const { data: events, error } = await query.order("event_date", { ascending: true });

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

    const grouped = groupEvents(events);

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

    // container.innerHTML = data.map(renderEventTile).join("")
}

/* === LISTENERS === */
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
    tags = [];
    filters = APP_CONFIG.DEFAULT_FILTER;
    renderTags();
    document.getElementById("filter-form").reset();
});

document.getElementById("filter-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.target;

    hideErrorMessages();

    const selectedCategories = Array.from(
        form.querySelectorAll('input[name="categories"]:checked')
    ).map(cb => getCategoryId(cb.value));

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
        tags: tags.length ? tags : null,
        from: from || null,
        to: to || null
    };

    console.log("filter:", filters);
    
    filterToggle.setAttribute("aria-expanded", "false");
    filterPanel.setAttribute("hidden", "");
    
    loadEvents();
});


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

hideErrorMessages();
initFilters();
loadEvents();
