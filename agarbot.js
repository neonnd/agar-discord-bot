const { Client, RichEmbed } = require('discord.js');
const bot = new Client({ disableEveryone: true });
const request = require('request-promise');
const config = require('./config.json');
const { font } = require('ascii-art');

let embed = new RichEmbed();
let prefix = config.prefix;

bot.on('ready', () => {
    bot.user.setActivity(`${prefix}help`, { type: 'PLAYING' });
    font('AgarBot', 'Doom', art => {
        console.log(art);
    });
});

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
            embed.addField('Commands', `${prefix}party\n${prefix}agar\n${prefix}invite\n${prefix}ping`);
            embed.setColor('RANDOM');
            msg.channel.send(embed);
            break;

        case 'invite':
            embed = new RichEmbed();
            embed.setColor('RANDOM');
            embed.setTitle('Bot Invite Link');
            embed.setURL(`https://discordapp.com/oauth2/authorize?client_id=${bot.user.id}&scope=bot&permissions=7232`);
            msg.channel.send(embed);
            break;

        case 'agar':
            let webBouncer = await request('https://webbouncer-live-v7-0.agario.miniclippt.com/info');
            var xclientkey = await request('https://agar.io/mc/agario.js');
            var versionString = xclientkey.match(/(?<=versionString=")[^"]+/)[0];
            var versionInt = parseInt(versionString.split('.')[0]) * 10000 + parseInt(versionString.split('.')[1]) * 100 + parseInt(versionString.split('.')[2]);
            let init = new Uint8Array(new Uint32Array([versionInt]).buffer);
            let core = await request('https://agar.io/agario.core.js');
            let protocolVersion = core.match(/d;..\(f,(\d+)\);/)[1];
            let agar = JSON.parse(webBouncer);
            embed = new RichEmbed();
            embed.setColor('RANDOM');
            embed.addField('Agar.io PC Servers', `Servers: ${agar.totals.numServers}\n Online: ${agar.totals.numEnabledServers}\nIdle: ${agar.totals.numServers - agar.totals.numEnabledServers}`);
            embed.addField('Players', `SG-Singapore: ${agar.regions['SG-Singapore'].numPlayers}\nUS-Atlanta: ${agar.regions['US-Atlanta'].numPlayers}\nEU-London: ${agar.regions['EU-London'].numPlayers}\nCN-China: ${agar.regions['CN-China'].numPlayers}\nBR-Brazil: ${agar.regions['BR-Brazil'].numPlayers}\nTK-Turkey: ${agar.regions['TK-Turkey'].numPlayers}\nRU-Russia: ${agar.regions['RU-Russia'].numPlayers}\nJP-Tokyo: ${agar.regions['JP-Tokyo'].numPlayers}\nTotal: ${agar.totals.numPlayers}`);
            embed.addField('Info', `Protocol Key: ${versionInt}\nProtocol Version: ${protocolVersion}\n[ ${[255, init]} ]`);
            msg.channel.send(embed);
            break;

        case 'party':
            if (!args[1] || args[1].length == 2 && !args[1].toUpperCase().match(/EU|RU|TK|CN|US|JP|BR|SG/)) {
                embed = new RichEmbed();
                embed.setColor('RANDOM');
                embed.addField('Agar.io Regions', 'CN (China)\nTK (Turkey)\nEU (London)\nUS (Atlanta)\nBR (Brazil)\nJP (Tokyo)\nRU (Russia)\nSG (Singapore)');
                embed.addField('Creating party', `${prefix}party region`);
                embed.addField('Checking party', `${prefix}party code`);
                return msg.channel.send(embed);
            }

            xclientkey = await request('https://agar.io/mc/agario.js');
            versionString = xclientkey.match(/(?<=versionString=")[^"]+/)[0];
            versionInt = parseInt(versionString.split('.')[0]) * 10000 + parseInt(versionString.split('.')[1]) * 100 + parseInt(versionString.split('.')[2]);

            embed = new RichEmbed();
            embed.setColor('RANDOM');

            if (args[1].length == 2) {

                requestV4('https://webbouncer-live-v7-0.agario.miniclippt.com/v4/findServer', versionInt, generateBytes(args[1]), body => {
                    if (body.status !== 'no_servers') {
                        embed.addField('Party info', `Link: https://agar.io/#${body.token}\nRegion: ${generateBytes(args[1], true)}\nCode: ${body.token}\nIP: ${body.endpoints.https.includes('ip') ? 'ws://' + body.endpoints.https : 'wss://' + body.endpoints.https}?party_id=${body.token}`);
                        msg.channel.send(embed);
                    } else {
                        requestV4('https://webbouncer-live-v7-0.agario.miniclippt.com/v4/createToken', versionInt, generateBytes(args[1], null, true), body => {
                            requestV4('https://webbouncer-live-v7-0.agario.miniclippt.com/v4/getToken', versionInt, generateBytes(args[1], null, null, body.token), body => {
                                embed.addField('Party info', `Link: https://agar.io/#${partyToken}\nRegion: ${region}\nCode: ${partyToken}\nIP: ${body.endpoints.https.includes('ip') ? 'ws://' + body.endpoints.https : 'wss://' + body.endpoints.https}?party_id=${partyToken}`);
                                msg.channel.send(embed);
                            });
                        });
                    }
                });

            } else {
                if (args[1].startsWith('#')) args[1] = args[1].split('#')[1];
                requestV4('https://webbouncer-live-v7-0.agario.miniclippt.com/v4/getToken', versionInt, generateBytes(args[1], null, null, args[1]), body => {

                    if (!body.status) {
                        embed.setTitle('invalid party code');
                        return msg.channel.send(embed);
                    }

                    embed.addField('Party info', `IP: ${body.endpoints.https.includes('ip') ? 'ws://' + body.endpoints.https : 'wss://' + body.endpoints.https}?party_id=${args[1].toUpperCase()}\nStatus: ${body.status}`);
                    msg.channel.send(embed);

                });
            }
            break;

    }
});

