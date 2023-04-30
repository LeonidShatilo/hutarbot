FROM node:16-alpine

WORKDIR /app

COPY ["package.json", "yarn.lock", "./"]

RUN yarn install

COPY . .

ENV PORT=3000

EXPOSE $PORT

CMD ["yarn", "start"]
