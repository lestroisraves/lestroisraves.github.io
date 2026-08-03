/* === EXPORTED FUNCTIONS === */
export function renderOptionBtn(type, key, config, withicon=true) {
    const label = config["label"] ? config["label"] : config["label"];
    const iconHtml = withicon
        ? `<span class="material-symbols-outlined">${config["icon"]}</span>`
        : "";
    const action = (key == "when")
        ? "select-when-option"
        : "select-option";
    return `<button id="${type}-${key}-option" class="option-btn ${type} ${type}-${key} active" data-action="${action}" data-filter-type="${type}" data-filter-key="${key}">
                ${iconHtml}
                <span class="text">${label}</span>
            </button>`
}

export function renderSection(sectionKey, sectionTitle, subtitle, events) {
    if (events.length === 0) {
        return `
        <div class="section-tab empty selected" data-key="${sectionKey}">
            <div class="section-header">
                <span class="section-title">${sectionTitle}</span>
            </div>
            <div class="event-list"></div>
        </div>
        `;
    }

    return `
        <div class="section-tab section-${sectionKey} no-empty selected" data-key="${sectionKey}">
            <div class="section-header">
                <span class="section-title">${sectionTitle}</span>
            </div>
            <div class="event-list">
                ${events.map(renderEventTile).join("")}
            </div>
        </div>
    `;
}

export function renderEventTile(event) {
    const eventData = renderEventData(event);

    return `
    <div class="event-tile" style="--event-color: ${APP_CONFIG.CATEGORIES[eventData.category]["color"]}"
            data-action="show-event" role="link" tabindex="0"
            data-event-id="${eventData.id}"
            data-category="${eventData.category}"
            data-pg="${eventData.pg}"
            data-price="${eventData.price}"
            data-area="${eventData.area}"
            data-date="${eventData.event_date}">
        <div class="event-side">
            <div class="event-category">${APP_CONFIG.CATEGORIES[eventData.category]["label"]}</div>
            <div class="event-date">${formatEventDate(eventData.event_date)}</div>
            ${eventData.timeHtml}
        </div>

        <div class="event-content">
            <div class="event-title">${event.title}</div>
            <div class="event-meta place">
                    ${eventData.locationHtml}
            </div>
            <div class="event-meta">
                ${renderMaterialIconText("sell", eventData.priceLabel)}
            </div>
            ${eventData.tagsHtml}
        </div>
    </div>
    `;
}

export function renderDots(dayMap) {
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

export function renderEventSuggestion(event) {
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
