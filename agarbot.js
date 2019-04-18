const { Client, RichEmbed } = require('discord.js');
const bot = new Client({ disableEveryone: true });
const request = require('request-promise');
const config = require('./config.json');
const { font } = require('ascii-art');

let embed = new RichEmbed();
let prefix = config.prefix;

bot.on('ready', () => {
    font('AgarBot', 'Doom', art => {
        console.log(art);
    });
    bot.user.setActivity(`${config.prefix}help`, { type: 'PLAYING' });
    bot.on('message', async msg => {
        if (!msg.content.toLocaleLowerCase().startsWith(prefix)) return;
        if (msg.author.bot || msg.channel.type === 'dm') return;
        const args = msg.content.substring(prefix.length).split(' ');

        switch (args[0].toLocaleLowerCase()) {
            case 'ping':
                embed = new RichEmbed();
                embed.addField('Bot ping', Math.round(bot.ping));
                embed.setColor('RANDOM');
                msg.channel.send(embed);
                break;

            case 'help':
                embed = new RichEmbed();
                embed.addField('Commands', `${config.prefix}party\n${config.prefix}agar\n${config.prefix}invite\n${config.prefix}ping`);
                embed.setColor('RANDOM');
                msg.channel.send(embed);
                break;

            case 'party':
                if (!args[1]) {
                    embed = new RichEmbed();
                    embed.setColor('RANDOM');
                    embed.addField('Agar.io Regions', 'CN (China)\nTK (Turkey)\nEU (Europe)\nUS (Atlanta)\nBR (Brazil)\nJP (Tokyo)\nRU (Russia)\nSG (Singapore)');
                    embed.addField('Creating party', `${config.prefix}party region`);
                    embed.addField('Checking party', `${config.prefix}party code`);
                    return msg.channel.send(embed);
                }
                if (args[1].length == 2) {
                    switch (args[1].toUpperCase()) {
                        case 'EU':
                            var rtoken = [10, 19, 10, 15, 69, 85, 45, 76, 111, 110, 100, 111, 110, 58, 112, 97, 114, 116, 121, 18, 0];
                            var bytes = [10, 19, 10, 9, 69, 85, 45, 76, 111, 110, 100, 111, 110, 18, 6, 58, 112, 97, 114, 116, 121];
                            var region = 'EU-London';
                            break;
                        case 'RU':
                            rtoken = [10, 19, 10, 15, 82, 85, 45, 82, 117, 115, 115, 105, 97, 58, 112, 97, 114, 116, 121, 18, 0];
                            bytes = [10, 19, 10, 9, 82, 85, 45, 82, 117, 115, 115, 105, 97, 18, 6, 58, 112, 97, 114, 116, 121];
                            region = 'RU-Russia';
                            break;
                        case 'TK':
                            rtoken = [10, 19, 10, 15, 84, 75, 45, 84, 117, 114, 107, 101, 121, 58, 112, 97, 114, 116, 121, 18, 0];
                            bytes = [10, 19, 10, 9, 84, 75, 45, 84, 117, 114, 107, 101, 121, 18, 6, 58, 112, 97, 114, 116, 12];
                            region = 'TK-Turkey';
                            break;
                        case 'CN':
                            rtoken = [10, 18, 10, 14, 67, 78, 45, 67, 104, 105, 110, 97, 58, 112, 97, 114, 116, 121, 18, 0];
                            bytes = rtoken;
                            region = 'CN-China';
                            break;
                        case 'US':
                            rtoken = [10, 20, 10, 16, 85, 83, 45, 65, 116, 108, 97, 110, 116, 97, 58, 112, 97, 114, 116, 121, 18, 0];
                            bytes = rtoken;
                            region = 'US-Atlanta';
                            break;
                        case 'JP':
                            rtoken = [10, 18, 10, 14, 74, 80, 45, 84, 111, 107, 121, 111, 58, 112, 97, 114, 116, 121, 18, 0];
                            bytes = rtoken;
                            region = 'JP-Tokyo';
                            break;
                        case 'BR':
                            rtoken = [10, 19, 10, 15, 66, 82, 45, 66, 114, 97, 122, 105, 108, 58, 112, 97, 114, 116, 121, 18, 0];
                            bytes = rtoken;
                            region = 'BR-Brazil';
                            break;
                        case 'SG':
                            rtoken = [10, 22, 10, 18, 83, 71, 45, 83, 105, 110, 103, 97, 112, 111, 114, 101, 58, 112, 97, 114, 116, 121, 18, 0];
                            bytes = rtoken;
                            region = 'SG-Singapore';
                            break;
                        default:
                            embed = new RichEmbed();
                            embed.setColor('RANDOM');
                            embed.addField('Agar.io Regions', 'CN (China)\nTK (Turkey)\nEU (Europe)\nUS (Atlanta)\nBR (Brazil)\nJP (Tokyo)\nRU (Russia)\nSG (Singapore)');
                            embed.addField('Creating party', `${config.prefix} region`);
                            embed.addField('Checking party', `${config.prefix}party code`);
                            msg.channel.send(embed);
                            break;
                    }
                    let xclientkey = await request('https://agar.io/mc/agario.js');
                    let versionString = xclientkey.match(/(?<=versionString=")[^"]+/)[0];
                    let versionInt = parseInt(versionString.split(".")[0]) * 10000 + parseInt(versionString.split(".")[1]) * 100 + parseInt(versionString.split(".")[2]);

                    request({
                        url: 'https://webbouncer-live-v6-0.agario.miniclippt.com/v4/findServer',
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-client-version': versionInt },
                        body: Buffer.from(bytes)
                    }).then(body => {
                        body = JSON.parse(body);
                        embed = new RichEmbed();
                        embed.setColor('RANDOM');
                        if (body.status === 'no_servers') {
                            request({
                                url: 'https://webbouncer-live-v6-0.agario.miniclippt.com/v4/createToken',
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'x-client-version': versionInt },
                                body: Buffer.from(rtoken)
                            }).then(body => {
                                body = JSON.parse(body);
                                let partyToken = body.token;
                                let bytez = [10, 17, 10, 9, 69, 85, 45, 76, 111, 110, 100, 111, 110, 18, 4, 58, 102, 102, 97, 26, 8, 10, 6];
                                for (let i = 0; i < partyToken.length; i++) bytez.push(partyToken.charCodeAt(i));
                                request({
                                    url: 'https://webbouncer-live-v6-0.agario.miniclippt.com/v4/getToken',
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'x-client-version': versionInt },
                                    body: Buffer.from(bytez)
                                }).then(body => {
                                    body = JSON.parse(body);
                                    embed = new RichEmbed();
                                    embed.setColor('RANDOM');
                                    embed.addField('Party info', `Link: https://agar.io/#${partyToken}\nRegion: ${region}\nCode: ${partyToken}\nIP: ${body.endpoints.https.includes('ip') ? 'ws://' + body.endpoints.https : 'wss://' + body.endpoints.https}?party_id=${partyToken}`);
                                    msg.channel.send(embed);
                                });
                            });
                        }
                        else {
                            embed.addField('Party info', `Link: https://agar.io/#${body.token}\nRegion: ${region}\nCode: ${body.token}\nIP: ${body.endpoints.https.includes('ip') ? 'ws://' + body.endpoints.https : 'wss://' + body.endpoints.https}?party_id=${body.token}`);
                            msg.channel.send(embed);
                        }
                    });
                }
                else {
                    if (args[1].startsWith('#')) args[1] = args[1].split('#')[1];
                    let bytez = [10, 17, 10, 9, 69, 85, 45, 76, 111, 110, 100, 111, 110, 18, 4, 58, 102, 102, 97, 26, 8, 10, 6];
                    for (let i = 0; i < args[1].length; i++) bytez.push(args[1].toUpperCase().charCodeAt(i));
                    request({
                        url: 'https://webbouncer-live-v6-0.agario.miniclippt.com/v4/getToken',
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-client-version': versionInt },
                        body: Buffer.from(bytez)
                    }).then(body => {
                        body = JSON.parse(body);
                        embed = new RichEmbed();
                        embed.setColor('RANDOM');
                        embed.addField('Party info', `IP: ${body.endpoints.https.includes('ip') ? 'ws://' + body.endpoints.https : 'wss://' + body.endpoints.https}?party_id=${args[1].toUpperCase()}\nStatus: ${body.status}`);
                        msg.channel.send(embed);
                    }).catch(() => {
                        embed = new RichEmbed();
                        embed.setColor('RANDOM');
                        embed.setTitle('invalid party code');
                        msg.channel.send(embed);
                    });
                }
                break;

            case 'invite':
                embed = new RichEmbed();
                embed.setColor('RANDOM');
                embed.setTitle('Bot Invite Link');
                embed.setURL(`https://discordapp.com/oauth2/authorize?client_id=${bot.user.id}&scope=bot&permissions=7232`);
                msg.channel.send(embed);
                break;

            case 'agar':
                let webBouncer = await request('https://webbouncer-live-v6-0.agario.miniclippt.com/info');
                let xclientkey = await request('https://agar.io/mc/agario.js');
                let versionString = xclientkey.match(/(?<=versionString=")[^"]+/)[0];
                let versionInt = parseInt(versionString.split(".")[0]) * 10000 + parseInt(versionString.split(".")[1]) * 100 + parseInt(versionString.split(".")[2]);
                let init = new Uint8Array(new Uint32Array([versionInt]).buffer);
                let core = await request('https://agar.io/agario.core.js');
                let protocolVersion = core.match(/..\(f,\d+\);d=f\+/)[0].replace(/[^0-9]/g, '');
                let agar = JSON.parse(webBouncer);
                embed = new RichEmbed();
                embed.setColor('RANDOM');
                embed.addField('Agar.io PC Servers', `Servers: ${agar.totals.numServers}\n Online: ${agar.totals.numEnabledServers}\nIdle: ${agar.totals.numServers - agar.totals.numEnabledServers}`);
                embed.addField('Players', `SG-Singapore: ${agar.regions['SG-Singapore'].numPlayers}\nUS-Atlanta: ${agar.regions['US-Atlanta'].numPlayers}\nEU-London: ${agar.regions['EU-London'].numPlayers}\nCN-China: ${agar.regions['CN-China'].numPlayers}\nBR-Brazil: ${agar.regions['BR-Brazil'].numPlayers}\nTK-Turkey: ${agar.regions['TK-Turkey'].numPlayers}\nRU-Russia: ${agar.regions['RU-Russia'].numPlayers}\nJP-Tokyo: ${agar.regions['JP-Tokyo'].numPlayers}\nTotal: ${agar.totals.numPlayers}`);
                embed.addField('Info', `Protocol Key: ${versionInt}\nProtocol Version: ${protocolVersion}\n[ ${[ 255, init[0], init[1], init[2], init[3] ]} ]`);
                msg.channel.send(embed);
                break;
        }
    });
});

bot.on('error', err => {
    if (err.msg === 'ECONNRESET' || err.msg === 'ERROR' || !err.msg) return;
    console.log(err);
});

bot.login(config.token);
