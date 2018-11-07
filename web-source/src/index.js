import ReactDOM from 'react-dom';

import * as React from 'react';
import * as Constants from '~/common/constants';
import * as Network from '~/common/network';
import * as Actions from '~/common/actions';

import App from './App';

import Storage from '~/common/storage';

import { LOADER_STRING, injectGlobalLoaderStyles } from '~/core-components/primitives/loader';
import { injectGlobal } from 'react-emotion';

const injectGlobalStyles = () => injectGlobal`
  html, body, div, span, applet, object, iframe,
  h1, h2, h3, h4, h5, h6, p, blockquote, pre,
  a, abbr, acronym, address, big, cite, code,
  del, dfn, em, img, ins, kbd, q, s, samp,
  small, strike, strong, sub, sup, tt, var,
  b, u, i, center,
  dl, dt, dd, ol, ul, li,
  fieldset, form, label, legend,
  table, caption, tbody, tfoot, thead, tr, th, td,
  article, aside, canvas, details, embed,
  figure, figcaption, footer, header, hgroup,
  menu, nav, output, ruby, section, summary,
  time, mark, audio, video {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0;
    vertical-align: baseline;
  }

  article, aside, details, figcaption, figure,
  footer, header, hgroup, menu, nav, section {
    display: block;
  }

  html, body {
    font-family: ${Constants.font.default};
    background: ${Constants.colors.black};
    font-size: 16px;
  }
`;

const storage = new Storage('castle');

const loader = document.createElement('div');
loader.innerHTML = LOADER_STRING.trim();
loader.id = 'loader';

document.body.appendChild(loader);

const INITIAL_STATE_OFFLINE = {
  logs: [],
  mediaUrl: '',
  playlist: null,
  media: null,
  mediaLoading: false,
  creator: null,
  viewer: null,
  local: null,
  searchQuery: '',
  allMedia: [],
  allPlaylists: [],
  allMediaFiltered: [],
  allPlaylistsFiltered: [],
  featuredPlaylists: [],
  featuredMedia: [],
  sidebarMode: 'current-context', // current-context | media-info | development
  sidebarVisible: true,
  pageMode: null, // browse | playlist | profile | sign-in | null
  isMediaFavorited: false,
  isMediaExpanded: false,
  isOverlayActive: true,
  isHorizontalOrientation: false,
  isOffline: true,
};

const run = async () => {
  const {
    featuredMedia,
    featuredPlaylists,
    allMedia,
    allPlaylists,
    viewer,
    isOffline,
  } = await Network.getProductData();

  await Actions.delay(300);

  document.getElementById('loader').classList.add('loader--finished');

  const state = Object.assign({}, INITIAL_STATE_OFFLINE, {
    allMedia,
    allPlaylists,
    allMediaFiltered: [...allMedia],
    allPlaylistsFiltered: [...allPlaylists],
    featuredPlaylists,
    featuredMedia,
    isOffline,
    viewer,
    sidebarVisible: !isOffline,
    pageMode: !isOffline ? 'browse' : null,
  });

  ReactDOM.render(<App state={state} storage={storage} />, document.getElementById('root'));

  await Actions.delay(300);

  document.getElementById('loader').outerHTML = '';
};

injectGlobalStyles();
injectGlobalLoaderStyles();
run();
