import { Amplitude } from '@amplitude/react-native';
import { gql } from '@apollo/client';

import { apolloClient } from '../Session';

export const logEvent = (event, properties) => {
  Amplitude.getInstance().logEvent(event, properties);

  try {
    apolloClient.mutate({
      mutation: gql`
      mutation LogEvent($event: String!, $properties: String) {
        analyticsLogEvent(event: $event, properties: $properties)
      }
    `,
      variables: { event, properties: properties ? JSON.stringify(properties) : null },
    });
  } catch (e) {
    console.error(`error logging event: ${e}`);
  }
};

export const setUserProperties = (...args) => {
  Amplitude.getInstance().setUserProperties(...args);
};

export const setUserId = (...args) => {
  Amplitude.getInstance().setUserId(...args);
}

export const clearUserProperties = (...args) => {
  Amplitude.getInstance().clearUserProperties(...args);
}
