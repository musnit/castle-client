import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5'

import * as Constants from './Constants';

const SceneCreatorAction = (props) => {
    return (
        <View style={{
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            margin: 6,
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

const SceneCreatorTool = (props) => {
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

const SceneCreatorTools = () => {
    return (
        <View style={{
            flexDirection: 'row',
            justifyContent: 'center',
        }}>
            <SceneCreatorTool name='pencil-alt' />
            <SceneCreatorTool name='layer-group' />
            <SceneCreatorTool name='copy' />
            <SceneCreatorTool name='trash' />
        </View>
    )
}

const SceneCreatorPanel = () => {
    return (
        <View>
            <SceneCreatorTools />
            <View style={{
                backgroundColor: '#fff',
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                padding: 16,
                paddingBottom: 128,
                marginTop: 8,
            }}>
                <Text style={{ color: '#888', letterSpacing: 0.5, textAlign: 'center' }}>BEHAVIORS</Text>
            </View>
        </View>
    )
}

export const SceneCreator = () => {
    return (
        <View style={{
            flex: 1,
            backgroundColor: '#D0BFA3',
            justifyContent: 'space-between',
        }}>
            <SceneCreatorActions />
            <SceneCreatorPanel />
        </View>
    );
};