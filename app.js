const https = require("https"), config = require("./config.json");

var connectionParams = {
    host: 'api.twitch.tv',
    path: {
        followedChannels: '/kraken/streams/followed?stream_type=live',
        getUser: '/kraken/users',
        channelFollow: `/kraken/users/${config.user}/follows/channels/`,
        channelStatus: '/kraken/streams/'
    }
}

function getChannelID(channelDisplayName)
{
    if (channelDisplayName.length < 1) return;

    return new Promise((resolve, reject) => {

    var options = {
        hostname: connectionParams.host,
        path: connectionParams.path.getUser + "?login=" + channelDisplayName,
        port: 443,
        headers: {
            'Accept': 'application/vnd.twitchtv.v5+json',
            'Client-ID': config.client_id,
            'Authorization': 'OAuth ' + config.oauth
        }
    };

    var findChannelID = function()
    {
        https.get(options, function (response) {
            var body = '';
            response.on('data', function(d) {
                body += d;
            });
        
        response.on('end', function()
        {
            var parsed = JSON.parse(body);
            var channelID = parsed.users[0]._id;
            resolve(channelID);
        });
        }).end();

    }

    findChannelID();

    })


}

function getFollowedStreams(limit)
{
    return https.get({
        hostname: connectionParams.host,
        path: limit > 0 ? connectionParams.path.followedChannels + ("&limit=" + limit) : connectionParams.path.followedChannels,
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
                channelNames.push(String(stream.channel.display_name).toLowerCase());
            }
        });

        if (channelNames.length < 1) return;

        channelNames.sort();

        channelNames.forEach(function(channelName){
            console.log(channelName);
        });

    });
    });
}

function sendFollow(channel)
{

    function postFollowRequest(channelID)
    {
        var followOptions = {
            hostname: connectionParams.host,
            path: connectionParams.path.channelFollow + channelID,
            port: 443,
            method: 'PUT',
            headers: {
                'Accept': 'application/vnd.twitchtv.v5+json',
                'Client-ID': config.client_id,
                'Authorization': 'OAuth ' + config.oauth
            }
        };

        var followRequest = https.request(followOptions);

        followRequest.on("response", function(res){
            console.log("Status message: " + res.statusMessage);
            console.log("Status code: " + res.statusCode);
        });

        followRequest.on("error", function(err){
            console.log(err);
        });

        followRequest.end();

    }

    getChannelID(channel).then(postFollowRequest, function(error){
        console.error("Failed!", error);
    });

}

function checkLive(channel)
{

    function isLive(channelID)
    {
        var options = {
            hostname: connectionParams.host,
            path: connectionParams.path.channelStatus + channelID,
            port: 443,
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.twitchtv.v5+json',
                'Client-ID': config.client_id,
                'Authorization': 'OAuth ' + config.oauth
            }
        };

        var statusRequest = https.request(options);

        statusRequest.on("response", function(channel){
            console.log(channel);
            if (channel["stream"] === null) console.log(channel + " is not live");

            else console.log(channel + " is live");
        });

        statusRequest.on("error", function(err){
            console.log(err);
        });

        statusRequest.end();

    }

    getChannelID(channel).then(isLive, function(error){
        console.error("Failed!", error);
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
    case (args[0].match(/--channels/) || {}).input:
        const limit = args[1].includes("--limit") ? args[1].split("=")[1] : 0;
        getFollowedStreams(limit);
    break;
    case (args[0].match(/--follow/) || {}).input:
        const channel = args[0].includes("--follow") ? args[0].split("=")[1] : 0;
        sendFollow(channel);
    break;
    case (args[0].match(/--is-live/) || {}).input:
        const liveStream = args[0].split("=")[1];
        checkLive(liveStream);
    break;
}
