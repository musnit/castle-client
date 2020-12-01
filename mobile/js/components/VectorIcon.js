import * as React from 'react';

import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Foundation from 'react-native-vector-icons/Foundation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import Zocial from 'react-native-vector-icons/Zocial';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';

const MAPPING = {
  ['AntDesign']: AntDesign,
  ['Entypo']: Entypo,
  ['EvilIcons']: EvilIcons,
  ['Feather']: Feather,
  ['FontAwesome']: FontAwesome,
  ['FontAwesome5']: FontAwesome5,
  ['Fontisto']: Fontisto,
  ['Foundation']: Foundation,
  ['Ionicons']: Ionicons,
  ['MaterialIcons']: MaterialIcons,
  ['MaterialCommunityIcons']: MaterialCommunityIcons,
  ['Octicons']: Octicons,
  ['Zocial']: Zocial,
  ['SimpleLineIcons']: SimpleLineIcons,
};

export const VectorIcon = ({ family, ...props }) => {
  const Component = MAPPING[family];
  if (Component) {
    return <Component {...props} />;
  }
  return null;
};
