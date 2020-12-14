# js-mgestures
Simple pure javascritp mouse gestures controller. I took some ideas from https://github.com/adkelley/elm-mouse-gesture and levenshtein algorithm. I also took some small pieces of code from the internet to be able to draw the mouse tail. 

## How it works?

This is the directions guide: 
<pre>
                                                 N
  0: 'E',                               NW       2       NE                   
  1: 'NE',                                 3     |     1                       
  2: 'N',                                        |                         
  3: 'NW',                            W  4 ------+------ 0 E                    
  4: 'W',                                        |                         
  5: 'SW',                                 5     |     7                    
  6: 'S',                               SW       6       SE                  
  7: 'SE',                                       S                           
  8: 'E'    // 8 is equal to 0                                                              
</pre>

When you make a gesture, it is translated to a string of numbers. For example, one line down <strong>&darr;</strong> would be translated as a sequence of numbers 6 (Ex: 666666666). If you do a small line, you will have something like 666 and if you do a large one you will have something like 666666666. So, the gesture pattern detector can be sensitive not just to a shape but to a size. If you want avoid this, i.e. a line down short and one large are matched with the same pattern, then you need set "normalize" option to true (this is the default setting for this option).  Setting "normalize" to true, 666 and 66666666666 will be normalized like 6666. 

In cases of circular gestures like circles or squares, you have another options that allow you match a circle that begin on North and other that begin on South like the same pattern. This options is "detectCircular". If you set it true, then any circle will be the same pattern, if it is false, then the circle will must match form and initial point. "detecCircular" default settings is false. 

## Usage:

```javascript
var ___gestures = new Gestures(); // or new Gestures({ ... })
___gestures.install();  // enable gestures
...
...
___gestures.uninstall(); // disable gestures
```
### Options:

```javascript 
{
  normalize: true, // if false disable normalization of gestures and difference between patterns of the same shape but different size.
  detectCircular: false, // if true detect circular shapes no matter where the gesture begins
  debug: 0 // 0-4, 0 log just HITs, 4 just for developers and dangerous
}
```

