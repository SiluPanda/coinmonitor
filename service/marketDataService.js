import axios from 'axios'
import dotenv from 'dotenv'
import cron from 'node-cron'
dotenv.config()


export let availableCoins = new Set()
export let coinsDetails = {}
export let priceHistory = {}

export async function fetchCoinsDetails() {
    try {
        console.log('fetching coin details...')
        let data = { "currency": "USD", "sort": "rank", "order": "ascending", "offset": 0, "limit": 100, "meta": true }
        let config = {
            headers: {
                'x-api-key': process.env.DATA_KEY
            }
        }

        let response = await axios.post(process.env.DATA_URL + '/coins/list', data, config)
        for (let coin of response.data) {
            coinsDetails[coin.code] = coin
            availableCoins.add(coin.code)
        }

    } catch (err) {
        console.log(`could not fetch coins, reason: ${err}`)
    }
}


/**
 * method to fetch data from livecoin watch history API from all monitorable coins
 * populates priceHistory global object variable
 */

export async function getPriceHistory() {
    console.log("fetching coin history...")
    try {
        let requestPromises = []

        let dataUrl = process.env.DATA_URL + "/coins/single/history"
        let data = {
            "start": Date.now() - 3600 * 24 * 1000,
            "end": Date.now(),
            "currency": 'USD'
        }
        let config = {
            headers: {
                'x-api-key': process.env.DATA_KEY
            }
        }

        let coinIdList = []
        for (let coinId in coinsDetails) {
            coinIdList.push(coinId)
            data['code'] = coinId
            requestPromises.push(axios.post(dataUrl, data, config))
        }

        let responseList = await Promise.all(requestPromises)
        
        for (let i = 0; i < responseList.length; i++) {
            priceHistory[coinIdList[i]] = responseList[i].data
        }
    } catch (err) {
        console.log(`error while fetching price history, reason: ${err}`)
    }
}



cron.schedule('* * * * *', async () => {
    await fetchCoinsDetails()
})
