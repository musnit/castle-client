import * as React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { InspectorNumberInput } from '../components/InspectorNumberInput';
import { InspectorTextInput } from '../components/InspectorTextInput';
import { InspectorInlineExpressionInput } from '../expressions/InspectorInlineExpressionInput';
import { ConfigureExpressionSheet } from '../expressions/ConfigureExpressionSheet';
import { sendAsync } from '../../../core/CoreEvents';

import * as Constants from '../../../Constants';
import * as SceneCreatorConstants from '../../SceneCreatorConstants';

import Entypo from 'react-native-vector-icons/Entypo';
import Feather from 'react-native-vector-icons/Feather';

import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Permissions from 'react-native-permissions';
import DocumentPicker from 'react-native-document-picker';

import { uploadAudioFile } from '../../../Session';

const audioRecorderPlayer = new AudioRecorderPlayer();
const RECORD_MAX_MS = 10000;

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    flexDirection: 'row',
    borderRadius: 6,
  },
  playButtonContainer: {
    paddingLeft: 4,
    paddingRight: 12,
    width: 72,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    borderWidth: 1,
    borderColor: Constants.colors.black,
    width: '100%',
    aspectRatio: 1,
    borderRadius: 128,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    ...Constants.styles.dropShadow,
  },
  controls: {
    alignItems: 'flex-start',
  },
  soundInputsRow: {
    flexDirection: 'row',
    flexShrink: 1,
    flexGrow: 0,
  },
  shuffleButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 4,
    borderColor: Constants.colors.black,
    borderWidth: 1,
    backgroundColor: '#fff',
    ...Constants.styles.dropShadow,
    marginBottom: 8,
  },
  segmentedControlItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    borderColor: Constants.colors.black,
    fontSize: 15,
  },
  segmentedControlItemSelected: {
    backgroundColor: Constants.colors.black,
  },
  segmentedControlLabelSelected: {
    color: Constants.colors.white,
    fontWeight: 'bold',
  },
  soundInputsRandomize: {
    fontSize: 15,
    marginTop: 2,
  },
  soundInputsLabel: {
    marginTop: 6,
    marginBottom: 2,
  },
  recordButton: {
    width: 100,
    height: 50,
    marginRight: 20,
    backgroundColor: '#ccc',
  },
});

export const SOUND_CATEGORIES = [
  {
    name: 'pickup',
    icon: 'umbrella',
  },
  {
    name: 'laser',
    icon: 'activity',
  },
  {
    name: 'explosion',
    icon: 'loader',
  },
  {
    name: 'powerup',
    icon: 'key',
  },
  {
    name: 'hit',
    icon: 'shield',
  },
  {
    name: 'jump',
    icon: 'coffee',
  },
  {
    name: 'blip',
    icon: 'paperclip',
  },
  {
    name: 'random',
    icon: 'gift',
  },
];

