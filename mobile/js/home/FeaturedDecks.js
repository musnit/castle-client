import React from 'react';
import { AppUpdateNotice } from '../components/AppUpdateNotice';
import { NativeDecksFeed } from '../components/NativeDecksFeed';

export const FeaturedDecks = (props) => (
  <>
    <NativeDecksFeed {...props} screenId="featuredFeed" amplitudeScreenName="featured" />
    <AppUpdateNotice />
  </>
);
