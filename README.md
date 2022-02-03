## 🎁 Referral Reward System - Technical Task for Emma App

[![Emma App Logo](https://assets-global.website-files.com/5dc96d533f57326b74c5225b/5dc96f5282d38de4960324e1_Emma-favicon-32.png)](https://emmafinance.notion.site/Backend-Engineering-Challenge-2022-c6bd492ac5e042a4b6a6698e8fed7a24)
[![SERVER-CI](https://github.com/uFlock/emma-app/actions/workflows/test-server.yml/badge.svg)](https://github.com/uFlock/emma-app/actions/workflows/test-server.yml)

A simple Node.js api-server that implements 2 separate referral award algorithms that award introduction when
the `POST /claim-free-share` route is hit. All task details and requirements can be found by clicking the purple gummy
bear icon above.

### ☀️ Project Features

     📐 TypeScript/Express + MongoDB
     🐳 Dockerised Development Environmet + Hot Reload
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
### 🌟 Bonus Task 1

The CPA algorithm has been implemented and is controlled by the CPA block in the .env file. Please check the section above 
for more details.

### 🌟 Bonus Task 2

The task is a bit ambiguous, it states:

>Assume that now support fractional shares and we decide to start awarding free portions of shares from popular companies like Apple, Google, Tesla because they’re more popular amongst users. Giving a whole Tesla is not feasible because the current price is £500+ so we need to give out a random fraction of it between £3-£200. State how you would adapt your system to achieve with that.

So I assume that what is meant here is that `Broker` now supports fractional shares, and we can now buy/sell fractional shares directly to market.

In that case the only adjustments that need to be made are:

* Add fractional trading functionality to the `Broker` module.
* Keep the CPA/Percentage logic to determine the price ranges.
* Add an array of desirable shares, which can be configured by environment variables, api, anything really.
* Slightly adjust `awardReferralShare()` to take into account the flag.
* Pass that flag to `awardShareToUserUsingCPA()` and `awardShareToUserUsingPercentSettings()`.
* Create functions `awardFractionalShareToUserInPriceRange()` and `buyRandomFractionalShareInPriceRange()` - that will pick a random share from the
  ArrayOfDesirable shares, and then calculates the fraction that needs to be awarded, checks if the rewardsAccount already has that fraction of that
share and then will either award or buy/award the needed fraction of the share.
* `awardFractionalShareToUserInPriceRange()` and `buyRandomFractionalShareInPriceRange()` are going to be invoked by
  `awardFractionalShareToUserInPriceRange()`/`buyRandomFractionalShareInPriceRange()` respectively based on the fractional logic flag.

### ✨ Some Guidance/Explanation for Assessing Persons

> For simplicity of assessing the algorithms it was decided to allow for the same user to claim infinite
> amount of shares (**user** has `shareClaimed: TRUE | FALSE` flag, but it is not used by the system),
> as it was assumed that the purpose of the exercise is to concentrate on referral logic.

> From the above assumption it was decided not to bother with registration nor user management -
> the first time you hit the endpoint with validly formatted email the system will create a user if user
> doesn't exist, so it is safe to use any email to test the algorithms.

> The system uses MongoDB to store user, rewardAccount and transaction data.

> It was assumed that you had to use the **Broker** module as is, as in you couldn't modify the
> methods, **and you had to use them all** as is.

> By mocking out the **Broker** module it was assumed - completely functional
> implementation (albeit best naive implementation) with appropriate test coverage.

> `POST /claim-free-share` route will return:
```ts
const result = { 
   algorithm: PERCENTAGE | CPA, 
   shareAwarded: { tickerSymbol: string, quantity: number, sharePrice: number },
   details: DEPENDS_ON_THE_ALGORITHM_IN_USE
};
```

> Depending on the algorithm enabled (see `.env.example` for more information) the call will return
> a **details** block with debugging information.
>
**Percentage Algorithm details block**

```ts
const details = {
   user: {
      id: string,
      email: string,
      name: string,
      shares: <{ tickerSymbol: string, quantity: number }>[],
      shareClaimed: false //this is always false as is not used by the system
   },
   outcome: {
      chance: number, //the chance that result was going to come up
      result: { //actual price range outcome
         min: number,
         max: number
      }
   }
};
```

**CPA Algorithm details block**:

```ts
const details = {
   referralAggregation: { //this block will not appear on the very first award as there is nothing to aggregate
      _id: "referral transactions",
      numberOfTransactions: number,
      totalValue: number
   },
	currentCpa: number, //current rolling CPA
	targetCpa: number, //target CPA
	allowedMaxPrice: number, //maximum value of the next awarded share
	user: {
		id: string,
		email: string,
		name: string,
		shares: <{ tickerSymbol: string, quantity: number }>[],
		shareClaimed: false //this is always false as is not used by the system
	}
};
```

> ⚠️ Data does not persist between the `server` restarts. 
> Startup script will erase all data in the database on restart and pre-populate the rewards account data.
> This is done to not cause a mess between algorithm changes in the environment.

> When both algorithms are trying to award a share they will first are going to check if the share in the
> current price range is already available in the rewards account, and if so there will be an attempt to award the share,
> if that fails (means other user claimed the share, or share is moved), the algorithm will buy the share in the price range and will
> try to award that until success.

> ⚠️ You will need to restart your dev/prod environment after changing the .env files for changes to take effect.

> Due to the random nature of the CPA algorithm and random market conditions it is unlikely to hit 100% CPA it will 
> always be a bit under or equal within the 5% of the target CPA. 

#### 🙈 If you find any issues or if any of the above assumptions/explanations are too ambiguous and/or wrong please do not hesitate to contact me or, alternatively, please raise an issue on GitHub.

⭐ Happy Assessing!




