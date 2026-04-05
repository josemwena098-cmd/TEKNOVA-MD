FROM node:lts-buster

# Clone bot from GitHub
RUN git clone https://github.com/josemwena098-cmd/TEKNOVA-MD.git /root/teknova-bot

# Set working directory
WORKDIR /root/teknova-bot

# Install dependencies
RUN npm install && npm install -g pm2

# Expose port
EXPOSE 9090

# Start the bot
CMD ["npm", "start"]
