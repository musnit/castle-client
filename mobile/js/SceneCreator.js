import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5'

import BottomSheet from 'reanimated-bottom-sheet';
import * as Constants from './Constants';
import { TouchableOpacity } from 'react-native-gesture-handler';

const SceneCreatorAction = (props) => {
  return (
    <View style={{
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      margin: 4,
    }}>
      <Icon name={props.name} size={24} color="#fff" style={Constants.styles.textShadow} solid />
    </View>
  )
}

const SceneCreatorActions = () => {
  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 8,
    }}>
      <SceneCreatorAction name='arrow-left' />
      <View style={{ flexDirection: 'row' }}>
        <SceneCreatorAction name='play' />
        <SceneCreatorAction name='undo' />
        <SceneCreatorAction name='redo' />
        <SceneCreatorAction name='sliders-h' />
      </View>
      <View style={{ width: 52 }}>
        {/* this will eventually be replaced with a chat icon */}
      </View>
    </View>
  );
};

const SceneCreatorBlueprintsPanel = () => {
  return (
    <View>
      <View style={{
        backgroundColor: '#fff',
        padding: 16,
        paddingTop: 0,
        paddingBottom: 800,
      }}>
        <Text></Text>
      </View>
    </View>
  )
}

class SceneCreatorBlueprintsSheet extends React.Component {
  _sheetRef = React.createRef(null);

  open = () => {
    if (this._sheetRef.current) {
      this._sheetRef.current.snapTo(1);
      this._sheetRef.current.snapTo(1);
    }
  };

  close = () => {
    if (this._sheetRef.current) {
      this._sheetRef.current.snapTo(2);
      this._sheetRef.current.snapTo(2);
    }
  };

  _renderHeader = () => (
    <View style={{
      backgroundColor: '#fff',
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      padding: 16,
    }}>
      <Text style={{ color: '#888', letterSpacing: 0.5, textAlign: 'center' }}>BLUEPRINTS</Text>
    </View>
  )

  _renderContent = () => (
    <SceneCreatorBlueprintsPanel />
  )

  render() {
    return (
      <React.Fragment>
        <BottomSheet
          ref={this._sheetRef}
          snapPoints = {[600, 300, 52]}
          initialSnap = {1}
          renderHeader = {this._renderHeader}
          renderContent = {this._renderContent}
        />
      </React.Fragment>
    )
  }
}

const SceneCreatorInspectorTool = (props) => {
  return (
    <View style={{
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      margin: 6,
      backgroundColor: '#fff',
      borderRadius: 1000,
      ...Constants.styles.dropShadow,
    }}>
      <Icon name={props.name} size={20} color="#000" solid />
    </View>
  )
}

const SceneCreatorInspectorTools = () => {
  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'center',
    }}>
      <SceneCreatorInspectorTool name='pencil-alt' />
      <SceneCreatorInspectorTool name='layer-group' />
      <SceneCreatorInspectorTool name='copy' />
      <SceneCreatorInspectorTool name='trash' />
    </View>
  )
}

const SceneCreatorInspectorPanel = () => {
  return (
    <View>
      <View style={{
        backgroundColor: '#fff',
        padding: 16,
        paddingTop: 0,
        paddingBottom: 800,
      }}>
        <Text></Text>
      </View>
    </View>
  )
}

class SceneCreatorInspectorSheet extends React.Component {
  _sheetRef = React.createRef(null);

  open = () => {
    if (this._sheetRef.current) {
      this._sheetRef.current.snapTo(1);
      this._sheetRef.current.snapTo(1);
    }
  };

  close = () => {
    if (this._sheetRef.current) {
      this._sheetRef.current.snapTo(2);
      this._sheetRef.current.snapTo(2);
    }
  };

  _renderHeader = () => (
    <React.Fragment>
      <SceneCreatorInspectorTools />
      <View style={{
        backgroundColor: '#fff',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        padding: 16,
        marginTop: 8,
      }}>
        <Text style={{ color: '#888', letterSpacing: 0.5, textAlign: 'center' }}>PROPERTIES</Text>
      </View>
    </React.Fragment>
  )

  _renderContent = () => (
    <SceneCreatorInspectorPanel />
  )

  render() {
    return (
      <React.Fragment>
        <BottomSheet
          ref={this._sheetRef}
          snapPoints = {[600, 400, 0]}
          initialSnap={2}
          renderHeader = {this._renderHeader}
          renderContent = {this._renderContent}
        />
      </React.Fragment>
    )
  }
}

class SceneCreator extends React.Component {
  _blueprintsRef = React.createRef();
  _inspectorRef = React.createRef();

  _showBlueprints = () => {
    if (this._blueprintsRef) {
      this._blueprintsRef.current.open();
    }
  };

  _dismissBlueprints = () => {
    if (this._blueprintsRef) {
      this._blueprintsRef.current.close();
    }
  };

  _showInspector = () => {
    if (this._inspectorRef) {
      this._inspectorRef.current.open();
    }
  };

  _dismissInspector = () => {
    if (this._inspectorRef) {
      this._inspectorRef.current.close();
    }
  };

  render() {
    return (
      <View style={{
        flex: 1,
        backgroundColor: '#D0BFA3',
      }}>
        <SceneCreatorActions />
        <View style={{ justifyContent: 'center', flexDirection: 'row', paddingTop: 200, }}>
          <TouchableOpacity
            onPress={() => {
              this._showInspector();
              this._dismissBlueprints();
            }}>
              <Text>~ inspect meeeee ~</Text>
          </TouchableOpacity>
        </View>
        <SceneCreatorBlueprintsSheet
          ref={this._blueprintsRef}
        />
        <SceneCreatorInspectorSheet
          ref={this._inspectorRef}
        />
      </View>
    );
  }
}

export default SceneCreator;