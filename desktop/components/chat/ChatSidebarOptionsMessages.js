import * as React from 'react';
import * as Constants from '~/common/constants';
import * as SVG from '~/common/svg';

import { css } from 'react-emotion';

const STYLES_HEADER = css`
  border-bottom: 1px solid ${Constants.REFACTOR_COLORS.elements.border};
  color: ${Constants.REFACTOR_COLORS.text};
  font-family: ${Constants.REFACTOR_FONTS.system};
  width: 100%;
  flex-shrink: 0;
  padding: 8px 8px 8px 8px;
  margin-bottom: 24px;
  overflow: hidden;
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const STYLES_HEADER_LEFT = css`
  min-width: 25%;
  width: 100%;
`;

const STYLES_HEADER_RIGHT = css`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 200ms ease color;
  padding: 8px;

  :hover {
    color: magenta;
  }
`;

const STYLES_OPTION = css`
  font-family: ${Constants.REFACTOR_FONTS.system};
  user-select: none;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
  text-align: right;
  padding: 0 16px 0 16px;
  width: 100%;
  cursor: pointer;
  transition: color 200ms ease;

  :hover {
    color: magenta;
  }
`;

export default class ChatSidebarOptionsMessages extends React.Component {
  render() {
    return (
      <React.Fragment>
        <header className={STYLES_HEADER}>
          <div className={STYLES_HEADER_LEFT} />
          <div className={STYLES_HEADER_RIGHT} onClick={this.props.onDismiss}>
            <SVG.Dismiss size="16px" />
          </div>
        </header>
        {this.props.viewer ? (
          <div className={STYLES_OPTION} onClick={this.props.onStartDirectMessage}>
            Message a user
          </div>
        ) : null}
      </React.Fragment>
    );
  }
}
