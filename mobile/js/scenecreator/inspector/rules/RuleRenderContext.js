import { useCardCreator } from '../../CreateCardContext';
import { getCoreStateCache } from '../../../core/CoreEvents';

/**
 *  Consolidates the various data sources needed to render rules.
 */
export const getRuleRenderContext = () => {
  let createCardContext = useCardCreator();
  const { deck } = createCardContext;

  // NOTE: we could convert these to `useCoreState` if we want to re-render when the data changes,
  // but in these cases we either expect to produce renders for more specific reasons, or we
  // expect the data not to change.
  const variables = getCoreStateCache('EDITOR_VARIABLES')?.variables;
  const behaviors = getCoreStateCache('EDITOR_ALL_BEHAVIORS');
  const library = getCoreStateCache('EDITOR_LIBRARY')?.library;
  const rules = getCoreStateCache('EDITOR_RULES_DATA') ?? {};

  return {
    deck,
    variables,
    behaviors,
    library,
    ...rules,
  };
};
