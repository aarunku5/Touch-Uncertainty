import React, { useState } from 'react';
import { View, Dimensions, Alert, StyleSheet, TouchableOpacity} from 'react-native';
import Svg, { Rect,Text,Circle } from 'react-native-svg';
import { PinchGestureHandler, State, PanGestureHandler } from 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const BlueSquareSVG = () => {
  const numSquares = 30;
  const gridSize = 30; // Size of each grid cell

  const { width, height } = Dimensions.get('window'); // Get device screen dimensions

  const [tapCount, setTapCount] = useState(0);
  const [tapTimeout, setTapTimeout] = useState(null);
  const [lastTapCoords, setLastTapCoords] = useState({ x: 0, y: 0 });

  const [tooltipText, setTooltipText] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const [newGestureHistory, setGestureHistory] = useState([]);

  const [isViewTransformed, setViewTransformed] = useState(false);

  const [filteredFrequentCells, setFilteredFrequentCells] = useState([]);

  const resetView = () => {
    setViewTransformed(false);
    setScale(initialScale);
    setTranslateX(0);
    setTranslateY(0);
    
    // Reset any other state variables or transformations you might have
  };

  const styles = StyleSheet.create({
    resetButton: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      backgroundColor: 'gray',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 5,
    },
    resetButtonText: {
      color: 'black',
      fontSize: 10,
    },
  });


  
  //making grid cells on the svg
  const numColumns = Math.floor(width / 100);
  const numRows = Math.floor(height / 100);
  const gridCells = [];
  for (let y = 0; y < numRows; y++) {
    for (let x = 0; x < numColumns; x++) {
      const cell = {
        id: `${x}_${y}`,
        minX: x * 100,
        minY: y * 100,
        maxX: (x + 1) * 100,
        maxY: (y + 1) * 100,
        interactions: 0,
      };
      gridCells.push(cell);
    }
  }

  const [gridCellInteractions, setGridCellInteractions] = useState({});

  const calculateDistance = (point1, point2) => {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

//series checking

//F1: When you do multiple zooms and pans across areas
  const checkGestureSeries = () => {
    const minPans = 6; // Minimum number of pan gestures in the series
    const minZooms = 6; // Minimum number of zoom gestures in the series
    const maxGestures = 20; // Maximum number of gestures to consider
  
    const recentGestures = newGestureHistory.slice(-maxGestures);
  
    const panCount = recentGestures.filter(gesture => gesture.type === 'Pan').length;
    const zoomCount = recentGestures.filter(gesture => gesture.type === 'Zoom').length;
  
    if ((panCount >= minPans && zoomCount >= minZooms) || (panCount >= minPans || zoomCount >= minZooms || panCount+zoomCount >= 10)) {

     // Log most frequent grid cells
     const sortedCells = Object.keys(gridCellInteractions).sort(
        (a, b) => gridCellInteractions[b] - gridCellInteractions[a]
      );
      const mostFrequentCells = sortedCells.slice(0, 5); // Adjust as needed
      mostFrequentCells.forEach((cellId) => {
        const cell = gridCells.find((cell) => cell.id === cellId);
      });

      // Filter out adjacent cells
            const filteredMostFrequentCells = mostFrequentCells.filter((cellId) => {
                const cell = gridCells.find((cell) => cell.id === cellId);
                return !mostFrequentCells.some((otherCellId) => {
                if (cellId !== otherCellId) {
                    const otherCell = gridCells.find((cell) => cell.id === otherCellId);
                    if (cell && otherCell) {
                    return (
                        Math.abs(cell.minX - otherCell.minX) <= 100 &&
                        Math.abs(cell.minY - otherCell.minY) <= 100
                    );
                    }
                }
                return false;
                });
            });
        console.log('Filtered most frequent cells:');
        setFilteredFrequentCells([]);
        filteredMostFrequentCells.forEach((cellId) => {
            const cell = gridCells.find((cell) => cell.id === cellId);
            filteredFrequentCells.push(cellId);
            // console.log(
            // `Cell ID: ${cellId}, Interactions: ${
            //     gridCellInteractions[cellId]
            // }, Boundaries: (${cell.minX},${cell.minY})-(${cell.maxX},${cell.maxY})`
            // );
        });
        

        //Cluster squares based on which cell they are closest to
            const clusteredSquares = gridCoordinates.map((square, squareIndex) => {
                const distancesToCells = filteredMostFrequentCells.map((cellId) => {
                const cell = gridCells.find((cell) => cell.id === cellId);
                return {
                    cellId,
                    distance: calculateDistance(square, { x: cell.minX, y: cell.minY }),
                };
                });
            
                const closestCell = distancesToCells.reduce((minCell, currentCell) => {
                return currentCell.distance < minCell.distance ? currentCell : minCell;
                }, distancesToCells[0]);
            
                return {
                ...square,
                clusterCellId: closestCell.cellId,
                };
            });
            console.log(clusteredSquares,filteredFrequentCells);

        // Show an alert box with options
            Alert.alert(
                'Transform View',
                'Do you want to transform the view?',
                [
                {
                    text: 'No',
                    onPress: () => {
                    // Do nothing
                    },
                    style: 'cancel',
                },
                {
                    text: 'Yes',
                    onPress: () => {
                    // Set the opacity of the SVG squares to 0.5
                    setViewTransformed(true);
                    },
                },
                ],
                { cancelable: false }
            );


        // Clear the gesture history queue after detecting the series
      setGestureHistory([]);
      setGridCellInteractions({});
    }
  };

  //pinch

  const initialScale = 1;
  const minScale = 1;
  const maxScale = 2;

  let translateXRef = 0;
  let translateYRef = 0;

  const [scale, setScale] = useState(initialScale);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);

  let lastPinchScale = initialScale;

  const handleZoom = event => {
         const newScale = event.nativeEvent.scale * scale;
    if (newScale >= minScale && newScale <= maxScale) {
      setScale(newScale);
      lastPinchScale = newScale;

    }
  };

  const handleZoomStateChange = event => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      // Calculate the zoom extent
      const zoomExtent = lastPinchScale / scale;

      
      // Do something with the zoom extent (e.g., store it, display it, etc.)
         if(zoomExtent>0.5){
                 // Add gesture to history
                 const newGesture = {
                    type: 'Zoom',
                    timestamp: new Date().getTime(),
                    coordinates: { x: lastPinchScale, y:zoomExtent },
                  };
                  setGestureHistory(newGestureHistory => {
                      const updatedHistory = [...newGestureHistory, newGesture];
                      updateGestureHistory(updatedHistory); // Pass the updated history to the function
                      return updatedHistory;
                    });      
                //GRID CELL CHECK
                    const { scale, focalX, focalY } = event.nativeEvent;
                    const cell = gridCells.find(
                        (cell) =>
                          focalX >= cell.minX && focalX <= cell.maxX && focalY >= cell.minY && focalY <= cell.maxY
                      );
                      if (cell) {
                        // Update the interaction count for the grid cell
                        setGridCellInteractions((prevInteractions) => ({
                          ...prevInteractions,
                          [cell.id]: (prevInteractions[cell.id] || 0) + 1,
                        }));
                    
                        // console.log(`Zoom gesture detected in grid cell: ${cell.id}`);
                      }

    }
    checkGestureSeries();
    }
  };

  const handlePan = event => {
    setTranslateX(translateXRef + event.nativeEvent.translationX);
    setTranslateY(translateYRef + event.nativeEvent.translationY);
  };

  const handlePanStateChange = event => {
    if (event.nativeEvent.state === State.END) {

      translateXRef = translateX;
      translateYRef = translateY;
         // Add gesture to history
         const newGesture = {
            type: 'Pan',
            timestamp: new Date().getTime(),
            coordinates: { x:event.nativeEvent.translationX, y:event.nativeEvent.translationY },
          };
          setGestureHistory(newGestureHistory => {
              const updatedHistory = [...newGestureHistory, newGesture];
              updateGestureHistory(updatedHistory); // Pass the updated history to the function
              return updatedHistory;
            });



            // // Find the grid cell that the tap corresponds to
            //     // Calculate the focal point of the pan gesture
            //     const focalPointX = translateXRef + event.nativeEvent.translationX;
            //     const focalPointY = translateYRef + event.nativeEvent.translationY;

            //     // Find the grid cell that the focal point corresponds to
            //     const tappedCell = gridCoordinates.find((cell) => {
            //     const xPercentage = (cell.x * width) / 100;
            //     const yPercentage = (cell.y * height) / 100;
            //     const scaledX = xPercentage * scale;
            //     const scaledY = yPercentage * scale;

            //     console.log(focalPointX,focalPointY)

            //     return (
            //         focalPointX >= scaledX &&
            //         focalPointX <= scaledX + gridSize * scale &&
            //         focalPointY >= scaledY &&
            //         focalPointY <= scaledY + gridSize * scale
            //     );
            //     });

            //     if (tappedCell) {
            //     console.log(
            //         `Pan gesture occurred in grid cell: x=${tappedCell.x}, y=${tappedCell.y}`
            //     );
            //     }
                //     const { locationX, locationY } = event.nativeEvent;
                //     const tappedCell = gridCoordinates.find((cell) => {
                //     const xPercentage = (cell.x * width) / 100;
                //     const yPercentage = (cell.y * height) / 100;
                //     const scaledX = (xPercentage + translateX) * scale;
                //     const scaledY = (yPercentage + translateY) * scale;

                //     return (
                //     locationX >= scaledX &&
                //     locationX <= scaledX + gridSize * scale &&
                //     locationY >= scaledY &&
                //     locationY <= scaledY + gridSize * scale
                //     );
                // });

                // if (tappedCell) {
                //     console.log(
                //     `Pan gesture occurred in grid cell: x=${tappedCell.x}, y=${tappedCell.y}`
                //     );
                // }






  }
        
            checkGestureSeries();
  };


  //rest of code

  
  const [cursorIndicator, setCursorIndicator] = useState(null);

  const handlePress = (event) => {

const { locationX, locationY } = event.nativeEvent;
const tappedSquare = gridCoordinates.find(({ x, y }) => {
const xPercentage = (x * width) / 100;
const yPercentage = (y * height) / 100;
const scaledX = (xPercentage + translateX) * scale;
const scaledY = (yPercentage + translateY) * scale;
const squareBoundary = {
  left: scaledX,
  top: scaledY,
  right: scaledX + gridSize * scale,
  bottom: scaledY + gridSize * scale,
};


return (
  locationX >= squareBoundary.left &&
  locationX <= squareBoundary.right &&
  locationY >= squareBoundary.top &&
  locationY <= squareBoundary.bottom
);
});

  
    
    if(tapCount === 0){//single tap only on square specified
            setLastTapCoords({ x: locationX, y: locationY });
            setTapCount(1);
            const newTimeout = setTimeout(() => handleSingleTap(locationX, locationY,tappedSquare), 300);
            setTapTimeout(newTimeout);
    }
    else if(tapCount === 1){//double tap
        if(tappedSquare)//in square
        {
            clearTimeout(tapTimeout);
            const gestureType = 'Double Tap';
           
            const lx = lastTapCoords.x; // Use the x coordinate of the first tap
            const ly = lastTapCoords.y; // Use the y coordinate of the first tap
            handleDoubleTap(locationX, locationY, lx, ly, tappedSquare);
        }       
        else {//not on square
            // Alert.alert("Handle Pinch")
            // handlePinch(event);
        }
        setTapCount(0);
        setLastTapCoords({ x: 0, y: 0 });
    }

    const cursorIndicator = (
        <Circle
        key={Date.now()} // Add a unique key to ensure re-rendering
          cx={`${locationX}`}
          cy={`${locationY}`}
          r="5"
          fill="white" // You can use any color you want
          opacity={0.5}
        />
      );
      setCursorIndicator(cursorIndicator);
      setTimeout(() => {
        setCursorIndicator(null);
      }, 500);
  };

  const handleSingleTap = (x, y, sq) => {
    const gestureType = 'Single Tap';
    if(sq){ //single tap on a square
        const squareId = String.fromCharCode(65 + gridCoordinates.indexOf(sq));
        setTooltipText('Square: '+squareId);
        setTooltipPosition({ x , y });
        setTimeout(() => {
            setTooltipText(null);
          }, 2000);
    // Add gesture to history
    const newGesture = {
        type: gestureType,
        timestamp: new Date().getTime(),
        coordinates: { x, y },
    };
    setGestureHistory(newGestureHistory => {
        const updatedHistory = [...newGestureHistory, newGesture];
        updateGestureHistory(updatedHistory); // Pass the updated history to the function
        return updatedHistory;
      });
    }
    setTapCount(0);
    setLastTapCoords({ x: 0, y: 0 });
    checkGestureSeries();
  };

  const handleDoubleTap = (x1, y1, x2, y2, sq) => {
    const gestureType = 'Double Tap';
      const squareId = String.fromCharCode(65 + gridCoordinates.indexOf(sq));
      setTooltipText('DSquare: ' + squareId);
      setTooltipPosition({ x: x2, y: y2 });
      setTimeout(() => {
        setTooltipText(null);
      }, 2000);
    // Add gesture to history
    const newGesture = {
      type: gestureType,
      timestamp: new Date().getTime(),
      coordinates: { x:x2, y:y2 },
    };
    setGestureHistory(newGestureHistory => {
        const updatedHistory = [...newGestureHistory, newGesture];
        updateGestureHistory(updatedHistory); // Pass the updated history to the function
        return updatedHistory;
      });
      checkGestureSeries();
  };

  const updateGestureHistory = (newGestureHistory) => {
    const currentTime = new Date().getTime();
    const filteredHistory = newGestureHistory.filter(
      gesture => currentTime - gesture.timestamp < 30000 // 30 seconds
    );
    setGestureHistory(filteredHistory);
  };

  const showGestureAlert = (gestureType, x, y) => {
    const timestamp = new Date().toLocaleTimeString();
    Alert.alert(
      'Gesture Info',
      `Gesture: ${gestureType}\nTimestamp: ${timestamp}\nCoordinates: (${x}, ${y})`,
    );
  };

  const [gridCoordinates, setGridCoordinates] = useState([
    { x: 10, y: 15 },
    { x: 31, y: 42 },
    { x: 52, y: 12 },
    { x: 20, y: 60 },
    { x: 48, y: 81 },
    { x: 65, y: 93 },
    { x: 71, y: 30 },
    { x: 33, y: 65 },
    { x: 59, y: 20 },
    { x: 86, y: 14 },
    { x: 87, y: 95 },
    { x: 85, y: 70 },
    { x: 70, y: 60 },
    { x: 35, y: 28 },
    { x: 50, y: 40 },
    { x: 110, y: 15 },
    { x: 131, y: 142 },
    { x: 92, y: 112 },
    { x: 120, y: 57 },
    { x: 68, y: 105 },
    { x: 95, y: 93 },
    { x: 71, y: 30 },
    { x: 83, y: 65 },
    { x: 69, y: 20 },
    { x: 106, y: 14 },
    { x: 117, y: 95 },
    { x: 85, y: 140 },
    { x: 70, y: 100 },
    { x: 24, y: 98 },
    { x: 76, y: 24 },  ]);




  



  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <PinchGestureHandler 
        onGestureEvent={handleZoom}
        onHandlerStateChange={handleZoomStateChange}
        simultaneousHandlers="panGesture"
        minPointers={3}
        maxPointers={3}        
    >
      <PanGestureHandler
        onGestureEvent={handlePan}
        onHandlerStateChange={handlePanStateChange}
        simultaneousHandlers="pinchGestures"
        minPointers={3}
        maxPointers={3}        
      >
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      onTouchStart={handlePress}
    >
      {/* Background */}
      <Rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.9)" />

      {/* Yellow Squares */}
        {gridCoordinates.map((coords, index) => {
            const { x, y } = coords;
            const xPercentage = (x * width) / 100;
            const yPercentage = (y * height) / 100;
            const scaledX = (xPercentage + translateX) * scale;
            const scaledY = (yPercentage + translateY) * scale;
            const darkness = 100 + (index + 1) * 10;
            const squareId = String.fromCharCode(65 + index);
            const opacity = isViewTransformed ? 0.5 : 1;

            return (
            <Rect
                key={index}
                x={scaledX}
                y={scaledY}
                width={gridSize * scale}
                height={gridSize * scale}
                fill={`rgba(${darkness}, ${darkness}, 0, ${opacity})`}
            />
            );
        })}


      {/* MERGE
            {isViewTransformed &&
            filteredFrequentCells.map((cellId, index) => {
            setTranslateX(0);setTranslateY(0);setScale(initialScale);
            const cell = gridCells.find((cell) => cell.id === cellId);
            const xPercentage = (cell.minX * width) / 100;
            const yPercentage = (cell.minY * height) / 100;
            const scaledX = (xPercentage + translateX) * scale;
            const scaledY = (yPercentage + translateY) * scale;

            return (
                <Rect
                key={`red_${index}`}
                x={scaledX}
                y={scaledY}
                width={gridSize * scale}
                height={gridSize * scale}
                fill="red"
                opacity={1}
                />
            );
            })} */}




    {/* Tooltip */}
      {tooltipText && (
    <React.Fragment>
    {/* Background Rect */}
    <Rect
      x={tooltipPosition.x - 20} // Adjust this value to center the box under the text
      y={tooltipPosition.y - 20} // Adjust this value to place the box above the text
      width="70"
      height="30"
      fill="white"
      opacity="0.6"
      rx="5"
      ry="5"
    />



    {/* Text */}
    <Text
      x={tooltipPosition.x+15}
      y={tooltipPosition.y-5}
      fill="black"
      fontSize="12"
      textAnchor="middle"
      alignmentBaseline="middle"
    >
      {tooltipText}
    </Text>
  </React.Fragment>
      )}

    {/* Display gesture history */}
    {newGestureHistory.map((gesture, index) => (
    <Text
        key={index}
        x={10}
        y={20 + index * 15}
        fill="white"
        fontSize="10"
        textAnchor="start"
        alignmentBaseline="middle"
    >
        {`${gesture.type} at (${gesture.coordinates.x}, ${gesture.coordinates.y}), ${new Date(gesture.timestamp).toLocaleString()}`}
    </Text>
    ))}

              {/* Display the cursor indicator */}
              {cursorIndicator}


        </Svg>
        </PanGestureHandler>
      </PinchGestureHandler>
      <TouchableOpacity onPress={resetView} style={styles.resetButton}>
      <Text style={styles.resetButtonText}>Reset</Text>
    </TouchableOpacity>
    </GestureHandlerRootView>
  );
};

export default BlueSquareSVG;

