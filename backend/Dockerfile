# Use a Node.js base image
FROM node:18

# Install dependencies (yt-dlp, ffmpeg, curl)
RUN apt-get update && apt-get install -y curl ffmpeg && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp && \
    chmod a+rx yt-dlp && mv yt-dlp /usr/local/bin/

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project
COPY . .

# Expose port for Railway
EXPOSE 5000

# Start the server
CMD ["node", "index.js"]
