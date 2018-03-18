var WELCOME = 'say \x10Hi! I\'m OrangeBot 3.0.;say \x10Start a match with \x06!start map \x08map map',
	WARMUP = 'say \x10Match will start when both teams are \x06!ready\x10',
	WARMUP_KNIFE = 'say \x10Knife round will start when both teams are \x06!ready\x10',
	WARMUP_TIME = 'say \x10or after a maximum of \x06{0}\x10 seconds.',
	WARMUP_TIMEOUT = 'say \x10Starting round in \x0620\x10 seconds.',
	KNIFE_DISABLED = 'say \x10Cancelled knife round.',
	KNIFE_STARTING = 'mp_unpause_match;mp_warmup_pausetimer 0;mp_warmuptime 5;mp_warmup_start; say \x10Both teams are \x06!ready\x10, starting knife round in:;say \x085...',
	KNIFE_STARTED = 'say \x10Knife round started! GL HF!',
	KNIFE_WON = 'mp_pause_match;mp_t_default_secondary "weapon_glock";mp_ct_default_secondary "weapon_hkp2000";mp_free_armor 0;mp_give_player_c4 1;say \x06{0} \x10won the knife round!;say \x10Do you want to \x06!stay\x10 or \x06!swap\x10?',
	KNIFE_STAY = 'mp_unpause_match;mp_restartgame 1;say \x10Match started! GL HF!',
	KNIFE_SWAP = 'mp_unpause_match;mp_swapteams;say \x10Match started! GL HF!',
	PAUSE_ENABLED = 'mp_pause_match;say \x10Pausing match on freeze time!',
	PAUSE_MISSING = 'say \x10All your pauses have been used up already',
	PAUSE_REMAINING = 'say \x10Pauses remaining: \x06{0}\x10 of \x06{1}',
	PAUSE_TIMEOUT = 'say \x10Continuing in \x0620 seconds',
	PAUSE_TIME = 'say \x10Pause will automatically end in \x06{0} seconds',
	PAUSE_ALREADY = 'say \x10A pause was already called.',
	MATCH_STARTING = 'mp_unpause_match;mp_warmup_pausetimer 0;mp_warmuptime 5;mp_warmup_start;log on;say \x10Both teams are \x06!ready\x10, starting match in:;say \x085...',
	MATCH_STARTED = 'say \x10Match started! GL HF!',
	MATCH_PAUSED = 'say \x10Match will resume when both teams are \x06!ready\x10.',
	MATCH_UNPAUSE = 'mp_unpause_match;say \x10Both teams are \x06!ready\x10, resuming match!',
	ROUND_STARTED = 'mp_respawn_on_death_t 0;mp_respawn_on_death_ct 0',
	READY = 'say \x10{0} are \x06!ready\x10, waiting for {1}.',
	LIVE = 'say \x03LIVE!;say \x0eLIVE!;say \x02LIVE!',
	T = 'Terrorists',
	CT = 'Counter-Terrorists',
	GOTV_OVERLAY = 'mp_teammatchstat_txt "Match {0} of {1}"; mp_teammatchstat_1 "{2}"; mp_teammatchstat_2 "{3}"',
	DEMO_REC = 'say \x10Started recording GOTV Demo: \x06{0}',
	DEMO_RECDISABLED = 'say \x10Disabled GOTV Demo recording.',
	DEMO_RECENABLED = 'say \x10Enabled GOTV Demo recording.',
	OT_ENABLED = 'say \x10Enabled Overtime.',
	OT_DISABLED = 'say \x10Disabled Overtime.'
	RESTORE_ROUND = 'mp_backup_restore_load_file "{0}";say \x10Round \x06{1}\x10 has been restored, resuming match in:;say \x085...';

///////////////////////////////////////////////////////////////////////////////

var named = require('named-regexp').named;
var rcon = require('simple-rcon');
var dns = require('dns');
var dgram = require('dgram');
var s = dgram.createSocket('udp4');
var SteamID = require('steamid');
var admins64 = [];
var servers = {};
var localIp = require('ip').address();
var externalIp;
require('public-ip').v4().then(ip => {
	externalIp = ip;
	initConnection();
});
var fs = require('fs');
var myip;

