FROM node:20-slim

COPY . ./

RUN yarn && \
    yarn install

ENTRYPOINT ["yarn", "run", "start:prod"]
