// @flow
import React, { Component } from 'react';
import { remote } from 'electron';
import styles from './WindowMinimizeButton.css';

type Props = {};
export default class WindowMinimizeButton extends Component<Props> {
  props: Props;

  MinMaxWindow = () => {
    const w = remote.getCurrentWindow();
    if (w.isMaximized()) {
      w.unmaximize();
    } else if (w.isMaximizable()) {
      w.maximize();
    }
  };

  render() {
    return (
      <div>
        <button className={styles.CloseBtn} onClick={this.MinMaxWindow}>
          <i className="fas fa-window-maximize" style={{ width: '20px', height: '20px' }} />
        </button>
      </div>
    );
  }
}