var nconf = require('nconf');
nconf.file({
	file: 'config.json'
});

var pauseSettings = {'uses':nconf.get('pause_uses'), 'time':nconf.get('pause_time')};
var readyTime = nconf.get('ready_time');
var token = nconf.get('telegram_token');
var myport = nconf.get('port');
var rcon_pass = nconf.get('default_rcon');
var admins = nconf.get('admins');
var server_config = nconf.get('server');
var serverType = nconf.get('serverType');
var config_warmup = nconf.get('config_warmup');
var config_knife = nconf.get('config_knife');
var config_match = nconf.get('config_match');
var config_overtime = nconf.get('config_overtime');
var recorddemo = nconf.get('recorddemo');
var knifedefault = nconf.get('knifedefault');
var otdefault = nconf.get('otdefault');
for (var i in admins) {
	admins64.push(id64(admins[i]));
}

if(pauseSettings.time && pauseSettings.time <= 30) pauseSettings.time = 30;
if(readyTime && readyTime <= 30) readyTime = 30;
if(token.length)
{
	var TelegramBot = require('node-telegram-bot-api');
	var bot = new TelegramBot(token, {
		polling: true
	});
	var groupId = nconf.get('telegram_group');
	bot.on('message', function (msg) {
		if (!msg.text) return;
		if (msg.chat.id != groupId) return;
		var nick = msg.from.username || msg.from.first_name;
		var message = msg.text;
		if (msg.reply_to_message) {
			var re = named(/@(:<addr>\d+\.\d+\.\d+\.\d+:\d+)/m);
			var match = re.exec(msg.reply_to_message.text);
			if (match !== null) {
				var addr = match.capture('addr');
				servers[addr].say(message);
			}
		}
	});
}

String.prototype.format = function () {
	var formatted = this;
	for (var i = 0; i < arguments.length; i++) {
		var regexp = new RegExp('\\{' + i + '\\}', 'gi');
		formatted = formatted.replace(regexp, arguments[i]);
	}
	return formatted;
};

