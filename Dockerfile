FROM node:20-slim

COPY . ./

RUN yarn install && \
    yarn build

ENTRYPOINT ["yarn", "run", "start:prod"]
