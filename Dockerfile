FROM node:6.3.1-slim

# Install Deps
WORKDIR /runner

# Copy App
COPY . /runner/


CMD [ "npm", "start" ]