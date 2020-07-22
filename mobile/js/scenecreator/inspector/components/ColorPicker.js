import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PopoverButton } from '../../PopoverProvider';
import { ColorPicker } from 'react-native-color-picker';
import tinycolor from 'tinycolor2';

const styles = StyleSheet.create({
  button: {
    padding: 4,
    borderWidth: 2,
    backgroundColor: '#eee',
    borderColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    overflow: 'hidden',
  },
  buttonSelected: {
    backgroundColor: '#cde1ff',
  },
});

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
    Component: ColorPickerPopover,
    valueStr,
    setValueFromStr,
    height: 400,
  };

  return (
    <PopoverButton
      style={styles.button}
      activeStyle={{ ...styles.button, ...styles.buttonSelected }}
      popover={popover}>
      <View style={{ width: 20, height: 20, backgroundColor: valueStr }} />
    </PopoverButton>
  );
};

export default NewColorPicker;
