FROM node:16.13.2-alpine3.15 AS development

ENV CHOKIDAR_USEPOLLING=true
ENV CI=true

RUN apk add --update --no-cache curl py-pip

WORKDIR /server
COPY package.json package-lock.json /server/
RUN npm ci
COPY . .

CMD [ "npm", "run", "start-dev" ]

FROM development AS production

ENV CHOKIDAR_USEPOLLING=false

CMD [ "npm", "run", "start" ]


