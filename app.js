const https = require("https"), config = require("./config.json"), optimist = require("optimist");

var connectionParams = {
    host: 'api.twitch.tv',
    path: '/kraken/streams/followed?stream_type=live'
}

function getFollowedStreams(limit)
{
    return https.get({
        hostname: connectionParams.host,
        path: limit > 0 ? connectionParams.path + ("&limit=" + limit) : connectionParams.path,
        port: 443,
        headers: {
            'Accept': 'application/vnd.twitchtv.v5+json',
            'Client-ID': config.client_id,
            'Authorization': 'OAuth ' + config.oauth
        }
    }, function (response) {
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
    
    response.on('end', function()
    {
        var parsed = JSON.parse(body),
            streams = parsed.streams,
            channelNames = []
            ;
        
        Array.from(streams).forEach(function(stream){
            if (stream.channel.display_name.length > 0) {
                channelNames.push(stream.channel.display_name);
            }
        });

        channelNames.sort();

        channelNames.forEach(function(channelName){
            console.log(channelName);
        });

    });
    });
}

var args = process.argv.slice(2),
    help = "Please specify a flag.";

if ( args.length < 1 )
{
    console.log(help);
    process.exit(0);
}

switch (args[0].toLowerCase()) {
    case '--following':
        var limit = args[1].includes("limit") ? args[1].split("=")[1] : 0;
        getFollowedStreams(limit);
    break;
}