function requestV4(url, version, token, callback) {
    request({
        url: url,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-client-version': version },
        body: Buffer.from(token)
    }).then(body => {
        body = JSON.parse(body);
        return callback(body);
    }).catch((e) => {
        callback(e);
    });
}

function generateBytes(args, region, backup, token) {
    if (token) {
        let rtoken = [10, 17, 10, 9, 69, 85, 45, 76, 111, 110, 100, 111, 110, 18, 4, 58, 102, 102, 97, 26, 8, 10, 6];
        for (let i = 0; i < token.length; i++) rtoken.push(token.charCodeAt(i));
        return rtoken;
    }
    switch (args.toUpperCase()) {
        case 'EU':
            var server = 'EU-London';
            if (region) return server;
            var bytes = [10, 19, 10, 9];
            for (let i = 0; i < server.length; i++) bytes.push(server.charCodeAt(i));
            if (backup) bytes.push(58, 112, 97, 114, 116, 121, 18, 0);
            else bytes.push(18, 6, 58, 112, 97, 114, 116, 121);
            return bytes;
        case 'RU':
            server = 'RU-Russia';
            if (region) return server;
            bytes = [10, 19, 10, 9];
            for (let i = 0; i < server.length; i++) bytes.push(server.charCodeAt(i));
            if (backup) bytes.push(18, 6, 58, 112, 97, 114, 116, 121);
            else bytes.push(18, 6, 58, 112, 97, 114, 116, 121);
            return bytes;
        case 'TK':
            server = 'TK-Turkey';
            if (region) return server;
            bytes = [10, 19, 10, 9];
            for (let i = 0; i < server.length; i++) bytes.push(server.charCodeAt(i));
            if (backup) bytes.push(18, 6, 58, 112, 97, 114, 116, 12);
            else bytes.push(18, 6, 58, 112, 97, 114, 116, 121);
            return bytes;
        case 'US':
            server = 'US-Atlanta';
            if (region) return server;
            bytes = [10, 20, 10, 16];
            for (let i = 0; i < server.length; i++) bytes.push(server.charCodeAt(i));
            bytes.push(58, 112, 97, 114, 116, 121, 18, 0);
            return bytes;
        case 'JP':
            server = 'JP-Tokyo';
            if (region) return server;
            bytes = [10, 18, 10, 14];
            for (let i = 0; i < server.length; i++) bytes.push(server.charCodeAt(i));
            bytes.push(58, 112, 97, 114, 116, 121, 18, 0);
            return bytes;
        case 'BR':
            server = 'BR-Brazil';
            if (region) return server;
            bytes = [10, 19, 10, 15];
            for (let i = 0; i < server.length; i++) bytes.push(server.charCodeAt(i));
            bytes.push(58, 112, 97, 114, 116, 121, 18, 0);
            return bytes;
        case 'SG':
            server = 'SG-Singapore';
            if (region) return server;
            bytes = [10, 22, 10, 18];
            for (let i = 0; i < server.length; i++) bytes.push(server.charCodeAt(i));
            bytes.push(58, 112, 97, 114, 116, 121, 18, 0);
            return bytes;
        case 'CN':
            server = 'CN-China';
            if (region) return server;
            bytes = [10, 18, 10, 14];
            for (let i = 0; i < server.length; i++) bytes.push(server.charCodeAt(i));
            bytes.push(58, 112, 97, 114, 116, 121, 18, 0);
            return bytes;
    }
}

bot.on('error', err => {
    if (err.msg === 'ECONNRESET' || err.msg === 'ERROR' || !err.msg) return;
    console.log(err);
});

bot.login(config.token);
