const tagContainer = document.getElementById("tag-container");

export const tagInput = document.getElementById("tag-input");
export let userTags = [];

export function clearTags() {
    userTags = [];
    renderTags();
}

function addTag(value) {
    const tag = value.trim().toLowerCase();

    if (!tag || userTags.includes(tag)) {
        return;
    }

    userTags.push(tag);
    renderTags();
}

function removeTag(tagToRemove) {
    userTags = userTags.filter(tag => tag !== tagToRemove);
    renderTags();
}

function renderTags() {
    // Remove existing chips
    tagContainer
        .querySelectorAll(".tag-chip")
        .forEach(el => el.remove());

    // Add chips before the input
    userTags.forEach(tag => {
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

/* Handle typing */
tagInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag(tagInput.value);
    }

    if (e.key === "Backspace" && tagInput.value === "" && userTags.length) {
        removeTag(userTags[userTags.length - 1]);
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