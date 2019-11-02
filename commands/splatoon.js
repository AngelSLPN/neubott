const Chariot = require('chariot.js');
const FS = require("fs");
const http = require('https');
const request = require("request");

class Splatoon extends Chariot.Command {
    constructor() {
        super();

        this.name = 'splatoon';
        this.cooldown = 60;
        this.aliases = ['splat'];
        this.owner = true;
        this.help = {
            message: 'Get information from SplatNet2 about current stages and Salmon Run rotations',
            usage: 'splatoon',
            inline: true
        }
    }

    async execute(message, args, chariot) {
        let TSbegin = Date.now();
        // Let's try to make a cache here
        const cacheBattle = ( FS.existsSync('./resources/.cache/spl2-battle.json') ) ? JSON.parse(FS.readFileSync('./resources/.cache/spl2-battle.json', 'utf8')) : null;
        if (cacheBattle == null || cacheBattle.regular[0].end_time < Date.now()/1000) {
        const options = {
            host: 'splatoon2.ink',
            path: '/data/schedules.json',
            family: 4,
            headers: {
                'User-Agent': 'Neubott/0.1 (Neu#1909, @Splatsune)'
            }
        }

        const req = http.get(options, (res) => {
            // Chariot.Logger.event(`Splatoon API status code: ${res.statusCode}`);
            // Chariot.Logger.event(`Splatoon API headers: ${JSON.stringify(res.headers)}`);
            res.setEncoding('utf8');
            let rawSchedules = '';
            res.on('data', (chunk) => {
                rawSchedules += chunk;
            });
            res.on('end',() => {
                try {
                const parsedSchedules = JSON.parse(rawSchedules);
                FS.writeFileSync('./resources/.cache/spl2-battle.json', JSON.stringify(parsedSchedules, null, 2));
                var timeEndBattle = new Date(parsedSchedules.regular[0].end_time);
                var timeRightNow = Math.floor(Date.now()/1000);
                var timeLeftBattle = Math.floor(Math.abs(timeEndBattle - timeRightNow) /60);
                let TSend = Date.now();
                // Chariot.Logger.event("Current Turf War Stages: " + parsedSchedules.regular[0].stage_a.name + " & " + parsedSchedules.regular[0].stage_b.name);
                // Chariot.Logger.event("Current Ranked " + parsedSchedules.gachi[0].rule.name + " Stages: " + parsedSchedules.gachi[0].stage_a.name + " & " + parsedSchedules.gachi[0].stage_b.name);
                // Chariot.Logger.event("Current League " + parsedSchedules.league[0].rule.name + " Stages: " + parsedSchedules.league[0].stage_a.name + " & " + parsedSchedules.league[0].stage_b.name);
                // Chariot.Logger.event("This rotation will change in: " + timeLeftBattle + " minutes");

                message.channel.createEmbed(new Chariot.RichEmbed()
                    .setColor('ORANGE')
                    .setTitle('Splatoon 2: Current Stages')
                    .setDescription('This schedule is valid for the next **' + timeLeftBattle + '** minutes.')
                    .addField('Turf War', parsedSchedules.regular[0].stage_a.name + '\n' + parsedSchedules.regular[0].stage_b.name, true)
                    .addField('Ranked (' + parsedSchedules.gachi[0].rule.name + ')', parsedSchedules.gachi[0].stage_a.name + '\n' + parsedSchedules.gachi[0].stage_b.name,true)
                    .addField('League (' + parsedSchedules.league[0].rule.name + ')', parsedSchedules.league[0].stage_a.name + '\n' + parsedSchedules.league[0].stage_b.name,true)
                    .setUrl('https://splatoon2.ink/')
                    .setTimestamp()
                    .setFooter('Data provided by Splatoon2.ink, processed in ' + (TSend - TSbegin) + 'ms','https://splatoon2.ink/favicon-32x32.png')
                    );
            } catch (e) { message.channel.createMessage("❌ Problem with request: `" + e.message + "`"); }
            });
        });

        req.on('error', (e) => {
            message.channel.createMessage("❌ Problem with request: `" + e.message + "`");
          });

        req.end();
        let pause = await req;
        }
        else { // Use the cached data
            var timeEndBattle = new Date(cacheBattle.regular[0].end_time);
            var timeRightNow = Math.floor(Date.now()/1000);
            var timeLeftBattle = Math.floor(Math.abs(timeEndBattle - timeRightNow) /60);
            let TSend = Date.now();
            // Chariot.Logger.event("Current Turf War Stages: " + cacheBattle.regular[0].stage_a.name + " & " + cacheBattle.regular[0].stage_b.name);
            // Chariot.Logger.event("Current Ranked " + cacheBattle.gachi[0].rule.name + " Stages: " + cacheBattle.gachi[0].stage_a.name + " & " + cacheBattle.gachi[0].stage_b.name);
            // Chariot.Logger.event("Current League " + cacheBattle.league[0].rule.name + " Stages: " + cacheBattle.league[0].stage_a.name + " & " + cacheBattle.league[0].stage_b.name);
            // Chariot.Logger.event("This rotation will change in: " + timeLeftBattle + " minutes");

            message.channel.createEmbed(new Chariot.RichEmbed()
                .setColor('ORANGE')
                .setTitle('Splatoon 2: Current Stages')
                .setDescription('This schedule is valid for the next **' + timeLeftBattle + '** minutes.')
                .addField('Turf War', cacheBattle.regular[0].stage_a.name + '\n' + cacheBattle.regular[0].stage_b.name, true)
                .addField('Ranked (' + cacheBattle.gachi[0].rule.name + ')', cacheBattle.gachi[0].stage_a.name + '\n' + cacheBattle.gachi[0].stage_b.name,true)
                .addField('League (' + cacheBattle.league[0].rule.name + ')', cacheBattle.league[0].stage_a.name + '\n' + cacheBattle.league[0].stage_b.name,true)
                .setUrl('https://splatoon2.ink/')
                .setTimestamp()
                .setFooter('Cached data provided by Splatoon2.ink, processed in ' + (TSend - TSbegin) + 'ms','https://splatoon2.ink/favicon-32x32.png')
                );
        }
        // Now for the Salmon Run data
        TSbegin = Date.now();
        const cacheSR = ( FS.existsSync('./resources/.cache/spl2-salmonrun.json') ) ? JSON.parse(FS.readFileSync('./resources/.cache/spl2-salmonrun.json', 'utf8')) : null;
        if (cacheSR == null || cacheSR.details[0].end_time < Date.now()/1000) {
            const options = {
                host: 'splatoon2.ink',
                path: '/data/coop-schedules.json',
                family: 4,
                headers: {
                    'User-Agent': 'Neubott/0.1 (Neu#1909, @Splatsune)'
                }
            }
        
        const req2 = http.get(options, (res) => {
            // Chariot.Logger.event(`Splatoon API status code: ${res.statusCode}`);
            // Chariot.Logger.event(`Splatoon API headers: ${JSON.stringify(res.headers)}`);
            res.setEncoding('utf8');
            let rawSchedules = '';
            res.on('data', (chunk) => {
                rawSchedules += chunk;
            });
            res.on('end',() => {
                try {
                const parsedSchedules = JSON.parse(rawSchedules);
                FS.writeFileSync('./resources/.cache/spl2-salmonrun.json', JSON.stringify(parsedSchedules, null, 2));
                var timeEndSR = new Date(parsedSchedules.details[0].end_time);
                let SRstage = parsedSchedules.details[0].stage;
                let SRw1 = parsedSchedules.details[0].weapons[0].id > -1 ? parsedSchedules.details[0].weapons[0].weapon.name : `*${parsedSchedules.details[0].weapons[0].coop_special_weapon.name}*`;
                let SRw2 = parsedSchedules.details[0].weapons[1].id > -1 ? parsedSchedules.details[0].weapons[1].weapon.name : `*${parsedSchedules.details[0].weapons[1].coop_special_weapon.name}*`;
                let SRw3 = parsedSchedules.details[0].weapons[2].id > -1 ? parsedSchedules.details[0].weapons[2].weapon.name : `*${parsedSchedules.details[0].weapons[2].coop_special_weapon.name}*`;
                let SRw4 = parsedSchedules.details[0].weapons[3].id > -1 ? parsedSchedules.details[0].weapons[3].weapon.name : `*${parsedSchedules.details[0].weapons[3].coop_special_weapon.name}*`;

                var timeRightNow = Math.floor(Date.now()/1000);
                var timeLeftSR = Math.floor(Math.abs(timeEndSR - timeRightNow) /60/60);
                let TSend = Date.now();
                // Chariot.Logger.event("Current Turf War Stages: " + parsedSchedules.regular[0].stage_a.name + " & " + parsedSchedules.regular[0].stage_b.name);
                // Chariot.Logger.event("Current Ranked " + parsedSchedules.gachi[0].rule.name + " Stages: " + parsedSchedules.gachi[0].stage_a.name + " & " + parsedSchedules.gachi[0].stage_b.name);
                // Chariot.Logger.event("Current League " + parsedSchedules.league[0].rule.name + " Stages: " + parsedSchedules.league[0].stage_a.name + " & " + parsedSchedules.league[0].stage_b.name);
                // Chariot.Logger.event("This rotation will change in: " + timeLeftBattle + " minutes");
                if (timeRightNow < parsedSchedules.details[0].start_time) {
                    message.channel.createEmbed(new Chariot.RichEmbed()
                    .setColor('DARK_GREEN')
                    .setTitle('Grizzco will open in **' + (Math.floor(Math.abs(parsedSchedules.details[0].start_time - timeRightNow) /60/60)) + '** hours.')
                    .setFooter('Processed in ' + (TSend - TSbegin) + 'ms')
                    );
                    return; //Only continue further processing if there's a shift running
                } else {
                    message.channel.createEmbed(new Chariot.RichEmbed()
                    .setColor('DARK_GREEN')
                    .setTitle('Splatoon 2: Salmon Run Shift')
                    .setDescription('This schedule is valid for the next **' + Math.floor(timeLeftSR) + '** hours')
                    .setImage('https://splatoon2.ink/assets/splatnet' + SRstage.image)
                    .addField('Stage', SRstage.name, true)
                    .addField('Weapons', `${SRw1}\n${SRw2}\n${SRw3}\n${SRw4}`, true)
                    .addField('Reward', '*soooon*', true)
                    .setUrl('https://splatoon2.ink/')
                    .setTimestamp()
                    .setFooter('Data provided by Splatoon2.ink, processed in ' + (TSend - TSbegin) + 'ms','https://splatoon2.ink/favicon-32x32.png')
                    );}

            } catch (e) { message.channel.createMessage("❌ Problem with SR request: `" + e.message + "`"); }
            });

        });
        
        req2.on('error', (e) => {
            message.channel.createMessage("❌ Problem with SR request: `" + e.message + "`");
            });

        req2.end();

        } else { // Use the cached data
        let SRstage = cacheSR.details[0].stage;
        let SRw1 = cacheSR.details[0].weapons[0].id > -1 ? cacheSR.details[0].weapons[0].weapon.name : `*${cacheSR.details[0].weapons[0].coop_special_weapon.name}*`;
        let SRw2 = cacheSR.details[0].weapons[1].id > -1 ? cacheSR.details[0].weapons[1].weapon.name : `*${cacheSR.details[0].weapons[1].coop_special_weapon.name}*`;
        let SRw3 = cacheSR.details[0].weapons[2].id > -1 ? cacheSR.details[0].weapons[2].weapon.name : `*${cacheSR.details[0].weapons[2].coop_special_weapon.name}*`;
        let SRw4 = cacheSR.details[0].weapons[3].id > -1 ? cacheSR.details[0].weapons[3].weapon.name : `*${cacheSR.details[0].weapons[3].coop_special_weapon.name}*`;
        var timeEndSR = new Date(cacheSR.details[0].end_time);
        var timeRightNow = Math.floor(Date.now()/1000);
        var timeLeftSR = Math.floor(Math.abs(timeEndSR - timeRightNow) /60/60);
        let TSend = Date.now();
        if (timeRightNow < cacheSR.details[0].start_time) {
            message.channel.createEmbed(new Chariot.RichEmbed()
            .setColor('DARK_GREEN')
            .setTitle('Grizzco will open in **' + (Math.floor(Math.abs(cacheSR.details[0].start_time - timeRightNow) /60/60)) + '** hours.')
            .setFooter('Processed in ' + (TSend - TSbegin) + 'ms')
            );
        } else {
            message.channel.createEmbed(new Chariot.RichEmbed()
            .setColor('DARK_GREEN')
            .setTitle('Splatoon 2: Salmon Run Shift')
            .setDescription('This schedule is valid for the next **' + Math.floor(timeLeftSR) + '** hours')
            .setImage('https://splatoon2.ink/assets/splatnet' + SRstage.image)
            .addField('Stage', SRstage.name, true)
            .addField('Weapons', `${SRw1}\n${SRw2}\n${SRw3}\n${SRw4}`, true)
            .addField('Reward', '*soooon*', true)
            .setUrl('https://splatoon2.ink/')
            .setTimestamp()
            .setFooter('Cached data provided by Splatoon2.ink, processed in ' + (TSend - TSbegin) + 'ms','https://splatoon2.ink/favicon-32x32.png')
            );
        }; //Only continue further processing if there's a shift running
        };

    }
}

module.exports = new Splatoon;