const { Client, MessageEmbed } = require('discord.js');
const bot = new Client({ disableEveryone: true });
const { murmur2 } = require('murmurhash-js');
const request = require('request-promise');
const config = require('./config.json');
const WebSocket = require('ws');
require('colour');

let embed = new MessageEmbed();
let prefix = config.prefix;

bot.on('ready', async () => {
    bot.user.setActivity(`${prefix}help`, { type: 'PLAYING' });
    console.log('Ready'.green);
    let xclientkey = await request('https://agar.io/mc/agario.js');
    let versionString = xclientkey.match(/(?<=versionString=")[^"]+/)[0];
    const { groups: { protoVersion } } = /proto-version.+?"(?<protoVersion>\d+.+?)"/gm.exec(xclientkey);
    let versionInt = parseInt(versionString.split('.')[0]) * 10000 + parseInt(versionString.split('.')[1]) * 100 + parseInt(versionString.split('.')[2]);
    let core = await request('https://agar.io/agario.core.js');
    let protocolVersion = core.match(/d;..\(.,(\d+)\);/)[1];
    global.protocolVersion = protocolVersion;
    global.protoVersion = protoVersion;
    global.versionInt = versionInt;
    update();
});

bot.on('message', async msg => {
    if (!msg.content.toLocaleLowerCase().startsWith(prefix)) return;
    if (msg.author.bot || msg.channel.type === 'dm') return;

    const args = msg.content.toLocaleLowerCase().substring(prefix.length).split(' ');

    switch (args[0].toLocaleLowerCase()) {

        case 'ping':
            embed = new MessageEmbed();
            embed.addField('Bot ping', Math.round(bot.ws.ping));
            embed.setColor('RANDOM');
            msg.channel.send(embed);
            break;

        case 'help':
            embed = new MessageEmbed();
            embed.addField('Commands', `${prefix}party\n${prefix}ffa\n${prefix}exp\n${prefix}agar\n${prefix}invite\n${prefix}ping`);
            embed.setColor('RANDOM');
            msg.channel.send(embed);
            break;

        case 'invite':
            embed = new MessageEmbed();
            embed.setColor('RANDOM');
            embed.setTitle('Bot Invite Link');
            embed.setURL(`https://discordapp.com/oauth2/authorize?client_id=${bot.user.id}&scope=bot&permissions=7232`);
            msg.channel.send(embed);
            break;

        case 'agar':
            let latestID = await request('https://webbouncer-live-v8-0.agario.miniclippt.com/getLatestID');
            let webBouncer = await request('https://webbouncer-live-v8-0.agario.miniclippt.com/info');
            let xclientkey = await request('https://agar.io/mc/agario.js');
            let versionString = xclientkey.match(/(?<=versionString=")[^"]+/)[0];
            const { groups: { protoVersion } } = /proto-version.+?"(?<protoVersion>\d+.+?)"/gm.exec(xclientkey);
            let versionInt = parseInt(versionString.split('.')[0]) * 10000 + parseInt(versionString.split('.')[1]) * 100 + parseInt(versionString.split('.')[2]);
            let init = new Uint8Array(new Uint32Array([versionInt]).buffer);
            let core = await request('https://agar.io/agario.core.js');
            let protocolVersion = core.match(/d;..\(.,(\d+)\);/)[1];
            let agar = JSON.parse(webBouncer);
            embed = new MessageEmbed();
            embed.setColor('RANDOM');
            embed.addField('Agar.io PC Servers', `Servers: ${agar.totals.numServers}\n Online: ${agar.totals.numEnabledServers}\nIdle: ${agar.totals.numServers - agar.totals.numEnabledServers}`);
            embed.addField('Players', `SG-Singapore: ${agar.regions['SG-Singapore'].numPlayers}\nUS-Atlanta: ${agar.regions['US-Atlanta'].numPlayers}
            EU-London: ${agar.regions['EU-London'].numPlayers}\nCN-China: ${agar.regions['CN-China'].numPlayers}\nBR-Brazil: ${agar.regions['BR-Brazil'].numPlayers}
            TK-Turkey: ${agar.regions['TK-Turkey'].numPlayers}\nRU-Russia: ${agar.regions['RU-Russia'].numPlayers}\nJP-Tokyo: ${agar.regions['JP-Tokyo'].numPlayers}
            Total: ${agar.totals.numPlayers}`);
            embed.addField('Info', `Proto Version: ${protoVersion}\nProtocol Key: ${versionInt}\nProtocol Version: ${protocolVersion}\n[ ${[255, init]} ]
            LatestID: ${latestID}\n[Config](https://configs-web.agario.miniclippt.com/live/v15/${latestID}/GameConfiguration.json)`);
            msg.channel.send(embed);
            break;

        case 'ffa':
        case 'exp':
            if (!args[1] || !args[1].toUpperCase().match(/EU|RU|TK|CN|US|JP|BR|SG/)) {
                embed = new MessageEmbed();
                embed.setColor('RANDOM');
                embed.addField('Agar.io Regions', 'CN (China)\nTK (Turkey)\nEU (London)\nUS (Atlanta)\nBR (Brazil)\nJP (Tokyo)\nRU (Russia)\nSG (Singapore)');
                embed.addField('Usage', `${prefix}gamemode region`);
                return msg.channel.send(embed);
            }

            embed = new MessageEmbed();
            embed.setColor('RANDOM');

            requestV4('findServer', generateBytes(args[1], args[0] == 'ffa' ? ':ffa' : ':experimental'), body => {
                let ip = `${body.endpoints.https.includes('ip') ? 'ws://' + body.endpoints.https : 'wss://' + body.endpoints.https}`;
                embed.addField('Server info', `Link: https://agar.io/?sip=${body.endpoints.https}\nRegion: ${generateBytes(args[1], 'region')}\nIP: ${ip}`);
                msg.channel.send(embed);
            });

            break;

        case 'party':
            if (!args[1] || args[1].length == 2 && !args[1].toUpperCase().match(/EU|RU|TK|CN|US|JP|BR|SG/)) {
                embed = new MessageEmbed();
                embed.setColor('RANDOM');
                embed.addField('Agar.io Regions', 'CN (China)\nTK (Turkey)\nEU (London)\nUS (Atlanta)\nBR (Brazil)\nJP (Tokyo)\nRU (Russia)\nSG (Singapore)');
                embed.addField('Creating party', `${prefix}party region`);
                embed.addField('Checking party', `${prefix}party code`);
                return msg.channel.send(embed);
            }

            embed = new MessageEmbed();
            embed.setColor('RANDOM');


            if (args[1].length == 2) {

                requestV4('findServer', generateBytes(args[1], ':party'), body => {
                    if (body.status !== 'no_servers') {
                        var ip = `${body.endpoints.https.includes('ip') ? 'ws://' + body.endpoints.https : 'wss://' + body.endpoints.https}?party_id=${body.token}`;
                        embed.addField('Party info', `Link: https://agar.io/#${body.token}\nRegion: ${generateBytes(args[1], 'region')}\nCode: ${body.token}\nIP: ${ip}`);
                        msg.channel.send(embed);
                    }
                    else {
                        requestV4('createToken', generateBytes(args[1], ':party'), body => {
                            let partyToken = body.token;
                            requestV4('getToken', generateBytes(args[1], false, partyToken), body => {
                                ip = `${body.endpoints.https.includes('ip') ? 'ws://' + body.endpoints.https : 'wss://' + body.endpoints.https}?party_id=${body.token}`;
                                embed.addField('Party info', `Link: https://agar.io/#${partyToken}\nRegion: ${generateBytes(args[1], 'region')}\nCode: ${partyToken}\nIP: ${ip}`);
                                msg.channel.send(embed);
                            });
                        });
                    }
                });

            }
            else {

                if (args[1].startsWith('#')) args[1] = args[1].split('#')[1];
                requestV4('getToken', generateBytes('eu', false, args[1].toUpperCase()), body => {

                    if (!body.status) {
                        embed.setTitle('invalid party code');
                        return msg.channel.send(embed);
                    }

                    let ip = `${body.endpoints.https.includes('ip') ? 'ws://' + body.endpoints.https : 'wss://' + body.endpoints.https}?party_id=${args[1].toUpperCase()}`;

                    new Bot(ip, (leaderboard, friends, minimap) => {
                        let leaderboardx = '```' + leaderboard.slice(0, 10).join('') + '```';
                        let totalMass = 0;
                        minimap.forEach(m => {
                            totalMass += m.mass;
                        });
                        totalMass = 1e3 > totalMass ? totalMass : Math.round(totalMass / 100) / 10 + 'k';
                        embed.addField('Party info', `\nLEADERBOARD\n\n${leaderboardx}\nIP: ${ip}\nTotal mass: ${totalMass}\nPlayers: ${leaderboard.length}\nFriends: ${friends}\nStatus: ${body.status}`);
                        msg.channel.send(embed);
                    });

                });
            }
            break;

    }
});

