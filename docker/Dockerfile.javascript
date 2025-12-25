FROM node:18-alpine

WORKDIR /app

RUN adduser -D -s /bin/sh runner
USER runner

COPY --chown=runner:runner . .

CMD ["node", "main.js"]