import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSession } from '../Session';

import * as Constants from '../Constants';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    padding: 16,
    maxWidth: Constants.TABLET_MAX_FORM_WIDTH,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Constants.colors.white,
  },
  retryButton: {
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: Constants.colors.white,
    borderRadius: 4,
    padding: 8,
    alignItems: 'center',
    marginTop: 16,
  },
});

/**
 *  This screen is shown if we can't find an auth token when the app boots.
 *  It attempts to create an anonymous user account and saves an auth token for that account.
 *  Once Session has a token, the app automatically navigates to the signed-in state.
 */
export const InitialAuthScreen = () => {
  const [error, setError] = React.useState(null);
  const { signInAsAnonymousUserAsync } = useSession();

  const createAnonUser = React.useCallback(async () => {
    try {
      const user = await signInAsAnonymousUserAsync();
    } catch (e) {
      console.warn(`Failed to create anon user: ${e}`);
      setError(
        `We had a problem launching Castle. Please double check your connection and try again.`
      );
    }
  }, [signInAsAnonymousUserAsync]);

  // attempt to create an anon user immediately when mounted
  React.useEffect(() => {
    createAnonUser();
  }, []);

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={createAnonUser}>
            <Text style={styles.errorText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};
