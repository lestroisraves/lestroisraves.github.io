---
hide:
  - navigation
  - toc
---

{% block back %}
<button id="back-btn" class="back-btn" data-action="go-back" hidden>←</button>
{% endblock %}
{% include 'includes/modals/popup.html' %}
{% include 'includes/modals/notices.html' %}
{% include 'includes/nav/loading.html' %}
{% include 'includes/forms/submit_form.html' %}

{% block html %}
<script type="module" defer src="../assets/js/edit_event/router.js"></script>
<html data-theme="light">
{% endblock %}

