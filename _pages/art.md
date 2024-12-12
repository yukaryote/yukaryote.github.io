---
layout: page
title: art
permalink: /art/
description:
nav: true
nav_order: 4
display_categories: [comics, illustrations]
horizontal: false
---
I like to draw and make comics. I've also dabbled in animation and filmmaking, directing two films for MIT admissions. All works shown were created without the use of generative AI.

[Artstation](https://www.artstation.com/yukaryote) / [Instagram](https://www.instagram.com/isbla.rt)

<!-- pages/projects.md -->
<div class="projects">
{% if site.enable_project_categories and page.display_categories %}
  <!-- Display categorized projects -->
  {% for category in page.display_categories %}
    <a id="{{ category }}" href=".#{{ category }}">
      <h2 class="category">{{ category }}</h2>
    </a>
    {% assign categorized_projects = site.art | where: "category", category %}
    {% assign sorted_projects = categorized_projects | sort: "importance" %}
    <!-- Generate cards for each project -->
    {% if page.horizontal %}
    <div class="container">
      <div class="row row-cols-1 row-cols-md-2">
      {% for project in sorted_projects %}
        {% include art_horizontal.liquid %}
      {% endfor %}
      </div>
    </div>
    {% else %}
    <div class="row row-cols-1 row-cols-md-3">
      {% for project in sorted_projects %}
        {% include art.liquid %}
      {% endfor %}
    </div>
    {% endif %}
  {% endfor %}
  <a id="film/animation" href=".#film/animation">
      <h2 class="category">film/animation</h2>
  </a>
  <div class="row justify-content-sm-center">
    <div class="col-sm mt-3 mt-md-0">
        <iframe width="400" height="300" src="https://www.youtube.com/embed/u7BZxpoH2b4?si=0g4gfjmRfvRr_vBc" title="YouTube video player" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>
    <div class="col-sm mt-3 mt-md-0">
        <iframe width="400" height="300" src="https://www.youtube.com/embed/k4eUKx9Os1c?si=Jt3WDbCMl8gzpMXL" title="YouTube video player" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>
  </div> 

{% else %}

<!-- Display projects without categories -->

{% assign sorted_projects = site.projects | sort: "importance" %}

  <!-- Generate cards for each project -->

{% if page.horizontal %}

  <div class="container">
    <div class="row row-cols-1 row-cols-md-2">
    {% for project in sorted_projects %}
      {% include art_horizontal.liquid %}
    {% endfor %}
    </div>
  </div>
  {% else %}
  <div class="row row-cols-1 row-cols-md-3">
    {% for project in sorted_projects %}
      {% include art.liquid %}
    {% endfor %}
  </div>
  {% endif %}
{% endif %}
</div>
