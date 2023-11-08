/* 
XRangeBar 范围选择控件 by zmz 2023-11-08
依赖 jquery sprintf 请在页面中引入相关JS

配置参数 opt : {
    elid        父容器
    min         最小值  默认值 0
    max         最大值  默认值 100
    tiptype     数值文字显示方式 
    orient      朝向 取值 'H' 或者 'V' 默认值 'H'
    barcss      滑轨css json 描述 如 { width:'100px', height:'100px' }    
    btncss      滑块css 同barcss
    tipcss      提示文字CSS 同barcss
    kbstep      键盘上下左右移动步长值 默认为0 0时无键盘功能
}
*/

//加载CSS
let url = new URL( document.currentScript.src );
let cssurl = url.protocol + '//' + url.host + url.pathname.replace( '.js', '.css');
cssurl += "?" + Math.random();
url = null;
var head = document.getElementsByTagName('head')[0];
var link = document.createElement('link');
link.href = cssurl;
link.rel = 'stylesheet';
link.type = 'text/css';
head.appendChild(link);

//数值文字显示方式
const XRANGEBAR_TIP_LR = 1; 
const XRANGEBAR_TIP_RL = 2;
const XRANGEBAR_TIP_TB = 3;
const XRANGEBAR_TIP_BT = 4;

const XRANGEBAR_DEFAULT_STYPE = {
    'H' : {
        'BAR' : {
            'width'         : '100%',
            'height'        : '10px',
            'top'           : '50%',
            'background'    : '#0000FF',
            'font-size'     : '1px',
            'transform'     : 'translate(0, -50%)',
            'border-radius' : '5px',    
        },
        'BTN' : {
            'width'         : '30px',
            'height'        : '30px',
            'border-radius' : '15px',
            'background'    : '#FF0000',
            'transform'     : 'translate(-50%, -50%)',
            'border'        : '2px solid #00f',
            'cursor'        : 'pointer',
            'outline'       : 'none',
        },
        'TIP' : {
            'text-align'    : 'center',
            'width'         : '80px',
            'height'        : '30px',
            'line-height'   : '30px',
            'background'    : '#333',
            'color'         : '#fff',
            'font-size'     : '14px',
            'border-radius' : '4px',
        },
    },
    'V' : {
        'BAR' : {
            'width'         : '10px',
            'height'        : '100%',
            'background'    : '#0000FF',
            'font-size'     : '1px',
            'left'          : '50%',
            'transform'     : 'translate(-50%,0)',
            'border-radius' : '5px', 
            'cursor'        : 'pointer',
        },
        'BTN' : {
            'width'         : '30px',
            'height'        : '30px',
            'border-radius' : '15px',
            'background'    : '#FF0000',
            'transform'     : 'translate(-50%, -50%)',
            'border'        : '2px solid #00f',
            'outline'       : 'none',
        },
        'TIP' : {
            'text-align'    : 'center',
            'width'         : '80',
            'height'        : '30px',
            'line-height'   : '30px',
            'background'    : '#333',
            'color'         : '#fff',
            'font-size'     : '14px',
            'border-radius' : '4px',
        }
    }
};

