import { apolloClient } from '../Session';
import { gql } from '@apollo/client';

export const getNextCreateAccountScreen = ({ coppaStatus }) => {
  switch (coppaStatus) {
    case 'over_13':
    case 'under_13_parent_accepted':
      return 'CreateAccountScreen';
    case 'new_user':
    case 'under_13_lied_in_signup':
      return 'ChooseBirthdayScreen';
    case 'under_13_pending_parent_information':
      return 'RequestParentConsentScreen';
    case 'under_13_pending_parent_decision':
      return 'PendingParentConsentScreen';
    case 'under_13_parent_rejected':
    case 'aged_up_pending_terms':
    default:
      throw new Error('unimplemented');
  }
};

export const setBirthday = async (birthday) => {
  const result = await apolloClient.mutate({
    mutation: gql`
      mutation ($birthday: Datetime!) {
        setBirthday(birthday: $birthday) {
          userId
          coppaStatus
          isUnder13
        }
      }
    `,
    variables: { birthday },
  });
  return result.data?.setBirthday;
};

export const setParentInfo = async ({ childName, parentEmail }) => {
  const result = await apolloClient.mutate({
    mutation: gql`
      mutation ($childName: String!, $parentEmail: String!) {
        setParentInfo(childName: $childName, parentEmail: $parentEmail)
      }
    `,
    variables: { childName, parentEmail },
  });
  // TODO: query coppa status from server
  return {
    coppaStatus: `under_13_pending_parent_decision`,
    isUnder13: true,
  };
};
