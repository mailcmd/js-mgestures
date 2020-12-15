# js-mgestures
Simple pure javascritp mouse gestures controller. I took some ideas from https://github.com/adkelley/elm-mouse-gesture and levenshtein algorithm. I also took some small pieces of code from the internet to be able to draw the mouse tail. 

## How it works?

The system works in a fairly simple way. Each gesture made is checked against a series of patterns; when there is a match (which does not have to be exact) the action associated with that pattern will be executed. To perform a gesture one of the mouse buttons should be held down for the duration (the default is the right mouse button). 

A mouse gesture has 3 essential properties: shape, size and speed. The shape is the basic gesture. A downward line or a circle are examples of shapes. At the same time each of these shapes can have a size (i.e. a downward line can be short or long) as well as be drawn at a certain speed. 

The pattern detector, by default, will ignore the size and speed of the shape, i.e. a downward line will be considered a match whether it is short or long and whether it is done in 300ms or 1000ms. To make the pattern detector sensitive to size, the "normalizeSize" option must be set to false. Similarly, to make the pattern detector speed sensitive you should set "normalizeSpeed" to false. By default these two options are set to true. 

## Patterns

A pattern is defined as a sequence of numbers from 0 to 8 (0 and 8 are equivalent). For example "5555" or "66660000" would be valid patterns, the first one a diagonal line SW and the second one an "L", that is a line to the south and then to the east. 

This is the guide that defines the number corresponding to each address:

<pre>
                                                 N
  0: 'E',                               NW       2       NE                   
  1: 'NE',                                 3     |     1                       
  2: 'N',                                        |                         
  3: 'NW',                            W  4 ------+------ 0  E                    
  4: 'W',                                        |                         
  5: 'SW',                                 5     |     7                    
  6: 'S',                               SW       6       SE                  
  7: 'SE',                                       S                           
  8: 'E'    // 8 is equal to 0                                                              
</pre>


......................

In cases of circular gestures like circles or squares, you have another options that allow you match a circle that begin on North and other that begin on South like the same pattern. This options is "detectCircular". If you set it true, then any circle will be the same pattern, if it is false, then the circle will must match form and initial point. "detecCircular" default settings is false. 

## Usage:

```javascript
var ___gestures = new Gestures({ ... })
___gestures.install();  // enable gestures
...
...
___gestures.uninstall(); // disable gestures
```
### Options:

```javascript 
{
  patterns: [ 
    { 
      // Example:
      name: "Line down", 
      patterns: [ "6666" ], // can be more than one
      action: function(ev) {
        // ev: "mouseup" event        
        // local vars inside 
        //    ix, iy: coordinates where the gesture begin
        //    mx, my: coordinates where the gesture end

        var diff = my - iy;
        console.log('You made a gesture over these objects: ', els);
        
        var els = document.elementsFromPoint(e.pageX, e.pageY);
        console.log('You moved ', diff, 'px');      
    },
    { ... },
    { ... }
  ],
  normalize: true, // if false disable normalization of gestures and difference between 
                   // patterns of the same shape but different size.
  detectCircular: false, // if true detect circular shapes no matter where the gesture begins
  debug: 0 // 0-4, 0 log just HITs, 4 just for developers and can hung up the browser
}
```
## Playing with the demo

Just do this:

```bash
# git clone https://github.com/mailcmd/js-mgestures.git
# cd js-mgestures/demo
# <your_favorite_browser> index.html
```
