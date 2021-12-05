import { Bot } from 'grammy'

export let bot = null

export async function initializeBot() {
    if (!bot) {
        bot = new Bot(process.env.TELEGRAM_TOKEN)
    }
}