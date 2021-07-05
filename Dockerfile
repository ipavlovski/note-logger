FROM registry.digitalocean.com/gpl-containers/arch-node:20210519
WORKDIR /app

# cache node dependencies
COPY package*.json ./
RUN npm install

# copy all the code and compile
COPY . .
RUN tsc

# execute
CMD ["npm", "run", "start:remote"]