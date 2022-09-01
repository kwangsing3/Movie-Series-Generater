//
//
//
//
// image host: https://image.tmdb.org/t/p/original/
//
//

import {join} from 'node:path';
import {WriteFileAsJSON} from '../utility/fileIO';

// 搜尋到的動漫架構
export const tv_struct: any = {};
export const movie_struct: any = {};

export function SendToSturct(tag: 'tv' | 'movie', input: any) {
  switch (tag) {
    case 'tv':
      SendTV(input);
      break;
    case 'movie':
      SendMovie(input);
      break;
    default:
      break;
  }
}

function SendTV(input: any) {
  //
  console.log();
  const ori_name = input['original_name'];
  const Seasons = input['seasons'];
  const year = new Date(input['first_air_date']).getUTCFullYear();
  if (Seasons === undefined || Seasons.length < 2) {
    const resDate = filter(new Date(input['first_air_date']));
    if (!Object.prototype.hasOwnProperty.call(tv_struct, resDate))
      tv_struct[resDate] = {};
    tv_struct[resDate][ori_name] = input;
  } else {
    for (const key of Seasons) {
      const resDate = filter(new Date(key['air_date']));
      if (!Object.prototype.hasOwnProperty.call(tv_struct, resDate))
        tv_struct[resDate] = {};
      key['poster_path'] =
        'https://image.tmdb.org/t/p/original/' + key['poster_path'];
      tv_struct[resDate][`${ori_name} (${year})`] = key;
    }
  }
  //
  //
  //
  //
}
function SendMovie(input: any) {
  //
  console.log();
}

const filter = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  return `${year}-${((month + 1) % 3) * 3 + 1}`;
  //
};

export const WriteStruct = async (pat: string) => {
  await WriteFileAsJSON(join(pat, '../', 'tv_struct.json'), tv_struct);
  await WriteFileAsJSON(join(pat, '../', 'movie_struct.json'), movie_struct);
};