s.on('message', function (msg, info) {
	var addr = info.address + ':' + info.port;
	var text = msg.toString(),
		param, cmd, re, match;

	if (servers[addr] === undefined && addr.match(/(\d+\.){3}\d+/)) {
		servers[addr] = new Server(String(addr), String(rcon_pass));
	}
	//console.log(text);

	// join team
	re = named(/"(:<user_name>.+)[<](:<user_id>\d+)[>][<](:<steam_id>.*)[>]" switched from team [<](:<user_team>CT|TERRORIST|Unassigned|Spectator)[>] to [<](:<new_team>CT|TERRORIST|Unassigned|Spectator)[>]/);
	match = re.exec(text);
	if (match !== null) {
		if (servers[addr].state.players[match.capture('steam_id')] === undefined) {
			if (match.capture('steam_id') != 'BOT') {
				servers[addr].state.players[match.capture('steam_id')] = new Player(match.capture('steam_id'), match.capture('new_team'), match.capture('user_name'), undefined);
			}
		} else {
			servers[addr].state.players[match.capture('steam_id')].steamid = match.capture('steam_id');
			servers[addr].state.players[match.capture('steam_id')].team = match.capture('new_team');
			servers[addr].state.players[match.capture('steam_id')].name = match.capture('user_name');
		}
		servers[addr].lastlog = +new Date();
	}

	// clantag
	re = named(/"(:<user_name>.+)[<](:<user_id>\d+)[>][<](:<steam_id>.*?)[>][<](:<user_team>CT|TERRORIST|Unassigned|Spectator)[>]" triggered "clantag" \(value "(:<clan_tag>.*)"\)/);
	match = re.exec(text);
	if (match !== null) {
		if (servers[addr].state.players[match.capture('steam_id')] === undefined) {
			if (match.capture('steam_id') != 'BOT') {
				servers[addr].state.players[match.capture('steam_id')] = new Player(match.capture('steam_id'), match.capture('user_team'), match.capture('user_name'), match.capture('clan_tag'));
			}
		} else {
			servers[addr].state.players[match.capture('steam_id')].clantag = match.capture('clan_tag') !== '' ? match.capture('clan_tag') : undefined;
		}
		servers[addr].lastlog = +new Date();
	}

	// disconnect
	re = named(/"(:<user_name>.+)[<](:<user_id>\d+)[>][<](:<steam_id>.*)[>][<](:<user_team>CT|TERRORIST|Unassigned|Spectator)[>]" disconnected/);
	match = re.exec(text);
	if (match !== null) {
		if (servers[addr].state.players[match.capture('steam_id')] !== undefined) {
			delete servers[addr].state.players[match.capture('steam_id')];
		}
		servers[addr].lastlog = +new Date();
	}

	// map loading
	re = named(/Loading map "(:<map>.*?)"/);
	match = re.exec(text);
	if (match !== null) {
		for (var prop in servers[addr].state.playerrs) {
			if (servers[addr].state.players.hasOwnProperty(prop)) {
				delete servers[addr].state.players[prop];
			}
		}
		servers[addr].lastlog = +new Date();
	}

	// map started
	re = named(/Started map "(:<map>.*?)"/);
	match = re.exec(text);
	if (match !== null) {
		servers[addr].newmap(match.capture('map'));
		servers[addr].lastlog = +new Date();
	}

	// round start
	re = named(/World triggered "Round_Start"/);
	match = re.exec(text);
	if (match !== null) {
		servers[addr].round();
		servers[addr].lastlog = +new Date();
	}

	// round end
	re = named(/Team "(:<team>.*)" triggered "SFUI_Notice_(:<team_win>Terrorists_Win|CTs_Win|Target_Bombed|Target_Saved|Bomb_Defused)" \(CT "(:<ct_score>\d+)"\) \(T "(:<t_score>\d+)"\)/);
	match = re.exec(text);
	if (match !== null) {
		var score = {
			'TERRORIST': parseInt(match.capture('t_score')),
			'CT': parseInt(match.capture('ct_score'))
		};
		servers[addr].score(score);
		servers[addr].lastlog = +new Date();
	}

	// !command
	re = named(/"(:<user_name>.+)[<](:<user_id>\d+)[>][<](:<steam_id>.*)[>][<](:<user_team>CT|TERRORIST|Unassigned|Spectator|Console)[>]" say(:<say_team>_team)? "[!\.](:<text>.*)"/);
	match = re.exec(text);
	if (match !== null) {
		var isadmin = match.capture('user_id') == '0' || servers[addr].admin(match.capture('steam_id'));
		param = match.capture('text').split(' ');
		cmd = param[0];
		param.shift();
		switch (String(cmd)) {
		case 'admin':
			if(token.length) {
				var message = param.join(' ').replace('!admin ', '');
				bot.sendMessage(groupId, '*' + match.capture('user_name') + '@' + addr + "*\n" + message + "\n*Admin called*", {
					parse_mode: 'Markdown'
				});
			}
			break;
		case 'restore':
		case 'replay':
			if (isadmin) servers[addr].restore(param);
			break;
		case 'status':
		case 'stats':
		case 'score':
		case 'scores':
			servers[addr].stats(true);
			break;
		case 'restart':
		case 'reset':
		case 'warmup':
			if (isadmin) servers[addr].warmup();
			break;
		case 'maps':
		case 'map':
		case 'start':
		case 'match':
		case 'startmatch':
			if (isadmin || !servers[addr].get().live) servers[addr].start(param);
			break;
		case 'force':
			if (isadmin) servers[addr].ready(true);
			break;
		case 'resume':
		case 'ready':
		case 'rdy':
		case 'gaben':
		case 'r':
		case 'unpause':
			servers[addr].ready(match.capture('user_team'));
			break;
		case 'pause':
			servers[addr].pause(match.capture('user_team'));
			break;
		case 'stay':
			servers[addr].stay(match.capture('user_team'));
			break;
		case 'swap':
		case 'switch':
			servers[addr].swap(match.capture('user_team'));
			break;
		case 'knife':
			if (isadmin) servers[addr].knife();
			break;
		case 'record':
			if (isadmin) servers[addr].record();
			break;
		case 'ot':
		case 'overtime':
			if (isadmin) servers[addr].overtime();
			break;
		case 'disconnect':
		case 'quit':
		case 'leave':
			if (isadmin) {
				servers[addr].quit();
				delete servers[addr];
				console.log('Disconnected from ' + addr);
			}
			break;
		case 'say':
			if (isadmin) servers[addr].say(param.join(' '));
			break;
		case 'debug':
			servers[addr].debug();
			break;
		default:
		}
		servers[addr].lastlog = +new Date();
	}
});

