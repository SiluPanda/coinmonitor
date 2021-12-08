import axios from 'axios'
import { coinsDetails } from './marketDataService.js'
import dotenv from 'dotenv'
import User from '../model/user.js'
import cron from 'node-cron'
import emoji from 'node-emoji'
import { bot } from '../config/bot.js'

dotenv.config()

export let crytoTweetsList = []

export async function fetchTweets() {

    try {
        console.log("fetching tweets...")
        let sourceHandles = [
            'crypto',
            'CryptoIndiaNews',
            'CryptoBoomNews',
            'BTCTN',
            'CryptooIndia',
            'coincrunchin',
            'MessariCrypto',
            'DocumentingBTC'

        ]

        let requestPromises = []

        for (let sourceId of sourceHandles) {
            let config = {
                headers: {
                    Authorization: process.env.TWITTER_TOKEN
                },
                params: {
                    exclude: 'retweets',
                    max_results: 10,
                    start_time: new Date(Date.now() - 3600 * 24 * 1000),
                    'user.fields': 'username',
                    'media.fields': 'url'
                }
            }
            let userId = (await axios.get(process.env.TWITTER_URL + `/users/by?usernames=${sourceId}`, 
                                            { headers: { Authorization: process.env.TWITTER_TOKEN }})).data.data[0].id

            requestPromises.push(axios.get(process.env.TWITTER_URL + `/users/${userId}/tweets`, config))
        }

        let responseList = await Promise.all(requestPromises)
        for (let i = 0; i < responseList.length; i++) {
            if (responseList[i].data.data) {
                let currTweets = responseList[i].data.data
                for (let j = 0; j < currTweets.length; j++) {
                    crytoTweetsList.push(currTweets[j])
                }
            }
        }

    } catch (err) {
        console.log(`error while fetching twitter data, reason: ${err}`)
    }

}

export async function sendTwitterData() {
    try {
        console.log("stating to send tweets to subscribed users...")
        let usersWithTweetAlerts = await User.find({ tweet: true }).exec()

        for (let user of usersWithTweetAlerts) {
            let sendMessagePromises = []
            for (let i = 0; i < crytoTweetsList.length; i++) {
                let message = `${emoji.get('bird')} ${crytoTweetsList[i].text}`
                sendMessagePromises.push(bot.api.sendMessage(user.userId, message))
            }
            await Promise.all(sendMessagePromises)
        }
    } catch (err) {
        console.log(`err while sending twitter data, reason: ${err}`)
    }
}


cron.schedule('0 0 8 * * *', async () => {
    await fetchTweets()
    await sendTwitterData()
})





