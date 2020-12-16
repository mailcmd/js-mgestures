// I took some ideas from https://github.com/adkelley/elm-mouse-gesture and levenshtein algorithm

/*                                               N
  0: 'E',                               NW       2       NE                   
  1: 'NE',                                 3     |     1                       
  2: 'N',                                        |                         
  3: 'NW',                            W  4 ------+------ 0 E                    
  4: 'W',                                        |                         
  5: 'SW',                                 5     |     7                    
  6: 'S',                               SW       6       SE                  
  7: 'SE',                                       S                           
  8: 'E'    // 8 is equal to 0                                                              
*/


// Gestures patterns samples
var circle = [ '444555666777000111222333444' ];
var down = [ '6666' ];
var up = [ '2222' ];
var diag_downleft = [ '5555' ];
var diag_upright = [ '1111' ];
var down_right = [ '66660000']; 
var right_down = [ '00006666']; 
var right = [ '0000', '00000000']; 
var left = [ '4444', '44444444']; 

// Gestures configuration samples
var patterns = [
  /*
    {
        name: 'up to down or down to up',
        patterns: up.concat(down), 
        action: function(e) {
            var diff = my - iy;
            var els = document.elementsFromPoint(e.pageX, e.pageY);
            console.log('You made a gesture over these objects: ', els);
            console.log('You moved ', diff, 'px');
        }
    },
    */
    {
        name: 'diagonal south west',
        patterns: circle, //diag_downleft,
        detectCircular: true,
        action: function(e) {
            //console.log(e);
        }
    },/*
    {
        name: 'down then right',
        patterns: down_right,
        action: function(e) {
            //console.log(e);
        }
    },
    {
        name: 'right then down',
        patterns: right_down,
        action: function(e) {
        }
    },
    {
        name: 'right',
        patterns: right,
        action: function(e) {
        }
    },
    {
        name: 'left',
        patterns: left,
        action: function(e) {
        }
    }   
    */ 
];

