# Get Node image
FROM node:18.3.0

# Setup env
ENV NODE_ENV=production
WORKDIR /

RUN npm install -g typescript

# Setup working env
COPY package*.json ./
COPY ./src ./src
COPY ./tsconfig.json ./

# Node dependencies
RUN npm install --production

RUN tsc

# Start service
ENTRYPOINT ["node", "dist/index.js"]