const SoundEffect = ({ onChangeSound, response, onChangeResponse, children, ...props }) => {
  const [lastNativeUpdate, incrementLastNativeUpdate] = React.useReducer((state) => state + 1, 0);
  React.useEffect(incrementLastNativeUpdate, [response.params]);

  const onChangeCategory = (index) =>
    onChangeSound({
      ...response,
      params: {
        ...response.params,
        category: SOUND_CATEGORIES[index].name,
      },
    });
  const onChangeSeed = (seed) =>
    onChangeSound({
      ...response,
      params: {
        ...response.params,
        seed,
      },
    });
  const onChangeMutation = (mutationSeed) =>
    onChangeSound({
      ...response,
      params: {
        ...response.params,
        mutationSeed,
      },
    });
  const selectedCategoryIndex = response.params?.category
    ? SOUND_CATEGORIES.findIndex((c) => c.name === response.params.category)
    : 0;

  return (
    <View style={[SceneCreatorConstants.styles.button, styles.container]}>
      <View style={styles.playButtonContainer}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => sendAsync('EDITOR_CHANGE_SOUND', response.params)}>
          <Entypo
            name="controller-play"
            size={36}
            color="#000"
            style={{ marginLeft: 6, marginTop: 3 }}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.controls}>
        <View style={styles.segmentedControl}>
          {SOUND_CATEGORIES.map((category, ii) => (
            <TouchableOpacity
              key={`item-${ii}`}
              onPress={() => onChangeCategory(ii)}
              style={[
                styles.segmentedControlItem,
                ii === selectedCategoryIndex ? styles.segmentedControlItemSelected : null,
                ii > 0 ? { borderLeftWidth: 1 } : null,
              ]}>
              <Feather
                name={category.icon}
                style={[
                  styles.segmentedControlItem,
                  ii === selectedCategoryIndex ? styles.segmentedControlLabelSelected : null,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.soundInputsRow}>
          <View style={{ maxWidth: '40%', marginRight: 8, flexShrink: 1 }}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flexShrink: 1, marginRight: 8 }}>
                <InspectorNumberInput
                  hideIncrements
                  lastNativeUpdate={lastNativeUpdate}
                  placeholder="Seed"
                  value={response.params?.seed}
                  onChange={onChangeSeed}
                />
              </View>
              <TouchableOpacity
                style={[SceneCreatorConstants.styles.button, styles.shuffleButton]}
                onPress={() => onChangeSeed(Math.floor(Math.random() * Math.floor(9999)))}>
                <Feather name="refresh-cw" style={styles.soundInputsRandomize} />
              </TouchableOpacity>
            </View>
            <Text style={styles.soundInputsLabel}>Coarse</Text>
          </View>
          <View style={{ maxWidth: '40%', flexShrink: 1 }}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flexShrink: 1, marginRight: 8 }}>
                <InspectorNumberInput
                  hideIncrements
                  lastNativeUpdate={lastNativeUpdate}
                  placeholder="Mutation"
                  value={response.params?.mutationSeed}
                  onChange={onChangeMutation}
                />
              </View>
              <TouchableOpacity
                style={[SceneCreatorConstants.styles.button, styles.shuffleButton]}
                onPress={() => onChangeMutation(Math.floor(Math.random() * Math.floor(9999)))}>
                <Feather name="refresh-cw" style={styles.soundInputsRandomize} />
              </TouchableOpacity>
            </View>
            <Text style={styles.soundInputsLabel}>Fine</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const SoundRecording = ({ onChangeSound, response, onChangeResponse, children, ...props }) => {
  const [state, setState] = React.useState('ready');

  const onChangeRecordingUrl = (recordingUrl) =>
    onChangeSound({
      ...response,
      params: {
        ...response.params,
        recordingUrl,
      },
    });

  const onChangeSoundId = (soundId) => {
    onChangeRecordingUrl(`https://audio.castle.xyz/${soundId}.mp3`);
  };

  const onStopRecord = React.useCallback(async () => {
    setState('processing');
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();

      let uploadResult = await uploadAudioFile(result);
      onChangeRecordingUrl(uploadResult.url);
    } catch (e) {
      console.error(`error processing audio: ${e}`);
    }
    setState('ready');
  }, [setState]);

  const onPermissionsError = React.useCallback(async () => {
    Alert.alert(
      'Permissions Error',
      `Please enable the ${
        Platform.OS === 'android' ? 'record audio' : 'microphone'
      } permission for Castle to use this feature`
    );
  });

  const onStartRecord = React.useCallback(async () => {
    try {
      let permissions;
      if (Platform.OS === 'android') {
        permissions = [
          Permissions.PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
          Permissions.PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
          Permissions.PERMISSIONS.ANDROID.RECORD_AUDIO,
        ];
      } else {
        permissions = [Permissions.PERMISSIONS.IOS.MICROPHONE];
      }

      const grants = await Permissions.requestMultiple(permissions);

      for (let permission in grants) {
        if (grants[permission] !== Permissions.RESULTS.GRANTED) {
          onPermissionsError();
          return;
        }
      }
    } catch (err) {
      console.warn(err);
      onPermissionsError();
      return;
    }

    setState('recording');

    await audioRecorderPlayer.startRecorder();
    audioRecorderPlayer.addRecordBackListener((e) => {
      if (e.currentPosition > RECORD_MAX_MS) {
        onStopRecord();
      }

      return;
    });
  }, [setState, onStopRecord, onPermissionsError]);

  const onPlayAudio = React.useCallback(async () => {
    sendAsync('EDITOR_PREVIEW_SOUND', response.params);
  }, [response.params]);

  const soundId = response.params?.recordingUrl
    ? response.params?.recordingUrl.split('audio.castle.xyz/')[1].split('.mp3')[0]
    : '';

  return (
    <View style={[SceneCreatorConstants.styles.button, styles.container]}>
      {state === 'ready' && (
        <TouchableOpacity style={styles.recordButton} onPress={() => onStartRecord()}>
          <Text>Record</Text>
        </TouchableOpacity>
      )}

      {state === 'recording' && (
        <TouchableOpacity style={styles.recordButton} onPress={() => onStopRecord()}>
          <Text>Stop Recording</Text>
        </TouchableOpacity>
      )}

      {state === 'processing' && (
        <View style={styles.recordButton}>
          <Text>Processing...</Text>
        </View>
      )}

      {state === 'ready' && (
        <TouchableOpacity style={styles.recordButton} onPress={() => onPlayAudio()}>
          <Text>Play</Text>
        </TouchableOpacity>
      )}

      <InspectorTextInput value={soundId} onChangeText={onChangeSoundId} placeholder="Sound id" />
    </View>
  );
};

