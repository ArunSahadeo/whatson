## Whatson

Node command-line executable that hooks into the Twitch API and returns a list of live channels from the ones from you are following.

## Usage

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
