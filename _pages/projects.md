---
layout: page
title: projects
permalink: /projects/
description:
nav: true
nav_order: 1
display_categories: [work, fun, art]
horizontal: false
---
some technical projects I've worked on for research, for courses, and just for fun. Page under construction.

{% assign sorted_projects = site.projects | sort: "importance" %}

  <!-- Generate cards for each project -->

{% if page.horizontal %}

  <div class="container">
    <div class="row row-cols-1 row-cols-md-2">
    {% for project in sorted_projects %}
      {% include projects_horizontal.liquid %}
    {% endfor %}
    </div>
  </div>
  {% else %}
  <div class="row row-cols-1 row-cols-md-3">
    {% for project in sorted_projects %}
      {% include projects.liquid %}
    {% endfor %}
  </div>

{% endif %}