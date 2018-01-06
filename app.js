const https = require("https"), config = require("./config.json");

var connectionParams = {
    host: 'api.twitch.tv',
    path: {
        followedChannels: '/kraken/streams/followed?stream_type=live',
        getUser: '/kraken/users',
        channelFollow: `/kraken/users/${config.user}/follows/channels/`,
        channelStatus: '/kraken/streams/',
        communityStatus: '/kraken/communities',
        channelPanels: '/api/channels/CHANNEL_PLACEHOLDER/panels'
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
            followedChannels = []
            ;

        Array.from(streams).forEach(function(stream){
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
            path: streamLimit > 0 ? connectionParams.path.channelStatus.slice(0, -1) + "?community_id=" + communityID + "&limit=" + streamLimit : connectionParams.path.channelStatus.slice(0, -1) + "?community_id=" + communityID,
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

            Array.from(streams).forEach(function(stream){
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

function getPanels(channel)
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

            parsed.map((panel) =>
            {
                console.log(panel !== undefined ? panel.data.description : '');
            });

        });
        });
    }

    queryPanels();
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
    case (args[0].match(/--panel-info/) || {}).input:
        const panelChannel = args[0].split("=")[1];
        getPanels(panelChannel);
    break;
}
