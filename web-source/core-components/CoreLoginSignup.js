import React from 'react';
import { css } from 'react-emotion';

import * as Actions from '~/common/actions';
import * as Constants from '~/common/constants';
import * as Strings from '~/common/strings';

import UIInput from '~/core-components/reusable/UIInput';
import UIButton from '~/core-components/reusable/UIButton';
import UIHeadingGroup from '~/core-components/reusable/UIHeadingGroup';
import UILink from '~/core-components/reusable/UILink';

const STYLES_CONTAINER = css`
  @keyframes authentication-animation {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  animation: authentication-animation 280ms ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background ${Constants.colors.background};
  color: ${Constants.colors.white};

  ::-webkit-scrollbar {
    display: none;
    width: 1px;
  }
`;

const STYLES_CONTENTS = css`
  padding: 16px;
  box-sizing: border-box;
  width: 100%;
  max-width: 320px;
`;

const STYLES_FOOTER = css`
  color: ${Constants.colors.white80};
  font-size: 12px;
  font-weight: 400;
  line-height: 1.5;
  margin-top: 24px;
`;

const STYLES_ERROR_MESSAGE = css`
  padding-bottom: 8px;
  height: 24px;
  color: ${Constants.colors.red};
`;

export default class CoreLoginSignup extends React.Component {
  // states:
  //  WHO - input who you are
  //  PASSWORD - put in your password
  //  SIGNUP - create an account
  static defaultProps = {
    onLogin: () => {},
  };

  state = {
    who: '',
    password: '',
    email: '',
    name: '',
    username: '',
    s: 'WHO',

    whoSubmitEnabled: true,
    passwordSubmitEnabled: true,
    signupSubmitEnabled: true,

    // NOTE(jim): This user is the actual authenticated user
    loggedInUser: null,

    // NOTE(jim): This is the suggested user.
    loginUser: null,
  };

  _goToSignup = () => {
    let s = {
      s: 'SIGNUP',
      signupSubmitEnabled: true,
    };

    let who = this.state.who;
    if (who && who.indexOf(' ') !== -1) {
      s.name = who;
    } else if (who && who.indexOf('@') !== -1) {
      s.email = who;
    } else if (who) {
      s.username = who;
    }
    this.setState(s);
  };

  _goToPassword = () => {
    this.setState({
      s: 'PASSWORD',
      passwordSubmitEnabled: true,
      loginError: null,
    });
  };

  _goToWho = () => {
    this.setState({
      s: 'WHO',
      whoSubmitEnabled: true,
    });
  };

  _goToSuccess = () => {
    this.setState({ s: 'SUCCESS' }, () => {
      this.props.onLogin(this.state.loggedInUser);
    });
  };

  render() {
    switch (this.state.s) {
      case 'WHO':
        return this._renderWho();
      case 'PASSWORD':
        return this._renderPassword();
      case 'SIGNUP':
        return this._renderSignup();
      case 'SUCCESS':
        return this._renderSuccess();
      default:
        this.setState({ s: 'WHO' });
        return this._renderWho();
    }
  }

  _handleLoginAsync = async e => {
    e.preventDefault();

    if (!this.state.passwordSubmitEnabled) {
      return;
    }

    this.setState({ passwordSubmitEnabled: false });

    const user = await Actions.login({
      userId: this.state.loginUser.userId,
      password: this.state.password,
    });

    if (!user) {
      return;
    }

    if (user.errors) {
      if (user.errors.length > 0) {
        this.setState({
          passwordSubmitEnabled: true,
          loginError: user.errors[0].message,
        });
      }

      return;
    }

    this.setState({ loggedInUser: user }, this._goToSuccess);
  };

  _handleSubmitEmailAsync = async e => {
    e.preventDefault();

    if (!this.state.whoSubmitEnabled) {
      return;
    }

    this.setState({ whoSubmitEnabled: false });
    const user = await Actions.getExistingUser({ who: this.state.who });

    if (user) {
      this.setState({
        loginUser: user,
      });
      this._goToPassword();

      return;
    }

    this._goToSignup();
  };

  _handleSignUpAsync = async e => {
    e.preventDefault();

    if (!this.state.signupSubmitEnabled) {
      return;
    }

    this.setState({ signupSubmitEnabled: false });

    const loggedInUser = await Actions.signup({
      name: this.state.name,
      username: this.state.username,
      email: this.state.email,
      password: this.state.password,
    });

    if (loggedInUser) {
      this.setState({ loggedInUser }, this._goToSuccess);
    }
  };

