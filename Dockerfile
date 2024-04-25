FROM node:20-slim

COPY . ./

RUN yarn install

ENTRYPOINT ["yarn", "run", "start:prod"]
