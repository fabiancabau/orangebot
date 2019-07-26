var WELCOME =
    "say \x10Hi! I'm ArenaPortal v3.1.;say \x10Start a match with \x06!start map \x08map map",
  WARMUP = "say \x10Match will start when both teams are \x06!ready\x10",
  WARMUP_KNIFE =
    "say \x10Knife round will start when both teams are \x06!ready\x10",
  WARMUP_TIME = "say \x10or after a maximum of \x06{0}\x10 seconds.",
  WARMUP_TIMEOUT = "say \x10Starting round in \x0620\x10 seconds.",
  KNIFE_DISABLED = "say \x10Cancelled knife round.",
  KNIFE_STARTING =
    "mp_unpause_match;mp_warmup_pausetimer 0;mp_warmuptime 5;mp_warmup_start; say \x10Both teams are \x06!ready\x10, starting knife round in:;say \x085...",
  KNIFE_STARTED = "say \x10Knife round started! GL HF!",
  KNIFE_WON =
    'mp_pause_match;mp_t_default_secondary "weapon_glock";mp_ct_default_secondary "weapon_hkp2000";mp_free_armor 0;mp_give_player_c4 1;say \x06{0} \x10won the knife round!;say \x10Do you want to \x06!stay\x10 or \x06!swap\x10?',
  KNIFE_STAY = "mp_unpause_match",
  KNIFE_SWAP = "mp_unpause_match;mp_swapteams",
  PAUSE_ENABLED = "mp_pause_match;say \x10Pausing match on freeze time!",
  PAUSE_MISSING = "say \x10All your pauses have been used up already",
  PAUSE_REMAINING = "say \x10Pauses remaining: \x06{0}\x10 of \x06{1}",
  PAUSE_TIMEOUT = "say \x10Continuing in \x0620 seconds",
  PAUSE_TIME = "say \x10Pause will automatically end in \x06{0} seconds",
  PAUSE_ALREADY = "say \x10A pause was already called.",
  UNPAUSE_ALREADY = "say \x10Match already live.",
  MATCH_STARTING =
    "mp_unpause_match;mp_warmup_pausetimer 0;mp_warmuptime 0;mp_warmup_end;log on;say \x10Both teams are \x06!ready.",
  MATCH_STARTED = "say \x10Match started! GL HF!",
  MATCH_PAUSED =
    "say \x10Match will resume when both teams are \x06!ready\x10.",
  MATCH_UNPAUSE =
    "mp_unpause_match;say \x10Both teams are \x06!ready\x10, resuming match!",
  FORCE_UNPAUSE =
    "mp_unpause_match;say \x10Admin forced unpause. Match is live!",
  ROUND_STARTED = "mp_respawn_on_death_t 0;mp_respawn_on_death_ct 0",
  READY = "say \x10{0} are \x06!ready\x10, waiting for {1}.",
  LIVE = "say \x03LIVE!;say \x0eLIVE!;say \x02LIVE!",
  T = "Terrorists",
  CT = "Counter-Terrorists",
  GOTV_OVERLAY =
    'mp_teammatchstat_txt "Match {0} of {1}"; mp_teammatchstat_1 "{2}"; mp_teammatchstat_2 "{3}"',
  DEMO_REC = "say \x10Started recording GOTV Demo: \x06{0}",
  DEMO_FINISHED = "say \x10Finished recording GOTV Demo: \x06{0}",
  DEMO_RECDISABLED = "say \x10Disabled GOTV Demo recording.",
  DEMO_RECENABLED = "say \x10Enabled GOTV Demo recording.",
  OT_ENABLED = "say \x10Enabled Overtime.",
  OT_DISABLED = "say \x10Disabled Overtime.";
(FM_ENABLED = "say \x10Map will be fully played out."),
  (FM_DISABLED = "say \x10Map will not be played out.");
SETTINGS = "say \x10Match Settings:";
SETTINGS_KNIFE = "say \x10Knife: \x06{0}";
SETTINGS_RECORDING = "say \x10GOTV Demo recording: \x06{0}";
SETTINGS_OT = "say \x10Overtime: \x06{0}";
SETTINGS_FULLMAP = "say \x10Full Map: \x06{0}";
SETTINGS_MAPS = "say \x10Maps: \x06{0}";
SETTINGS_TEAMNAME = "mp_teamname_{0} {1}";
MAP_FINISHED = "say \x10Map finished! \x06GG";
MAP_CHANGE = "say \x10Changing map in 20 seconds to: \x06{0}";
SERIES_FINISHED = "say \x10Finished the series!";
RESTORE_ROUND =
  'mp_backup_restore_load_file "{0}";say \x10Round \x06{1}\x10 has been restored, resuming match in:;say \x085...';

// var app = require('express')();
// var server = require('http').Server(app);
// var io = require('socket.io')(server);

// server.listen(3000);

// app.get('/', function (req, res) {
//   res.sendFile(__dirname + '/index.html');
// });

// io.on('connection', function (socket) {
// 	//io.emit('servers', servers);
// });

