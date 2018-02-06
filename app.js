const https = require("https"), fs = require("fs"), config = fs.existsSync("./config.json") ? require("./config.json") : false;

if (!config)
{
    console.log("config.json does not exist");
    process.exit(0);
}

for (var key in config)
{
    
    var keyValue;
    const alphaNumPattern = /^([0-9]|[a-z])+([0-9a-z]+)$/i;

    switch (key)
    {
        case "user":
            if (config.hasOwnProperty(key))
            {
                keyValue = config[key];
                if(!Number.isInteger(parseInt(keyValue)))
                {
                    console.log(key + " is not set");
                    process.exit(0);
                }
            }
        break;
        case "oauth":
            if (config.hasOwnProperty(key))
            {
                keyValue = config[key];
                if (!keyValue.match(alphaNumPattern))
                {
                    console.log(key + " is not set");
                    process.exit(0);
                }
            }
        break;
        case "client_id":
            if (config.hasOwnProperty(key))
            {
                keyValue = config[key];
                if (!keyValue.match(alphaNumPattern))
                {
                    console.log(key + " is not set");
                    process.exit(0);
                }
            }
        break;
        case "client_secret":
            if (config.hasOwnProperty(key))
            {
                keyValue = config[key];
                if (!keyValue.match(alphaNumPattern))
                {
                    console.log(key + " is not set");
                    process.exit(0);
                }
            }
        break;
    }
}

process.exit(0);

