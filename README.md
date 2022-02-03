# 📡 Basic API Server - Technical Task for Emma App

[![Emma App Logo](https://assets-global.website-files.com/5dc96d533f57326b74c5225b/5dc96f5282d38de4960324e1_Emma-favicon-32.png)](https://emmafinance.notion.site/Backend-Engineering-Challenge-2022-c6bd492ac5e042a4b6a6698e8fed7a24)
[![SERVER-CI](https://github.com/uFlock/emma-app/actions/workflows/test-server.yml/badge.svg)](https://github.com/uFlock/emma-app/actions/workflows/test-server.yml)

A simple Node.js api-server that implements 2 separate referral algorithms that award introduction when
the `POST /claim-free-share` route is hit. All task details and requirements can be found by clicking the purple gummy
icon above.

### ☀️ Project Features

     📐 TypeScript/Express + MongoDB
     🐳 Dockerised Development Environmet  
     🔮 Test Driven Development
     🔄 Contineous Integration Pipeline (CI via Github Actions)
     📊 Two algorithms [➗Percentage Based] and [💰CPA]
     📚 Some Documentation

### 🚧 Project prerequisites

1. Node and Npm - get the latest LTS version from [here](https://nodejs.org/en/). I would strongly recommend using NVM (
   Node Version Manager).
2. [Docker](https://docs.docker.com/get-docker/) - Please follow the instructions for your respective platform.
3. The demo is designed to run on localhost so please make sure ports `3000` and `27017`
   are not taken by any other process on your dev machine. You can adjust port settings in corresponding `.env`
   and `docker-compose` files.

### 🚀 Getting Started

1. Simply clone the project from `https://github.com/uFlock/primaryBid.git`.
2. Project Root Level Commands (Run these at the project root level):
    * `npm run start` - builds and starts the "production" release that by default will run on `localhost:3000`.
    * `npm run dev` - starts development version with live reload in the docker container (using
      nodemon) `localhost:3000`.
    * `npm run npm-install` - If you want proper type checking and module resolution whilst developing, this swill
      install all the dependencies in the respective `server` and `client` directories.
    * `npm run down-all` - will run compose down for both environments.
3. App Level Commands (Run these at `/server` level):
    * `npm install` - installs all the dependencies for server. (same as `npm run npm-install` at root level)
    * `npm run test` - this will run all the jest test suites and will rerun every time the corresponding code changes.

### 👷 Example Dev Workflow

1. Clone the project from `https://github.com/uFlock/primaryBid.git`.
2. In the root directory run `npm run npm-install` command this will install all the dependencies for the `server`
   project. Alternatively you can `cd server && npm install`.
3. Optional: Go into `server` directory and run `npm run test` command - this will run all the jest test suites and will
   rerun every time the corresponding code changes.
4. Now run `npm run dev` command at the root of the project to spin up the development environment with hot reload on
   code changes.
5. Appropriate tests will auto run in the GitHub Actions CI on every push to the `main` branch.

### 🌳 Environment Files Explained

#### 📡 Server:

`/server` has 3 .env files:

1. `env.dev` - has all the settings for the dev environment that is invoked via the `npm run dev` command at the root
   level.
2. `.env.prod` - (not really prod, more like local) - has all the setting for the "production" environment that is
   invoked via the `npm run start` command at the root level.
3. `.env.example` - example .env file which contains all the `.env` variable explanations. Example for this project
   below:

```dotenv
# PORT to run internally on
PORT=3000
# Mongo connection string
MONGO_URI=mongodb://mongo-db:27017
# in case you queriying via some third-party web interface
ALLOW_CORS_ORIGIN=http://localhost:8080
# REFERRAL SHARE VALUE CHANCES - SHOULD ADD UP TO 100 - REQUIRED EVEN IF NOT IN USE
CHANCE1=95
MIN1=3
MAX1=10

CHANCE2=3
MIN2=10
MAX2=25

CHANCE3=2
MIN3=25
MAX3=200

# CPA - Cost Per Acquisition - if enabled will disable CHANCES logic above
CPA=0 # 0 means disabled any non 0 value enables CPA logic and disables Percentage Algorithm | must be positive number
MIN_CPA_SHARE_COST=3 # optional - defaults to 3 - minimum price share to award / must be positive number and below the CPA value
```

### ⌛ Project Not Yet Complete... Still Working on It... Please Wait...

