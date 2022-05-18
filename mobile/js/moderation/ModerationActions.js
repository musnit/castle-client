import { apolloClient } from '../Session';
import { gql } from '@apollo/client';

export const DECK_REPORT_REASONS = [
  {
    id: 'offensive',
    label: `It's offensive or rude`,
  },
  {
    id: 'spam',
    label: 'It is spam',
  },
  {
    id: 'clone',
    label: `It's an unfair clone`,
  },
  {
    id: 'harrassment',
    label: 'It bullies someone',
  },
  {
    id: 'violence',
    label: 'It encourages violence',
  },
  {
    id: 'self-harm',
    label: 'It encourages self-harm',
  },
  {
    id: 'other',
    label: 'Other reason',
  },
];

export const blockUser = async (userId, isBlocked) => {
  const result = await apolloClient.mutate({
    mutation: gql`
      mutation ($userId: ID!, $isBlocked: Boolean!) {
        blockUser(userId: $userId, isBlocked: $isBlocked) {
          userId
          isBlocked
        }
      }
    `,
    variables: { userId, isBlocked },
  });
  return result?.data?.blockUser;
};

export const reportDeck = async ({ deckId, reason }) => {
  const result = await apolloClient.mutate({
    mutation: gql`
      mutation ($deckId: ID!, $reason: String) {
        reportDeck(deckId: $deckId, reason: $reason) {
          deckId
        }
      }
    `,
    variables: { deckId, reason },
  });
  return result?.data?.reportDeck;
};
