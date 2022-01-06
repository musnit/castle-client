import * as React from 'react';
import { SAMPLE_COMPONENTS } from '../../sound/components/Sample';
import { sendAsync } from '../../../core/CoreEvents';

export const PlaySoundResponse = ({ response, onChangeResponse, children, ...props }) => {
  const onChangeParams = React.useCallback(
    (params) => {
      onChangeResponse({
        ...response,
        params,
      });
      if (params.type === 'sfxr') {
        // play sound any time sfxr params change, but don't autoplay for other types
        sendAsync('EDITOR_CHANGE_SOUND', params);
      }
    },
    [onChangeResponse]
  );
  const soundType = response.params?.type ?? 'sfxr';
  const SoundComponent = SAMPLE_COMPONENTS[soundType];

  return (
    <>
      {children}
      {SoundComponent ? (
        <SoundComponent onChangeParams={onChangeParams} params={response.params} {...props} />
      ) : null}
    </>
  );
};
