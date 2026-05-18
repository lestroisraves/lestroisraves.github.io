---
hide:
  - navigation
  - toc
---

{% block back %}
<button class="back-btn" data-action="go-back">←</button>
{% endblock %}
{% include 'includes/modals/popup.html' %}
{% include 'includes/modals/notices.html' %}
{% include 'includes/forms/submit_form.html' %}

{% block html %}
<script type="module" defer src="../assets/js/edit_event/router.js"></script>
<html data-theme="light">
{% endblock %}

