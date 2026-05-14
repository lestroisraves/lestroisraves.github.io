---
hide:
  - navigation
  - toc
---

{% include 'includes/modals/event_modal.html' %}
{% include 'includes/modals/confirm_modal.html' %}
{% include 'includes/modals/popup.html' %}
{% include 'includes/nav/events_header.html' %}
{% include 'includes/forms/events_filter_form.html' %}

{% block html %}
<article id="events"></article>
<script type="module" defer src="assets/js/events/events.js"></script>
<script type="module" defer src="assets/js/events/router.js"></script>
<html data-theme="light">
{% endblock %}