var connectionParams = {
    host: 'api.twitch.tv',
    frontendHost: 'www.twitch.tv',
    path: {
        followedChannels: '/kraken/streams/followed?stream_type=live',
        getUser: '/kraken/users',
        channelFollow: `/kraken/users/${config.user}/follows/channels/`,
        channelStatus: '/kraken/streams/',
        communityStatus: '/kraken/communities',
        channelPanels: '/api/channels/CHANNEL_PLACEHOLDER/panels',
        channelVideos: '/kraken/channels/CHANNEL_PLACEHOLDER/videos'
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

function getCommunityID(communityDisplayName)
{
    if (communityDisplayName.length < 1) return;

    return new Promise((resolve, reject) => {

    var options = {
        hostname: connectionParams.host,
        path: connectionParams.path.communityStatus + "?name=" + communityDisplayName,
        port: 443,
        headers: {
            'Accept': 'application/vnd.twitchtv.v5+json',
            'Client-ID': config.client_id,
            'Authorization': 'OAuth ' + config.oauth
        }
    };

    var findCommunityID = function()
    {
        https.get(options, function (response) {
            var body = '';
            response.on('data', function(d) {
                body += d;
            });
        
        response.on('end', function()
        {
            var parsed = JSON.parse(body);
            var communityID = parsed._id;
            resolve(communityID);
        });
        }).end();

    }

    findCommunityID();

    })


}

function getFollowedStreams(limit, category)
{
    return https.get({
        hostname: connectionParams.host,
        path: limit > 0 ? connectionParams.path.followedChannels + ("&limit=" + limit) : connectionParams.path.followedChannels + ("&limit=100"),
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
            followedChannels = []
            ;

        if (typeof(streams) === undefined)
        {
            console.log("Couldn't fetch followed channels. Please try again.");
            return;
        }

        Array.from(streams).forEach(function(stream, index){
            stream.channel.viewers = streams[index].viewers;
            if (stream.channel.display_name.length > 0) {
                followedChannels.push(stream.channel);
            }
        });

        if (followedChannels.length < 1) return;

        function alphaSort(a, b)
        {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
        }

        followedChannels.sort(alphaSort);

        if (category.length > 1)
        {
            followedChannels = followedChannels.filter(function(row)
            {
                return String(row.game).toLowerCase() === category.toLowerCase();
            });

        }   

        console.log("Number of channels: " + followedChannels.length + "\n\n");

        followedChannels.forEach(function(followedChannel){
            console.log("Streamer: " + followedChannel.name);
            console.log("Status: " + followedChannel.status);
            console.log("Desc: " + followedChannel.description);
            console.log("Game: " + followedChannel.game);
            console.log("Lang: " + followedChannel.language);
            console.log("Viewers: " + followedChannel.viewers);
            console.log("\n");
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
        return;
    });

    console.log("You are now following " + channel);

}

function sendUnfollow(channel)
{

    function postUnfollowRequest(channelID)
    {
        var unfollowOptions = {
            hostname: connectionParams.host,
            path: connectionParams.path.channelFollow + channelID,
            port: 443,
            method: 'DELETE',
            headers: {
                'Accept': 'application/vnd.twitchtv.v5+json',
                'Client-ID': config.client_id,
                'Authorization': 'OAuth ' + config.oauth
            }
        };

        var unfollowRequest = https.request(unfollowOptions);

        unfollowRequest.on("response", function(res){
            console.log("Status message: " + res.statusMessage);
            console.log("Status code: " + res.statusCode);
        });

        unfollowRequest.on("error", function(err){
            console.log(err);
        });

        unfollowRequest.end();

    }

    getChannelID(channel).then(postUnfollowRequest, function(error){
        console.error("Failed!", error);
        return;
    });

    console.log("You have unfollowed " + channel);

}

function checkCommunity(community, streamLimit)
{

    function getCommunityStreams(communityID)
    {
        var communityStreamOptions = {
            hostname: connectionParams.host,
            path: streamLimit > 0 ? connectionParams.path.channelStatus.slice(0, -1) + "?community_id=" + communityID + "&limit=" + streamLimit : connectionParams.path.channelStatus.slice(0, -1) + "?community_id=" + communityID + "&limit=100",
            port: 443,
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.twitchtv.v5+json',
                'Client-ID': config.client_id,
                'Authorization': 'OAuth ' + config.oauth
            }
        };
        
        var communityRequest = https.get(communityStreamOptions);

        communityRequest.on("response", function(res){
            var communityBody = '';
            console.log("Status message: " + res.statusMessage);
            console.log("Status code: " + res.statusCode);

        res.on("data", function(data){
            communityBody += data;
        })

        res.on("end", function()
        {
            var parsed = JSON.parse(communityBody),
                streams = parsed.streams,
                communityStreams = [];

            Array.from(streams).forEach(function(stream, index){
                stream.channel.viewers = streams[index].viewers;
                if (stream.channel.display_name.length > 0) {
                    communityStreams.push(stream.channel);
                }
            });

            if (communityStreams.length < 1) return;

            function alphaSort(a, b)
            {
                if (a.name < b.name) return -1;
                if (a.name > b.name) return 1;
                return 0;
            }

            communityStreams.sort(alphaSort);

            console.log("Number of channels: " + communityStreams.length + "\n\n");

            communityStreams.forEach(function(communityStream){
                console.log("Streamer: " + communityStream.name);
                console.log("Status: " + communityStream.status);
                console.log("Desc: " + communityStream.description);
                console.log("Game: " + communityStream.game);
                console.log("Lang: " + communityStream.language);
                console.log("Viewers: " + communityStream.viewers);
                console.log("\n");
            });

        });

        }).on("error", function(err){
            console.log(err);
        });

    }

    getCommunityID(community).then(getCommunityStreams, function(error){
        console.error("Failed!", error);
    });

}

function checkGame(game, streamLimit)
{


        var gameStreamOptions = {
            hostname: connectionParams.host,
            path: streamLimit > 0 ? connectionParams.path.channelStatus.slice(0, -1) + "?game=" + game + "&limit=" + streamLimit : connectionParams.path.channelStatus.slice(0, -1) + "?game=" + game,
            port: 443,
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.twitchtv.v5+json',
                'Client-ID': config.client_id,
                'Authorization': 'OAuth ' + config.oauth
            }
        };
        
        var gameRequest = https.get(gameStreamOptions);

        gameRequest.on("response", function(res){
            var gameBody = '';
            console.log("Status message: " + res.statusMessage);
            console.log("Status code: " + res.statusCode);

        res.on("data", function(data){
            gameBody += data;
        })

        res.on("end", function()
        {
            var parsed = JSON.parse(gameBody),
                streams = parsed.streams,
                gameStreams = [];

            Array.from(streams).forEach(function(stream){
                if (stream.channel.display_name.length > 0) {
                    gameStreams.push(stream.channel);
                }
            });

            if (gameStreams.length < 1) return;

            function alphaSort(a, b)
            {
                if (a.name < b.name) return -1;
                if (a.name > b.name) return 1;
                return 0;
            }

            gameStreams.sort(alphaSort);

            console.log("Number of channels: " + gameStreams.length + "\n\n");

            gameStreams.forEach(function(gameStream){
                console.log("Streamer: " + gameStream.name);
                console.log("Status: " + gameStream.status);
                console.log("Desc: " + gameStream.description);
                console.log("Lang: " + gameStream.language);
                console.log("\n");
            });

        });

        }).on("error", function(err){
            console.log(err);
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

        return https.get(options, function (response) {
            var body = '';
            response.on('data', function(d) {
                body += d;
            });
        
        response.on('end', function()
        {
            var parsed = JSON.parse(body),
                stream = parsed.stream;
        
            if (stream === null) console.log(channel + " is not live");

            else console.log(channel + " is live");


        });
        });
    }

    getChannelID(channel).then(isLive, function(error){
        console.error("Failed!", error);
    });

}

function lastBroadcast(channel)
{

    function lastChannelStatusUpdate(channel)
    {
        var options = {
            hostname: connectionParams.frontendHost,
            path: '/' + channel,
            port: 443,
            method: 'GET',
            headers: {
                'Accept': ''
            }
        }
    }

    function checkLastUpdated(channelID)
    {

        var videoPath = connectionParams.path.channelVideos.replace(/CHANNEL_PLACEHOLDER/i, channelID); 
        
        var options = {
            hostname: connectionParams.host,
            path: videoPath + '?broadcasts=true&broadcast_type=archive&limit=1',
            port: 443,
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.twitchtv.v5+json',
                'Client-ID': config.client_id,
                'Authorization': 'OAuth ' + config.oauth
            }
        };

        return https.get(options, function (response) {
            var body = '';
            response.on('data', function(d) {
                body += d;
            });
        
        response.on('end', function()
        {
            var parsed = JSON.parse(body),
                latestBroadcast = parsed.videos[0] ? parsed.videos[0].recorded_at : lastChannelStatusUpdate(channel),
                timeOffset = new Date().getTimezoneOffset() * 1000,
                latestBroadcastDate = new Date(new Date(latestBroadcast).getTime() - timeOffset);
                
            if (!latestBroadcast)
            {
                console.log("Channel has no videos");
                return;
            }
        
            console.log( ((latestBroadcastDate.getDate()).toString().length === 1 ? '0' + latestBroadcastDate.getDate() : latestBroadcastDate.getDate())
                         + "-"
                         + ( latestBroadcastDate.getMonth() + 1 )
                         + "-"
                         + latestBroadcastDate.getFullYear()

                       );

        });
        });
    }

    getChannelID(channel).then(checkLastUpdated, function(error){
        console.error("Failed!", error);
    });

}

function getPanels(channel, displayOrder)
{

    var panelPath = connectionParams.path.channelPanels.replace(/channel_placeholder/i, channel);

    function queryPanels(channel)
    {
        var options = {
            hostname: connectionParams.host,
            path: panelPath,
            port: 443,
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.twitchtv.v5+json',
                'Client-ID': config.client_id,
                'Authorization': 'OAuth ' + config.oauth
            }
        };

        return https.get(options, function (response) {
            var body = '';
            response.on('data', function(d) {
                body += d;
            });
        
        response.on('end', function()
        {
            var parsed = JSON.parse(body);

            if (Object.keys(parsed).length < 1)
            {
                console.log("This user has no panels.");
                return;
            };

            if (displayOrder && displayOrder > 0)
            {
                const panelSingular = Array.from(parsed)
                     .find(panel => {
                        return parseInt(panel.display_order, 10) === parseInt(displayOrder, 10);
                     });

                console.log(panelSingular.data.description);

                return;
            }

            parsed.map((panel) =>
            {
                console.log(panel !== undefined ? panel.data.description : '');
            });

        });
        });
    }

    queryPanels();
}

function isFollowing(channel)
{

    function confirmFollow(channelID)
    {
        var options = {
            hostname: connectionParams.host,
            path: connectionParams.path.channelFollow,
            port: 443,
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.twitchtv.v5+json',
                'Client-ID': config.client_id,
                'Authorization': 'OAuth ' + config.oauth
            }
        };

        return https.get(options, function (response) {
            var body = '';
            response.on('data', function(d) {
                body += d;
            });
        
        response.on('end', function()
        {
            var parsed = JSON.parse(body),
                follows = parsed.follows;

            if (Object.keys(parsed).length < 1)
            {
                console.log("This user is not following any channels.");
                return;
            };

            const followedChannel = Array.from(follows)
                .find(targetChannel =>
                {
                    return targetChannel.channel.display_name.toLowerCase() === channel.toLowerCase();
                });

            if (!followedChannel)
            {
                console.log("You are not following this channel.")
                return;
            }

            console.log("You are following " + followedChannel.channel.display_name);

        });
        });
    }

    getChannelID(channel).then(confirmFollow, function(error){
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
        const limit = args[1] && args[1].includes("--limit") ? args[1].split("=")[1] : 0;
        const category = (args[1] && args[1].includes("--category")) || (args[2] && args[2].includes("--category")) ? args[1].split("=")[1] || args[2].split("=")[2] : '';
        getFollowedStreams(limit, category);
    break;
    case (args[0].match(/--community/) || {}).input:
        const community = args[0].includes("=") ? args[0].split("=")[1] : '';
        const streamLimit = args[1] && args[1].includes("--limit") ? args[1].split("=")[1] : 0;
        checkCommunity(community, streamLimit);
    break;
    case (args[0].match(/--game/) || {}).input:
        const game = args[0].includes("=") ? encodeURIComponent(args[0].split("=")[1]) : '';
        const gameLimit = args[1] && args[1].includes("--limit") ? args[1].split("=")[1] : 0;
        checkGame(game, gameLimit);
    break;
    case (args[0].match(/--follow/) || {}).input:
        const channel = args[0].includes("--follow") ? args[0].split("=")[1] : '';
        sendFollow(channel);
    break;
    case (args[0].match(/--unfollow/) || {}).input:
        const channelToUnfollow = args[0].includes("--unfollow") ? args[0].split("=")[1] : '';
        sendUnfollow(channelToUnfollow);
    break;
    case (args[0].match(/--is-live/) || {}).input:
        const liveStream = args[0].split("=")[1];
        checkLive(liveStream);
    break;
    case (args[0].match(/--last-updated/) || {}).input:
        const channelToQuery = args[0].split("=")[1];
        lastBroadcast(channelToQuery);
    break;
    case (args[0].match(/--panel-info/) || {}).input:
        const panelChannel = args[0].split("=")[1];
        const displayOrder = args[1] && args[1].includes("--display-order") ? args[1].split("=")[1] : 0;
        getPanels(panelChannel, displayOrder);
    break;
    case (args[0].match(/--is-following/) || {}).input:
        const channelToCheck = args[0].split("=")[1];
        isFollowing(channelToCheck);
    break;
}
