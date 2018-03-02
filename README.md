## Whatson

Node command-line executable that hooks into the Twitch API and returns a list of live channels from the ones you are following.

## Prerequisites

Run the following:

```bash
npm install
```

Also copy `config.json.example` as `config.json` and enter the appropriate values for your Twitch account.

## Usage

### How to check if you are following a channel

```bash
node app.js --is-following=somechannel
```

### If you are following channel:

```bash
You are following somechannel
```

### If you are not following channel:

```bash
You are not following somechannel
```

### How to check if a specific channel is live or not

```bash
node app.js --is-live=somechannel
```

#### If channel is live:

```bash
somechannel is live
```

#### If channel is not live:

```bash
somechannel is not live
```

### How to get live streams that your user is following:

```bash
node app.js --channels
```

#### Getting 5 live streams that your user is following:

```bash
node app.js --channels --limit=5
```

### How to follow a channel on Twitch:

```bash
node app.js --follow=somechannel
```

### How to unfollow a channel on Twitch:

```bash
node app.js --unfollow=somechannel
```
### How to get live streams from a community

```bash
node app.js --community=somecommunity
```

#### Getting 5 live streams from a community

```bash
node app.js --community=somecommunity --limit=5
```

### How to get live streams from a game

```bash
node app.js --game=somegame
```

#### Getting 5 live streams from a game

```bash
node app.js --game=somegame --limit=5
```

### Find out the date of the channel's most recent video

```bash
node app.js --last-updated=somechannel
```

### Get channel information for a live stream (opens a preview image of stream)

```bash
node app.js --channel-info=somechannel
```

### Return text from the channel's panels (if available)

```bash
node app.js --panel-info=somechannel
```

### Get all channels you are following (regardless of whether they are live or not)

```bash
node app.js --get-followed
```

#### Get all channels you are following whose name begins with the letter A

```bash
node app.js --get-followed --filter-char=a
```

#### Get all channels you are following in ascending order

```bash
node app.js --get-followed --order-by=asc
```

#### Get all channels you are following in descending order

```bash
node app.js --get-followed --order-by=desc
```
