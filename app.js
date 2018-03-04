const https = require("https"), fs = require("fs"), config = fs.existsSync("./config.json") ? require("./config.json") : false, exec = require("child_process").exec;

if (!config || Object.keys(config).length === 0)
{
    !config
        ?
    console.log("config.json does not exist")
    :
    console.log("config.json has no keys")
    ;
    process.exit(0);
}

for (var key in config)
{

    if ( key === "preview_dimensions" || key === "image_tools" ) continue;
    
    var keyValue;
    const alphaNumPattern = /^([0-9]|[a-z])+([0-9a-z]+)$/i;

    switch (key)
    {
        case "user":
            keyName = key.charAt(0).toUpperCase() + key.substr(1);
            keyValue = config[key];
            if(!Number.isInteger(parseInt(keyValue)))
            {
                console.log(keyName + " is not set");
                process.exit(0);
            }
        break;
        case "oauth":
            keyName = key.charAt(0).toUpperCase() + key.charAt(1).toUpperCase() + key.substr(2);
            keyValue = config[key];
            if (!keyValue.match(alphaNumPattern))
            {
                console.log(keyName + " is not set");
                process.exit(0);
            }
        break;
        case "client_id":
            keyName = key.charAt(0).toUpperCase() + key.substr(1);
            keyValue = config[key];
            if (!keyValue.match(alphaNumPattern))
            {
                console.log(keyName + " is not set");
                process.exit(0);
            }
        break;
        case "client_secret":
            keyName = key.charAt(0).toUpperCase() + key.substr(1);
            keyValue = config[key];
            if (!keyValue.match(alphaNumPattern))
            {
                console.log(keyName + " is not set");
                process.exit(0);
            }
        break;
        default:
            console.log(key + " is not a valid key name!");
            process.exit(0);
        break;
    }
}

