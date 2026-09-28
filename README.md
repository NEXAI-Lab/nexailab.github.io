# NEXAI Lab

Academic website for NEXAI Lab — Novel Explorations in Artificial Intelligence.

## Local preview

Run a local server from the repository root:

    python3 -m http.server 8000

Open http://localhost:8000.

## Update content

- Edit data/people.json to update people, affiliations, interests, photos, and profile links.
- Edit data/projects.json to update project titles and descriptions.
- Edit data/publications.json to add publications or update metadata. Use null for details that are not available.

The site reads these files in the browser. Use a local server for preview; opening index.html directly does not allow JSON loading.

## GitHub Pages

In the repository settings, enable GitHub Pages from branch main and folder / (root). The site has no build step or package dependencies.