class XRangeBar {
    constructor( opt ) {
        this.Option = typeof( opt ) == 'undefined' ? {} : opt; 
        /* 默认值处理 Begin */
        this.Option.min = typeof( opt.min ) != 'undefined' ? opt.min : 0;
        this.Option.max = typeof( opt.max ) != 'undefined' ? opt.max : 100; 
        this.Option.format = typeof( opt.format ) != 'undefined' ? opt.format : '%.02f';
        this.Option.orient = typeof( opt.orient ) != 'undefined' ? opt.orient : 'H';
        this.Option.kbstep = typeof( opt.kbstep ) != 'undefined' ? opt.kbstep : 0;
        
        if( this.Option.orient == 'H' || this.Option.orient == 'h' ) {
            this.Option.tiptype = typeof( opt.tiptype ) != 'undefined' ? opt.tiptype : XRANGEBAR_TIP_TB;
            this.Option.barcss = Object.assign( {}, XRANGEBAR_DEFAULT_STYPE.H.BAR, typeof( opt.barcss ) != 'undefined' ? opt.barcss : {} );
            this.Option.btncss = Object.assign( {}, XRANGEBAR_DEFAULT_STYPE.H.BTN, typeof( opt.btncss ) != 'undefined' ? opt.btncss : {} );
            this.Option.tipcss = Object.assign( {}, XRANGEBAR_DEFAULT_STYPE.H.TIP, typeof( opt.tipcss ) != 'undefined' ? opt.tipcss : {} );
        } else {
            this.Option.tiptype = typeof( opt.tiptype ) != 'undefined' ? opt.tiptype : XRANGEBAR_TIP_LR;
            this.Option.barcss = Object.assign( {}, XRANGEBAR_DEFAULT_STYPE.V.BAR, typeof( opt.barcss ) != 'undefined' ? opt.barcss : {} );
            this.Option.btncss = Object.assign( {}, XRANGEBAR_DEFAULT_STYPE.V.BTN, typeof( opt.btncss ) != 'undefined' ? opt.btncss : {} );
            this.Option.tipcss = Object.assign( {}, XRANGEBAR_DEFAULT_STYPE.V.TIP, typeof( opt.tipcss ) != 'undefined' ? opt.tipcss : {} );
        }
        /* 默认值处理 End */

        this.MinVal = this.Option.min;
        this.MaxVal = this.Option.max;
        this.OldMinVal = this.MinVal;
        this.OldMaxVal = this.MaxVal;
        this.Container = $("#"+opt.elid);
        this.Touch = false;
        this.old_X = 0;
        this.old_Y = 0;
        this.deltaY = 0;
        this.deltaX = 0;

        this.CurBtn = null;
        this.BtnLess = null;
        this.BtnGreater = null;
        this.TipLess = null;
        this.TipGreater = null;

        this.startfnc = ( function( pThis ) {
            return function( e ) {
                if( $(e.target).closest('#'+pThis.Option.elid).length > 0 ) {
                    if( $(e.target).closest('.XRangeBar-btn-less').length > 0 ||
                        $(e.target).closest('.XRangeBar-tip-less').length > 0 ||
                        $(e.target).closest('.XRangeBar-btn-greater').length > 0 ||
                        $(e.target).closest('.XRangeBar-tip-greater').length > 0 ) {
                        e.preventDefault();
                        e.stopPropagation();
                        pThis.Touch = true;
                        if( e.type == 'mousedown' ) {
                            pThis.old_Y = e.clientY;
                            pThis.old_X = e.clientX;
                        } else if( e.type == 'toucstart' ) {
                            pThis.old_Y = e.touches[0].clientY;
                            pThis.old_X = e.touches[0].clientX;
                        }
                        pThis.daltaY = 0;
                        pThis.daltaX = 0;
                    }
                    if( $(e.target).closest('.XRangeBar-btn-less').length > 0 ||
                        $(e.target).closest('.XRangeBar-tip-less').length > 0 ) {
                        pThis.CurBtn = $(e.target).closest('.XRangeBar-btn-less');
                    } 

                    if( $(e.target).closest('.XRangeBar-btn-greater').length > 0 ||
                        $(e.target).closest('.XRangeBar-tip-greater').length > 0 ) {
                        pThis.CurBtn = $(e.target).closest('.XRangeBar-btn-greater');
                    }
                }
            };
        }( this ) );

        this.endfnc = ( function( pThis ) {
            return function( e ) {
                pThis.Touch = false;
                pThis.CurBtn = null;
            };
        }( this ) );
        
        this.movefnc = ( function( pThis ) {
            return function( e ) {
                if( !pThis.Touch ) {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                let CX, CY;
                if( e.type == 'mousemove' ) {
                    CX = e.clientX;
                    CY = e.clientY;
                } else if( e.type == 'touchmove' ) {
                    CX = e.touches[0].clientX;
                    CY = e.touches[0].clientY;
                }
                if( pThis.Option.orient == 'H' ) {
                    var npos, minpos, maxpos, val;
                    pThis.deltaX = CX - pThis.old_X;
                    npos = parseInt( pThis.CurBtn.css('left') ) + pThis.deltaX;
                    if( pThis.CurBtn.hasClass('XRangeBar-btn-less') ) {
                        pThis.BtnGreater.css({'z-index':10});
                        pThis.BtnLess.css({'z-index':11});
                        minpos = 0;
                        maxpos = parseFloat( pThis.BtnGreater.css('left') ) + parseFloat( pThis.BtnGreater.css('width') );
                        if( npos < minpos ) { npos = minpos; }
                        if( npos > maxpos ) { npos = maxpos; }
                        pThis.CurBtn.css('left', npos + 'px');
                        pThis.MinVal = npos * ( pThis.Option.max - pThis.Option.min ) / parseFloat( pThis.Container.css('width') ) + pThis.Option.min;
                    }
                    if( pThis.CurBtn.hasClass('XRangeBar-btn-greater') ) {
                        pThis.BtnLess.css({'z-index':10});
                        pThis.BtnGreater.css({'z-index':11});  
                        minpos = parseFloat( pThis.BtnLess.css('left') ) - parseFloat( pThis.BtnLess.css('width') );;
                        maxpos = parseFloat( pThis.Container.css('width') ) - parseFloat( pThis.BtnGreater.css('width') );;
                        if( npos < minpos ) { npos = minpos; }
                        if( npos > maxpos ) { npos = maxpos; }
                        pThis.CurBtn.css('left', npos + 'px');
                        pThis.MaxVal = ( npos + parseFloat( pThis.BtnGreater.css('width') ) ) * ( pThis.Option.max - pThis.Option.min ) / parseFloat( pThis.Container.css('width') ) + pThis.Option.min;
                    }
                    
                } else if ( pThis.Option.orient == 'V' ) {
                    var npos, minpos, maxpos, val;
                    pThis.deltaY = CY - pThis.old_Y;
                    npos = parseInt( pThis.CurBtn.css('top') ) + pThis.deltaY;
                    if( pThis.CurBtn.hasClass('XRangeBar-btn-less') ) {
                        pThis.BtnGreater.css({'z-index':10});
                        pThis.BtnLess.css({'z-index':11});
                        minpos = 0;
                        maxpos = parseFloat( pThis.BtnGreater.css('top') ) + parseFloat( pThis.BtnGreater.css('height') );
                        if( npos < minpos ) { npos = minpos; }
                        if( npos > maxpos ) { npos = maxpos; }
                        pThis.CurBtn.css('top', npos + 'px');
                        pThis.MinVal = npos * ( pThis.Option.max - pThis.Option.min ) / parseFloat( pThis.Container.css('height') ) + pThis.Option.min;
                    }
                    if( pThis.CurBtn.hasClass('XRangeBar-btn-greater') ) {
                        pThis.BtnLess.css({'z-index':10});
                        pThis.BtnGreater.css({'z-index':11});  
                        minpos = parseFloat( pThis.BtnLess.css('top') ) - parseFloat( pThis.BtnLess.css('height') );;
                        maxpos = parseFloat( pThis.Container.css('height') ) - parseFloat( pThis.BtnGreater.css('height') );;
                        if( npos < minpos ) { npos = minpos; }
                        if( npos > maxpos ) { npos = maxpos; }
                        pThis.CurBtn.css('top', npos + 'px');
                        pThis.MaxVal = ( npos + parseFloat( pThis.BtnGreater.css('height') ) ) * ( pThis.Option.max - pThis.Option.min ) / parseFloat( pThis.Container.css('height') ) + pThis.Option.min;
                    }
                }
                pThis.old_Y = CY;
                pThis.old_X = CX;
                let sv_min = sprintf( pThis.Option.format, pThis.MinVal ),
                    sv_max = sprintf( pThis.Option.format, pThis.MaxVal )
                pThis.TipLess.text( sv_min ); 
                pThis.TipGreater.text( sv_max ); 
                
                if( pThis.OldMinVal != sv_min ||
                    pThis.OldMaxVal != sv_max ) {
                    pThis.OldMinVal = sv_min;
                    pThis.OldMaxVal = sv_max;
                    pThis.Container.trigger( 'change', [sv_min,sv_max] );   
                }
            };
        }( this ) );
        //------------------------------------------------------------------------------------

        window.addEventListener('touchstart', this.startfnc, { passive: false } );
        window.addEventListener('mousedown', this.startfnc, { passive: false } );
        window.addEventListener('touchend', this.endfnc, { passive: false } );
        window.addEventListener('mouseup', this.endfnc, { passive: false } );
        window.addEventListener('touchmove', this.movefnc, { passive: false } );
        window.addEventListener('mousemove', this.movefnc, { passive: false } );

        this.InitElement();
    }
    
    destructor(){
        window.removeEventListener('touchstart', this.startfnc, { passive: false } );
        window.removeEventListener('mousedown', this.startfnc, { passive: false } );
        window.removeEventListener('touchend', this.endfnc, { passive: false } );
        window.removeEventListener('mouseup', this.endfnc, { passive: false } );
        window.removeEventListener('touchmove', this.movefnc, { passive: false } );
        window.removeEventListener('mousemove', this.movefnc, { passive: false } );
    }

    //初始化HTML元素
    InitElement() {
        var bar = $(`<div class="XRangeBar-bar"><div class="XRangeBar-btn XRangeBar-btn-less"><div class="XRangeBar-tip XRangeBar-tip-less">${sprintf(this.Option.format,this.MinVal)}</div></div><div class="XRangeBar-btn XRangeBar-btn-greater"><div class="XRangeBar-tip XRangeBar-tip-greater">${sprintf(this.Option.format,this.MaxVal)}</div></div></div>`);
        $('#'+this.Option.elid).append( bar ); 
        if( this.Option.kbstep > 0 ) {
            if( $("#XRangeBar-Input-Focus").length < 1 ) {
                $("body").append( $(`<input type="text" id="XRangeBar-Input-Focus" style="position:absolute;top:-100px;" />`) );
                $("#XRangeBar-Input-Focus").on( 'keydown', function( e ) {
                    let pThis = $("#XRangeBar-Input-Focus").data('barobj');
                    let btnid = $("#XRangeBar-Input-Focus").attr('data-target');
                    if( !pThis ) {
                        return;
                    }
                    if( pThis.Option.orient == 'H' ) {
                        if( e.keyCode == 37 ) { 
                            //左移 
                            pThis.moveslider( btnid, -pThis.Option.kbstep ); 
                        } else if( e.keyCode == 39 ) {
                            //右移
                            pThis.moveslider( btnid, pThis.Option.kbstep ); 
                        }
                    } else if( pThis.Option.orient == 'V' ) {
                        if( e.keyCode == 38 ) {
                            //上移
                            pThis.moveslider( btnid, -pThis.Option.kbstep ); 
                        } else if( e.keyCode == 40 ) {
                            //下移
                            pThis.moveslider( btnid, pThis.Option.kbstep ); 
                        }
                    }
                } );
                $("#XRangeBar-Input-Focus").on( 'blur', function( e ) {
                    let tid = $("#XRangeBar-Input-Focus").attr('data-target');
                    if( tid ) {
                        $('#'+tid).css('outline','none');
                        $('#'+tid).removeAttr('id');
                        $("#XRangeBar-Input-Focus").removeAttr('data-target');
                        $("#XRangeBar-Input-Focus").removeData('barobj' );
                    }
                } );
            }
            bar.find('.XRangeBar-btn').click( e => {
                let el = $(e.target).closest('.XRangeBar-btn'); 
                if(  el.css('outline-style') == 'none' ) {
                    let pcolor = $(e.target).closest('.XRangeBar-bar').css('background-color');
                    $('.XRangeBar-btn').css('outline', 'none' );
                    el.css('outline',`4px solid ${pcolor}` );
                    let nid = 'XRangeBar-btn-' + parseInt( Math.random() * 10000 ).toString();
                    el.attr('id', nid );
                    $("#XRangeBar-Input-Focus").attr('data-target',nid );
                    $("#XRangeBar-Input-Focus").focus();
                    $("#XRangeBar-Input-Focus").data( 'barobj', this );
                } else {
                    el.css('outline', 'none' );
                    el.removeAttr('id');
                    $("#XRangeBar-Input-Focus").removeAttr('data-target');
                    $("#XRangeBar-Input-Focus").blur();
                    $("#XRangeBar-Input-Focus").removeData('barobj' );
                }
            } );
        }
        this.BtnLess = bar.find('.XRangeBar-btn-less');
        this.BtnGreater = bar.find('.XRangeBar-btn-greater');
        this.TipLess = bar.find('.XRangeBar-tip-less');
        this.TipGreater = bar.find('.XRangeBar-tip-greater');
        if( typeof( this.Option.barcss ) != 'undefined' ) {
            bar.css( this.Option.barcss );
        }
        if( typeof( this.Option.btncss ) != 'undefined' ) {
            bar.find('.XRangeBar-btn-less, .XRangeBar-btn-greater').css( this.Option.btncss );
            if( this.Option.orient == 'H' || this.Option.orient == 'h' ) {
                var halfH = ( parseFloat( bar.find('.XRangeBar-btn-less').css('height') ) - parseFloat( bar.css('height') ) ) / 2;
                bar.find('.XRangeBar-btn-less').css({
                    left:'0px',
                    transform: `translate(-50%,-${halfH}px)`,
                });                    
                bar.find('.XRangeBar-btn-greater').css({
                    right:'0px',
                    transform: `translate(50%,-${halfH}px)`,
                });  
            }
            if( this.Option.orient == 'V' || this.Option.orient == 'v' ) {
                var halfW = ( parseFloat( bar.find('.XRangeBar-btn-less').css('width') ) - parseFloat( bar.css('width') ) ) / 2;
                bar.find('.XRangeBar-btn-less').css({
                    top:'0px',
                    transform: `translate(-${halfW}px,-50%)`,
                });                    
                bar.find('.XRangeBar-btn-greater').css({
                    bottom:'0px',
                    transform: `translate(-${halfW}px,50%)`,
                });  
            }
        }
        if( typeof( this.Option.tipcss ) != 'undefined' ) {
            bar.find('.XRangeBar-tip-less, .XRangeBar-tip-greater').css( this.Option.tipcss );
            var tw = parseInt( this.TipLess.width() );  
            var th = parseInt( this.TipLess.height() );  
            var bw = parseInt( this.BtnLess.css('width'));
            var bbw = parseInt( this.BtnLess.css('border-width'));
            var bh = parseInt( this.BtnLess.css('height'));
            var bgcolor = this.TipLess.css('background-color'); 
            var styleElement = document.createElement('style');
            styleElement.type = 'text/css';
            styleElement.appendChild( document.createTextNode(`#${this.Option.elid} .XRANGEBAR_TIP_L::before { border-left-color:${bgcolor}}`) );
            styleElement.appendChild( document.createTextNode(`#${this.Option.elid} .XRANGEBAR_TIP_R::before { border-right-color:${bgcolor}}`) );
            styleElement.appendChild( document.createTextNode(`#${this.Option.elid} .XRANGEBAR_TIP_T::before { border-top-color:${bgcolor}}`) );
            styleElement.appendChild( document.createTextNode(`#${this.Option.elid} .XRANGEBAR_TIP_B::before { border-bottom-color:${bgcolor}}`) );
            document.getElementsByTagName('head')[0].appendChild( styleElement );

            if( this.Option.tiptype == XRANGEBAR_TIP_LR ) {
                this.TipLess.addClass( 'XRANGEBAR_TIP_L' );
                this.TipGreater.addClass( 'XRANGEBAR_TIP_R' );
                this.TipLess.css( {right: `${bw+5}px`} );
                this.TipLess.css( {top: `-${(th-bh)/2+bbw}px`} );
                this.TipGreater.css( {left: `${bw+5}px`} );
                this.TipGreater.css( {top: `-${(th-bh)/2+bbw}px`} );
            } else if( this.Option.tiptype == XRANGEBAR_TIP_RL ) {
                this.TipLess.addClass( 'XRANGEBAR_TIP_R' );
                this.TipGreater.addClass( 'XRANGEBAR_TIP_L' );
                this.TipGreater.css( {right: `${bw+5}px`} );
                this.TipGreater.css( {top: `-${(th-bh)/2+bbw}px`} );
                this.TipLess.css( {left: `${bw+5}px`} );
                this.TipLess.css( {top: `-${(th-bh)/2+bbw}px`} );
            } else if( this.Option.tiptype == XRANGEBAR_TIP_TB ) {
                this.TipLess.addClass( 'XRANGEBAR_TIP_T' );       
                this.TipGreater.addClass( 'XRANGEBAR_TIP_B' );
                this.TipLess.css( {top: `-${th+7+bbw}px`} );
                this.TipLess.css( {left: `-${(tw-bw)/2+bbw}px`} );
                this.TipGreater.css( {bottom: `-${th+7+bbw}px`} );
                this.TipGreater.css( {left: `-${(tw-bw)/2+bbw}px`} );
            } else if( this.Option.tiptype == XRANGEBAR_TIP_BT ) {
                this.TipGreater.addClass( 'XRANGEBAR_TIP_T' );       
                this.TipLess.addClass( 'XRANGEBAR_TIP_B' );
                this.TipGreater.css( {top: `-${th+7+bbw}px`} );
                this.TipGreater.css( {left: `-${(tw-bw)/2+bbw}px`} );
                this.TipLess.css( {bottom: `-${th+7+bbw}px`} );
                this.TipLess.css( {left: `-${(tw-bw)/2+bbw}px`} );
            }
        } 
    }

    //键盘步长移动
    moveslider( btnid, val ) {
        let sv_min, sv_max;
        if( this.Option.orient == 'H' ) {
            if( $(`#${btnid}`).closest('.XRangeBar-btn-greater').length > 0 ) {
                let minpos = - parseFloat( this.BtnGreater.css('width') ),
                    maxpos = parseFloat( this.Container.css('width') ) - parseFloat( this.BtnGreater.css('width') ),
                    nleft,
                    nv = this.MaxVal + val;
                if( nv > this.Option.max ) { nv = this.Option.max; }
                if( nv < this.MinVal ) { nv = this.MinVal; }
                nleft = minpos + ( maxpos - minpos ) * ( nv - this.Option.min ) / ( this.Option.max - this.Option.min ) ;
                this.MaxVal = nv;
                this.BtnGreater.css('left',  nleft + 'px' );
                sv_min = sprintf( this.Option.format, this.MinVal );
                sv_max = sprintf( this.Option.format, this.MaxVal );
                this.TipGreater.text( sv_max ); 
            } 
            else if( $(`#${btnid}`).closest('.XRangeBar-btn-less').length > 0 ) {
                let minpos = 0,
                    maxpos = parseFloat( this.Container.css('width') ),
                    nleft,
                    nv = this.MinVal + val;
                if( nv > this.MaxVal ) { nv = this.MaxVal; }
                if( nv < this.Option.min ) { nv = this.Option.min; }
                nleft = minpos + ( maxpos - minpos ) * ( nv - this.Option.min ) / ( this.Option.max - this.Option.min ) ;
                this.MinVal = nv;
                this.BtnLess.css('left',  nleft + 'px' );
                sv_min = sprintf( this.Option.format, this.MinVal );
                sv_max = sprintf( this.Option.format, this.MaxVal );
                this.TipLess.text( sv_min ); 
            }
        } else if ( this.Option.orient == 'V' ) {
            if( $(`#${btnid}`).closest('.XRangeBar-btn-greater').length > 0 ) {
                let minpos = - parseFloat( this.BtnGreater.css('height') ),
                    maxpos = parseFloat( this.Container.css('height') ) - parseFloat( this.BtnGreater.css('height') ),
                    ntop,
                    nv = this.MaxVal + val;
                if( nv > this.Option.max ) { nv = this.Option.max; }
                if( nv < this.MinVal ) { nv = this.MinVal; }
                ntop = minpos + ( maxpos - minpos ) * ( nv - this.Option.min )  / ( this.Option.max - this.Option.min ) ;
                this.MaxVal = nv;
                this.BtnGreater.css('top',  ntop + 'px' );
                sv_min = sprintf( this.Option.format, this.MinVal );
                sv_max = sprintf( this.Option.format, this.MaxVal );
                this.TipGreater.text( sv_max ); 
            }  
            else if( $(`#${btnid}`).closest('.XRangeBar-btn-less').length > 0 ) {
                let minpos = 0,
                    maxpos = parseFloat( this.Container.css('height') ),
                    ntop,
                    nv = this.MinVal + val;
                if( nv > this.MaxVal ) { nv = this.MaxVal; }
                if( nv < this.Option.min ) { nv = this.Option.min; }
                ntop = minpos + ( maxpos - minpos ) * ( nv - this.Option.min ) / ( this.Option.max - this.Option.min ) ;
                this.MinVal = nv;
                this.BtnLess.css('top',  ntop + 'px' );
                sv_min = sprintf( this.Option.format, this.MinVal );
                sv_max = sprintf( this.Option.format, this.MaxVal );
                this.TipLess.text( sv_min ); 
            }      
        }
        if( this.OldMinVal != sv_min ||
            this.OldMaxVal != sv_max ) {
            this.OldMinVal = sv_min;
            this.OldMaxVal = sv_max;
            this.Container.trigger( 'change', [sv_min,sv_max] );   
        }
    }

}
