# Common build stage
FROM node:17-alpine3.14 as common-build-stage

ENV REACT_APP_API_HOST .
ENV PUBLIC_URL /
ENV PORT 3000

RUN apk add --update python3 make g++ && rm -rf /var/cache/apk/*
COPY . ./app

WORKDIR /app

RUN npm install --prefix ./app
RUN npm install

EXPOSE 3000

# Development build staged
FROM common-build-stage as development-build-stage

ENV NODE_ENV development

CMD ["sh", "-c", "npm run build --prefix ./app && npm run dev"]

# Production build stage
FROM common-build-stage as production-build-stage

ENV NODE_ENV production

CMD ["sh", "-c", "npm run build --prefix ./app && npm run start"]
