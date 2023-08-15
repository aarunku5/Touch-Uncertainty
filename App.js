import React from 'react';
import { View, StyleSheet } from 'react-native';
import BlueSquareSVG from './BlueSquareSVG';
import { tuio_socket } from './process_tuio';

const App = () => {
 
  return (
    <View style={styles.container}>
      <BlueSquareSVG />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