var connectionParams = {
    host: 'api.twitch.tv',
    path: {
        followedChannels: '/kraken/streams/followed?stream_type=live',
        getUser: '/kraken/users',
        channelFollow: `/kraken/users/${config.user}/follows/channels/`,
        channelStatus: '/kraken/streams/',
        communityStatus: '/kraken/communities',
        channelPanels: '/api/channels/CHANNEL_PLACEHOLDER/panels',
        channelVideos: '/kraken/channels/CHANNEL_PLACEHOLDER/videos',
        channelFeed: '/kraken/feed/CHANNEL_PLACEHOLDER/posts?limit=1'
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

function getFollowedStreams(limit, category, channelsFilter)
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

        function customSort(a, b)
        {
            channelsFilter = String(channelsFilter).toLowerCase();
            switch(channelsFilter)
            {
                case "viewers":
                    if (a.viewers < b.viewers) return -1;
                    if (a.viewers > b.viewers) return 1;
                break;
                case "game":
                    if (a.game < b.game) return -1;
                    if (a.game > b.game) return 1;
                break;
                case "name":
                default:
                    if (a.name < b.name) return -1;
                    if (a.name > b.name) return 1;
                break;
            }
            return 0;
        }

        followedChannels.sort(customSort);

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

function getFollowed(limit, orderBy, filterChar)
{
    
    var queryParams =
    {
        'limit': (limit > 0 ? limit : 100),
    };
    
    if (orderBy.length && orderBy.toLowerCase() === "asc" || orderBy.toLowerCase() === "desc")
    {   
        queryParams =
        {
            'limit': (limit > 0 ? limit: 100),
            'direction': String(orderBy.toLowerCase()),
            'sortby': 'login',
        }
    }

    var channelFollowsPath = connectionParams.path.channelFollow;
    channelFollowsPath += "?";

    for ( var key in queryParams )
    {
        channelFollowsPath += (key + "=" + queryParams[key]);

        if (key !== Object.keys(queryParams)[Object.keys(queryParams).length -1]) channelFollowsPath += "&";
    }

    return https.get({
        hostname: connectionParams.host,
        path: channelFollowsPath,
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
            channelsFollowing = parsed.follows,
            followedStreamers = []
            ;

        if (typeof(channelsFollowing) === undefined)
        {
            console.log("Couldn't fetch followed channels. Please try again.");
            return;
        }

        Array.from(channelsFollowing).forEach(function(channelFollowing){
            var channel = channelFollowing.channel;
            if (channel.display_name.length > 0) {
                followedStreamers.push(channel);
            }
        });

        if (followedStreamers.length < 1) return;

        if (filterChar)
        {
            followedStreamers = followedStreamers.filter(function(followedStreamer)
            {
                return String(followedStreamer.name).charAt(0) === String(filterChar).toLowerCase();
            });
        }

        console.log("Number of channels: " + followedStreamers.length + "\n\n");

        followedStreamers.forEach(function(followedStreamer){
            console.log("Streamer: " + followedStreamer.name);
            console.log("Last known game: " + followedStreamer.game);
            console.log("Language: " + followedStreamer.language);
            console.log("Description: " + followedStreamer.description);
            console.log("Broadcaster Type: " + followedStreamer.broadcaster_type);
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

function checkCommunity(community, streamLimit, communityFilter)
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

            function customSort(a, b)
            {
                communityFilter = String(communityFilter).toLowerCase();
                switch(communityFilter)
                {
                    case "viewers":
                        if (a.viewers < b.viewers) return -1;
                        if (a.viewers > b.viewers) return 1;
                    break;
                    case "game":
                        if (a.game < b.game) return -1;
                        if (a.game > b.game) return 1;
                    break;
                    case "name":
                    default:
                        if (a.name < b.name) return -1;
                        if (a.name > b.name) return 1;
                    break;
                }
                return 0;
            }

            communityStreams.sort(customSort);

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

function checkGame(game, streamLimit, gameFilter)
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

            Array.from(streams).forEach(function(stream, index){
                stream.channel.viewers = streams[index].viewers;
                if (stream.channel.display_name.length > 0) {
                    gameStreams.push(stream.channel);
                }
            });

            if (gameStreams.length < 1) return;

            function customSort(a, b)
            {
                gameFilter = String(gameFilter).toLowerCase();
                switch(gameFilter)
                {
                    case "viewers":
                        if (a.viewers < b.viewers) return -1;
                        if (a.viewers > b.viewers) return 1;
                    break;
                    case "game":
                        if (a.game < b.game) return -1;
                        if (a.game > b.game) return 1;
                    break;
                    case "name":
                    default:
                        if (a.name < b.name) return -1;
                        if (a.name > b.name) return 1;
                    break;
                }
                return 0;
            }

            gameStreams.sort(customSort);

            console.log("Number of channels: " + gameStreams.length + "\n\n");

            gameStreams.forEach(function(gameStream){
                console.log("Streamer: " + gameStream.name);
                console.log("Status: " + gameStream.status);
                console.log("Game: " + gameStream.game);
                console.log("Desc: " + gameStream.description);
                console.log("Lang: " + gameStream.language);
                console.log("Viewers: " + gameStream.viewers);
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

function channelPosts(channel)
{

    function checkLastPosted(channelID)
    {

        var channelFeed = connectionParams.path.channelFeed.replace(/CHANNEL_PLACEHOLDER/i, channelID); 
        
        var options = {
            hostname: connectionParams.host,
            path: channelFeed,
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
                posts = parsed.posts,
                lastPost = posts[0];

            if(!lastPost)
            {
                console.log("Channel has no posts.");
                return;
            }

            console.log("Message: " + lastPost.body);
            console.log("Date: " + lastPost.created_at);

        });
        });
    }

    getChannelID(channel).then(checkLastPosted, function(error){
        console.error("Failed!", error);
    });

}

function lastBroadcast(channel)
{

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


                console.log(panelSingular.data.title + "\n");
                console.log(panelSingular.data.description);

                return;
            }

            parsed.map((panel) =>
            {
                if (panel !== undefined)
                {
                    var title = String(panel.data.title + "\n"),
                        desc = panel.data.description,
                        filteredDesc,
                        markdownPattern = /[#]{1,}([A-Z|a-z|0-9|.|'|+|/|(|)|\s]+)\n?/g;
                    
                    const linuxBold = "\033[1m%s\n\033[0m",
                          winBold = "\x1b[1m%s\n\x1b[0m";

                    switch (process.platform)
                    {
                        case "linux":

                            if ( String(desc).match(markdownPattern) )
                            {
                                filteredDesc = desc.replace(markdownPattern, "\033[1m$1\n\033[0m");
                            }

                            console.log(linuxBold, title);

                            if (filteredDesc) console.log(filteredDesc);

                            else console.log(desc + "\n");

                        break;

                        case "win32":

                            if ( String(desc).match(markdownPattern) )
                            {
                                filteredDesc = desc.replace(markdownPattern, "\033[1m$1\n\033[0m");
                            }

                            console.log(winBold, title);

                            if (filteredDesc) console.log(filteredDesc);

                            else console.log(desc + "\n");
                        break;
                    }

                }
            });

        });
        });
    }

    queryPanels();
}

function getChannelInfo(channelName)
{

    function queryChannel(channel)
    {
        var options = {
            hostname: connectionParams.host,
            path: connectionParams.path.channelStatus + channel,
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

            if (!parsed.stream)
            {
                console.log(channelName + " is not live");
                return;
            }

            channelSingle = parsed.stream.channel,
            channelSingle.viewers = parsed.stream.viewers;

            var matchedWord =
            {
                "{width}": "preview_dimensions.width" in config ? config.preview_dimensions.width : 400,
                "{height}": "previe_dimensions.height" in config ? config.preview_dimensions.height : 400
            };

            channelSingle.preview = String(parsed.stream.preview.template)
                                    .replace(/\{width\}|\{height\}/g,
                                    function(matched)
                                    { return matchedWord[matched]; });

            if (Object.keys(channelSingle).length < 1)
            {
                console.log("This channel has no info.");
                return;
            };

            console.log("Streamer: " + channelSingle.name);
            console.log("Status: " + channelSingle.status);
            console.log("Desc: " + channelSingle.description);
            console.log("Game: " + channelSingle.game);
            console.log("Lang: " + channelSingle.language);
            console.log("Viewers: " + channelSingle.viewers);
            console.log("\n");

            var previewFileName = String(channelSingle.preview).replace(/^.+(live_user_)/, ''),
                previewFileStream = fs.createWriteStream(previewFileName);

            var previewRequest = https.get(channelSingle.preview, function(resp)
            {
                resp.pipe(previewFileStream);
            });

            if (!fs.existsSync(previewFileName)) return;

            var whichOS = require("os").platform(),
                which = whichOS.includes("win") ? "where" : "which",
                spawn = require("child_process").spawn;

            if (whichOS.includes("win"))
            {

                console.log("Please open " + previewFileName + " in your preferred application.");

                return;
			}
			else if (whichOS.includes("darwin"))
			{
				exec("open -a Preview " + previewFileName, function(err)
				{
					console.error(err);
				});

				return;
				
			}

            var imageTools = [
                "eog",
                "photoshop"
            ];

            imageTools.forEach(function(imageTool)
            {

                var out = spawn(which, [imageTool])
                    .on("error", function(err) { throw err });

                out.on("close", function(code){
                    if ( parseInt(code) === 0 )
                    {
                        exec(imageTool + " " + previewFileName, function(err)
                        {
                            console.error(err);
                        });

                        return;
                    }
                });
            });
        });
        });
    }

    getChannelID(channelName).then(queryChannel, function(error){
        console.error("Failed!", error);
    });

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
    help = "Please specify a flag.",
    availableFlags = [
        '--channels',
        '--community',
        '--game',
        '--follow',
        '--unfollow',
        '--is-live',
        '--last-updated',
        '--channel-info',
        '--panel-info',
        '--is-following',
        '--get-followed',
        '--last-posted',
    ]
    ;

