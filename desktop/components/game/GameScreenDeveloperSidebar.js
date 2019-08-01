import * as React from 'react';

import { css } from 'react-emotion';
import { DevelopmentContext } from '~/contexts/DevelopmentContext';

import DevelopmentLogs from '~/components/game/DevelopmentLogs';

const BORDER_COLOR = '#333';
const BACKGROUND_COLOR = '#000';

const STYLES_CONTAINER = css`
  width: 100%;
  height: 100%;
  border-left: 1px solid ${BORDER_COLOR};
  background: ${BACKGROUND_COLOR};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: column;
`;

const STYLES_INFO_HEADING = css`
  width: 100%;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 16px 16px;
  flex-shrink: 0;
  border-bottom: 1px solid ${BORDER_COLOR};
  color: #fff;
`;

const STYLES_SECTION = css`
  position: relative;
  width: 100%;
  height: 24px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 0 16px;
  flex-shrink: 0;
  border-bottom: 1px solid ${BORDER_COLOR};
`;

const STYLES_TOP = css`
  min-height: 10%;
  height: 100%;
  width: 100%;
  overflow-y: scroll;
  display: block;
  background-color: #000000;
  background-image: linear-gradient(90deg, #000000 0%, #181818 74%);

  ::-webkit-scrollbar {
    width: 0px;
  }
`;

const STYLES_BOTTOM = css`
  border-top: 1px solid ${BORDER_COLOR};
  width: 100%;
  overflow-y: scroll;
  position: relative;
  display: block;
  background-color: #000000;
  background-image: linear-gradient(90deg, #000000 0%, #181818 74%);

  ::-webkit-scrollbar {
    width: 0px;
  }
`;

const STYLES_LEFT = css`
  flex-shrink: 0;
  min-width: 200px;
`;

const STYLES_RIGHT = css`
  flex-shrink: 0;
  min-width: 200px;
  text-align: right;
`;

const STYLES_DRAGGABLE_SECTION_HORIZONTAL = css`
  width: 100%;
  height: 12px;
  position: absolute;
  right: 0;
  top: -6px;
  left: 0;
  cursor: grab;
  z-index: 1;
  user-select; none;
`;

const MIN_SIZE = 88;

export default class GameScreenDeveloperSidebar extends React.Component {
  static contextType = DevelopmentContext;

  state = {
    server: 360 + 4,
  };

  componentDidMount() {
    window.addEventListener('mouseup', this._handleMouseUp);
    window.addEventListener('mousemove', this._handleMouseMove);
  }

  componentWillUnmount() {
    window.removeEventListener('mouseup', this._handleMouseUp);
    window.removeEventListener('mousemove', this._handleMouseMove);
  }

  _handleMouseDown = (e, resizing) => {
    e.preventDefault();
    this.setState({ resizing, mouseY: e.pageY, start: this.state[resizing] });
  };

  _handleMouseMove = (e) => {
    if (!this.state.resizing) {
      return;
    }

    let nextHeight;

    if (this.state.resizing === 'server') {
      nextHeight = this.state.start - (e.pageY - this.state.mouseY);
    }

    if (nextHeight < MIN_SIZE) {
      nextHeight = MIN_SIZE;
    }

    this.setState({ [this.state.resizing]: nextHeight });
  };

  _handleMouseUp = (e) => {
    if (this.state.resizing) {
      this.setState({ resizing: null, mouseY: null, start: null });
    }
  };

  render() {
    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_INFO_HEADING}>
          <span>Project URL</span> <span>{`{PROJECT_URL_BINDING}`}</span>
        </div>

        <div className={STYLES_SECTION}>
          <div className={STYLES_LEFT}>&nbsp;</div>
          <div className={STYLES_RIGHT} style={{ minWidth: 100 }}>
            &nbsp;
          </div>
        </div>

        <div className={STYLES_TOP}>
          <DevelopmentLogs
            logs={this.context.logs}
            onClearLogs={this.context.setters.clearLogs}
            game={this.props.game}
          />
        </div>

        <div
          className={STYLES_SECTION}
          style={{
            borderTop: `1px solid ${BORDER_COLOR}`,
            borderBottom: 0,
          }}>
          <div
            className={STYLES_DRAGGABLE_SECTION_HORIZONTAL}
            onMouseDown={(e) => this._handleMouseDown(e, 'server')}
          />
          <div className={STYLES_LEFT}>&nbsp;</div>
          <div className={STYLES_RIGHT} style={{ minWidth: 100 }}>
            &nbsp;
          </div>
        </div>

        <div className={STYLES_BOTTOM} style={{ height: this.state.server }}>
          &nbsp;
        </div>
      </div>
    );
  }
}
