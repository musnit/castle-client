import { Amplitude } from '@amplitude/react-native';
import { gql } from '@apollo/client';
import { CastleAsyncStorage } from './CastleAsyncStorage';

import { apolloClient } from '../Session';

let gUserProperties = null;

async function getUserPropertiesAsync() {
  if (gUserProperties) {
    return gUserProperties;
  }

  let asyncStorageResponse = await CastleAsyncStorage.getItem('ANALYTICS_USER_PROPERTIES');
  if (asyncStorageResponse) {
    try {
      gUserProperties = JSON.parse(asyncStorageResponse);
    } catch (e) {
      console.error(`error reading analytics user properties from async storage ${e}`);
      gUserProperties = {};
    }
  } else {
    gUserProperties = {};
  }

  return gUserProperties;
}

export const logEvent = async (event, properties = {}) => {
  Amplitude.getInstance().logEvent(event, properties);

  try {
    let userProperties = await getUserPropertiesAsync();
    apolloClient.mutate({
      mutation: gql`
      mutation LogEvent($event: String!, $properties: String) {
        analyticsLogEvent(event: $event, properties: $properties)
      }
    `,
      variables: { event, properties: JSON.stringify({
        ...userProperties,
        ...properties,
      }) },
    });
  } catch (e) {
    console.error(`error logging event: ${e}`);
  }
};

export const logEventSkipAmplitude = async (event, properties = {}) => {
  try {
    let userProperties = await getUserPropertiesAsync();
    apolloClient.mutate({
      mutation: gql`
      mutation LogEvent($event: String!, $properties: String) {
        analyticsLogEvent(event: $event, properties: $properties)
      }
    `,
      variables: { event, properties: JSON.stringify({
        ...userProperties,
        ...properties,
      }) },
    });
  } catch (e) {
    console.error(`error logging event: ${e}`);
  }
};

export const setUserProperties = async (properties = {}) => {
  Amplitude.getInstance().setUserProperties(properties);

  try {
    let userProperties = await getUserPropertiesAsync();
    gUserProperties = {
      ...userProperties,
      ...properties,
    };
    await CastleAsyncStorage.setItem('ANALYTICS_USER_PROPERTIES', JSON.stringify(gUserProperties));
  } catch (e) {
    console.error(`error setting user properties: ${e}`);
  }
};

export const setUserId = (...args) => {
  Amplitude.getInstance().setUserId(...args);
}

export const clearUserProperties = async (...args) => {
  Amplitude.getInstance().clearUserProperties(...args);

  try {
    gUserProperties = {};
    await CastleAsyncStorage.setItem('ANALYTICS_USER_PROPERTIES', JSON.stringify({}));
  } catch (e) {
    console.error(`error clearing user properties: ${e}`);
  }
}
