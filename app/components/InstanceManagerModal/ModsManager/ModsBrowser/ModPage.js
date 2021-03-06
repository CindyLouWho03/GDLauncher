import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import ContentLoader from 'react-content-loader';
import path from 'path';
import Promise from 'bluebird';
import _ from 'lodash';
import { Button, Select } from 'antd';
import { PACKS_PATH, CURSEMETA_API_URL } from '../../../../constants';
import { downloadMod } from '../../../../utils/mods';

import styles from './ModPage.scss';

function ModPage(props) {

  const [modData, setModData] = useState(null);
  const [modsInstalling, setModsInstalling] = useState([]);
  const [selectedModVersion, setSelectedModVersion] = useState(null);

  useEffect(() => {
    getAddonData(props.match.params.mod);
  }, []);

  const installMod = async (id, projectFileId, filename) => {
    setModsInstalling({
      ...modsInstalling,
      [filename]: { installing: true, completed: false }
    });

    await downloadMod(id, projectFileId, filename, props.match.params.instance);

    setModsInstalling({
      ...modsInstalling,
      [filename]: { installing: false, completed: true }
    });
  };

  const getAddonData = async addon => {
    const [{ data }, files] = await Promise.all([
      axios.get(`${CURSEMETA_API_URL}/direct/addon/${addon}`),
      axios.get(`${CURSEMETA_API_URL}/direct/addon/${addon}/files`)
    ]);

    const filteredFiles = files.data.filter(el =>
      el.gameVersion.includes(props.match.params.version)
    );

    setModData({ ...data, allFiles: _.orderBy(filteredFiles, ['fileDate'], ['desc']) });
  };

  const isDownloadCompleted = data => modsInstalling[data] && modsInstalling[data].completed;

  const isInstalling = data => modsInstalling[data] && modsInstalling[data].installing;

  const handleModVersionChange = version => setSelectedModVersion(version);

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: 10 }}>
      {!modData ? (
        <div>
          <ContentLoader
            height={350}
            width={500}
            speed={0.6}
            ariaLabel={false}
            primaryColor="var(--secondary-color-2)"
            secondaryColor="var(--secondary-color-3)"
            style={{
              height: '350px',
              width: '500px',
              marginTop: 20
            }}
          >
            <rect x="100" y="10" rx="0" ry="0" width={320} height="20" />
            <rect x="10" y="70" rx="0" ry="0" width={480} height="30" />
            <rect x="10" y="110" rx="0" ry="0" width={480} height="30" />
            <rect x="10" y="150" rx="0" ry="0" width={480} height="30" />
            <rect x="10" y="230" rx="0" ry="0" width={50} height="50" />
            <rect x="70" y="230" rx="0" ry="0" width={420} height="17" />
            <rect x="70" y="260" rx="0" ry="0" width={420} height="17" />
            <rect x="10" y="290" rx="0" ry="0" width={480} height="17" />
            <rect x="10" y="320" rx="0" ry="0" width={480} height="17" />
          </ContentLoader>
        </div>
      ) : (
          <div>
            <h1 style={{ textAlign: 'center' }}>{modData.name}</h1>
            <div className={styles.modActions}>
              <div
                style={{
                  width: '45%',
                  display: 'flex',
                  justifyContent: 'space-evenly',
                  alignItems: 'center'
                }}
              >
                <Button
                  type="primary"
                  onClick={() =>
                    installMod(modData.id, modData.allFiles[0].id, modData.allFiles[0].fileNameOnDisk)
                  }
                  loading={isInstalling(modData.allFiles[0].fileNameOnDisk)}
                  disabled={isDownloadCompleted(modData.allFiles[0].fileNameOnDisk)}
                >
                  Install Latest
                </Button>
              </div>
              <span>Or</span>
              <div style={{ width: '45%' }}>
                <Select
                  style={{
                    width: '200px',
                    display: 'block',
                    margin: '0 auto'
                  }}
                  placeholder="Select a version"
                  notFoundContent="No version found"
                  onChange={handleModVersionChange}
                >
                  {modData.allFiles.map(ver => (
                    <Select.Option
                      key={ver.fileNameOnDisk}
                      value={ver.fileNameOnDisk}
                    >
                      {ver.fileNameOnDisk}
                    </Select.Option>
                  ))}
                </Select>
                <br />
                <Button
                  type="primary"
                  onClick={() =>
                    installMod(modData.id, modData.allFiles.find(
                      v => v.fileNameOnDisk === selectedModVersion
                    ).id, modData.allFiles.find(
                      v => v.fileNameOnDisk === selectedModVersion
                    ).fileNameOnDisk
                    )
                  }
                  loading={isInstalling(selectedModVersion)}
                  disabled={isDownloadCompleted(selectedModVersion)}
                  style={{ display: 'block', margin: '0 auto' }}
                >
                  {isInstalling(selectedModVersion)
                    ? 'Installing'
                    : isDownloadCompleted(selectedModVersion)
                      ? 'Installed'
                      : 'Install Selected Mod'}
                </Button>
              </div>
            </div>
            <h2 style={{ textAlign: 'center' }}>Description</h2>
            <div className={styles.modDescription}>
              <span
                dangerouslySetInnerHTML={{
                  __html: modData.fullDescription
                }}
              />
            </div>
          </div>
        )}
    </div>
  );
}

function mapStateToProps(state) {
  return {};
}

export default connect(mapStateToProps)(ModPage);