  _handleChange = e => this.setState({ [e.target.name]: e.target.value });

  // TODO(jim): The user won't even see this because authentication takes them to
  // another scene almost immediately.
  _renderSuccess = () => {
    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_CONTENTS}>
          <UIHeadingGroup title="Successfully signed in">
            {this.state.loggedInUser.name}
            <br />
            <br />
            {'@' + this.state.loggedInUser.username}
          </UIHeadingGroup>
        </div>
      </div>
    );
  };

  _renderPassword = () => {
    let imgSrc = Constants.TRANSPARENT_GIF_DATA_URL;

    // TODO(jim): How reliable is this? Where does imgixURL come from?
    if (this.state.loginUser && this.state.loginUser.photo && this.state.loginUser.photo.imgixUrl) {
      imgSrc = this.state.loginUser.photo.imgixUrl;
    }

    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_CONTENTS}>
          <form onSubmit={this._handleLoginAsync}>
            <UIHeadingGroup title="Sign in">
              <h3>{this.state.loginUser.name}</h3>
              <h5>{'@' + this.state.loginUser.username}</h5>
            </UIHeadingGroup>
            {!Strings.isEmpty(this.state.loginError) ? (
              <h5 className={STYLES_ERROR_MESSAGE}>{this.state.loginError}</h5>
            ) : null}
            <UIInput
              key="login-password"
              autoFocus={true}
              label="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              onChange={this._handleChange}
              value={this.state.password}
            />
            <UIButton onClick={this._handleLoginAsync}>Sign in</UIButton>
          </form>

          <div className={STYLES_FOOTER}>
            Not {this.state.loginUser.name || '@' + this.state.loginUser.username}?{' '}
            <UILink onClick={this._goToWho}>Sign in as someone else</UILink> or{' '}
            <UILink onClick={this._goToSignup}>Create a new account</UILink>
          </div>

          <div className={STYLES_FOOTER}>
            Forgot your password?
            <UILink
              onClick={event => {
                event.preventDefault();
                alert('Not implemented yet! :( E-mail ccheever@expo.io to get it reset');
              }}>
              &nbsp;Reset it
            </UILink>
          </div>
        </div>
      </div>
    );
  };

  _renderSignup = () => {
    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_CONTENTS}>
          <form onSubmit={this._handleSignUpAsync}>
            <UIHeadingGroup title="Create a Castle account" />
            <UIInput
              autoFocus
              label="username"
              name="username"
              placeholder="Username"
              onChange={this._handleChange}
              value={this.state.username}
            />
            <UIInput
              label="name"
              name="name"
              type="text"
              placeholder="Your name"
              onChange={this._handleChange}
              value={this.state.name}
            />
            <UIInput
              label="email"
              name="email"
              type="email"
              noValidate
              placeholder="E-mail address"
              onChange={this._handleChange}
              value={this.state.email}
            />

            <UIInput
              label="password"
              name="password"
              type="password"
              placeholder="New password"
              onChange={this._handleChange}
              value={this.state.password}
            />
            <UIButton onClick={this._handleSignUpAsync}>Create Account</UIButton>
          </form>

          <div className={STYLES_FOOTER}>
            Already have an account? <UILink onClick={this._goToWho}>Sign in</UILink> instead.
          </div>
        </div>
      </div>
    );
  };

  _renderWho = () => {
    return (
      <div className={STYLES_CONTAINER}>
        <div className={STYLES_CONTENTS}>
          <form onSubmit={this._handleSubmitEmailAsync}>
            <UIHeadingGroup title="Sign in or create account">
              Sign in to create playlists and share art and games you've made with everyone on
              Castle.
            </UIHeadingGroup>
            <UIInput
              value=""
              autoFocus
              label="Search"
              name="who"
              placeholder="E-mail or username"
              onChange={this._handleChange}
              value={this.state.who}
            />
            <UIButton
              type="submit"
              onFocus={this._handleSubmitEmailAsync}
              onClick={this._handleSubmitEmailAsync}>
              Continue
            </UIButton>
            <div className={STYLES_FOOTER}>
              Don't worry, we will help you find your account or create a new one if you can't
              remember.
            </div>
          </form>
        </div>
      </div>
    );
  };
}
