import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { PopoverButton } from '../../../components/PopoverProvider';
import tinycolor from 'tinycolor2';
import FastImage from 'react-native-fast-image';

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    borderRadius: 4,
    overflow: 'hidden',
  },
  picker: {
    padding: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  swatch: {
    width: 32,
    height: 32,
  },
  swatchSelected: {
    width: 36,
    height: 36,
    borderWidth: 2,
    borderColor: '#fff',
    margin: -2,
    zIndex: 2,
    borderRadius: 4,
  },
});

const colors = [
  '#3b1725',
  '#73172d',
  '#b4202a',
  '#df3e23',
  '#fa6a0a',
  '#f9a31b',
  '#ffd541',
  '#fffc40',
  '#d6f264',
  '#9cdb43',
  '#59c135',
  '#14a02e',
  '#1a7a3e',
  '#24523b',
  '#122020',
  '#143464',
  '#285cc4',
  '#249fde',
  '#20d6c7',
  '#a6fcdb',
  '#fef3c0',
  '#fad6b8',
  '#f5a097',
  '#e86a73',
  '#bc4a9b',
  '#793a80',
  '#403353',
  '#242234',
  '#322b28',
  '#71413b',
  '#bb7547',
  '#dba463',
  '#f4d29c',
  '#dae0ea',
  '#b3b9d1',
  '#8b93af',
  '#6d758d',
  '#4a5462',
  '#333941',
  '#422433',
  '#5b3138',
  '#8e5252',
  '#ba756a',
  '#e9b5a3',
  '#e3e6ff',
  '#b9bffb',
  '#849be4',
  '#588dbe',
  '#477d85',
  '#23674e',
  '#328464',
  '#5daf8d',
  '#92dcba',
  '#cdf7e2',
  '#e4d2aa',
  '#c7b08b',
  '#a08662',
  '#796755',
  '#5a4e44',
  '#423934',
];

const ColorPicker64Popover = ({ valueHex, setValueFromStr, closePopover }) => {
  var swatches = [];
  for (let i = 0; i < colors.length; i++) {
    swatches.push(
      <TouchableOpacity
        key={`color-${i}`}
        onPress={() => {
          setValueFromStr(colors[i]);
          closePopover();
        }}
        style={[
          styles.swatch,
          { backgroundColor: colors[i] },
          colors[i] == valueHex ? styles.swatchSelected : null,
        ]}></TouchableOpacity>
    );
  }

  return <View style={styles.picker}>{swatches}</View>;
};

const ColorPicker = ({ value, setValue }) => {
  let valueStr, valueHex;
  if (value.r) {
    // TODO: phase out rgb color objects
    const r255 = 255 * value.r;
    const g255 = 255 * value.g;
    const b255 = 255 * value.b;
    valueStr = `rgb(${r255}, ${g255}, ${b255})`;
    valueHex = '#' + tinycolor(valueStr).toHex();
  } else {
    const r255 = 255 * value[0];
    const g255 = 255 * value[1];
    const b255 = 255 * value[2];
    valueStr = `rgb(${r255}, ${g255}, ${b255})`;
    valueHex = '#' + tinycolor(valueStr).toHex();
  }

  const setValueFromStr = (newValueStr) => {
    const rgba = tinycolor(newValueStr).toRgb();
    setValue([rgba.r / 255.0, rgba.g / 255.0, rgba.b / 255.0, rgba.a]);
  };

  let popoverHeight = 32 * 6 + 12; // swatch height * number of rows + padding

  const popover = {
    Component: ColorPicker64Popover,
    valueHex,
    setValueFromStr,
    width: 330,
    height: popoverHeight,
  };

  return (
    <PopoverButton style={styles.button} activeStyle={styles.button} popover={popover}>
      <View style={{ width: '100%', height: '100%', backgroundColor: valueStr }} />
    </PopoverButton>
  );
};

export default ColorPicker;
