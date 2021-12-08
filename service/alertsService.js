import axios from 'axios'
import dotenv from 'dotenv'
import { 
    coinsDetails, 
    availableCoins, 
    priceHistory, 
    getPriceHistory 
} from './marketDataService.js'
import cron from 'node-cron'
import User from '../model/user.js'
import Alert from '../model/alert.js'
import emoji from 'node-emoji'
import { bot } from '../config/bot.js'

dotenv.config()



/**
 * for each coin, check if a alert should be send, and send it to
 * all the subscribed used who has the coin in their watch list
 */
export async function sendVolatilityAlerts() {
    console.log("starting volatility alert service...")

    try {
        for (let coinId in priceHistory) {

            let history = priceHistory[coinId].history
            
            let detection = await detectAbnormnalVolatility(history)
            let shouldAlert = detection[2]
            if (shouldAlert) {
                let targetUsers = await User.find({ watchlist: coinId, volatilityAlert: true }).exec()
                let message = `${emoji.get('fire')} Extreme volatility alert
                Name: ${coinsDetails[coinId].name}
                Code: ${coinsDetails[coinId].code}
                Price: ${coinsDetails[coinId].rate}
                Volume: ${coinsDetails[coinId].volume}
                Average absolute change percentage in 24h of 30 minutes windows: ${detection[0]}
                Change percentage in last 30 minutes: ${detection[1]}
                `

                let sendMessagePromises = []
                for (let user of targetUsers) {
                    sendMessagePromises.push(bot.api.sendMessage(user.userId, message))
                }

                await Promise.all(sendMessagePromises)
            }
            
        }
    } catch (err) {
        console.log(`error while sending volatility alerts, reason: ${err}`)
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
        for (let i = 2; i < size - 2; i++) {
            if (history[i].rate != undefined && history[i-2] != undefined) {
                totalChange += (Math.abs(history[i].rate - history[i-2].rate) / history[i-2].rate) * 100
                sampleSize += 1
            }
        }
        let averageChange = totalChange / sampleSize
        let latestChange = (Math.abs(history[size - 1].rate - history[size - 3].rate) / history[size - 3].rate) * 100

        averageChange = averageChange.toFixed(2)
        latestChange = latestChange.toFixed(2)
        if (latestChange > thereshold * averageChange) {
            return [averageChange, latestChange, true]
        }
        else {
            return [averageChange, latestChange, false]
        }
    } catch (err) {
        console.log(`error while computing volatility anomaly, reason: ${err}`)
        throw new Error(err)
    }

}   


/**
 * sends directional price alerts for the subscribed alerts
 */
export async function sendPriceAlerts() {
    try {
        for (let coinId in coinsDetails) {
            // get alert subscriptions of type below and price above than current price
            let subs = await Alert.find({ coinId: coinId, alertType: 'price', direction: 'below', value: { $gte: coinsDetails[coinId].rate }}).exec()
            let messagePromises = []
            

            for (let sub of subs) {
                let message = `${emoji.get('relieved')} Price alert triggered
                Name: ${coinsDetails[coinId].name}
                Code: ${coinId},
                Price: ${coinsDetails[coinId].rate}
                Volume: ${coinsDetails[coinId].volume}
                Strike Price: ${sub.value}
                Direction: ${sub.direction}`

                messagePromises.push(bot.api.sendMessage(sub.userId, message))
            }

            await Promise.all(messagePromises)

            await Alert.deleteMany({ coinId: coinId, alertType: 'price', direction: 'below', value: { $gte: coinsDetails[coinId].rate }})

            // get alert for the above directional alerts
            subs = await Alert.find({ coinId: coinId, alertType: 'price', direction: 'above', value: { $lte: coinsDetails[coinId].rate }}).exec()
            messagePromises = []

            for (let sub of subs) {
                let message = `${emoji.get('relieved')} Price alert triggered
                Name: ${coinsDetails[coinId].name}
                Code: ${coinId},
                Price: ${coinsDetails[coinId].rate}
                Volume: ${coinsDetails[coinId].volume}
                Strike Price: ${sub.value}
                Direction: ${sub.direction}`

                messagePromises.push(bot.api.sendMessage(sub.userId, message))
            }

            await Promise.all(messagePromises)

            await Alert.deleteMany({ coinId: coinId, alertType: 'price', direction: 'above', value: { $lte: coinsDetails[coinId].rate }})
        }
    } catch (err) {
        console.log(`error while sending price alerts, reason: ${err}`)
    }
}

cron.schedule('0 */30 * * * *', async () => {
    await getPriceHistory()
    await sendVolatilityAlerts()
})

cron.schedule('0 */2 * * * *', async () => {
    await sendPriceAlerts()
})




