import axios from 'axios';
import * as fs from 'fs';
import makeDir from 'make-dir';
import path from 'path';
import _ from 'lodash';
import { promisify } from 'util';
import { message } from 'antd';
import vSort from 'version-sort';
import { PACKS_PATH, GAME_VERSIONS_URL, FORGE_PROMOS } from '../constants';
import { addToQueue } from './downloadManager';

export const GET_MC_VANILLA_VERSIONS = 'GET_MC_VANILLA_VERSIONS';
export const CREATION_COMPLETE = 'CREATION_COMPLETE';
export const DISPATCH_VANILLA_MANIFEST = 'DISPATCH_VANILLA_MANIFEST';
export const START_PACK_CREATION = 'START_PACK_CREATION';
export const GET_FORGE_MANIFEST = 'GET_FORGE_MANIFEST';

export function getVanillaMCVersions() {
  return async dispatch => {
    const versions = await axios.get(GAME_VERSIONS_URL);
    dispatch({
      type: GET_MC_VANILLA_VERSIONS,
      payload: versions
    });
    const promos = (await axios.get(FORGE_PROMOS)).data;
    const forgeVersions = {};
    // This reads all the numbers for each version. It replaces each number
    // with the correct forge version. It filters numbers which do not have the "installer"
    // file. It then omits empty versions (not even one valid forge version for that mc version)
    Object.keys(promos.mcversion).forEach(v => {
      if (v === '1.7.10_pre4') return;
      forgeVersions[v] = promos.mcversion[v]
        .filter(ver => {
          const { files } = promos.number[ver];
          for (let i = 0; i < files.length; i++) {
            if (files[i][1] === 'installer' && files[i][0] === 'jar') {
              return true;
            }
          }
          return false;
        })
        .map(ver => {
          const { files } = promos.number[ver];
          let md5;
          for (let i = 0; i < files.length; i++) {
            if (files[i].includes('installer')) {
              [, , md5] = files[i];
            }
          }
          return {
            [promos.number[ver].version]: {
              branch: promos.number[ver].branch,
              md5
            }
          };
        });
    });

    dispatch({
      type: GET_FORGE_MANIFEST,
      payload: _.omitBy(forgeVersions, v => v.length === 0)
    });
  };
}

export function createPack(version, packName, forgeVersion = null) {
  return async (dispatch) => {

    dispatch({ type: START_PACK_CREATION });

    await makeDir(path.join(PACKS_PATH, packName));
    dispatch(addToQueue(packName, version, forgeVersion));
    dispatch({ type: CREATION_COMPLETE });
  };
}

export function instanceDownloadOverride(
  version,
  packName,
  forgeVersion = null
) {
  return async (dispatch) => {

    dispatch({ type: START_PACK_CREATION });

    try {
      await promisify(fs.access)(path.join(PACKS_PATH, packName));
    } catch (e) {
      await makeDir(path.join(PACKS_PATH, packName));
    } finally {
      dispatch(addToQueue(packName, version, forgeVersion));
      dispatch({ type: CREATION_COMPLETE });
    }
  };
}