function clean(str) {
	return str.replace(/[^A-Za-z0-9: \-_,]/g, '');
}

function cleansay(str) {
	return str.replace('ä', 'a').replace('ö', 'o').replace(/[^A-Za-z0-9:<>.?! \-_,]/g, '');
}

function Player(steamid, team, name, clantag) {
	this.steamid = steamid;
	this.team = team;
	this.name = name;
	this.clantag = clantag;
}

function Server(address, pass, adminip, adminid, adminname) {
	var tag = this;
	this.state = {
		ip: address.split(':')[0],
		port: address.split(':')[1] || 27015,
		pass: pass,
		live: false,
		map: '',
		maps: [],
		knife: knifedefault,
		record: recorddemo,
		ot: otdefault,
		score: [],
		knifewinner: false,
		paused: false,
		freeze: false,
		unpause: {
			'TERRORIST': false,
			'CT': false
		},
		ready: {
			'TERRORIST': false,
			'CT': false
		},
		steamid: [],
		admins: [],
		queue: [],
		players: {},
		pauses: {}
	};
	if (adminid !== undefined && tag.state.steamid.indexOf(adminid) == -1) {
		tag.state.steamid.push(id64(adminid));
		tag.state.admins.push(adminname);
	}
	this.get = function () {
		return this.state;
	};
	this.rcon = function (cmd) {
		if (cmd === undefined) return;
		this.state.queue.push(cmd);
	};
	this.realrcon = function (cmd) {
		if (cmd === undefined) return;
		var conn = new rcon({
			host: this.state.ip,
			port: this.state.port,
			password: this.state.pass
		});
		conn.on('authenticated', function () {
			cmd = cmd.split(';');
			for (var i in cmd) {
				conn.exec(String(cmd[i]));
			}
			conn.close();
		}).on('error', function (err) {
			//console.log('err);
		});
		conn.connect();
	};
	this.clantag = function (team) {
		if (team != 'TERRORIST' && team != 'CT') {
			return team;
		}
		var tags = {};
		var ret = 'mix1';
		if (team == 'CT' && this.clantag('TERRORIST') == 'mix1') {
			ret = 'mix2';
		}
		for (var i in this.state.players) {
			if (this.state.players[i].team == team && this.state.players[i].clantag !== undefined) {
				if (tags[this.state.players[i].clantag] === undefined) {
					tags[this.state.players[i].clantag] = 0;
				}
				tags[this.state.players[i].clantag]++;
			}
		}
		var max = 0;
		for (var prop in tags) {
			if (tags.hasOwnProperty(prop) && tags[prop] > max) {
				ret = prop;
			}
		}
		ret = clean(ret);
		if (team == 'CT' && this.clantag('TERRORIST') == ret) {
			ret = ret + '2';
		}
		return ret;
	};
	this.admin = function (steamid) {
		return (this.state.steamid.indexOf(id64(steamid)) >= 0 || admins64.indexOf(id64(steamid)) >= 0);
	};
	this.hasadmin = function () {
		return (this.state.steamid.length > 0);
	};
	this.stats = function (tochat) {
		var team1 = this.clantag('TERRORIST');
		var team2 = this.clantag('CT');
		var stat = {};
		stat[team1] = [];
		stat[team2] = [];
		for (var i in this.state.maps) {
			if (this.state.score[this.state.maps[i]] !== undefined) {
				if (this.state.score[this.state.maps[i]][team1] !== undefined) {
					stat[team1][i] = this.state.score[this.state.maps[i]][team1];
				} else {
					stat[team1][i] = 'x';
				}
				if (this.state.score[this.state.maps[i]][team2] !== undefined) {
					stat[team2][i] = this.state.score[this.state.maps[i]][team2];
				} else {
					stat[team2][i] = 'x';
				}
			} else {
				stat[team1][i] = 'x';
				stat[team2][i] = 'x';
			}
		}
		var maps = [];
		var scores = {team1:0, team2:0};
		for (var j = 0; j < this.state.maps.length; j++) {
			maps.push(this.state.maps[j] + ' ' + stat[team1][j] + '-' + stat[team2][j]);

			if(this.state.maps[j] != this.state.map)
			{
				if (stat[team1][j] > stat[team2][j]) scores.team1 += 1;
				else if(stat[team1][j] < stat[team2][j]) scores.team2 += 1;
			}
		}
		var chat = '\x10' + team1 + ' [\x06' + maps.join(', ') + '\x10] ' + team2;
		if (tochat) {
			this.rcon('say ' + chat);
		} else {
			var index = this.state.maps.indexOf(this.state.map);
			this.rcon(GOTV_OVERLAY.format(index+1, this.state.maps.length, scores.team1, scores.team2));
		}
		return chat;
	};
	this.restore = function(round) {
		var roundNum = parseInt(round);
		if (roundNum < 10) roundNum = "0"+roundNum;
		this.rcon(RESTORE_ROUND.format('backup_round'+roundNum+'.txt', round));
		setTimeout(function () {
			tag.rcon('say \x054...');
		}, 1000);
		setTimeout(function () {
			tag.rcon('say \x063...');
		}, 2000);
		setTimeout(function () {
			tag.rcon('say \x102...');
		}, 3000);
		setTimeout(function () {
			tag.rcon('say \x0f1...');
		}, 4000);
		setTimeout(function () {
			tag.rcon(LIVE+';mp_unpause_match');
		}, 5000);
	};
	this.round = function () {
		this.state.freeze = false;
		this.state.paused = false;
		this.rcon(ROUND_STARTED);
	};
	this.pause = function (team) {
		team = this.clantag(team);
		if (!this.state.live) return;
		if (this.state.paused) {
			this.rcon(PAUSE_ALREADY);
			return;
		}

		if(pauseSettings.uses) 
		{
			if (!this.state.pauses[team]) return this.rcon(PAUSE_MISSING);
			this.state.pauses[team]-=1;
			this.rcon(PAUSE_REMAINING.format(this.state.pauses[team], pauseSettings.uses));
		}
		
		if(token.length) {
			var message = this.clantag('TERRORIST') + ' - ' + this.clantag('CT') + "\n*Match paused*";
			bot.sendMessage(groupId, '*Console@' + this.state.ip + ':' + this.state.port + "*\n" + message, {
				parse_mode: 'Markdown'
			});
		}
		this.rcon(PAUSE_ENABLED);
		this.state.paused = true;
		this.state.unpause = {
			'TERRORIST': false,
			'CT': false
		};
		if (this.state.freeze) {
			this.matchPause();
		}
	};
	this.matchPause = function() {
		this.rcon(MATCH_PAUSED);
		
		if (pauseSettings.time) {
			clearTimeout(this.state.pauses.timer);
			this.state.pauses.timer = setTimeout(function() {
				tag.rcon(PAUSE_TIMEOUT);
				tag.state.pauses.timer = setTimeout(function() {
					tag.ready(true);
				}, 20*1000);
			}, (pauseSettings.time-20)*1000);
			this.rcon(PAUSE_TIME.format(pauseSettings.time));
		}
	};
	this.status = function () {
		var conn = new rcon({
			host: this.state.ip,
			port: this.state.port,
			password: this.state.pass
		}).on('error', function (err) {
			//console.log(err);
		}).exec('status', function (res) {
			var re = named(/map\s+:\s+(:<map>.*?)\s/);
			var match = re.exec(res.body);
			if (match !== null) {
				var map = match.capture('map');
				if (tag.state.maps.indexOf(map) >= 0) {
					tag.state.map = map;
				} else {
					//tag.state.maps = [map];
					tag.state.map = map;
				}
				tag.stats(false);
			}
			var regex = new RegExp('"(:<user_name>.*?)" (:<steam_id>STEAM_.*?) .*?' + adminip + ':', '');
			re = named(regex);
			match = re.exec(res.body);
			if (match !== null) {
				for (var i in match.captures.steam_id) {
					if (tag.state.steamid.indexOf(id64(match.captures.steam_id[i])) == -1) {
						tag.state.steamid.push(id64(match.captures.steam_id[i]));
						tag.state.admins.push(match.captures.user_name[i]);
					}
				}
			}
			conn.close();
		}).connect();
	};
	this.start = function (maps) {
		this.state.score = [];
		if (maps.length > 0) {
			this.state.maps = maps;
			if (this.state.map != maps[0]) {
				this.rcon('changelevel ' + this.state.maps[0]);
			} else {
				this.newmap(maps[0], 0);
			}
		} else {
			this.state.maps = [];
			this.newmap(this.state.map, 0);
			setTimeout(function () {
				tag.status();
			}, 1000);
		}
	};
	this.ready = function (team) {
		if (this.state.live && this.state.paused) {
			if (team === true) {
				this.state.unpause.TERRORIST = true;
				this.state.unpause.CT = true;
			} else {
				this.state.unpause[team] = true;
			}
			if (this.state.unpause.TERRORIST != this.state.unpause.CT) {
				this.rcon(READY.format(this.state.unpause.TERRORIST ? T : CT, this.state.unpause.TERRORIST ? CT : T));
			} else if (this.state.unpause.TERRORIST === true && this.state.unpause.CT === true) {
				if("timer" in this.state.pauses) clearTimeout(this.state.pauses.timer);
				this.rcon(MATCH_UNPAUSE);
				this.state.paused = false;
				this.state.unpause = {
					'TERRORIST': false,
					'CT': false
				};
			}
		} else if (!this.state.live) {
			if (team === true) {
				this.state.ready.TERRORIST = true;
				this.state.ready.CT = true;
			} else {
				this.state.ready[team] = true;
			}
			if (this.state.ready.TERRORIST != this.state.ready.CT) {
				this.rcon(READY.format(this.state.ready.TERRORIST ? T : CT, this.state.ready.TERRORIST ? CT : T));
			} else if (this.state.ready.TERRORIST === true && this.state.ready.CT === true) {
				this.state.live = true;
				if("timer" in this.state.ready) clearTimeout(this.state.ready.timer);
				if (this.state.knife) {
                			this.rcon(this.getconfig(config_knife));
					tag.rcon(KNIFE_STARTING);


					setTimeout(function () {
						tag.rcon(KNIFE_STARTED);
					}, 9000);
				} else {

					this.rcon(this.getconfig(config_match));
					this.startrecord();
					this.rcon(MATCH_STARTING);

					setTimeout(function () {
						tag.rcon(MATCH_STARTED);
					}, 9000);
					if(token.length) {
						var message = this.stats(false) + "\n" + this.state.maps.join(' ').replace(this.state.map, '*' + this.state.map + '*').replace(/de_/g, '') + "\n*Match started*";
						bot.sendMessage(groupId, '*Console@' + this.state.ip + ':' + this.state.port + "*\n" + message, {
							parse_mode: 'Markdown'
						});
					}
				}
				setTimeout(function () {
					tag.rcon('say \x054...');
				}, 1000);
				setTimeout(function () {
					tag.rcon('say \x063...');
				}, 2000);
				setTimeout(function () {
					tag.rcon('say \x102...');
				}, 3000);
				setTimeout(function () {
					tag.rcon('say \x0f1...');
				}, 4000);
				setTimeout(function () {
					tag.rcon(LIVE);
				}, 5000);
			}
		}
	};
	this.newmap = function (map, delay) {
		if(token.length) {
			var message = this.stats(false) + "\n" + this.state.maps.join(' ').replace(map, '*' + map + '*').replace(/de_/g, '') + "\n*Map loaded*";
			bot.sendMessage(groupId, '*Console@' + this.state.ip + ':' + this.state.port + "*\n" + message, {
				parse_mode: 'Markdown'
			});
		}
		if (delay === undefined) delay = 10000;
		var index = -1;
		if (this.state.maps.indexOf(map) >= 0) {
			index = this.state.maps.indexOf(map);
			this.state.map = map;
		} else {
			this.state.maps = [map];
			this.state.map = map;
		}
		
		this.state.pauses[this.clantag('CT')] = pauseSettings.uses;
		this.state.pauses[this.clantag('TERRORIST')] = pauseSettings.uses;
		
		setTimeout(function () {
			if (index >= 0 && tag.state.maps[index + 1] !== undefined) {
				tag.rcon('nextlevel ' + tag.state.maps[index + 1]);
			} else {
				tag.rcon('nextlevel ""');
			}
			tag.stats(false);
			tag.warmup();
			tag.startReadyTimer();
		}, delay);
	};
	this.knife = function () {
		if (this.state.live) return;
		if (!this.state.knife) {
			this.state.knife = true;
			this.rcon(WARMUP_KNIFE);
			this.startReadyTimer();
		} else {
			this.state.knife = false;
			this.rcon(KNIFE_DISABLED);
			if("timer" in this.state.ready) clearTimeout(this.state.ready.timer);
		}
	};

        this.record = function () {
		if (this.state.live) return;
		if (this.state.recorddemo === true) {
			this.state.recorddemo = false;
			this.rcon(DEMO_RECDISABLED);
		} else {
			this.state.recorddemo = true;
			this.rcon(DEMO_RECENABLED);
		}
        };

	this.overtime = function () {
                if (this.state.ot === true) {
                        this.state.ot = false;
                        this.rcon(OT_DISABLED);
			this.rcon('mp_overtime_enable 0');
                } else {
                        this.state.ot = true;
                        this.rcon(OT_ENABLED);
			this.rcon(this.getconfig(config_overtime));
                }
        };

	this.startrecord = function () {
 		if (recorddemo === true) {
		var demoname = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').replace(/\..+/, '') + '_' + this.state.map + '_' + clean(this.clantag('TERRORIST')) + '-' + clean(this.clantag('CT')) + '.dem';
		this.rcon('tv_stoprecord; tv_record ' + demoname);
		this.rcon(DEMO_REC.format(demoname));
                                        }
};

	this.getconfig = function (file) {
		var config_unformatted = fs.readFileSync(file, 'utf8');
		config_formatted = config_unformatted.replace(/(\r\n\t|\n|\r\t)/gm,"; ");
		return config_formatted;
	};

	this.startReadyTimer = function() {
		if(!readyTime) return;
		if("timer" in this.state.ready) clearTimeout(this.state.ready.timer);
		
		var tag = this;
		this.rcon(WARMUP_TIME.format(readyTime));
		this.state.ready.timer = setTimeout(function() {
			tag.rcon(WARMUP_TIMEOUT);
			tag.state.ready.timer = setTimeout(function() {
				tag.ready(true);
			}, 20*1000);
		}, (readyTime-20)*1000);
	};
	this.score = function (score) {
		/*var message = this.clantag('TERRORIST') + ' *' + score.TERRORIST + ' - ' + score.CT + '* ' + this.clantag('CT');
		bot.sendMessage(groupId, '*Console@' + this.state.ip + ':' + this.state.port + "*\n" + message, {
			parse_mode: 'Markdown'
		});*/
		var tagscore = {};
		tagscore[this.clantag('CT')] = score.CT;
		tagscore[this.clantag('TERRORIST')] = score.TERRORIST;
		this.state.score[this.state.map] = tagscore;
		this.stats(false);
		if (score.TERRORIST + score.CT == 1 && this.state.knife) {
			this.state.knifewinner = score.TERRORIST == 1 ? 'TERRORIST' : 'CT';
			this.state.knife = false;
			this.rcon(this.getconfig(config_match));
			this.rcon(KNIFE_WON.format(this.state.knifewinner == 'TERRORIST' ? T : CT));

		} else if (this.state.paused) {
			this.matchPause();
		}
		this.state.freeze = true;
	};
	this.stay = function (team) {
		if (team == this.state.knifewinner) {
			this.rcon(KNIFE_STAY);
			this.state.knifewinner = false;
			this.startrecord();
		}
	};
	this.swap = function (team) {
		if (team == this.state.knifewinner) {
			this.rcon(KNIFE_SWAP);
			this.state.knifewinner = false;
			this.startrecord();
		}
	};
	this.quit = function () {
		this.rcon('logaddress_delall;log off;say \x10I\'m outta here!');
	};
	this.debug = function () {
		this.rcon('say \x10live: ' + this.state.live + ' paused: ' + this.state.paused + ' freeze: ' + this.state.freeze + ' knife: ' + this.state.knife + ' knifewinner: ' + this.state.knifewinner + ' ready: T:' + this.state.ready.TERRORIST + ' CT:' + this.state.ready.CT + ' unpause: T:' + this.state.unpause.TERRORIST + ' CT:' + this.state.unpause.CT);
		this.stats(true);
	};
	this.say = function (msg) {
		//this.rcon('say \x10' + cleansay(msg));
		this.rcon('say ' + cleansay(msg));
	};
	this.warmup = function () {
		this.state.ready = {
			'TERRORIST': false,
			'CT': false
		};
		this.state.unpause = {
			'TERRORIST': false,
			'CT': false
		};
		this.state.live = false;
		this.state.paused = false;
		this.state.freeze = false;
		this.state.knifewinner = false;
		this.state.knife = knifedefault;
		this.state.record = recorddemo;
		this.state.ot = otdefault;

		this.rcon(this.getconfig(config_warmup));

		if (this.state.ot) { 
			this.rcon(this.getconfig(config_overtime));
		}

		tag.rcon(WARMUP);
	};
	this.rcon('sv_rcon_whitelist_address ' + myip + ';logaddress_add ' + myip + ':' + myport + ';log on');
	this.status();
	setTimeout(function () {
		tag.rcon(WELCOME);
	}, 1000);
	s.send("plz go", 0, 6, this.state.port, this.state.ip); // SRCDS won't send data if it doesn't get contacted initially
	console.log('Connected to ' + this.state.ip + ':' + this.state.port + ', pass ' + this.state.pass);
}
setInterval(function () {
	for (var i in servers) {
		if (!servers.hasOwnProperty(i)) return;
		var now = +new Date();
		if (servers[i].lastlog < now - 1000 * 60 * 10 && servers[i].state.players.length < 3) {
			console.log('Dropping idle server ' + i);
			delete servers[i];
			continue;
		}
		if (!servers[i].state.live) {
			if (servers[i].state.knife) {
				servers[i].rcon(WARMUP_KNIFE);
				if(readyTime) servers[i].rcon(WARMUP_TIME.format(readyTime));
			} else if(servers[i].state.maps.length) {
				servers[i].rcon(WARMUP);
				if(readyTime) servers[i].rcon(WARMUP_TIME.format(readyTime));
			} else {
				servers[i].rcon(WELCOME);
			}
		} else if (servers[i].state.paused && servers[i].state.freeze) {
			//servers[i].matchPause();
		}
	}
}, 30000);
setInterval(function () {
	for (var i in servers) {
		if (servers[i].state.queue.length > 0) {
			var cmd = servers[i].state.queue.shift();
			servers[i].realrcon(cmd);
		}
	}
}, 100);
s.bind(myport);
process.on('uncaughtException', function (err) {
	console.log(err);
});

function addServer(host, port, pass) {
	dns.lookup(host, 4, function (err, ip) {
		servers[ip + ':' + port] = new Server(ip + ':' + port, pass);
	});
}

function initConnection()
{
	if(serverType == "local") myip = localIp;
	else myip = externalIp;
	
	for (var i in server_config) {
		if (server_config.hasOwnProperty(i)) {
			addServer(server_config[i].host, server_config[i].port, server_config[i].pass);
		}
	}
	console.log('OrangeBot listening on ' + myport);
	console.log('Run this in CS console to connect or configure orangebot.js:');
	console.log('connect YOUR_SERVER;password YOUR_PASS;rcon_password YOUR_RCON;rcon sv_rcon_whitelist_address ' + externalIp + ';rcon logaddress_add ' + externalIp + ':' + myport + ';rcon log on; rcon rcon_password '+rcon_pass+"\n");
}

function id64(steamid) {
	return (new SteamID(String(steamid))).getSteamID64();
}
