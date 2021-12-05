import axios from 'axios'
import dotenv from 'dotenv'
import { coinsDetails, availableCoins } from './marketDataService.js'
import cron from 'node-cron'
import User from '../model/user.js'
import emoji from 'node-emoji'
import { bot } from '../config/bot.js'

dotenv.config()


export let priceHistory = {}

/**
 * method to fetch data from livecoin watch history API from all monitorable coins
 * populates priceHistory global object variable
 */

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


/**
 * for each coin, check if a alert should be send, and send it to
 * all the subscribed used who has the coin in their watch list
 */
export async function sendVolatilityAlerts() {
    for (let coinId in priceHistory) {

        let history = priceHistory[coinId].history
        
        let detection = detectAbnormnalVolatility(history)
        let shouldAlert = detection[2]

        if (shouldAlert) {
            let targetUsers = await User.find({ watchlist: coinId, volatilityAltert: true }).exec()
            let message = 
            `
            ${emoji.get('fire')} Extreme volatility alert
            Name: ${coinsDetails[coinId].name}
            Code: ${coinsDetails[coinId].code}
            Price: ${coinsDetails[coinId].rate}
            Volume: ${coinsDetails[coinId].volume}
            Average absolute change in 24h of 15 min windows: ${detection[0]}
            Latest change: ${detection[1]}
            `


            let sendMessagePromises = []
            for (let user of targetUsers) {
                sendMessagePromises.push(bot.api.sendMessage(chatId, message))
            }

            await Promise.all(sendMessagePromises)
        }
        
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

    try {
        // TODO 

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
            return [averageChange, latestChange, true]
        }
        else {
            return [null, null, true]
        }
    } catch (err) {
        console.log(`error while computing volatility anomaly, reason: ${err}`)
        return [null, null, true]
    }

}   

cron.schedule('0 */30 * * * *', async () => {
    await getPriceHistory()
    await sendVolatilityAlerts()
})



