import axios from 'axios'
import { coinsDetails } from './marketDataService.js'
import dotenv from 'dotenv'
import User from '../model/user.js'
import cron from 'node-cron'
import emoji from 'node-emoji'

dotenv.config()

export let crytoTweetsList = []

export async function fetchTweets() {

    try {
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

    } catch (err) {
        console.log(`err while sending twitter data, reason: ${err}`)
    }
}





