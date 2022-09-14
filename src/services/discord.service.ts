// Discord Webhook Notifications
import { WebhookClient, MessageEmbed, ColorResolvable } from 'discord.js';

// Env
import { config } from 'dotenv';
config();

//  Load in the webhook client (single channel)
const webhookClient = new WebhookClient({ url: `${process.env.WEBHOOK_URL}` });

// send the webhooks, ColorResolvable can be a hex color code string
export const sendDiscordWebhook = async (title: string, description: string, fields: {}, color: ColorResolvable) => {
    const embed = new MessageEmbed();

    embed.setTitle(title).setDescription(description).setColor(color);
    for(let key in fields) {
        // console.log(key, fields[key]);
        embed.addField(key, fields[key]);
    }

    webhookClient.send({
        username: 'RPC-Cache Notification',
        avatarURL: 'https://i.pinimg.com/736x/aa/64/ad/aa64ad43fcf3c6d512c9a486a62d1f27.jpg',
        embeds: [embed],
    });
}