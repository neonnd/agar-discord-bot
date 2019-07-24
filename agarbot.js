const { Client, RichEmbed } = require('discord.js');
const bot = new Client({ disableEveryone: true });
const request = require('request-promise');
const config = require('./config.json');
const { font } = require('ascii-art');
const WebSocket = require('ws');

let embed = new RichEmbed();
let prefix = config.prefix;
let debug = null;

bot.on('ready', async () => {
    bot.user.setActivity(`${prefix}help`, { type: 'PLAYING' });
    font('AgarBot', 'Doom', art => {
        console.log(art);
    });
    var xclientkey = await request('https://agar.io/mc/agario.js');
    var versionString = xclientkey.match(/(?<=versionString=")[^"]+/)[0];
    var versionInt = parseInt(versionString.split('.')[0]) * 10000 + parseInt(versionString.split('.')[1]) * 100 + parseInt(versionString.split('.')[2]);
    let core = await request('https://agar.io/agario.core.js');
    let protocolVersion = core.match(/d;..\(f,(\d+)\);/)[1];
    global.protocolVersion = protocolVersion;
    global.versionInt = versionInt;
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

        case 'debug':
            if (msg.author.id != 560932847808937984) return;
            debug ? debug = false : debug = true;
            msg.channel.send(debug);
            break;

        case 'help':
            embed = new RichEmbed();
            embed.addField('Commands', `${prefix}party\n${prefix}ffa\n${prefix}exp\n${prefix}agar\n${prefix}invite\n${prefix}ping`);
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
            let latestID = await request('https://webbouncer-live-v7-0.agario.miniclippt.com/getLatestID');
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
            embed.addField('Info', `Protocol Key: ${versionInt}\nProtocol Version: ${protocolVersion}\n[ ${[255, init]} ]\nLatestID: ${latestID}\n[Config](https://configs-web.agario.miniclippt.com/live/v12/${latestID}/GameConfiguration.json)`);
            msg.channel.send(embed);
            break;

        case 'ffa':
        case 'exp':
            if (!args[1] || !args[1].toUpperCase().match(/EU|RU|TK|CN|US|JP|BR|SG/)) {
                embed = new RichEmbed();
                embed.setColor('RANDOM');
                embed.addField('Agar.io Regions', 'CN (China)\nTK (Turkey)\nEU (London)\nUS (Atlanta)\nBR (Brazil)\nJP (Tokyo)\nRU (Russia)\nSG (Singapore)');
                embed.addField('Usage', `${prefix}gamemode region`);
                return msg.channel.send(embed);
            }

            embed = new RichEmbed();
            embed.setColor('RANDOM');

            requestV4('https://webbouncer-live-v7-0.agario.miniclippt.com/v4/findServer', global.versionInt, generateBytes(args[1], null, null, null, args[0] == 'ffa' ? ':ffa' : ':experimental'), body => {
                let ip = `${body.endpoints.https.includes('ip') ? 'ws://' + body.endpoints.https : 'wss://' + body.endpoints.https}`;
                embed.addField('Server info', `Link: https://agar.io/?sip=${body.endpoints.https}\nRegion: ${generateBytes(args[1], true)}\nIP: ${ip}`);
                msg.channel.send(embed);
            });

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

            embed = new RichEmbed();
            embed.setColor('RANDOM');

            if (args[1].length == 2) {

                requestV4('https://webbouncer-live-v7-0.agario.miniclippt.com/v4/findServer', global.versionInt, generateBytes(args[1]), body => {
                    if (body.status !== 'no_servers') {
                        let ip = `${body.endpoints.https.includes('ip') ? 'ws://' + body.endpoints.https : 'wss://' + body.endpoints.https}?party_id=${body.token}`;
                        embed.addField('Party info', `Link: https://agar.io/#${body.token}\nRegion: ${generateBytes(args[1], true)}\nCode: ${body.token}\nIP: ${ip}`);
                        msg.channel.send(embed);
                    } else {
                        requestV4('https://webbouncer-live-v7-0.agario.miniclippt.com/v4/createToken', global.versionInt, generateBytes(args[1], null, true), body => {
                            let partyToken = body.token;
                            requestV4('https://webbouncer-live-v7-0.agario.miniclippt.com/v4/getToken', global.versionInt, generateBytes(args[1], null, null, partyToken), body => {
                                let ip = `${body.endpoints.https.includes('ip') ? 'ws://' + body.endpoints.https : 'wss://' + body.endpoints.https}?party_id=${partyToken}`;
                                embed.addField('Party info', `Link: https://agar.io/#${partyToken}\nRegion: ${region}\nCode: ${partyToken}\nIP: ${ip}`);
                                msg.channel.send(embed);
                            });
                        });
                    }
                });

            } else {
                if (args[2]) return;
                if (args[1].startsWith('#')) args[1] = args[1].split('#')[1];
                requestV4('https://webbouncer-live-v7-0.agario.miniclippt.com/v4/getToken', global.versionInt, generateBytes(args[1], null, null, args[1]), body => {

                    if (!body || !body.status) {
                        embed.setTitle('invalid party code');
                        return msg.channel.send(embed);
                    }

                    let ip = `${body.endpoints.https.includes('ip') ? 'ws://' + body.endpoints.https : 'wss://' + body.endpoints.https}?party_id=${args[1].toUpperCase()}`;

                    new Bot(ip, debug ? msg : false, (leaderboard, minimap) => {
                        let leaderboardx = "```" + leaderboard.slice(0, 10).join('') + "```";
                        let totalMass = 0;
                        minimap.forEach(m => {
                            totalMass += m.mass;
                        });
                        totalMass = 1e3 > totalMass ? totalMass : Math.round(totalMass / 100) / 10 + "k";
                        embed.addField('Party info', `\nLEADERBOARD\n\n${leaderboardx}\nIP: ${ip}\nTotal mass: ${totalMass}\nPlayers: ${leaderboard.length}\nStatus: ${body.status}`);
                        msg.channel.send(embed);
                    });

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
    }, (err, res, body) => {
        if (err || !res || res.statusCode !== 200) return callback(err);
        body = JSON.parse(body);
        callback(body);
    });
}

function generateBytes(args, region, backup, token, mode) {
    if (token) {
        let rtoken = [10, 17, 10, 9, 69, 85, 45, 76, 111, 110, 100, 111, 110, 18, 4, 58, 102, 102, 97, 26, 8, 10, 6];
        for (let i = 0; i < token.length; i++) rtoken.push(token.charCodeAt(i));
        return rtoken;
    }
    switch (args.toUpperCase()) {
        case 'EU':
            var server = 'EU-London';
            if (mode) {
                const getOwnPropertyNames = function (data) {
                    output.push(data.length);
                    for (let value = 0; value < data.length; value++) {
                        output.push(data.charCodeAt(value));
                    }
                };
                let output = [10, 4 + server.length + mode.length, 10];
                getOwnPropertyNames(server);
                output.push(18);
                getOwnPropertyNames(mode);
                return new Uint8Array(output);
            }
            if (region) return server;
            var bytes = [10, 19, 10, 9];
            for (let i = 0; i < server.length; i++) bytes.push(server.charCodeAt(i));
            if (backup) bytes.push(58, 112, 97, 114, 116, 121, 18, 0);
            else bytes.push(18, 6, 58, 112, 97, 114, 116, 121);
            return bytes;
        case 'RU':
            server = 'RU-Russia';
            if (mode) {
                const getOwnPropertyNames = function (data) {
                    output.push(data.length);
                    for (let value = 0; value < data.length; value++) {
                        output.push(data.charCodeAt(value));
                    }
                };
                let output = [10, 4 + server.length + mode.length, 10];
                getOwnPropertyNames(server);
                output.push(18);
                getOwnPropertyNames(mode);
                return new Uint8Array(output);
            }
            if (region) return server;
            bytes = [10, 19, 10, 9];
            for (let i = 0; i < server.length; i++) bytes.push(server.charCodeAt(i));
            if (backup) bytes.push(18, 6, 58, 112, 97, 114, 116, 121);
            else bytes.push(18, 6, 58, 112, 97, 114, 116, 121);
            return bytes;
        case 'TK':
            server = 'TK-Turkey';
            if (mode) {
                const getOwnPropertyNames = function (data) {
                    output.push(data.length);
                    for (let value = 0; value < data.length; value++) {
                        output.push(data.charCodeAt(value));
                    }
                };
                let output = [10, 4 + server.length + mode.length, 10];
                getOwnPropertyNames(server);
                output.push(18);
                getOwnPropertyNames(mode);
                return new Uint8Array(output);
            }
            if (region) return server;
            bytes = [10, 19, 10, 9];
            for (let i = 0; i < server.length; i++) bytes.push(server.charCodeAt(i));
            if (backup) bytes.push(18, 6, 58, 112, 97, 114, 116, 12);
            else bytes.push(18, 6, 58, 112, 97, 114, 116, 121);
            return bytes;
        case 'US':
            server = 'US-Atlanta';
            if (mode) {
                const getOwnPropertyNames = function (data) {
                    output.push(data.length);
                    for (let value = 0; value < data.length; value++) {
                        output.push(data.charCodeAt(value));
                    }
                };
                let output = [10, 4 + server.length + mode.length, 10];
                getOwnPropertyNames(server);
                output.push(18);
                getOwnPropertyNames(mode);
                return new Uint8Array(output);
            }
            if (region) return server;
            bytes = [10, 20, 10, 16];
            for (let i = 0; i < server.length; i++) bytes.push(server.charCodeAt(i));
            bytes.push(58, 112, 97, 114, 116, 121, 18, 0);
            return bytes;
        case 'JP':
            server = 'JP-Tokyo';
            if (mode) {
                const getOwnPropertyNames = function (data) {
                    output.push(data.length);
                    for (let value = 0; value < data.length; value++) {
                        output.push(data.charCodeAt(value));
                    }
                };
                let output = [10, 4 + server.length + mode.length, 10];
                getOwnPropertyNames(server);
                output.push(18);
                getOwnPropertyNames(mode);
                return new Uint8Array(output);
            }
            if (region) return server;
            bytes = [10, 18, 10, 14];
            for (let i = 0; i < server.length; i++) bytes.push(server.charCodeAt(i));
            bytes.push(58, 112, 97, 114, 116, 121, 18, 0);
            return bytes;
        case 'BR':
            server = 'BR-Brazil';
            if (mode) {
                const getOwnPropertyNames = function (data) {
                    output.push(data.length);
                    for (let value = 0; value < data.length; value++) {
                        output.push(data.charCodeAt(value));
                    }
                };
                let output = [10, 4 + server.length + mode.length, 10];
                getOwnPropertyNames(server);
                output.push(18);
                getOwnPropertyNames(mode);
                return new Uint8Array(output);
            }
            if (region) return server;
            bytes = [10, 19, 10, 15];
            for (let i = 0; i < server.length; i++) bytes.push(server.charCodeAt(i));
            bytes.push(58, 112, 97, 114, 116, 121, 18, 0);
            return bytes;
        case 'SG':
            server = 'SG-Singapore';
            if (mode) {
                const getOwnPropertyNames = function (data) {
                    output.push(data.length);
                    for (let value = 0; value < data.length; value++) {
                        output.push(data.charCodeAt(value));
                    }
                };
                let output = [10, 4 + server.length + mode.length, 10];
                getOwnPropertyNames(server);
                output.push(18);
                getOwnPropertyNames(mode);
                return new Uint8Array(output);
            }
            if (region) return server;
            bytes = [10, 22, 10, 18];
            for (let i = 0; i < server.length; i++) bytes.push(server.charCodeAt(i));
            bytes.push(58, 112, 97, 114, 116, 121, 18, 0);
            return bytes;
        case 'CN':
            server = 'CN-China';
            if (mode) {
                const getOwnPropertyNames = function (data) {
                    output.push(data.length);
                    for (let value = 0; value < data.length; value++) {
                        output.push(data.charCodeAt(value));
                    }
                };
                let output = [10, 4 + server.length + mode.length, 10];
                getOwnPropertyNames(server);
                output.push(18);
                getOwnPropertyNames(mode);
                return new Uint8Array(output);
            }
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

class Bot {
    constructor(server, debug, callback) {

        this.originalLeaderboard = [];
        this.encryptionKey = null;
        this.decryptionKey = null;
        this.callback = callback;
        this.leaderboard = [];
        this.server = server;
        this.debug = debug;
        this.packets = [];
        this.connect();
    }

    connect() {
        this.ws = new WebSocket(this.server);
        this.ws.binaryType = 'nodebuffer';

        this.ws.onopen = () => {
            this.ws.send(new Buffer.from([254, global.protocolVersion, 0, 0, 0]));
            this.ws.send(new Buffer.from([255, 44, 119, 0, 0]));
        };

        this.ws.onmessage = msg => {
            msg = new Buffer.from(msg.data);
            let offset = 0;

            if (this.decryptionKey) msg = this.xor(msg, this.decryptionKey);

            this.packets.push(msg[0]);

            switch (msg.readUInt8(offset++)) {
                case 241:
                    this.decryptionKey = global.versionInt ^ msg.readInt32LE(offset);
                    msg = Array.from(msg).splice(5, 11);

                    this.encryptionKey = this.clientKey(this.ws.url, new Uint8Array(msg));
                    break;

                case 54:
                case 53:
                    if (!this.minimap) return;
                    for (let i = 0; offset < msg.byteLength;) {
                        this.sizrex = false;
                        let flag = msg.readUInt8(offset++);
                        if (flag & 2) {
                            let x, d = '';
                            while ((x = msg.readUInt8(offset++)) != 0) {
                                d += String.fromCharCode(x);
                            }
                            try {
                                if (!d || d == '' || d.toLowerCase().includes('agarbot')) this.sizrex = true;
                                if (i >= 11) this.leaderboard.push(`${i + 1}. ${this.sizrex ? 'OP-Bots.com' : decodeURIComponent(escape(d))}\n`);
                                else this.originalLeaderboard.push(`${i + 1}. ${decodeURIComponent(escape(d))}\n`),
                                    this.leaderboard.push(`${i + 1}. ${this.sizrex ? 'OP-Bots.com' : decodeURIComponent(escape(d))} (${this.shortMass(this.minimap[i++].mass)})\n`);
                            } catch (e) { }
                        }
                        if (flag & 4) offset += 4;
                    }
                    if (this.debug) {
                        this.debug.channel.send('```js\n' + this.packets + '```');
                        this.debug.channel.send('```js\n' + JSON.stringify(this.minimap) + '```');
                        this.debug.channel.send('```js\n' + this.originalLeaderboard.slice(0, 10).join('') + '```');
                        return this.ws.close();
                    }
                    this.callback(this.leaderboard, this.minimap);
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
                    this.minimap.sort((a, b) => { return b - a; });
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

    clientKey(ip, buf) {
        for (var e = null, p = ip.match(/(ws+:\/\/)([^:]*)(:\d+)/)[2], s = p.length + buf.byteLength, o = new Uint8Array(s), a = 0; a < p.length; a++)
            o[a] = p.charCodeAt(a);
        o.set(buf, p.length);
        for (var m = new DataView(o.buffer), r = s - 1, g = 0 | 4 + (-4 & r - 4), h = 255 ^ r, f = 0; 3 < r;)
            e = 0 | Math.imul(m.getInt32(f, !0), 1540483477), h = (0 | Math.imul(e >>> 24 ^ e, 1540483477)) ^ (0 | Math.imul(h, 1540483477)), r -= 4, f += 4;
        switch (r) {
            case 3:
                h = o[g + 2] << 16 ^ h, h = o[g + 1] << 8 ^ h;
                break;
            case 2:
                h = o[g + 1] << 8 ^ h;
                break;
            case 1:
                break;
            default:
                e = h;
        }
        e != h && (e = 0 | Math.imul(o[g] ^ h, 1540483477)), e ^= h = e >>> 13, e = 0 | Math.imul(e, 1540483477), e ^= h = e >>> 15;
        return e;
    }
}

bot.login(config.token);
