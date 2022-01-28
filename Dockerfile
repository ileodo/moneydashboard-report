# Common build stage
FROM node:17-alpine3.14 as common-build-stage

RUN apk add --update python3 make g++ && rm -rf /var/cache/apk/*
COPY . ./app

WORKDIR /app

RUN npm install

EXPOSE 3000

# Development build stage
FROM common-build-stage as development-build-stage

ENV NODE_ENV development

CMD ["npm", "run", "dev"]

# Production build stage
FROM common-build-stage as production-build-stage

ENV NODE_ENV production

CMD ["npm", "run", "start"]