if ( args.length < 1 )
{
    console.log(help);
    process.exit(0);
}

args[0] = args[0].toLowerCase();

switch (args[0]) {
    case (args[0].match(/--channels/) || {}).input:
        const limit = (args[1] && args[1].includes("--limit") ? args[1].split("=")[1] : '') || (args[2] && args[2].includes("--limit") ? args[2].split("=")[1] : '') || (args[3] && args[3].includes("--limit") ? args[3].split("=")[1] : '');
        const category = (args[1] && args[1].includes("--category") ? args[1].split("=")[1] : '') || (args[2] && args[2].includes("--category") ? args[2].split("=")[1] : '') || (args[3] && args[3].includes("--category") ? args[3].split("=")[1] : '');
        const channelsFilter = (args[1] && args[1].includes("--channels-filter") ? args[1].split("=")[1] : '') || (args[2] && args[2].includes("--channels-filter") ? args[2].split("=")[1] : '') || (args[3] && args[3].includes("--channels-filter") ? args[3].split("=")[1] : '');
        getFollowedStreams(limit, category, channelsFilter);
    break;
    case (args[0].match(/--community/) || {}).input:
        const community = args[0].includes("=") ? args[0].split("=")[1] : '';
        const streamLimit = args[1] && args[1].includes("--limit") ? args[1].split("=")[1] : 0;
        const communityFilter = (args[1] && args[1].includes("--community-filter") ? args[1].split("=")[1] : '') || (args[2] && args[2].includes("--community-filter") ? args[2].split("=")[1] : '') || (args[3] && args[3].includes("--community-filter") ? args[3].split("=")[1] : '');
        checkCommunity(community, streamLimit, communityFilter);
    break;
    case (args[0].match(/--game/) || {}).input:
        const game = args[0].includes("=") ? encodeURIComponent(args[0].split("=")[1]) : '';
        const gameLimit = (args[1] && args[1].includes("--limit") ? args[1].split("=")[1] : '') || (args[2] && args[2].includes("--limit") ? args[2].split("=")[1] : '') || (args[3] && args[3].includes("--limit") ? args[3].split("=")[1] : '');
        const gameFilter = (args[1] && args[1].includes("--game-filter") ? args[1].split("=")[1] : '') || (args[2] && args[2].includes("--game-filter") ? args[2].split("=")[1] : '') || (args[3] && args[3].includes("--game-filter") ? args[3].split("=")[1] : '');
        checkGame(game, gameLimit, gameFilter);
    break;
    case (args[0].match(/--follow/) || {}).input:
        const channel = args[0].includes("--follow") ? args[0].split("=")[1] : '';
        if (!channel)
        {
            console.log("Channel to follow is empty");
            process.exit(1);
        }
        sendFollow(channel);
    break;
    case (args[0].match(/--unfollow/) || {}).input:
        const channelToUnfollow = args[0].includes("--unfollow") ? args[0].split("=")[1] : '';
        if (!channelToUnfollow)
        {
            console.log("Channel to unfollow is empty");
            process.exit(1);
        }
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
        if (panelChannel.length === 0)
        {
            console.log("--panel-info cannot be empty.");
            process.exit(1);
        }
        const displayOrder = args[1] && args[1].includes("--display-order") ? args[1].split("=")[1] : 0;
        getPanels(panelChannel, displayOrder);
    break;
    case (args[0].match(/--channel-info/) || {}).input:
        const targetChannel = args[0].split("=")[1];
        if (targetChannel.length === 0)
        {
            console.log("--channel-info cannot be empty.");
            process.exit(1);
        }
        getChannelInfo(targetChannel);
    break;
    case (args[0].match(/--get-followed/) || {}).input:
        const followLimit = args[1] && args[1].includes("--limit") ? args[1].split("=")[1] : 0;
        const orderBy = (args[1] && args[1].includes("--order-by") ? args[1].split("=")[1] : '') || (args[2] && args[2].includes("--order-by") ? args[2].split("=")[1] : '');
        const filterChar = (args[1] && args[1].includes("--filter-char") ? args[1].split("=")[1] : '') || (args[2] && args[2].includes("--filter-char") ? args[2].split("=")[1] : '') || (args[3] && args[3].includes("--filter-char") ? args[3].split("=")[1] : '');
        getFollowed(followLimit, orderBy, filterChar);
    break;
    case (args[0].match(/--is-following/) || {}).input:
        const channelToCheck = args[0].split("=")[1];
        isFollowing(channelToCheck);
    break;
    case (args[0].match(/--last-posted/) || {}).input:
        const feedChannel = args[0].split("=")[1];
        channelPosts(feedChannel);
    break;
    default:
        console.log("Invalid flag. The available flags are:");
        availableFlags.forEach(function(flag){
            console.log(flag);
        });
    break;
}