///////////////////////////////////////////////////////////////////////////////
var argv = require("minimist")(process.argv.slice(2));
if (argv.h === true) {
  console.log("Usage:             node ArenaPortal.js [-i config.json] [-h]");
  console.log(
    "Description:       ArenaPortal v3.1 is a CS:GO matchmaking bot written in node.js."
  );
  console.log("GitHub:            https://github.com/dejavueakay/ArenaPortal");
  console.log();
  console.log("Arguments:");
  console.log(
    " -i config.json                    Set the config.json file to use"
  );
  console.log(" -h                                See this help");
  console.log();
  console.log(
    "For further documentation, visit our GitHub wiki: https://github.com/dejavueakay/ArenaPortal/wiki"
  );
  process.exit();
}

console.log("ArenaPortal v3.1: Loading modules ...");
var named = require("named-regexp").named;
var rcon = require("simple-rcon");
var dns = require("dns");
var dgram = require("dgram");
var s = dgram.createSocket("udp4");
var SteamID = require("steamid");
var admins64 = [];
var servers = {};
var localIp = require("ip").address();
var externalIp;
require("public-ip")
  .v4()
  .then(ip => {
    externalIp = ip;
    initConnection();
  });
var fs = require("fs");
var tcpp = require("tcp-ping");
var myip;

if (argv.i == undefined) {
  argv.i = "config.json";
} else if (argv.i == true) {
  console.log(
    "\x1b[31mERROR\x1b[0m: You did not specify a config file with the argument -i"
  );
  console.log("ArenaPortal v3.1: Exiting with code 1.");
  process.exit(1);
}

console.log("ArenaPortal v3.1: Checking if we can find config file ...");
if (!fs.existsSync(argv.i)) {
  console.log("\x1b[31mERROR\x1b[0m: Could not find ini file: " + argv.i);
  console.log("ArenaPortal v3.1: Exiting with code 1.");
  process.exit(1);
} else {
  console.log("ArenaPortal v3.1: Found config file: " + argv.i);
}

var nconf = require("nconf");
nconf.file({
  file: argv.i
});

var pauseTime = nconf.get("pause_time");
var readyTime = nconf.get("ready_time");
var myport = nconf.get("port");
var rcon_pass = nconf.get("default_rcon");
var admins = nconf.get("admins");
var server_config = nconf.get("server");
var serverType = nconf.get("serverType");
var config_warmup = nconf.get("config_warmup");
var config_knife = nconf.get("config_knife");
var config_match = nconf.get("config_match");
var config_overtime = nconf.get("config_overtime");
var config_fullmap = nconf.get("config_fullmap");
var recorddemo = nconf.get("recorddemo");
var knifedefault = nconf.get("knifedefault");
var otdefault = nconf.get("otdefault");
var fullmapdefault = nconf.get("fullmapdefault");
var serveriteration = 0;
for (var i in admins) {
  admins64.push(id64(admins[i]));
}

var configs = [
  config_warmup,
  config_knife,
  config_match,
  config_overtime,
  config_fullmap
];
for (var i in configs) {
  if (!fs.existsSync(configs[i])) {
    console.log(
      "\x1b[31mERROR\x1b[0m: Could not find config file: " + configs[i]
    );
    console.log("ArenaPortal v3.1: Exiting with code 1.");
    process.exit(1);
  } else {
    console.log("ArenaPortal v3.1: Found config file: " + configs[i]);
  }
}

if (pauseTime && pauseTime <= 30) pauseTime = 30;
if (readyTime && readyTime <= 30) readyTime = 30;

String.prototype.format = function() {
  var formatted = this;
  for (var i = 0; i < arguments.length; i++) {
    var regexp = new RegExp("\\{" + i + "\\}", "gi");
    formatted = formatted.replace(regexp, arguments[i]);
  }
  return formatted;
};

