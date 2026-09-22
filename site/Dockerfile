# Static site — no build step, no runtime dependencies.
# Build:  docker build -t mglion-static .
# Run:    docker run -p 8080:80 mglion-static
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
