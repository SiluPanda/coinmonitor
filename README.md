# coinmonitor

## Introduction

This is a telegram bot which constantly monitors top 100 crypto currencies and alerts when any abnormalities occur.
Users can get started by visting the bot link in the project description. It has other other helpful commands to easily
track the market.

## Features
- Manage watchlist of a collection of coins, add and remove from available coins
- Set alert for abnoromal sprikes and crashes (extreme volatility)
- Set alert of price movements (eg: below 4000, above 6000 etc)
- Subscribe for crypto news from various twitter sources

## Local setup
- Clone the repo
- Create a telegram bot and get the key
- Install dependecies with `npm i`
- Add a file named `.env` and add following environment varibles:
```
TELEGRAM_TOKEN=<> 
MONGO_URI=<>
DATA_URL=https://api.livecoinwatch.com
DATA_KEY=<>
TWITTER_URL=<>
TWITTER_TOKEN=<>
```

- Start the project with `npm start`

## Data Attribution:
The bot uses live data from the amazing platform https://www.livecoinwatch.com/

[![DigitalOcean Referral Badge](https://web-platforms.sfo2.cdn.digitaloceanspaces.com/WWW/Badge%201.svg)](https://www.digitalocean.com/?refcode=f29a81da8623&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=badge)

