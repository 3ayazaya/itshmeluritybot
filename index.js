const TelegramBot = require('node-telegram-bot-api');
const { Pool } = require('pg');
require('dotenv').config();

const token = process.env.TOKEN;
const bot = new TelegramBot(token, {polling: true});

bot.onText(/\/get/, (msg, match) => {

	const chatId = msg.chat.id;

    const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DATABASE,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      });

    pool.connect();

    pool.query('SELECT * FROM public.posts WHERE is_posted IS false ORDER BY id DESC', (err, res) => {
        const posts = res['rows'];
        for (let i = 0; i < posts.length; i++) {
            console.log(posts[i]['title']);
            let message = `<b>${posts[i]['title']}</b>\n\n${posts[i]['link']}`
            bot.sendMessage(chatId, message, {'parse_mode':'HTML'});
        }
        pool.end();
    });
});