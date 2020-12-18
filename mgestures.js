/*** 

I took some ideas from https://github.com/adkelley/elm-mouse-gesture and levenshtein algorithm. I also took some ideas and small pieces of code from the internet to be able to draw the mouse tail. 

Usage:

var ___gestures = new Gestures({...});
___gestures.install();  // enable gestures
...
...
___gestures.uninstall(); // disable gestures

***/

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



/////////////////////////////
// Gesture object definition

var Gestures = function (conf) {
        
    var mx = my = gst = ix = iy = undefined;
    var _this = this;
    var installed = false;

    // After many tests, 0.3 is the value that seems to be flexible enough without 
    // losing sensitivity or giving a significant amount of false positives. 
    // This coefficient is not linear and the closer it is to 0, the greater will be  
    // its matching requirement. 
    _this.SENSIBILITY_COEF = 0.3;

    _this.conf = Object.assign({}, {
        normalizeSize: true,
        normalizeTime: true,
        detectCircular: false,
        patterns: null,
        msByChar: 50, // ms by char
        mouseButton: 2,
        trailStyle: 'line',
        debug: 0
    }, conf);
    
    _this.onmousemove = function(e) {
        if (_this.mouseDown[_this.conf.mouseButton] != 1 || e.type == 'mouseup') {        
            
            // If left button we must control text selection
            if (_this.conf.mouseButton == 0) document.body.style.userSelect = '';            
            
            if (gst) {
                _this.ts_stop = (new Date()).getTime();
                console.log('GESTURE: ', gst);
                console.log('    Duration: ', _this.ts_stop - _this.ts_start);
                var found = false;
                if (_this.conf.normalizeSize) gst = _this.normalizeSize(gst);
                if (_this.conf.normalizeSize && _this.conf.debug >= 2) console.log('    Gesture size normalized: ', gst);
                
                for (i in _this.conf.patterns) {
                    const g = _this.conf.patterns[i];
                    let detectCircular = g.detectCircular !== undefined ? g.detectCircular : _this.conf.detectCircular;
                    let normalizeSize = g.normalizeSize !== undefined ? g.normalizeSize : _this.conf.normalizeSize;
                    let normalizeTime = g.normalizeTime !== undefined ? g.normalizeTime : _this.conf.normalizeTime;

                    for (j in g.patterns) {
                        if (_this.conf.debug >= 1) console.log('  * Matching: ', g.name, '(', g.patterns[j], ')');
                        let p = (normalizeSize ? _this.normalizeSize(g.patterns[j]) : g.patterns[j]);
                        if (normalizeSize && _this.conf.debug >= 2) console.log('    Pattern size normalized: ', p, ' (', g.patterns[j],')');

                        if (normalizeTime && _this.conf.debug >= 2) console.log('    Gesture time normalized!');
                        if (normalizeTime) _this.normalizeTime(p.length);

                        const coef = _this.distance(p, normalizeSize ? _this.normalizeSize(gst) : gst, detectCircular, normalizeTime);

                        if (coef <= _this.SENSIBILITY_COEF) {
                            found = true;
                            g.action(e);
                            if (_this.conf.debug >= 0) console.log('    HIT! Pattern: [', g.name+'] '+p, 'vs', gst, ' - COEF: ', coef);
                            break;
                        } 
                        if (_this.conf.debug >= 1) console.log('    FAIL! Pattern: [', g.name+'] '+p, 'vs', gst, ' - COEF: ', coef);
                    }
                    if (found) break;
                }
            }
            mx = my = gst = undefined;
            return;

        } else if (_this.mouseDown[_this.conf.mouseButton] == 1) {

            if (!mx || !my) {
                mx = e.pageX, my = e.pageY, gst = '';
                ix = mx, iy = my;
                _this.mouse_trail();
                return;
            }

            // 1ms delay, don't aks why, just do it
            setTimeout(function(){            
                _this.add_point(mx - _this.canvas.offsetLeft, my - _this.canvas.offsetTop);                    
            }, 1);
            
            var dx = (e.pageX - mx);
            var dy = (my - e.pageY);
            var dis = Math.sqrt(dx * dx + dy * dy);

            if (dis < 10) return;

            var angle = Math.atan2(dy, dx) * 180 / Math.PI;
            angle = angle < 0 ? angle + 360 : angle;
            angle2 = angle + 22.5;
            var idx = parseInt(angle2 / 45);
            idx = (idx == 8 ? 0 : idx);
            gst += idx.toString();

            mx = e.pageX, my = e.pageY;
        }
    };

    _this.distance = function(a, b, detectCircular, normalizeTime) {
        if (a.length == 0) return b.length;
        if (b.length == 0) return a.length;

        if (_this.conf.debug >= 2) console.log('    Comparing: ', a, b);

        // if equals don't be stupid, just say ok
        if (normalizeTime && a == b) return 0;

        // the longer, the more flexible (you could play with this if you want)
        var sensibility_adjust = 0.002 * Math.pow((a.length + b.length) / 2, 2); 

        // length_coef keep relation between lengths of strings
        var length_coef = a.length / b.length; 
        length_coef = (length_coef < 1 ? 1/length_coef : length_coef) - 1;

        // time_coef keep relation between times of strings
        var time_coef = (a.length * _this.conf.msByChar) / (___gestures.ts_stop - ___gestures.ts_start);
        time_coef = (time_coef < 1 ? 1/time_coef : time_coef) - 1;

        var matrix = [];
        
        // init matrix        
        for (i = 0; i < b.length; i++) {
            matrix[i] = [];
        }

        // fill matrix
        var dis = 0;
        for (var i = 0; i < b.length; i++) {
            for (var j = 0; j < a.length; j++) {
                dis = Math.abs(parseInt(b.charAt(i)) - parseInt(a.charAt(j)));
                dis = dis == 8 ? 0 : (dis > 4 ? 8 - dis : dis);
                dis = length_coef + time_coef + dis;
                matrix[i][j] = dis * dis * dis;
            }
        }

        _this.matrix = matrix;

        if (_this.conf.debug >= 4) {
            // draw matrix        
            f = '   ';
            for(j = 0; j < a.length; j++) f += j.toString().padStart(5) + ' ';
            console.log('    ', f);

            for(var i = 0; i < b.length; i++) {
                var f = i.toString().padStart(2)+' ';
                for(var j = 0; j < a.length; j++){
                    f += matrix[i][j].toFixed(2).toString().padStart(5) + ' ';
                }
                console.log('    ', f);
            }
        }
        
        if (_this.conf.debug >= 2) console.log('    ADJUST: sensibility_adjust: ', sensibility_adjust);
        if (_this.conf.debug >= 2) console.log('    ADJUST: length_coef: ', length_coef);
        if (_this.conf.debug >= 2) console.log('    ADJUST: time_coef: ', time_coef);

        // do the math
        var res = [], from = (detectCircular ? b.length-1 : 0);

        for (n = from; n >= 0; n--) {
            var f = '', tot = 0, c = 0;
            for (i = n; i < b.length + n; i++) {
                const j = Math.round((i - n) * (1+length_coef));
                const i2 = (i > b.length-1 ? i - b.length : i);
                if (j >= a.length) break;
                tot += matrix[i2][j];
                c++;
                f += matrix[i2][j].toFixed(2).toString().padStart(5) + ' ';
            }
            res.push(tot / c);
            if (_this.conf.debug >= 3) console.log('    Diagonal ', n, ': ', f, ' - Coef: ', res[res.length-1]);
        }
        
        return eval('Math.min(' + res.join(',') + ') - sensibility_adjust');
    };

    _this.normalizeTime = function(l) {
        _this.ts_start = 0;
        _this.ts_stop = _this.conf.msByChar * l;
    };

    _this.normalizeSize = function(s) {
        var ca = '', r = '', c = 0;
        for (i = 0; i < s.length; i++) {
            const cc = s.charAt(i);
            if (ca != cc) {
                //r += cc.repeat(4);
                c = 0;
            } else {
                c++;
            }
            if (c == 1) r += cc.repeat(4);
            ca = cc;
        }
        return r;
    };

    // Mouse trail

    // Point Class 
    _this.Point = function(x, y) {
        this.x = x;
        this.y = y;
        this.lifetime = 0;
        return this;
    };     
    
    _this.add_point = function(x, y) {
        var point = new _this.Point(x, y);
        _this.points.push(point);
    };    

    _this.mouse_trail = function() {
        _this.canvas.style.display = 'block';
        var ctx = _this.ctx;
        const duration = 30; 
    
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.beginPath();

        for (let i = 0; i < _this.points.length; ++i) {
            const point = _this.points[i];
            let lastPoint;
        
            if (_this.points[i - 1] !== undefined) {
                lastPoint = _this.points[i - 1];
            } else lastPoint = point;
        
            point.lifetime += 1;

            if (point.lifetime > duration) {
                // If the point dies, remove it.
                _this.points.shift();
            } else {
                // Otherwise animate it
        
                ctx.lineJoin = 'round';
                ctx.lineWidth = 1; 

                // As the lifetime goes on, lifePercent goes from 0 to 1.
                const lifePercent = (point.lifetime / duration);        

                const red = 0;
                const green = Math.floor(190 - (190 * lifePercent));
                const blue = Math.floor(210 + (210 * lifePercent));
                ctx.strokeStyle = `rgb(${red},${green},${blue})`;
                ctx.fillStyle = `rgb(${red},${green},${blue})`;

                if (_this.conf.trailStyle == 'points') {
                    ctx.arc(point.x, point.y, 10*(1-lifePercent), 0, 2 * Math.PI, true);
                    ctx.fill();
                } else {
                    var x1 = lastPoint.x, y1 = lastPoint.y, r1 = 5*(1 - lastPoint.lifetime / duration);
                    var x2 = point.x, y2 = point.y, r2 = 5*(1 - point.lifetime / duration);

                    if (i == 0) ctx.arc(x1, y1, r1, 0, Math.PI * 2, true);
                    if (i == _this.points.length-1) ctx.arc(x2, y2, r2, 0, Math.PI * 2, true);
                    
                    if (i > 0) {
                        var ang = Math.PI/2 - Math.asin( (y2-y1) / Math.sqrt( Math.pow(y2-y1, 2) + Math.pow(x2-x1, 2) ) ) ;
                        
                        if (!isNaN(ang)) {
                            if (x1 == x2) { 
                                var x1o = r1, x2o = r2;
                                var y1o = y2o = 0;
                            } else if (y1 == y2) {
                                var x1o = x2o = 0;
                                var y1o = r1, y2o = r2;
                            } else {
                                var x1o = r1 * Math.cos(ang);
                                var y1o = r1 * Math.sin(ang);
                                var x2o = r2 * Math.cos(ang);
                                var y2o = r2 * Math.sin(ang);
                            }

                            if ((x2 > x1 && y2 > y1) || (x2 < x1 && y2 < y1)) {
                                var x1_1 = x1 - x1o;
                                var y1_1 = y1 + y1o; 
                                var x1_2 = x1 + x1o;
                                var y1_2 = y1 - y1o;
                                var x2_1 = x2 - x2o;
                                var y2_1 = y2 + y2o; 
                                var x2_2 = x2 + x2o;
                                var y2_2 = y2 - y2o;
                            } else {
                                var x1_1 = x1 + x1o;
                                var y1_1 = y1 + y1o; 
                                var x1_2 = x1 - x1o;
                                var y1_2 = y1 - y1o;
                                var x2_1 = x2 + x2o;
                                var y2_1 = y2 + y2o; 
                                var x2_2 = x2 - x2o;
                                var y2_2 = y2 - y2o;
                            }                    

                            ctx.moveTo(x1_1, y1_1);
                            ctx.lineTo(x1_2, y1_2);
                            ctx.lineTo(x2_2, y2_2);
                            ctx.lineTo(x2_1, y2_1);
                            ctx.lineTo(x1_1, y1_1);
                        }
                        ctx.stroke();
                    }
                    ctx.fill();
                }             
            }

        }
        ctx.closePath();

        if (_this.mouseDown[_this.conf.mouseButton] == 1) {
            requestAnimationFrame(_this.mouse_trail);
        } else {
            _this.canvas.style.display = 'none';
            _this.points = [];
        }
    };

   
    // Install and uninstall
    _this.install = function() {
        if (!installed) {            
            // this array keeps mouse buttons status (idx 0: left, 1: middle, 2: right)
            _this.mouseDown = [0, 0, 0];

            // Events
            document.body.addEventListener('mousedown', _this.onmousedown = function (evt) {
                _this.mouseDown[evt.button] = 1;  
                _this.ts_start = (new Date()).getTime();
                // If left button we must control text selection
                if (_this.conf.mouseButton == 0) document.body.style.userSelect = 'none';                
            }, true);            
            document.body.addEventListener('mouseup', _this.onmouseup = function (evt) {
                _this.mouseDown[evt.button] = 0;                
            }, true);
            window.addEventListener('mousemove', _this.onmousemove, true);
            window.addEventListener('mouseup', _this.onmousemove, true);
            _this.oncontextmenu = document.oncontextmenu;
            document.oncontextmenu = function () { return false; };

            // create canvas to draw mouse trail
            _this.canvas = document.createElement('canvas');
            _this.canvas.id = '___mgestures-canvas';
            _this.canvas.width = innerWidth;
            _this.canvas.height = innerHeight;
            _this.canvas.style.position = 'fixed'; 
            _this.canvas.style.top = 0; 
            _this.canvas.style.left = 0; 
            _this.canvas.style.zIndex = 1000000; 
            _this.canvas.style.display = 'none';
            document.body.appendChild(_this.canvas);
            _this.ctx = _this.canvas.getContext("2d");
            _this.points = [];            
            
            installed = true;
        }
    }
    
    _this.uninstall = function() {
        if (installed) {
            // Events
            window.removeEventListener('mousedown', _this.onmousedown, true);
            window.removeEventListener('mouseup', _this.onmouseup, true);
            window.removeEventListener('mousemove', _this.onmousemove, true);
            window.removeEventListener('mouseup', _this.onmousemove, true);
            _this.canvas.remove();
            document.oncontextmenu = _this.oncontextmenu;
            installed = false;
        }
    }
    
    return _this;

}

