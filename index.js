const TelegramBot = require('node-telegram-bot-api');
const { Pool } = require('pg');
require('dotenv').config();

const token = process.env.TOKEN;
const bot = new TelegramBot(token, {polling: true});

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

bot.onText(/\/get/, (msg, match) => {

	const chatId = msg.chat.id;

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
    pool.query('SELECT * FROM public.posts WHERE needs_to_post IS NULL ORDER BY id DESC', async (err, res) => {
        const posts = res['rows'];
        for (let i = 0; i < posts.length; i++) {
            console.log(posts[i]['title']);
            let message = `<b>${posts[i]['title']}</b>\n\n${posts[i]['link']}`
            await bot.sendMessage(chatId, message, options);
            await delay();
        }
    });

});

bot.on('callback_query', (ev) => {
    const chatId = ev.message.chat.id
    const postId = ev.message.text.match(/https:\/\/habr\.com\/ru\/post\/(\d*)\//)[1];
    if (ev.data === '1') {
        bot.answerCallbackQuery(ev.id, 'Liked').then(() => {
            bot.sendMessage(chatId, `Лайк на пост - ${postId} принят`);
            pool.query(`UPDATE public.posts SET needs_to_post=true WHERE post_id=${postId};`, async (err, res) => {
                console.log(res)
            });
        });

    } else {
        bot.answerCallbackQuery(ev.id, 'Disliked').then(() => {
            bot.sendMessage(chatId, `Дизлайк на пост - ${postId} принят`);
            pool.query(`UPDATE public.posts SET needs_to_post=false WHERE post_id=${postId};`, async (err, res) => {
                console.log(res)
            });
        });
    }
});
