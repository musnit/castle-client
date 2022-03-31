import { requireNativeComponent } from 'react-native';

let NativeBottomSheet = null;

if (Platform.OS === 'android' && NativeBottomSheet == null) {
  NativeBottomSheet = requireNativeComponent('CastleBottomSheet', null);
}

export default NativeBottomSheet;
