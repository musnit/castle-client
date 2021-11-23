import * as React from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
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
  bigPlayButtonContainer: {
    paddingLeft: 4,
    paddingRight: 12,
    width: 72,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigPlayButton: {
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
  playButtonContainer: {
    paddingRight: 8,
    paddingVertical: 4,
    width: 64,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    borderWidth: 1,
    borderColor: Constants.colors.black,
    width: '100%',
    aspectRatio: 1,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    ...Constants.styles.dropShadow,
  },
  playButtonDisabled: {
    borderColor: Constants.colors.grayOnWhiteBorder,
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
  chooseFileButton: {
    marginRight: 12,
  },
  soundIdInput: { minWidth: 72, flexShrink: 1, marginRight: 12 },
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

const BigPlayButton = ({ onPress, disabled }) => (
  <View style={styles.bigPlayButtonContainer}>
    <TouchableOpacity
      style={[styles.bigPlayButton, disabled ? styles.playButtonDisabled : null]}
      onPress={onPress}
      disabled={disabled}>
      <Entypo
        name="controller-play"
        size={36}
        color={disabled ? '#aaa' : '#000'}
        style={{ marginLeft: 5, marginTop: 2 }}
      />
    </TouchableOpacity>
  </View>
);

const PlayButton = ({ onPress, disabled }) => (
  <View style={styles.playButtonContainer}>
    <TouchableOpacity
      style={[styles.playButton, disabled ? styles.playButtonDisabled : null]}
      onPress={onPress}
      disabled={disabled}>
      <Entypo
        name="controller-play"
        size={36}
        color={disabled ? '#aaa' : '#000'}
        style={{ marginLeft: 5, marginTop: 2 }}
      />
    </TouchableOpacity>
  </View>
);

const RecordStopButton = ({ onPress, isRecording, disabled }) => (
  <View style={styles.playButtonContainer}>
    <TouchableOpacity
      style={[styles.playButton, disabled ? styles.playButtonDisabled : null]}
      onPress={onPress}
      disabled={disabled}>
      <Entypo
        name={isRecording ? 'controller-stop' : 'controller-record'}
        size={36}
        color={disabled ? '#aaa' : '#000'}
        style={{ marginLeft: 2, marginTop: 1 }}
      />
    </TouchableOpacity>
  </View>
);

const AudioActivityIndicator = ({ label }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <ActivityIndicator style={{ marginRight: 8 }} />
    <Text style={{ fontSize: 16 }}>{label}</Text>
  </View>
);

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
      <BigPlayButton onPress={() => sendAsync('EDITOR_CHANGE_SOUND', response.params)} />
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

class SoundRecording extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      state: 'ready',
    };
  }

  async componentWillUnmount() {
    let { state } = this.state;

    if (state === 'recording') {
      audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
    }

    this._closed = true;
  }

  onChangeRecordingUrl = async (recordingUrl) => {
    let { onChangeSound, response } = this.props;

    onChangeSound({
      ...response,
      params: {
        ...response.params,
        recordingUrl,
      },
    });
  };

  onChangeSoundId = async (soundId) => {
    this.onChangeRecordingUrl(`https://audio.castle.xyz/${soundId}.mp3`);
  };

  onStopRecord = async () => {
    this.setState({
      state: 'processing',
    });

    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();

      if (this._closed) {
        return;
      }

      let uploadResult = await uploadAudioFile(result, true);

      if (this._closed) {
        return;
      }

      this.onChangeRecordingUrl(uploadResult.url);
    } catch (e) {
      console.error(`error processing audio: ${e}`);
    }

    this.setState({
      state: 'ready',
    });
  };

  onPermissionsError = async () => {
    Alert.alert(
      'Permissions Error',
      `Please enable the ${
        Platform.OS === 'android' ? 'record audio' : 'microphone'
      } permission for Castle to use this feature`
    );
  };

  onStartRecord = async () => {
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
      this.onPermissionsError();
      return;
    }

    this.setState({
      state: 'recording',
    });

    await audioRecorderPlayer.startRecorder();
    audioRecorderPlayer.addRecordBackListener((e) => {
      if (e.currentPosition > RECORD_MAX_MS) {
        this.onStopRecord();
      }

      return;
    });
  };

  onPlayAudio = async () => {
    let { response } = this.props;

    sendAsync('EDITOR_PREVIEW_SOUND', response.params);
  };

  render() {
    let { response } = this.props;
    let { state } = this.state;

    const soundId = response.params?.recordingUrl
      ? response.params?.recordingUrl.split('audio.castle.xyz/')[1].split('.mp3')[0]
      : null;

    return (
      <View
        style={[SceneCreatorConstants.styles.button, styles.container, { alignItems: 'center' }]}>
        <PlayButton onPress={this.onPlayAudio} disabled={state !== 'ready' || !soundId} />
        <RecordStopButton
          onPress={state === 'ready' ? this.onStartRecord : this.onStopRecord}
          isRecording={state === 'recording'}
          disabled={state === 'processing'}
        />
        <InspectorTextInput
          optimistic
          value={soundId}
          onChangeText={this.onChangeSoundId}
          placeholder="Sound id"
          style={styles.soundIdInput}
        />
        {state === 'recording' || state === 'processing' ? (
          <AudioActivityIndicator
            label={state === 'recording' ? 'Recording...' : 'Processing...'}
          />
        ) : null}
      </View>
    );
  }
}

const SoundUpload = ({ onChangeSound, response, onChangeResponse, children, ...props }) => {
  const [state, setState] = React.useState('ready');

  const onChangeUploadUrl = React.useCallback(
    (uploadUrl) =>
      onChangeSound({
        ...response,
        params: {
          ...response.params,
          uploadUrl,
        },
      }),
    [response, onChangeSound]
  );

  const onChangeSoundId = React.useCallback(
    (soundId) => {
      onChangeUploadUrl(`https://audio.castle.xyz/${soundId}.mp3`);
    },
    [onChangeUploadUrl]
  );

  const onStartUpload = React.useCallback(async () => {
    setState('processing');

    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.audio],
      });

      let uploadResult = await uploadAudioFile(res[0].uri, false);
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
  const chooseFileDisabled = state !== 'ready';

  return (
    <View style={[SceneCreatorConstants.styles.button, styles.container, { alignItems: 'center' }]}>
      <PlayButton onPress={onPlayAudio} disabled={state !== 'ready' || !soundId} />
      <TouchableOpacity
        style={[
          SceneCreatorConstants.styles.button,
          styles.chooseFileButton,
          chooseFileDisabled ? { borderColor: '#ccc' } : null,
        ]}
        onPress={onStartUpload}
        disabled={chooseFileDisabled}>
        <Text
          style={[
            SceneCreatorConstants.styles.buttonLabel,
            chooseFileDisabled ? { color: '#666' } : null,
          ]}>
          {soundId ? 'Change File' : 'Choose File'}
        </Text>
      </TouchableOpacity>
      <InspectorTextInput
        optimistic
        value={soundId}
        onChangeText={onChangeSoundId}
        placeholder="Sound id"
        style={styles.soundIdInput}
      />
      {state === 'processing' ? <AudioActivityIndicator label="Processing..." /> : null}
    </View>
  );
};

const SOUND_COMPONENTS = {
  sfxr: SoundEffect,
  microphone: SoundRecording,
  library: SoundUpload,
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
  const soundType = response.params?.type ?? 'sfxr';
  const SoundComponent = SOUND_COMPONENTS[soundType];

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
