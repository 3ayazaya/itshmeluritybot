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
    const delay = () => new Promise(resolve => setTimeout(resolve, 500));

    const options = {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{text: '✅', callback_data: '1'}, {text: '❌', callback_data: '2'}],
            ]
        }),
        parse_mode: 'HTML'
    };
    pool.query('SELECT * FROM public.posts ORDER BY id DESC', async (err, res) => {
        const posts = res['rows'];
        for (let i = 0; i < posts.length; i++) {
            console.log(posts[i]['title']);
            let message = `<b>${posts[i]['title']}</b>\n\n${posts[i]['link']}`
            await bot.sendMessage(chatId, message, options);
            await delay();
        }
        pool.end();
    });

});

bot.on('callback_query', (ev) => {
    const chatId = ev.message.chat.id

    if (ev.data === '1') {
        bot.answerCallbackQuery(ev.id, 'Liked').then(() => {
            bot.sendMessage(chatId, 'Лайк принят');
        });
    } else
        bot.answerCallbackQuery(ev.id, 'Disliked').then(() => {
            bot.sendMessage(chatId, 'Дизлайк принят');
        });
});