// Captured Events from server
s.on("message", function(msg, info) {
  var addr = info.address + ":" + info.port;
  var text = msg.toString(),
    param,
    cmd,
    re,
    match;

  if (servers[addr] === undefined && addr.match(/(\d+\.){3}\d+/)) {
    servers[addr] = new Server(String(addr), String(rcon_pass));
  }

  // join team
  re = named(
    /"(:<user_name>.+)[<](:<user_id>\d+)[>][<](:<steam_id>.*)[>]" switched from team [<](:<user_team>CT|TERRORIST|Unassigned|Spectator)[>] to [<](:<new_team>CT|TERRORIST|Unassigned|Spectator)[>]/
  );
  match = re.exec(text);
  if (match !== null) {
    if (servers[addr].state.players[match.capture("steam_id")] === undefined) {
      if (match.capture("steam_id") != "BOT") {
        servers[addr].state.players[match.capture("steam_id")] = new Player(
          match.capture("steam_id"),
          match.capture("new_team"),
          match.capture("user_name"),
          undefined
        );
      }
    } else {
      servers[addr].state.players[
        match.capture("steam_id")
      ].steamid = match.capture("steam_id");
      servers[addr].state.players[
        match.capture("steam_id")
      ].team = match.capture("new_team");
      servers[addr].state.players[
        match.capture("steam_id")
      ].name = match.capture("user_name");
    }
    servers[addr].lastlog = +new Date();
    // //io.emit('servers', servers);
  }

  // clantag
  re = named(
    /"(:<user_name>.+)[<](:<user_id>\d+)[>][<](:<steam_id>.*?)[>][<](:<user_team>CT|TERRORIST|Unassigned|Spectator)[>]" triggered "clantag" \(value "(:<clan_tag>.*)"\)/
  );
  match = re.exec(text);
  if (match !== null) {
    if (servers[addr].state.players[match.capture("steam_id")] === undefined) {
      if (match.capture("steam_id") != "BOT") {
        servers[addr].state.players[match.capture("steam_id")] = new Player(
          match.capture("steam_id"),
          match.capture("user_team"),
          match.capture("user_name"),
          match.capture("clan_tag")
        );
      }
    } else {
      servers[addr].state.players[match.capture("steam_id")].clantag =
        match.capture("clan_tag") !== ""
          ? match.capture("clan_tag")
          : undefined;
    }
    servers[addr].lastlog = +new Date();
  }

  // disconnect
  re = named(
    /"(:<user_name>.+)[<](:<user_id>\d+)[>][<](:<steam_id>.*)[>][<](:<user_team>CT|TERRORIST|Unassigned|Spectator)[>]" disconnected/
  );
  match = re.exec(text);
  if (match !== null) {
    if (servers[addr].state.players[match.capture("steam_id")] !== undefined) {
      delete servers[addr].state.players[match.capture("steam_id")];
    }
    servers[addr].lastlog = +new Date();
    // //io.emit('servers', servers);
  }

  // map loading
  re = named(/Loading map "(:<map>.*?)"/);
  match = re.exec(text);
  if (match !== null) {
    for (var prop in servers[addr].state.players) {
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
    servers[addr].newmap(match.capture("map"));
    servers[addr].lastlog = +new Date();
    //io.emit('servers', servers);
  }

  // round start
  re = named(/World triggered "Round_Start"/);
  match = re.exec(text);
  if (match !== null) {
    servers[addr].round();
    servers[addr].lastlog = +new Date();
    //io.emit('servers', servers);
  }

  // round end
  re = named(
    /Team "(:<team>.*)" triggered "SFUI_Notice_(:<team_win>Terrorists_Win|CTs_Win|Target_Bombed|Target_Saved|Bomb_Defused)" \(CT "(:<ct_score>\d+)"\) \(T "(:<t_score>\d+)"\)/
  );
  match = re.exec(text);
  if (match !== null) {
    var score = {
      TERRORIST: parseInt(match.capture("t_score")),
      CT: parseInt(match.capture("ct_score"))
    };
    servers[addr].score(score);

    // Show score in the round end
    if (servers[addr].state.live) {
      servers[addr].stats(true);
    }

    servers[addr].lastlog = +new Date();
    //io.emit('servers', servers);
  }

  re = named(/Game Over: competitive/);
  match = re.exec(text);
  if (match !== null) {
    servers[addr].mapend();
    servers[addr].lastlog = +new Date();
    //io.emit('servers', servers);
  }

  // !command
  re = named(
    /"(:<user_name>.+)[<](:<user_id>\d+)[>][<](:<steam_id>.*)[>][<](:<user_team>CT|TERRORIST|Unassigned|Spectator|Console)[>]" say(:<say_team>_team)? "[!\.](:<text>.*)"/
  );
  match = re.exec(text);
  if (match !== null) {
    var isadmin =
      match.capture("user_id") == "0" ||
      servers[addr].admin(match.capture("steam_id"));
    param = match.capture("text").split(" ");
    cmd = param[0];
    param.shift();

    switch (String(cmd)) {
      case "restore":
      case "replay":
        if (isadmin) servers[addr].restore(param);
        break;
      case "status":
      case "stats":
      case "score":
      case "scores":
        servers[addr].stats(true);
        break;
      case "restart":
      case "reset":
      case "warmup":
        if (isadmin) servers[addr].warmup();
        break;
      case "maps":
      case "map":
      case "start":
      case "match":
      case "startmatch":
        if (isadmin || !servers[addr].get().live) servers[addr].start(param);
        break;
      case "force":
        if (isadmin) servers[addr].ready(true);
        break;
      case "resume":
      case "ready":
      case "rdy":
      case "gaben":
      case "r":
      case "unpause":
        servers[addr].ready(match.capture("user_team"));
        break;
      case "forceunpause":
        if (isadmin) servers[addr].forceunpause();
        break;
      case "pause":
        servers[addr].pause(match.capture("user_team"));
        break;
      case "stay":
        servers[addr].stay(match.capture("user_team"));
        break;
      case "swap":
      case "switch":
        servers[addr].swap(match.capture("user_team"));
        break;
      case "knife":
        if (isadmin) servers[addr].knife();
        break;
      case "record":
        if (isadmin) servers[addr].record();
        break;
      case "ot":
      case "overtime":
        if (isadmin) servers[addr].overtime();
        break;
      case "fullmap":
        if (isadmin) servers[addr].fullmap();
        break;
      case "settings":
        servers[addr].settings();
        break;
      case "teamname":
        if (isadmin) servers[addr].teamname(param[0], param[1]);
        break;
      case "disconnect":
      case "quit":
      case "leave":
        if (isadmin) {
          servers[addr].quit();
          delete servers[addr];
          console.log(
            "ArenaPortal v3.1: " + addr + " - Disconnected by admin."
          );
        }
        break;
      case "say":
        if (isadmin) servers[addr].say(param.join(" "));
        break;
      case "debug":
        servers[addr].debug();
        break;
      default:
    }
    servers[addr].lastlog = +new Date();
  }
});

function clean(str) {
  return str.replace(/[^A-Za-z0-9: \-_,]/g, "");
}

function cleansay(str) {
  return str
    .replace("ä", "a")
    .replace("ö", "o")
    .replace(/[^A-Za-z0-9:<>.?! \-_,]/g, "");
}

function Player(steamid, team, name, clantag) {
  this.steamid = steamid;
  this.team = team;
  this.name = name;
  this.clantag = clantag;
}

function Server(address, rconpass, adminip, adminid, adminname) {
  var tag = this;
  this.state = {
    ip: address.split(":")[0],
    port: address.split(":")[1] || 27015,
    rconpass: rconpass,
    live: false,
    map: "",
    maps: [],
    mapindex: 0,
    knife: knifedefault,
    record: recorddemo,
    demoname: "",
    ot: otdefault,
    fullmap: fullmapdefault,
    score: [],
    knifewinner: false,
    paused: false,
    freeze: false,
    unpause: {
      TERRORIST: false,
      CT: false
    },
    ready: {
      TERRORIST: false,
      CT: false
    },
    teamnames: {
      TERRORIST: null,
      CT: null
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

  this.lo3 = function() {
    this.rcon("say \x02The Match will be live on the third restart.");
    this.rcon("mp_restartgame 1");
    setTimeout(function() {
      tag.rcon("mp_restartgame 1");
    }, 1000);
    setTimeout(function() {
      tag.rcon("mp_restartgame 3");
    }, 2000);
    setTimeout(function() {
      tag.rcon("say \x04Match is live!");
    }, 6000);
  };

  this.get = function() {
    return this.state;
  };
  this.rcon = function(cmd) {
    if (cmd === undefined) return;
    this.state.queue.push(cmd);
  };
  this.realrcon = function(cmd) {
    if (cmd === undefined) return;
    var conn = new rcon({
      host: this.state.ip,
      port: this.state.port,
      password: this.state.rconpass
    });
    conn
      .on("authenticated", function() {
        cmd = cmd.split(";");
        for (var i in cmd) {
          conn.exec(String(cmd[i]));
        }
        conn.close();
      })
      .on("error", function() {});
    conn.connect();
  };
  this.clantag = function(team) {
    if (team == "TERRORIST" && this.state.teamnames["TERRORIST"] !== null) {
      return this.state.teamnames["TERRORIST"];
    }

    if (team == "CT" && this.state.teamnames["CT"] !== null) {
      return this.state.teamnames["CT"];
    }

    if (team != "TERRORIST" && team != "CT") {
      return team;
    }
    var tags = {};
    var ret = "mix1";
    if (team == "CT" && this.clantag("TERRORIST") == "mix1") {
      ret = "mix2";
    }
    for (var i in this.state.players) {
      if (
        this.state.players[i].team == team &&
        this.state.players[i].clantag !== undefined
      ) {
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
    if (team == "CT" && this.clantag("TERRORIST") == ret) {
      ret = ret + "2";
    }
    return ret;
  };
  this.teamname = function(side, name) {
    this.rcon(SETTINGS_TEAMNAME.format(side, name));

    if (side == 2) {
      Object.keys(tag.state.players).forEach(function(key) {
        if (tag.state.players[key].team == "TERRORIST") {
          tag.state.players[key].clantag = name;
        }
      });

      tag.teamnames["TERRORIST"] = name;
    }

    if (side == 1) {
      Object.keys(tag.state.players).forEach(key => {
        if (tag.state.players[key].team == "CT") {
          tag.state.players[key].clantag = name;
        }
      });

      tag.teamnames["CT"] = name;
    }
  };

  this.teamnamefromconfig = function() {
    this.rcon(SETTINGS_TEAMNAME.format(2, tag.state.teamnames["TERRORIST"]));
    this.rcon(SETTINGS_TEAMNAME.format(1, tag.state.teamnames["CT"]));

    Object.keys(tag.state.players).forEach(function(key) {
      if (tag.state.players[key].team == "TERRORIST") {
        tag.state.players[key].clantag = tag.state.teamnames["TERRORIST"];
      }

      if (tag.state.players[key].team == "CT") {
        tag.state.players[key].clantag = tag.state.teamnames["CT"];
      }
    });
  };

  this.admin = function(steamid) {
    return (
      this.state.steamid.indexOf(id64(steamid)) >= 0 ||
      admins64.indexOf(id64(steamid)) >= 0
    );
  };

  this.hasadmin = function() {
    return this.state.steamid.length > 0;
  };

  this.stats = function(tochat) {
    var team1 = this.clantag("TERRORIST");
    var team2 = this.clantag("CT");
    var stat = {};
    stat[team1] = [];
    stat[team2] = [];
    for (var i in this.state.maps) {
      if (this.state.score[this.state.maps[i]] !== undefined) {
        if (this.state.score[this.state.maps[i]][team1] !== undefined) {
          stat[team1][i] = this.state.score[this.state.maps[i]][team1];
        } else {
          stat[team1][i] = "x";
        }
        if (this.state.score[this.state.maps[i]][team2] !== undefined) {
          stat[team2][i] = this.state.score[this.state.maps[i]][team2];
        } else {
          stat[team2][i] = "x";
        }
      } else {
        stat[team1][i] = "x";
        stat[team2][i] = "x";
      }
    }
    var maps = [];
    var scores = { team1: 0, team2: 0 };
    for (var j = 0; j < this.state.maps.length; j++) {
      maps.push(
        this.state.maps[j] + " " + stat[team1][j] + "-" + stat[team2][j]
      );

      if (this.state.maps[j] != this.state.map) {
        if (stat[team1][j] > stat[team2][j]) scores.team1 += 1;
        else if (stat[team1][j] < stat[team2][j]) scores.team2 += 1;
      }
    }
    var chat = "\x10" + team1 + " [\x06" + maps.join(", ") + "\x10] " + team2;
    if (tochat) {
      this.rcon("say " + chat);
    } else {
      var index = this.state.maps.indexOf(this.state.map);
      this.rcon(
        GOTV_OVERLAY.format(
          index + 1,
          this.state.maps.length,
          scores.team1,
          scores.team2
        )
      );
    }
    return chat;
  };
  this.restore = function(round) {
    var roundNum = parseInt(round);
    if (roundNum < 10) roundNum = "0" + roundNum;
    console.log(
      "backup_round" +
        roundNum +
        "_" +
        this.state.map +
        "_" +
        this.state.teamnames["CT"] +
        "_" +
        this.state.teamnames["TERRORIST"] +
        ".txt"
    );
    this.rcon(
      RESTORE_ROUND.format(
        "backup_round" +
          roundNum +
          "_" +
          this.state.map +
          "_" +
          this.state.teamnames["CT"] +
          "_" +
          this.state.teamnames["TERRORIST"] +
          ".txt",
        round
      )
    );
    setTimeout(function() {
      tag.rcon("say \x054...");
    }, 1000);
    setTimeout(function() {
      tag.rcon("say \x063...");
    }, 2000);
    setTimeout(function() {
      tag.rcon("say \x102...");
    }, 3000);
    setTimeout(function() {
      tag.rcon("say \x0f1...");
    }, 4000);
    setTimeout(function() {
      tag.rcon(LIVE + ";mp_unpause_match");
    }, 5000);

    //io.emit('servers', servers);
  };
  this.round = function() {
    this.state.freeze = false;
    this.state.paused = false;
    this.rcon(ROUND_STARTED);

    //io.emit('servers', servers);
  };
  this.pause = function(team) {
    team = this.clantag(team);
    if (!this.state.live) return;
    if (this.state.paused) {
      this.rcon(PAUSE_ALREADY);
      return;
    }

    this.rcon(PAUSE_ENABLED);
    this.state.paused = true;
    this.state.unpause = {
      TERRORIST: false,
      CT: false
    };
    if (this.state.freeze) {
      this.matchPause();
    }

    //io.emit('servers', servers);
  };
  this.forceunpause = function() {
    if (!this.state.live) return;
    if (!this.state.paused) {
      this.rcon(UNPAUSE_ALREADY);
      return;
    }

    this.rcon(FORCE_UNPAUSE);
    this.state.paused = false;
    this.state.unpause = {
      TERRORIST: true,
      CT: true
    };

    //io.emit('servers', servers);
  };
  this.matchPause = function() {
    this.rcon(MATCH_PAUSED);

    if (pauseTime) {
      clearTimeout(this.state.pauses.timer);
      this.state.pauses.timer = setTimeout(function() {
        tag.rcon(PAUSE_TIMEOUT);
        tag.state.pauses.timer = setTimeout(function() {
          tag.ready(true);
        }, 20 * 1000);
      }, (pauseTime - 20) * 1000);
      this.rcon(PAUSE_TIME.format(pauseTime));
    }

    //io.emit('servers', servers);
  };
  this.status = function() {
    var conn = new rcon({
      host: this.state.ip,
      port: this.state.port,
      password: this.state.rconpass
    })
      .on("error", function(err) {})
      .exec("status", function(res) {
        var re = named(/map\s+:\s+(:<map>.*?)\s/);
        var match = re.exec(res.body);
        if (match !== null) {
          var map = match.capture("map");
          if (tag.state.maps.indexOf(map) >= 0) {
            tag.state.map = map;
          } else {
            tag.state.map = map;
          }
          tag.stats(false);
        }
        var regex = new RegExp(
          '"(:<user_name>.*?)" (:<steam_id>STEAM_.*?) .*?' + adminip + ":",
          ""
        );
        re = named(regex);
        match = re.exec(res.body);
        if (match !== null) {
          for (var i in match.captures.steam_id) {
            if (
              tag.state.steamid.indexOf(id64(match.captures.steam_id[i])) == -1
            ) {
              tag.state.steamid.push(id64(match.captures.steam_id[i]));
              tag.state.admins.push(match.captures.user_name[i]);
            }
          }
        }
        conn.close();
      })
      .connect();

    //io.emit('servers', servers);
  };
  this.start = function(maps) {
    this.state.score = [];
    possible_maps = [
      "de_mirage",
      "de_cache",
      "de_dust2",
      "de_overpass",
      "de_train",
      "de_nuke",
      "de_inferno",
      "de_vertigo"
    ];

    let actual_maps = [];
    let teamnames = [];

    actual_maps = maps.filter(m => {
      return possible_maps.indexOf(m) !== -1;
    });

    teamnames = maps.filter(m => {
      return possible_maps.indexOf(m) == -1;
    });

    if (teamnames.length == 2) {
      this.state.teamnames["TERRORIST"] = teamnames[1];
      this.state.teamnames["CT"] = teamnames[0];
    }

    if (actual_maps.length > 0) {
      this.state.maps = actual_maps;

      this.state.mapindex = 0;

      if (this.state.map != actual_maps[0]) {
        this.rcon("changelevel " + this.state.maps[0]);
      } else {
        this.newmap(actual_maps[0], 0);
      }
    } else {
      this.state.maps = [];
      this.newmap(this.state.map, 0);
      setTimeout(function() {
        tag.status();
      }, 1000);
    }

    //io.emit('servers', servers);
  };
  this.ready = function(team) {
    if (this.state.live && this.state.paused) {
      if (team === true) {
        this.state.unpause.TERRORIST = true;
        this.state.unpause.CT = true;
      } else {
        this.state.unpause[team] = true;
      }
      if (this.state.unpause.TERRORIST != this.state.unpause.CT) {
        this.rcon(
          READY.format(
            this.state.unpause.TERRORIST ? T : CT,
            this.state.unpause.TERRORIST ? CT : T
          )
        );
      } else if (
        this.state.unpause.TERRORIST === true &&
        this.state.unpause.CT === true
      ) {
        if ("timer" in this.state.pauses) clearTimeout(this.state.pauses.timer);
        this.rcon(MATCH_UNPAUSE);
        this.state.paused = false;
        this.state.unpause = {
          TERRORIST: false,
          CT: false
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
        this.rcon(
          READY.format(
            this.state.ready.TERRORIST ? T : CT,
            this.state.ready.TERRORIST ? CT : T
          )
        );
      } else if (
        this.state.ready.TERRORIST === true &&
        this.state.ready.CT === true
      ) {
        this.state.live = true;
        if ("timer" in this.state.ready) clearTimeout(this.state.ready.timer);
        if (this.state.knife) {
          this.rcon(this.getconfig(config_knife));
          tag.rcon(KNIFE_STARTING);

          this.teamnamefromconfig();

          setTimeout(function() {
            tag.rcon(KNIFE_STARTED);
          }, 9000);
        } else {
          this.teamnamefromconfig();
          this.rcon(this.getconfig(config_match));
          this.startrecord();
          this.rcon(MATCH_STARTING);
          this.lo3();
        }
        setTimeout(function() {
          tag.rcon("say \x054...");
        }, 1000);
        setTimeout(function() {
          tag.rcon("say \x063...");
        }, 2000);
        setTimeout(function() {
          tag.rcon("say \x102...");
        }, 3000);
        setTimeout(function() {
          tag.rcon("say \x0f1...");
        }, 4000);
        setTimeout(function() {
          tag.rcon(LIVE);
        }, 5000);
      }
    }

    //io.emit('servers', servers);
  };
  this.newmap = function(map, delay) {
    if (delay === undefined) delay = 10000;
    var index = -1;
    if (this.state.maps.indexOf(map) >= 0) {
      index = this.state.maps.indexOf(map);
      this.state.map = map;
    } else {
      this.state.maps = [map];
      this.state.map = map;
    }
    setTimeout(function() {
      tag.stats(false);
      tag.warmup();
      tag.startReadyTimer();
    }, delay);
  };
  this.knife = function() {
    if (this.state.live) return;
    if (!this.state.knife) {
      this.state.knife = true;
      this.rcon(WARMUP_KNIFE);
      this.startReadyTimer();
    } else {
      this.state.knife = false;
      this.rcon(KNIFE_DISABLED);
      if ("timer" in this.state.ready) clearTimeout(this.state.ready.timer);
    }

    //io.emit('servers', servers);
  };

  this.record = function() {
    if (this.state.live) return;
    if (this.state.record === true) {
      this.state.record = false;
      this.rcon(DEMO_RECDISABLED);
    } else {
      this.state.record = true;
      this.rcon(DEMO_RECENABLED);
    }

    //io.emit('servers', servers);
  };

  this.settings = function() {
    this.rcon(SETTINGS);
    this.rcon(SETTINGS_KNIFE.format(this.state.knife));
    this.rcon(SETTINGS_RECORDING.format(this.state.record));
    this.rcon(SETTINGS_OT.format(this.state.ot));
    this.rcon(SETTINGS_FULLMAP.format(this.state.fullmap));

    var outputmaps = "";
    for (var i = 0; i < this.state.maps.length; i++) {
      if (i + 1 < this.state.maps.length) {
        outputmaps += this.state.maps[i];
        outputmaps += ", ";
      } else {
        outputmaps += this.state.maps[i];
      }
    }
    this.rcon(SETTINGS_MAPS.format(outputmaps));
  };

  this.mapend = function() {
    this.rcon(MAP_FINISHED);
    this.state.mapindex++;
    if (this.state.record === true) {
      this.rcon("tv_stoprecord");
      this.rcon(DEMO_FINISHED.format(this.state.demoname));
    }

    if (
      this.state.maps.length >= 0 &&
      this.state.maps.length == this.state.mapindex
    ) {
      this.rcon(SERIES_FINISHED);
      this.state.mapindex = 0;
    } else if (
      this.state.maps.length >= 0 &&
      this.state.maps.length > this.state.mapindex
    ) {
      this.rcon(MAP_CHANGE.format(this.state.maps[this.state.mapindex]));
      setTimeout(() => {
        this.rcon("changelevel " + this.state.maps[this.state.mapindex]);
      }, 20000);
    }

    //io.emit('servers', servers);
  };

  this.overtime = function() {
    if (this.state.ot === true) {
      this.state.ot = false;
      this.rcon(OT_DISABLED);
      this.rcon("mp_overtime_enable 0");
    } else {
      this.state.ot = true;
      this.rcon(OT_ENABLED);
      this.rcon(this.getconfig(config_overtime));
    }
  };

  this.fullmap = function() {
    if (this.state.fullmap === true) {
      this.state.fullmap = false;
      this.rcon(FM_DISABLED);
      this.rcon("mp_match_can_clinch 1");
    } else {
      this.state.fullmap = true;
      this.rcon(FM_ENABLED);
      this.rcon(this.getconfig(config_fullmap));
    }
  };

  this.startrecord = function() {
    if (this.state.record === true) {
      var demoname =
        new Date()
          .toISOString()
          .replace(/T/, "_")
          .replace(/:/g, "-")
          .replace(/\..+/, "") +
        "_" +
        this.state.map +
        "_" +
        clean(this.clantag("TERRORIST")) +
        "-" +
        clean(this.clantag("CT")) +
        ".dem";
      this.state.demoname = demoname;
      this.rcon("tv_stoprecord; tv_record " + demoname);
      this.rcon(DEMO_REC.format(demoname));
    }
  };

  this.getconfig = function(file) {
    var config_unformatted = fs.readFileSync(file, "utf8");
    config_formatted = config_unformatted.replace(/(\r\n\t|\n|\r\t)/gm, "; ");
    return config_formatted;
  };

  this.lo3 = function() {
    this.rcon("say \x02The Match will be live on the third restart.");
    this.rcon("mp_restartgame 1");
    setTimeout(function() {
      tag.rcon("mp_restartgame 1");
    }, 1000);
    setTimeout(function() {
      tag.rcon("mp_restartgame 3");
    }, 2000);
    setTimeout(function() {
      tag.rcon("say \x04Match is live!");
    }, 6000);
  };

  this.startReadyTimer = function() {
    if (!readyTime) return;
    if ("timer" in this.state.ready) clearTimeout(this.state.ready.timer);
    var tag = this;
    this.rcon(WARMUP_TIME.format(readyTime));
    this.state.ready.timer = setTimeout(function() {
      tag.rcon(WARMUP_TIMEOUT);
      tag.state.ready.timer = setTimeout(function() {
        tag.ready(true);
      }, 20 * 1000);
    }, (readyTime - 20) * 1000);
  };
  this.score = function(score) {
    var tagscore = {};
    tagscore[this.clantag("CT")] = score.CT;
    tagscore[this.clantag("TERRORIST")] = score.TERRORIST;
    this.state.score[this.state.map] = tagscore;
    this.stats(false);
    if (score.TERRORIST + score.CT == 1 && this.state.knife) {
      this.state.knifewinner = score.TERRORIST == 1 ? "TERRORIST" : "CT";
      this.state.knife = false;
      this.rcon(this.getconfig(config_match));
      this.rcon(
        KNIFE_WON.format(this.state.knifewinner == "TERRORIST" ? T : CT)
      );
    } else if (this.state.paused) {
      this.matchPause();
    }
    this.state.freeze = true;
  };
  this.stay = function(team) {
    if (team == this.state.knifewinner) {
      this.rcon(KNIFE_STAY);
      this.state.knifewinner = false;
      this.startrecord();
      this.lo3();
    }

    //io.emit('servers', servers);
  };
  this.swap = function(team) {
    if (team == this.state.knifewinner) {
      this.rcon(KNIFE_SWAP);
      this.state.knifewinner = false;
      this.startrecord();
      lo3();
    }

    //io.emit('servers', servers);
  };
  this.quit = function() {
    this.rcon("say \x10Goodbye from ArenaPortal");
    this.rcon("logaddress_delall; log off");
  };
  this.debug = function() {
    this.rcon(
      "say \x10live: " +
        this.state.live +
        " paused: " +
        this.state.paused +
        " freeze: " +
        this.state.freeze +
        " knife: " +
        this.state.knife +
        " knifewinner: " +
        this.state.knifewinner +
        " ready: T:" +
        this.state.ready.TERRORIST +
        " CT:" +
        this.state.ready.CT +
        " unpause: T:" +
        this.state.unpause.TERRORIST +
        " CT:" +
        this.state.unpause.CT
    );
    this.stats(true);
  };
  this.say = function(msg) {
    this.rcon("say " + cleansay(msg));
  };
  this.warmup = function() {
    this.state.ready = {
      TERRORIST: false,
      CT: false
    };
    this.state.unpause = {
      TERRORIST: false,
      CT: false
    };
    this.state.live = false;
    this.state.paused = false;
    this.state.freeze = false;
    this.state.knifewinner = false;
    this.state.knife = knifedefault;
    this.state.record = recorddemo;
    this.state.ot = otdefault;
    this.state.fullmap = fullmapdefault;

    this.rcon(this.getconfig(config_warmup));

    if (this.state.ot) {
      this.rcon(this.getconfig(config_overtime));
    }

    if (this.state.fullmap) {
      this.rcon(this.getconfig(config_fullmap));
    }

    tag.rcon(WARMUP);
  };
  this.rcon(
    "sv_rcon_whitelist_address " +
      myip +
      ";logaddress_add " +
      myip +
      ":" +
      myport +
      ";log on"
  );
  this.status();
  setTimeout(function() {
    tag.rcon(WELCOME);
  }, 1000);
  s.send("plz go", 0, 6, this.state.port, this.state.ip); // SRCDS won't send data if it doesn't get contacted initially
  console.log(
    "ArenaPortal v3.1: " +
      this.state.ip +
      ":" +
      this.state.port +
      " - Connected to Server."
  );
}
setInterval(function() {
  for (var i in servers) {
    if (!servers.hasOwnProperty(i)) return;
    var now = +new Date();
    if (
      servers[i].lastlog < now - 1000 * 60 * 10 &&
      servers[i].state.players.length < 3
    ) {
      console.log("Dropping idle server " + i);
      delete servers[i];
      continue;
    }
    if (!servers[i].state.live) {
      if (servers[i].state.knife) {
        servers[i].rcon(WARMUP_KNIFE);
        if (readyTime) servers[i].rcon(WARMUP_TIME.format(readyTime));
      } else if (servers[i].state.maps.length) {
        servers[i].rcon(WARMUP);
        if (readyTime) servers[i].rcon(WARMUP_TIME.format(readyTime));
      } else {
        servers[i].rcon(WELCOME);
      }
    } else if (servers[i].state.paused && servers[i].state.freeze) {
      //servers[i].matchPause();
    }
  }
}, 30000);
setInterval(function() {
  for (var i in servers) {
    if (servers[i].state.queue.length > 0) {
      var cmd = servers[i].state.queue.shift();
      servers[i].realrcon(cmd);
    }
  }
}, 100);
s.bind(myport);
process.on("uncaughtException", function(err) {
  if (err.code == "EADDRINUSE") {
    console.log(
      "ArenaPortal v3.1: \x1b[31mERROR\x1b[0m: Could not bind UDP Socket to port " +
        myport
    );
    console.log(
      "ArenaPortal v3.1: \x1b[31mERROR\x1b[0m: Maybe try to use another port?"
    );
    console.log("ArenaPortal v3.1: Exiting with code 1.");
    process.exit(1);
  }
  // else {
  // 	console.log(err);
  // }
});

function addServer(host, port, rconpass) {
  if (serveriteration < server_config.length) {
    console.log(
      "ArenaPortal v3.1: " +
        host +
        ":" +
        port +
        " - Trying to establish connection to Server . . ."
    );
    tcpp.probe(host, port, function(err, available) {
      if (available) {
        dns.lookup(host, 4, function(err, ip) {
          console.log(
            "ArenaPortal v3.1: " +
              host +
              ":" +
              port +
              " - Server is reachable. Adding to server list and connecting . . ."
          );
          servers[ip + ":" + port] = new Server(ip + ":" + port, rconpass);
          serveriteration++;
          addServer(
            server_config[serveriteration].host,
            server_config[serveriteration].port,
            server_config[serveriteration].rconpass
          );
        });
      } else {
        console.log(
          "ArenaPortal v3.1: " +
            host +
            ":" +
            port +
            " - ERROR: Server is not reachable."
        );
        serveriteration++;
        addServer(
          server_config[serveriteration].host,
          server_config[serveriteration].port,
          server_config[serveriteration].rconpass
        );
      }
    });
  }
}

function initConnection() {
  console.log("ArenaPortal v3.1: UDP Socket listening on " + myport);
  console.log("____________________________________________________________");
  console.log();
  if (serverType == "local") myip = localIp;
  else myip = externalIp;

  addServer(
    server_config[0].host,
    server_config[0].port,
    server_config[0].rconpass
  );

  setTimeout(() => {
    console.log("____________________________________________________________");
    console.log();
    console.log(
      "ArenaPortal v3.1: If you want to add more servers without putting them in your config.json, you can add them on-the-fly In-game by typing this in your console:"
    );
    console.log(
      "ArenaPortal v3.1: connect YOURSERVER; password YOURPASSWORD; rcon_password YOURRCON; rcon sv_whitelist_address " +
        externalIp +
        "; rcon logaddress_add " +
        externalIp +
        ":" +
        myport +
        ";rcon log on; rcon rcon_password " +
        rcon_pass
    );
    console.log(
      "ArenaPortal v3.1: Make sure to fill YOURSERVER, YOURPASSWORD and YOURRCON with your own data."
    );
    console.log("____________________________________________________________");
    console.log();
  }, server_config.length * 1000);
}

function id64(steamid) {
  return new SteamID(String(steamid)).getSteamID64();
}
