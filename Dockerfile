FROM node:16.18.0-alpine
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
COPY ./ ./
RUN npm i
CMD ["npm", "run", "start"]