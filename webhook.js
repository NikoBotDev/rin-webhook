
const { WebhookClient } = require('discord.js');
const logger = require('./functions/logger');
const track  = require('./functions/tracker');
const hook = new WebhookClient(process.env.ID, process.env.TOKEN);
const mongo = require('./data/MongoDB');
mongo.start();
setInterval(async () => {
  const map = await track();
  console.log('a');
  if(!map)
    return;
  console.log(map.base.image)
  logger.info(`Creating post for [${map.base.title}](${map.base.id})`);
  const embed = {
    color: 0x53f442,
    title: ':sparkling_heart: Ranked',
    description: `[${map.base.title} by ${map.base.author}](${map.base.link})\n\n**Length:** ${map.maps[0].length} **BPM:** ${map.maps[0].bpm}\n**Download:** [map](https://osu.ppy.sh/d/${map.base.id})([no vid](https://osu.ppy.sh/d/${map.base.id}n))\n-------------------\n`,
    thumbnail: {
      url: map.image
    },
    fields: [],
    timestamp: new Date(map.base.pubDate)
  };
  map.maps = map.maps.slice(0, 3);
  for(const m of map.maps) {
    embed.fields.push({
      name: m.version,
      value: `**▸Difficulty:** ${m.stars.toFixed(2)}★ **▸Max Combo:** x${m.maxCombo}
**▸AR:** ${m.ar.toFixed(1)} **▸OD:** ${m.od.toFixed(1)} **▸HP:** ${m.hp.toFixed(1)} **▸CS:** ${m.cs.toFixed(1)}
**▸PP:** ○ **95%**–${m.pp[0].toFixed(2)} ○ **99%**–${m.pp[1].toFixed(2)} ○ **100%**–${m.pp[2].toFixed(2)}`
    });
  }
  await hook.send('', {
    embeds: [
      embed
    ]
  }); 
  return;
}, 20000);