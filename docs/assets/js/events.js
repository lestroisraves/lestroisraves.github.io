console.log("executing:", document.currentScript?.src);

const today = startOfDay(new Date());
const tomorrow = addDays(today, 1);
const thisSunday = getSunday(today);
const nextMonday = addDays(thisSunday, 1);
const nextSunday = getSunday(nextMonday);

function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getSunday(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0 (Sun) → 6 (Sat)
    const diff = (7 - day) % 7;
    d.setDate(d.getDate() + diff);
    return startOfDay(d);
}

function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return startOfDay(d);
}

function sortByDate(events) {
    return events.sort(
        (a, b) =>
            new Date(a.event_date) - new Date(b.event_date)
    );
}


function formatDateRange(startDate, endDate) {
    return `Du ${formatDateForUI(startDate)} au ${formatDateForUI(endDate)}`;
}


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
async function loadEvents() {
    if (!window.supabaseClient) {
        console.error("Supabase not initialized");
        return;
    }

    const container = document.getElementById("events");
    const header = document.getElementById("event-list-header");

    const { data: events, error } = await window.supabaseClient
        .from("future_events")
        .select("*")
        .eq("pending", false)
        .order("event_date", { ascending: true });

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
    
    container.innerHTML =
        renderSection("Aujourd'hui", formatDateForUI(today), grouped.today) +
        renderSection("Cette semaine", formatDateRange(tomorrow, thisSunday), grouped.thisWeek) +
        renderSection("Semaine prochaine", formatDateRange(nextMonday, nextSunday), grouped.nextWeek) +
        renderSection("Prochainement", "Après le " + formatDateForUI(nextSunday), grouped.future);

    // container.innerHTML = data.map(renderEventTile).join("")
}

loadEvents();
