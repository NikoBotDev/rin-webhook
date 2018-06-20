const s = require('snekfetch');
const promisify = require('util').promisify;
const parseXMLAsync = promisify(require('xml2js').parseString);
const fs = require('fs-nextra');
const { osuKey } = process.env;
const oppai = require('oppai');
module.exports = async () => {
  const m = await s.get('https://osu.ppy.sh/feed/ranked/');
  const xml = await parseXMLAsync(m.text);
  const map = xml.rss.channel[0].item[0];
  const id = /(http:\/\/)?osu\.ppy\.sh\/s\/([0-9]+)/.exec(map.link[0])[2];
  const oldMap = await fs.readJSON('./data/lastmap.json');
  if(id === oldMap.id)
    return null;
  map.id = id;
  await fs.writeJSON('./data/lastmap.json', map, { spaces: 5 });
  const mapObject = await getMap(id);
  if(!mapObject || (Array.isArray(mapObject)) && !mapObject.length)
    return;
  const mapInfos = [];
  for(const bmp of mapObject) {
    const g = await s.get(`https://osu.ppy.sh/osu/${bmp.beatmap_id}`);
    const path = `data/temp/${id}.osu`;
    await fs.writeFile(path, g.body);
    const exists = await fs.pathExists(path);
    if(!exists)
      return;
    const oppai = await getOppai(path);
    await fs.unlink(path).catch(() => {
      // ignored
    });
    const time = getTime(bmp.total_length);
    oppai.length = `${time.minutes}:${time.seconds}`;
    oppai.bpm = parseInt(bmp.bpm);
    mapInfos.push(oppai);
  }
  const base = {
    id,
    title: map.title[0],
    author: map.author[0],
    link: map.link[0],
    pubDate: map.pubDate[0],
    image: `https://b.ppy.sh/thumb/${id}l.jpg`
  };
  return {
    base,
    maps: mapInfos
  };
  
};
async function getMap(id) {
  try {
    const m = await s.get(`https://osu.ppy.sh/api/get_beatmaps?k=${osuKey}&s=${id}&m=0`);
    if(m)
      return m.body;
    return null;
  } catch(e) {
    console.error(e);
    return null;
  }
}

function getOppai(path, accs = [95, 99, 100]) {
  return new Promise((res, rej) => {
    try {
      const ctx = oppai.Ctx();
      const b = oppai.Beatmap(ctx);
      const BUFSIZE = 2000000;
      const buf = oppai.Buffer(BUFSIZE);
      b.parse(path, buf, BUFSIZE, false, 'data/cache/');
      const diffCtx = oppai.DiffCalcCtx(ctx);
    
      const diff = diffCtx.diffCalc(b);
      const data = {
        cs: b.cs(),
        od: b.od(),
        ar: b.ar(),
        hp: b.hp(),
        maxCombo: b.maxCombo()
      };
      const totalPPList = [];
      for(const acc of accs) {
        const { pp } = ctx.ppCalcAcc(diff.aim, diff.speed, b, parseFloat(acc));
        totalPPList.push(pp);
      }
      const oppaiJson = {
        version: b.version(),
        title: b.title(),
        stars: diff.stars,
        artist: b.artist(),
        creator: b.creator(),
        maxCombo: data.maxCombo,
        numObjects: b.numObjects(),
        numCircles: b.numCircles(),
        numSliders: b.numSliders(),
        numSpinners: b.numSpinners(),
        pp: totalPPList,
        acc: accs,
        cs: data.cs,
        od: data.od,
        ar: data.ar,
        hp: data.hp
      };
      res(oppaiJson);
    } catch(e) {
      rej(e);
    }
  });
}

function getTime(secs) {
  const minutes = Math.floor(secs / 60);
  const seconds = secs - minutes * 60;
  return {
    minutes,
    seconds
  };
}