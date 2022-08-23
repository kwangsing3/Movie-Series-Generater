import {join} from 'node:path';
import {WriteFile, WriteFileAsJSON} from '../utility/fileIO';
import * as wrapTMDB from 'wraptmdb-ts';
const cliProgress = require('child_process');

//Step1
async function Call(keywords: string[], path: string) {
  let str = '';
  let legn = keywords.length - 1;
  keywords.forEach((element: string) => {
    str += element;
    if (legn-- > 0) str += '|';
  });
  //Progress Bar
  const bar1 = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  let cur_page = 1;
  let MaxPage = 1;
  const query = {
    with_keywords: str,
    with_watch_monetization_types: 'flatrate',
    include_adult: true,
    sort_by: 'popularity.desc',
    page: cur_page,
    language: 'en-US',
  };
  //First request to get infomation
  const data = await wrapTMDB.Discover.GetTVDiscover(query);
  const total_results = Object.prototype.hasOwnProperty.call(
    data,
    'total_results'
  )
    ? data['total_results']
    : 0;
  MaxPage = data['total_pages'] > 1 ? data['total_pages'] : -1;
  let current_result = 0;
  bar1.start(total_results, current_result);
  while (cur_page <= MaxPage) {
    // To Search for TV shows ID
    query.page = cur_page;
    const data = await wrapTMDB.Discover.GetTVDiscover(query);
    if (data['results'].length === 0) {
      break;
    }
    const IDs: any[] = [];
    data['results'].forEach((element: {[x: string]: any}) => {
      IDs.push(element['id']);
    });
    //Generated json structure
    for (const key of IDs) {
      const data = await wrapTMDB.TV.GetDetails(key);
      //turn into real folder
      await GenerateFolder(data, path);
      bar1.update(current_result++);
    }
    cur_page++;
  }
  bar1.stop();
}

exports.default = Call;
/*------------------Geaneate Logic------------------*/
const metadataName = 'metadata.mtg.txt';
//Generate Folder by JSON structure
async function GenerateFolder(data: {[x: string]: any}, parentpath: string) {
  // Skip if has no name
  let Foldername = Object.prototype.hasOwnProperty.call(data, 'original_name')
    ? data['original_name']
    : '';
  if (Foldername === '') return;
  //Prefix Foldername
  Foldername = Foldername.replace('/', '／')
    .replace('\\', '＼')
    .replace(':', '：');
  //Release date
  const strFirstAirDate = Object.prototype.hasOwnProperty.call(
    data,
    'first_air_date'
  )
    ? data['first_air_date']
    : '';
  const FirstAirDate = new Date(strFirstAirDate);
  const Year = FirstAirDate.getUTCFullYear();
  Foldername += ` (${Year})`;
  // Seasons
  const Seasons = Object.prototype.hasOwnProperty.call(data, 'seasons')
    ? data['seasons']
    : [];
  for (const season of Seasons) {
    //Season name
    let name = Object.prototype.hasOwnProperty.call(season, 'name')
      ? season['name']
      : '';
    if (name === '' || name === 'Specials' || name === 'Extras') {
      continue;
    }
    //Season index
    const season_number = Object.prototype.hasOwnProperty.call(
      season,
      'season_number'
    )
      ? season['season_number']
      : -1;
    if (!name.includes(`Season ${season_number}`)) {
      name = `Season ${season_number} - ${name}`;
    }
    // Episode Count (ignore if there's no episodes)
    const episode_count = Object.prototype.hasOwnProperty.call(
      season,
      'episode_count'
    )
      ? season['episode_count']
      : -1;
    if (episode_count < 1) {
      continue;
    }
    //.gitkeep: git will not track the folder if nothing in there
    await WriteFile(
      join(parentpath + Foldername + '/' + `${Foldername}.mtg.mkv`),
      null
    );
    //Add extra folders
    await WriteFile(
      join(parentpath + Foldername + '/' + 'Specials' + '/.mtg.gitkeep'),
      null
    );
    await WriteFile(
      join(parentpath + Foldername + '/' + 'Extras' + '/.mtg.gitkeep'),
      null
    );
    //Add json as a tag
    await WriteFileAsJSON(
      join(parentpath + Foldername + '/' + metadataName),
      data
    );
  }
}
