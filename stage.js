const h = require('mutant/html-element')
const Value = require('mutant/value')
const computed = require('mutant/computed')

module.exports = function(opts) {
  opts = opts || {}

  const stageScale = Value(1.0)
  const width = Value(1920)
  const height = Value(1080)

  function load() {
    let options
    try {
      options = JSON.parse(
        localStorage['tre-stage-view-options']
      )
    } catch(e) {}
    if (options) {
      width.set(options.width || 1920)
      height.set(options.height || 1080)
      stageScale.set(options.scale || 1)
    }
  }

  function save() {
    localStorage['tre-stage-view-options'] = JSON.stringify({
      scale: stageScale(),
      width: width(),
      height: height()
    })
  }


  function renderBar() {
    const stageScaleSlider = [
      h('input', {
        type: 'range',
        value: stageScale,
        min: '0.25',
        max: '1.0',
        step: '0.05',
        'ev-input': e => {
          stageScale.set(Number(e.target.value))
          save()
        }
      }),
      h('span', stageScale)
    ]

    function numberField(name, obs) {
      return h('input', {
        type: 'number',
        value: obs,
        'ev-change': e => setTimeout( ()=> {
          obs.set(e.target.value)
          save()
        }, 0),
      })
    }

    return h('.tre-stage-view-options', [
      numberField('width', width),
      h('span', 'x'),
      numberField('height', height),
      h('button', {
        'ev-click': e => {
          const w = width()
          width.set(height())
          height.set(w)
        }
      }, 'swap'),
      stageScaleSlider
    ])
  }

  function renderStage(content) {
    return h('.tre-stage', {
      style: {
        width: computed([width, stageScale], (w, s) => `${s * w}px`),
        height: computed([height, stageScale], (h, s) => `${s * h}px`)
      }
    }, [
      h('.tre-stage-zoom', {
        style: {
          width: computed(width, w => `${w}px`),
          height: computed(height, h => `${h}px`),
          zoom: computed(stageScale, s => `${s * 100}%`)
        }
      }, content)
    ])
  }
    
  return function(content) {
    load()
    return [
      renderBar(),
      h('.tre-stage-container', [
        renderStage(content)
      ])
    ]
  }
}
