# Typescript Starter

## Prep initial files

Install dependencies
```bash
npm install
```

Add scratch file
```bash
cat <<EOF > scratch.ts
// @ts-nocheck

EOF
```

Add environment file
```bash
cat <<EOF > .env
SERVER_PORT=

MYSQL_HOST=
MYSQL_PORT=
MYSQL_USER=
MYSQL_PASS=
MYSQL_DB=

PATH_STORAGE=
EOF
```


# Deployment

```
:                                                      ┌──────┐
:  ┌──────┬─────────────┐                          ┌──►│ TEST │
:  │      │ LOCAL   DEV │                          │   └──────┘
:  ├──────┼─────────────┤       ┌─────────────┐    │
:  │REG   │   X      X  ├──────►│ DO-REGISTRY ├────┤
:  │      │             │       └─────────────┘    │
:  │DOCKER│   X      X  │                          │   ┌──────┐
:  └──────┴─────────────┘                          └──►│ PROD │
:                                                      └──────┘
```


Build an arch-node image, if it doesn't exist.
```bash
tag=registry.digitalocean.com/gpl-containers/arch-node:$(date "+%Y%m%d") && echo $tag
cat <<EOF | docker build --no-cache -t $tag - && docker run --rm -it $tag
FROM archlinux:latest
RUN pacman -Syu --noconfirm 
RUN pacman -S nodejs npm typescript ts-node --noconfirm 
CMD [ "bash"]
EOF
docker push $tag
```

Check that the image has been created
```bash
docker image ls registry.digitalocean.com/gpl-containers/arch-node
```


Check that `Dockerfile` has the proper tag (20210519 in this case).

```Dockerfile
FROM registry.digitalocean.com/gpl-containers/arch-node:20210519
WORKDIR /app
# ... run the rest of the commands ...
```


## Project API


0. VSCode debug

- debug scratch file breakpoint (file-debugger)
- debug src file breakpoint called from scratch ()
- debug on-error (scratch and file)
- debug jest test (jest debugger)

1. Run a REPL for quick development/prototyping

In  a `scratch.ts` fle  practice some commads:
- basics - clear, send, exit
- imports - from lib, from file
- load - exit, load, clear


```bash
npm run dev:repl
```


2. Run jest tests

```bash
# run all tests
npm run dev:jest

# run select tests
npm run dev:jest utils.test.ts
```


3. Start/Connect/Stop database

If there is a DB connection on an open network, can connect to it directly.
Otherwise, may need to tunnel to a server OR run a db container.

Method 1: tunnel to a protected server
```bash
systemctl --user start ssh-tunnel@gpl-test-mysql-tunnel
systemctl --user stop ssh-tunnel@gpl-test-mysql-tunnel
```

Method 2: 
```bash
docker-compose up -d mariadb
```

```bash
npm run db:start
npm run db:repl
npm run db:stop
```

4. Local/Remote start commands

- local: automatically compile, then start
- remote: same start command, but without pre-compiling

```bash
npm run start:local
tsc && npm run start:remote
```


5. Docker start commands

Builds a 'local' container: tagged with 'local' instead of hash.

```bash
npm run docker:build
npm run docker:run
```

6. Deployment to remotes

3 deployment methods:
- push: tag a pre-built container with hash, send to registry
- test: pull from registry on test server, and run
- prod: pull from registry on prod server, and run

```bash
npm run deploy:push
npm run deploy:test
npm run deploy:prod
```
