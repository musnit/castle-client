import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { PopoverButton } from '../../PopoverProvider';
import { ColorPicker } from 'react-native-color-picker';
import tinycolor from 'tinycolor2';

const styles = StyleSheet.create({
  button: {
    borderWidth: 2,
    backgroundColor: '#eee',
    borderColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    overflow: 'hidden',
  },
  buttonSelected: {
    backgroundColor: '#cde1ff',
  },
  picker: {
    padding: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  swatch: {
    width: 32,
    height: 32,
  }
});

const colors = ['#3b1725','#73172d','#b4202a','#df3e23','#fa6a0a','#f9a31b','#ffd541','#fffc40','#d6f264','#9cdb43','#59c135','#14a02e','#1a7a3e','#24523b','#122020','#143464','#285cc4','#249fde','#20d6c7','#a6fcdb','#fef3c0','#fad6b8','#f5a097','#e86a73','#bc4a9b','#793a80','#403353','#242234','#322b28','#71413b','#bb7547','#dba463','#f4d29c','#dae0ea','#b3b9d1','#8b93af','#6d758d','#4a5462','#333941','#422433','#5b3138','#8e5252','#ba756a','#e9b5a3','#e3e6ff','#b9bffb','#849be4','#588dbe','#477d85','#23674e','#328464','#5daf8d','#92dcba','#cdf7e2','#e4d2aa','#c7b08b','#a08662','#796755','#5a4e44','#423934'];

const ColorPickerPopover = ({ valueStr, setValueFromStr, closePopover }) => {
  return (
    <ColorPicker
      style={{ width: 200, height: 200 }}
      oldColor={valueStr}
      //onColorChange={setValueFromStr}
      onColorSelected={(newValueStr) => {
        setValueFromStr(newValueStr);
        closePopover();
      }}
      onOldColorSelected={() => closePopover()}
    />
  );
};

const ColorPicker64Popover = ({ setValueFromStr, closePopover }) => {
  var swatches = [];
  for (let i = 0; i < colors.length; i++) {
    swatches.push(
      <TouchableOpacity
        onPress={() => {
          setValueFromStr(colors[i]);
          closePopover();
        }}
        style={[styles.swatch, { backgroundColor: colors[i] }]}>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.picker}>
      {swatches}
    </View>
  );
};

const NewColorPicker = ({ value, setValue }) => {
  let valueStr;
  if (value) {
    const r255 = 255 * value.r;
    const g255 = 255 * value.g;
    const b255 = 255 * value.b;
    valueStr = `rgb(${r255}, ${g255}, ${b255})`;
  }

  const setValueFromStr = (newValueStr) => {
    const rgba = tinycolor(newValueStr).toRgb();
    setValue({ r: rgba.r / 255.0, g: rgba.g / 255.0, b: rgba.b / 255.0, a: rgba.a });
  };

  const popover = {
    Component: ColorPicker64Popover,
    valueStr,
    setValueFromStr,
    width: 330,
    height: 204,
  };

  return (
    <PopoverButton
      style={styles.button}
      activeStyle={{ ...styles.button, ...styles.buttonSelected }}
      popover={popover}>
      <View style={{ width: 28, height: 28, backgroundColor: valueStr }} />
    </PopoverButton>
  );
};

export default NewColorPicker;
