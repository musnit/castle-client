import * as React from 'react';
import * as CEF from '~/common/cef';
import * as Constants from '~/common/constants';
import * as SVG from '~/core-components/primitives/svg';
import Logs from '~/common/logs';
import shuffle from 'lodash.shuffle';
import { css } from 'react-emotion';

import UIButtonIconHorizontal from '~/core-components/reusable/UIButtonIconHorizontal';
import UIControl from '~/core-components/reusable/UIControl';
import UIGridMedia from '~/core-components/reusable/UIGridMedia';

const MAX_NUM_FEATURED_MEDIA = 6;

const STYLES_CONTAINER = css`
  width: 100%;
  height: 100%;
`;

const STYLES_FOOTER = css`
  width: 100%;
  display: flex;
  justify-content: space-between;
  border-top: 1px solid ${Constants.colors.border};
`;

const STYLES_FOOTER_CONTENT = css`
  margin: 16px 32px 16px 0;
  cursor: pointer;
`;

const STYLES_TITLE = css`
  font-family: ${Constants.font.default};
  color: ${Constants.colors.white};
  font-size: 24px;
  font-weight: 400;
  display: flex;
  align-items: center;
`;

const STYLES_HEADING = css`
  color: ${Constants.colors.white};
  font-size: 18px;
  font-weight: 600;
`;

const STYLES_SUB_PARAGRAPH = css`
  color: ${Constants.colors.white};
  font-size: 14px;
  margin-top: 8px;
  line-height: 1.725;
`;

const STYLES_PARAGRAPH = css`
  color: ${Constants.colors.white};
  font-size: 14px;
  margin-top: 16px;
  line-height: 1.725;
`;

const STYLES_BUTTON_CONTAINER = css`
  margin-top: 24px;
`;

const STYLES_ACTIONS = css`
  display: flex;
  flex-wrap: wrap;
  max-width: 1000px;
`;

const STYLES_ACTION = css`
  max-width: 400px;
  margin-right: 16px;
`;

const STYLES_OPTION = css`
  color: ${Constants.colors.white60};
  border-bottom: 1px solid ${Constants.colors.border};
  font-size: 12px;
  font-weight: 600;
  padding: 16px 0 16px 0;
  transition: 200ms ease color;
  display: flex;
  align-items: center;
  :hover {
    cursor: pointer;
    color: ${Constants.colors.white};
  }
`;

const STYLES_SECTION = css`
  padding: 16px 16px 32px 16px;
`;

const STYLES_MEDIA = css`
  padding: 16px 0 0 0;
`;

export default class CoreWelcomeScreen extends React.Component {
  static defaultProps = {
    featuredMedia: [],
  };

  _handleClickTutorial = () => {
    CEF.openExternalURL('http://www.playcastle.io/get-started');
  };

  _handleClickCreateProjectAsync = async () => {
    const newProjectDirectory = await CEF.chooseDirectoryWithDialogAsync({
      title: 'Create a New Castle Project',
      message: 'Choose a folder where the project will be created.',
      action: 'Create Project',
    });
    if (newProjectDirectory) {
      let entryPointFilePath;
      try {
        entryPointFilePath = await CEF.createProjectAtPathAsync(newProjectDirectory);
      } catch (_) {}
      if (entryPointFilePath) {
        const mediaUrl = `file://${entryPointFilePath}`;
        this.props.onMediaSelect({ mediaUrl });
        Logs.system('Welcome to Castle!');
        Logs.system(`We created some starter code for your project at ${entryPointFilePath}.`);
        Logs.system(`Open that file in your favorite text editor to get started.`);
        Logs.system(`Need help? Check out http://www.playcastle.io/get-started`);
      }
    }
  };

  _handleClickFooter = () => {
    CEF.openExternalURL('http://www.playcastle.io');
  };

  _getFeaturedMedia = () => {
    const { featuredMedia } = this.props;
    let result;
    if (featuredMedia) {
      result = shuffle(featuredMedia);
      if (result.length > MAX_NUM_FEATURED_MEDIA) {
        result = result.slice(0, MAX_NUM_FEATURED_MEDIA);
      }
    }
    return result;
  }

  render() {
    const featuredMedia = this._getFeaturedMedia();
    const externalIcon = (<SVG.Share height="16px" />);
    const createIcon = (<SVG.Play height="16px" />);

    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_SECTION}>
          <div className={STYLES_HEADING}>Play Games</div>
          <div className={STYLES_MEDIA}>
            <UIGridMedia
              mediaItems={featuredMedia}
              onUserSelect={this.props.onUserSelect}
              onMediaSelect={this.props.onMediaSelect}
            />
          </div>
        </div>
        <div className={STYLES_SECTION}>
          <div className={STYLES_HEADING}>Make a Game</div>
          <div className={STYLES_ACTIONS}>
            <div className={STYLES_ACTION}>
              <p className={STYLES_PARAGRAPH}>
                Click this button to create a new minimal Castle project and start tinkering.
              </p>
              <div className={STYLES_BUTTON_CONTAINER}>
                <UIButtonIconHorizontal
                  onClick={this._handleClickCreateProjectAsync}
                  icon={createIcon}>
                  Create a Castle Project
                </UIButtonIconHorizontal>
              </div>
            </div>
            <div className={STYLES_ACTION}>
              <p className={STYLES_PARAGRAPH}>
                Check out our tutorial to get started making your own game or interactive media with Castle.
              </p>
              <div className={STYLES_BUTTON_CONTAINER}>
                <UIButtonIconHorizontal
                  onClick={this._handleClickTutorial}
                  icon={externalIcon}>
                  Open Tutorial
                </UIButtonIconHorizontal>
              </div>
            </div>
          </div>
        </div>
        <div className={STYLES_FOOTER}>
          <div />
          <div className={STYLES_FOOTER_CONTENT} onClick={this._handleClickFooter}>
            <img height="24px" src="static/castle-wordmark.png" />
          </div>
        </div>
      </div>
    );
  }
}
