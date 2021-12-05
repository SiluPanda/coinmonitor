import axios from 'axios'
import dotenv from 'dotenv'
import { coinsDetails, availableCoins } from './marketDataService.js'
import cron from 'node-cron'

dotenv.config()


export let priceHistory = {}

export async function getPriceHistory() {
    
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


export async function sendVolatilityAlerts() {
    for (let coinId in priceHistory) {

        let history = priceHistory.coinId.history
        // TODO

        
    }
}

/**
 * detects if there is any anomaly in the volatility lately
 * check last intervals average absolute change percentage, and check if the 
 * last change is significantly higher than the average, currently 
 * the thereshold is (average*3)
 * 
 * @param {Array<Object>} history past data of 1 day, 15 minutes apart
 * @param {number} history.date date in epoch mili
 * @param {number} history.rate price in USD
 * @param {number} history.volume volume
 * 
 * @param {number} thereshold how many times we can tolorate over average change
 */

export async function detectAbnormnalVolatility(history, thereshold=3) {

    let size = history.length

    let totalChange = 0
    let sampleSize = 0
    for (let i = 1; i < size - 1; i++) {
        if (history[i].rate != undefined && history[i-1] != undefined) {
            totalChange += (Math.abs(history[i].rate - history[i-1].rate) / history[i-1].rate) * 100
            sampleSize += 1
        }
    }
    let averageChange = totalChange / sampleSize
    let latestChange = (Math.abs(history[size - 1].rate - history[size - 2].rate) / history[size - 2].rate) * 100

    if (latestChange > thereshold * averageChange) {
        return true;
    }
    else {
        return false;
    }

}   

cron.schedule('0 */30 * * * *', async () => {
    getPriceHistory()
})

detectAbnormnalVolatility


