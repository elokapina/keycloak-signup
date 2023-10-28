FROM node:18

RUN mkdir /app

WORKDIR /app

COPY public public
COPY src src
COPY views views
COPY package.json tsconfig.json tsconfig.release.json ./

RUN npm install && \
  npm run build

EXPOSE 3000

CMD [ "npm", "start" ]

