# syntax=docker/dockerfile:1
FROM nginx:1.27-alpine

# Copy README-derived landing page and any static content
COPY index.html /usr/share/nginx/html/index.html
COPY README.md  /usr/share/nginx/html/README.md

# Simple nginx config: static files, SPA-style fallback to index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