function requestV4(action, token, callback) {
    request({
        url: `https://webbouncer-live-v8-0.agario.miniclippt.com/v4/${action}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-client-version': global.versionInt,
            'x-support-proto-version': global.protoVersion
        },
        body: Buffer.from(token)
    }).then(body => {
        body = JSON.parse(body);
        callback(body);
    }).catch(e => {
        callback(e);
    });
}

function generateBytes(args, mode, token) {

    const regions = {
        sg: 'SG-Singapore',
        us: 'US-Atlanta',
        eu: 'EU-London',
        tk: 'TK-Turkey',
        br: 'BR-Brazil',
        ru: 'RU-Russia',
        jp: 'JP-Tokyo',
        cn: 'CN-China',
    };

    if (mode == 'region') return regions[args];

    const getOwnPropertyNames = function (data) {
        output.push(data.length);
        for (let value = 0; value < data.length; value++) {
            output.push(data.charCodeAt(value));
        }
    };

    if (token) {
        var output = [10, 4 + regions[args].length + 4, 10];
        getOwnPropertyNames(regions[args]);
        output.push(18);
        getOwnPropertyNames(':ffa');
        output.push(26, 8, 10);
        getOwnPropertyNames(token);
        return new Uint8Array(output);
    }

    output = [10, 4 + regions[args].length + mode.length, 10];
    getOwnPropertyNames(regions[args]);
    output.push(18);
    getOwnPropertyNames(mode);
    return new Uint8Array(output);
}

function update() {
    setInterval(async () => {
        let xclientkey = await request('https://agar.io/mc/agario.js');
        let versionString = xclientkey.match(/(?<=versionString=")[^"]+/)[0];
        let versionInt = parseInt(versionString.split('.')[0]) * 10000 + parseInt(versionString.split('.')[1]) * 100 + parseInt(versionString.split('.')[2]);
        const { groups: { protoVersion } } = /proto-version.+?"(?<protoVersion>\d+.+?)"/gm.exec(xclientkey);
        let core = await request('https://agar.io/agario.core.js');
        let protocolVersion = core.match(/d;..\(.,(\d+)\);/)[1];
        global.protocolVersion = protocolVersion;
        global.protoVersion = protoVersion;
        global.versionInt = versionInt;
    }, 3.6e+6);
}

class Bot {
    constructor(server, callback) {

        this.encryptionKey = null;
        this.decryptionKey = null;
        this.callback = callback;
        this.friendsCounter = 0;
        this.leaderboard = [];
        this.server = server;
        this.connect();
    }

    connect() {
        this.ws = new WebSocket(this.server);
        this.ws.binaryType = 'nodebuffer';

        this.ws.onopen = () => {
            let buf = new Buffer.alloc(5);
            buf.writeUInt8(254, 0);
            buf.writeUInt32LE(global.protocolVersion, 1);
            this.ws.send(buf);

            buf = new Buffer.alloc(5);
            buf.writeUInt8(255, 0);
            buf.writeUInt32LE(global.versionInt, 1);
            this.ws.send(buf);
        };

        this.ws.onmessage = msg => {
            msg = new Buffer.from(msg.data);
            let offset = 0;

            if (this.decryptionKey) msg = this.xor(msg, this.decryptionKey);

            switch (msg.readUInt8(offset++)) {
                case 241:
                    this.decryptionKey = global.versionInt ^ msg.readInt32LE(offset);
                    msg = Array.from(msg).splice(5, 11);

                    this.encryptionKey = murmur2(this.ws.url, new Uint8Array(msg), 255);
                    break;

                case 54:
                    if (!this.minimap) return;
                    for (let i = 0; offset < msg.byteLength;) {
                        this.sizrex = false;
                        let flag = msg.readUInt8(offset++);
                        if (flag & 2) {
                            let x, d = '';
                            while ((x = msg.readUInt8(offset++)) != 0) {
                                d += String.fromCharCode(x);
                            }
                            if (!d || d == '' || d.toLowerCase().match(/agarbot|morebots/)) this.sizrex = true;
                            if (i >= 11) this.leaderboard.push(`${i + 1}. ${this.sizrex ? 'OP-Bots.com' : decodeURIComponent(escape(d))}\n`);
                            else this.leaderboard.push(`${i + 1}. ${this.sizrex ? 'OP-Bots.com' : decodeURIComponent(escape(d))} (${this.shortMass(this.minimap[i++].mass)})\n`);
                        }
                        if (flag & 4) offset += 4;
                        if (flag & 16) this.friendsCounter++;
                    }
                    this.callback(this.leaderboard, this.friendsCounter, this.minimap);
                    this.ws.close();
                    break;

                case 69:
                    let x = 0;
                    let d = msg.readUInt16LE(offset);
                    for (offset += 2, this.minimap = [], x = 0; x < d; x++) {
                        let x = msg.readInt32LE(offset);
                        offset += 4;
                        let y = msg.readInt32LE(offset);
                        offset += 4;
                        let mass = msg.readInt32LE(offset);
                        offset += 5;
                        let size = ~~Math.sqrt(100 * mass);
                        this.minimap.push({
                            x: x,
                            y: y,
                            size: size,
                            mass: mass,
                        });
                    }
                    this.minimap.sort((a, b) => { return b.mass - a.mass; });
                    break;
            }
        };
    }

    shortMass(e) {
        return 1e3 > e ? e : Math.round(e / 100) / 10 + 'k';
    }

    xor(buf, xorKey) {
        const newBuf = new Buffer.alloc(buf.byteLength);
        for (let i = 0; i < buf.byteLength; i++) newBuf.writeUInt8(buf.readUInt8(i) ^ xorKey >>> i % 4 * 8 & 255, i);
        return newBuf;
    }
}

bot.on('error', err => {
    if (err.msg === 'ECONNRESET' || err.msg === 'ERROR' || err.statusCode === 520 || !err.msg) return;
    console.log(err);
});

bot.login(config.token);
