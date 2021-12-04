import { Bot } from 'grammy'
import dotenv from 'dotenv'
import User from './model/user.js'
import mongoose from 'mongoose'
import { fetchCoinsDetails, coinsDetails, availableCoins } from './service/marketDataService.js'

dotenv.config()

const dbConnnectionOptions = {
    maxPoolSize: 5,
    minPoolSize: 1,
    socketTimeoutMS: 100000

}

await mongoose.connect(process.env.MONGO_URI, dbConnnectionOptions)
.then(async (res) => {
    console.log("connected to database")
})
.catch((error) => {
    console.log("failed to start application, reason: " + error)
    process.exit(1)
})

await fetchCoinsDetails()


const bot = new Bot(process.env.TELEGRAM_TOKEN)

/**
 * /start
 * 
 * set up user, save a empty user documents in DB and print all available methods
 */
bot.command('start', async (ctx) => {

    let chatId = ctx.msg.chat.id
    let newUser = new User({
        userId: chatId,
        watchlist: []
    })

    User.findOne({ userId: chatId })
    .then(res => {
        if (!res) {
            // add the user if does not exists
            newUser.save()
        }
    })
    .catch(err => console.log(err))

    await ctx.reply(`Hello ${ctx.from.first_name || ctx.from.username}`)
    await ctx.reply('Welcome to coinmonitor. Here are the things bot can do for you!')
    await ctx.reply(`/help: shows all the available commands`)
    await ctx.reply(`/watchlist: shows the coins in your watch list`)
    await ctx.reply(`/add <coin symbol>: adds a coin with specified symbol to watch list, it must be a valid coin symbol. example: /add BTC`)
    await ctx.reply(`/remove <coin symbol>: removes a coin with specified symbol from watch list, if it already exists, example /remove BTC`)
})

bot.command('help', async (ctx) => {
    
    let helpMessage = `The bot can do following things
    1. /start Welcome command, sets up user and prints welcome message
    2. /watchlist Print the details of coins in your watch list
    3. /add Adds a coin in your watchlist, example: /add BTC
    4. /remove Removes a coin from your watchlist, /remove BTC
    5. /all Prints all the monitorable coins `

    await ctx.reply(helpMessage)
})

/**
 * /watchlist 
 * 
 * list the details of all the coins in watchlist
 */
bot.command('watchlist', async (ctx) => {
    await ctx.reply('Fetching your watchlist real quick...')

    let chatId = ctx.msg.chat.id
    let user = await User.findOne({ userId: chatId })
    let watchlist = user?.watchlist || []

    let coins = []
    for (let symbol of watchlist) {
        if (symbol in coinsDetails) coins.push(coinsDetails[symbol])
    }

    if (coins.length == 0) {
        await ctx.reply('Watch list seems empty, add some coins to watchlist with /add <coin symbol> command')
        return
    }

    for (let c of coins) {

        let sym = c.symbol || ''

        let message = `
        ${sym} ${c.name}
        Code: ${c.code}
        Price: ${c.rate}
        Volume: ${c.volume}
        Market Cap: ${c.cap}
        `
        await ctx.reply(message)
    }
    
})

/**
 * /add
 * 
 * adds a coin symbol to watchlist
 */
bot.command('add', async (ctx) => {
    let chatId = ctx.msg.chat.id
    let message = ctx.msg.text

    
    let symbol = message.split(' ')
    if (symbol.length < 2) {
        await ctx.reply("No symbol is provided, please provide a valid symbol, use /all to get all available coins")
        return 
    }

    symbol = symbol[1].toUpperCase()

    if (!(availableCoins.has(symbol))) {
        await ctx.reply(`${symbol} is not valid crypto code, please use command /all to get all available coin codes`)
        return
    }

    let user = await User.findOneAndUpdate({ userId: chatId }, { $addToSet: { watchlist: symbol }})
    await ctx.reply(`Successfully added ${symbol} to your watch list`)
})

/**
 * /remove
 * 
 * removes a coin from watchlist
 */
bot.command('remove', async (ctx) => {
    let chatId = ctx.msg.chat.id
    let message = ctx.msg.text

    let symbol = message.split(' ')
    if (symbol.length < 2) {
        await ctx.reply("No symbol is provided, please provide a valid symbol, use /all to get all available coins")
        return 
    }

    symbol = symbol[1].toUpperCase()

    if (!(availableCoins.has(symbol))) {
        await ctx.reply(`${symbol} is not valid crypto code or not supported yet, please use command /all to get all available coin codes`)
        return
    }

    let user = await User.findOneAndUpdate({ userId: chatId }, { $pull: { watchlist: symbol }})
    await ctx.reply(`Successfully removed ${symbol} from your watch list`)

})

/**
 * /all
 * lists all the available monitorable coins
 */
bot.command('all', async (ctx) => {
    let all = ""
    for (let c in coinsDetails) {
        all += `${c} (${coinsDetails[c].name}) \n`
    }
    
    await ctx.reply(`Below are all coins available to monitor: \n ${all}`)
})




bot.start()