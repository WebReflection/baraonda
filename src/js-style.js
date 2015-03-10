var restyle = require('restyle');

module.exports = function () {
  return {
    all: restyle({
      '*': {
        cursor: 'default',
        touchAction: 'none',
        userSelect: 'none'
      }
    }),
    accuracy: restyle({
      '#accuracy': {
        width: 0,
        marginLeft: 0,
        transition: 'all 3s'
      }
    }),
    glow: restyle({
      '@keyframes glow': {
        '0%':   { boxShadow: '0px 0px 0px 0px rgba(255,255,255,1)' },
        '100%': { boxShadow: '0px 0px 32px 16px rgba(255,255,255,1)' }
      },
      '.glow': {
        animation: {
          name: 'glow',
          duration: '1s',
          iterationCount: 'infinite',
          direction: 'alternate'
        }
      }
    }),
    score: restyle({
      '#score': {
        lineHeight: score.offsetHeight,
        fontSize: Math.floor(score.offsetHeight / 1.5)
      }
    }),
    circle: restyle({
      '.circle': {
        position: 'fixed',
        border: '2px solid #DDD',
        margin: { top: 0, left: 0 },
        width: 0,
        height: 0,
        borderRadius: '50%'
      },
      '.circle-showed': {
        width: 100,
        height: 100,
        margin: {
          top: -51,
          left: -51
        }
      },
      '@keyframes circle-showing': {
        '0%':   {   width: 0, height: 0, margin: { top: 0, left: 0 } },
        '100%': { width: 100, height: 100, margin: { top: -51, left: -51 } }
      },
      '.circle-showing': {
        animation: {
          name: 'circle-showing',
          duration: '250ms',
          iterationCount: '1',
          direction: 'normal'
        }
      },
      '@keyframes circle-disappearing': {
        '0%':   { opacity: '1', width: 100, height: 100, margin: { top: -51, left: -51 } },
        '100%': { opacity: '0', width: 0, height: 0, margin: { top: 0, left: 0 } }
      },
      '.circle-disappearing': {
        animation: {
          name: 'circle-disappearing',
          duration: '250ms',
          iterationCount: '1',
          direction: 'normal'
        }
      },
      '@keyframes circle-growing': {
        '0%':   { borderWidth: 2, margin: { top: -51, left: -51 }, boxShadow: '0px 0px 0px 0px rgba(255,255,255,1)' },
        '100%': { borderWidth: 32, margin: { top: -80, left: -80 }, boxShadow: '0px 0px 32px 16px rgba(255,255,255,1)' }
      },
      '.circle-growing': {
        animation: {
          name: 'circle-growing',
          duration: '500ms',
          iterationCount: '2',
          direction: 'alternate'
        }
      },
      '@keyframes blue': {
        '0%':   { backgroundColor: '#00A' },
        '100%': { backgroundColor: '#333' }
      },
      'body.blue': {
        animation: {
          name: 'blue',
          duration: '350ms',
          iterationCount: '1',
          direction: 'normal'
        }
      },
      '@keyframes red': {
        '0%':   { backgroundColor: '#A00' },
        '100%': { backgroundColor: '#333' }
      },
      'body.red': {
        animation: {
          name: 'red',
          duration: '350ms',
          iterationCount: '1',
          direction: 'normal'
        }
      },
      '@keyframes blue-highlight': {
        '0%':   { color: '#00F', opacity: '1' },
        '100%': { color: '#000', opacity: '.3' }
      },
      '.blue-highlight': {
        animation: {
          name: 'blue-highlight',
          duration: '350ms',
          iterationCount: '1',
          direction: 'normal'
        }
      },
      '@keyframes red-highlight': {
        '0%':   { color: '#F00', opacity: '1' },
        '100%': { color: '#000', opacity: '.3' }
      },
      '.red-highlight': {
        animation: {
          name: 'red-highlight',
          duration: '350ms',
          iterationCount: '1',
          direction: 'normal'
        }
      },
      '@keyframes highlight': {
        '0%':   { color: '#FFF', opacity: '1' },
        '100%': { color: '#000', opacity: '.3' }
      },
      '.highlight': {
        animation: {
          name: 'highlight',
          duration: '900ms',
          iterationCount: '1',
          direction: 'normal'
        }
      }
    })
  };
};