const SoundUpload = ({ onChangeSound, response, onChangeResponse, children, ...props }) => {
  const [state, setState] = React.useState('ready');

  const onChangeUploadUrl = (uploadUrl) =>
    onChangeSound({
      ...response,
      params: {
        ...response.params,
        uploadUrl,
      },
    });

  const onChangeSoundId = (soundId) => {
    onChangeUploadUrl(`https://audio.castle.xyz/${soundId}.mp3`);
  };

  const onStartUpload = React.useCallback(async () => {
    setState('processing');

    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.audio],
      });

      let uploadResult = await uploadAudioFile(res[0].uri);
      onChangeUploadUrl(uploadResult.url);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled
      } else {
        console.log(err);
        Alert.alert('Upload Error', `Error uploading audio file. Please try again.`);
      }
    }

    setState('ready');
  }, [onChangeUploadUrl, setState]);

  const onPlayAudio = React.useCallback(async () => {
    sendAsync('EDITOR_PREVIEW_SOUND', response.params);
  }, [response.params]);

  const soundId = response.params?.uploadUrl
    ? response.params?.uploadUrl.split('audio.castle.xyz/')[1].split('.mp3')[0]
    : '';

  return (
    <View style={[SceneCreatorConstants.styles.button, styles.container]}>
      {state === 'ready' && (
        <TouchableOpacity style={styles.recordButton} onPress={() => onStartUpload()}>
          <Text>Select File</Text>
        </TouchableOpacity>
      )}

      {state === 'processing' && (
        <View style={styles.recordButton}>
          <Text>Processing...</Text>
        </View>
      )}

      {state === 'ready' && (
        <TouchableOpacity style={styles.recordButton} onPress={() => onPlayAudio()}>
          <Text>Play</Text>
        </TouchableOpacity>
      )}

      <InspectorTextInput value={soundId} onChangeText={onChangeSoundId} placeholder="Sound id" />
    </View>
  );
};

const SOUND_COMPONENTS = {
  synthesis: SoundEffect,
  recording: SoundRecording,
  upload: SoundUpload,
};

export const PlaySoundResponse = ({
  response,
  onChangeResponse,
  children,
  addChildSheet,
  ...props
}) => {
  const onChangeSound = React.useCallback(
    (response) => {
      onChangeResponse(response);
      sendAsync('EDITOR_CHANGE_SOUND', response.params);
    },
    [onChangeResponse]
  );
  const SoundComponent = SOUND_COMPONENTS[response.params?.type];

  return (
    <>
      {children}
      {SoundComponent ? (
        <SoundComponent
          onChangeSound={onChangeSound}
          response={response}
          onChangeResponse={onChangeResponse}
          {...props}
        />
      ) : null}
    </>
  );
};
