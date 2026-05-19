---
hide:
  - navigation
  - toc
---


{% include 'includes/modals/event_modal.html' %}
{% include 'includes/modals/confirm_modal.html' %}
{% include 'includes/modals/popup.html' %}
{% include 'includes/nav/events_header.html' %}
{% include 'includes/nav/loading.html' %}

{% block html %}
<article id="events" hidden></article>
<script type="module" defer src="assets/js/events/router.js"></script>
<html data-theme="light">
{% endblock %}
